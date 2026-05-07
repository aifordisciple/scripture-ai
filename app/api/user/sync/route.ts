// app/api/user/sync/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** 安全解析 JSON 字符串，解析失败返回 fallback */
function safeJsonParse(str: string | null | undefined, fallback: Record<string, unknown> = {}): Record<string, unknown> {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        settings: true,
        highlights: true,
        notes: true,
        interactions: true,
        planProgress: true,
        badges: true
      }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const activePlans = (user.planProgress && Array.isArray(user.planProgress))
      ? user.planProgress.map((p: { planId: string; startDate: Date; completedTasks: string | null; savedDevotionals: string | null; status: string | null }) => ({
          planId: p.planId,
          startDate: p.startDate.getTime(),
          completedTasks: safeJsonParse(p.completedTasks),
          savedDevotionals: safeJsonParse(p.savedDevotionals),
          status: p.status || 'active'
        }))
      : [];

    return NextResponse.json({
      settings: user.settings,
      highlights: user.highlights,
      notes: user.notes,
      interactions: user.interactions,
      activePlans,
      streakCount: user.streakCount,
      lastActiveDate: user.lastActiveDate?.getTime() || null,
      badges: user.badges?.map(b => ({ type: b.type, earnedAt: b.earnedAt.getTime() })) || []
    });
  } catch (err) {
    console.error("GET Sync Error:", err);
    return NextResponse.json({ error: "Sync fetch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let data: Record<string, unknown>;
    try {
      data = await req.json();
    } catch {
      data = {};
    }

    const { settings, highlights, notes, interactions, activePlans, streakCount, lastActiveDate, badges } = data || {};

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // 1. 同步设置
      if (settings && typeof settings === 'object') {
         const s = settings as Record<string, unknown>;
         const safeSettings = {
             fontSize: Number(s.fontSize) || 18,
             lineHeight: Number(s.lineHeight) || 1.8,
             isDarkMode: Boolean(s.isDarkMode),
             showEnglish: Boolean(s.showEnglish),
             lastBook: s.lastBook ? String(s.lastBook) : null,
             lastChapter: s.lastChapter ? Number(s.lastChapter) : null,
             customPlans: s.customPlans ? JSON.stringify(s.customPlans) : "[]",
         };
         await tx.userSetting.upsert({
             where: { userId: user.id },
             update: safeSettings,
             create: { ...safeSettings, userId: user.id }
         });
      }

      // 2. 同步高亮 (merge: 按唯一键匹配，存在则更新，不存在则创建，服务端独有项保留)
      if (Array.isArray(highlights)) {
          const validHighlights = highlights.filter((h: unknown) => h && typeof h === 'object' && (h as Record<string, unknown>).bookId);
          const serverHighlights = await tx.highlight.findMany({ where: { userId: user.id } });
          const serverMap = new Map(serverHighlights.map(h => [`${h.bookId}-${h.chapter}-${h.verse}`, h]));
          const clientKeys = new Set<string>();

          for (const h of validHighlights) {
              const item = h as Record<string, unknown>;
              const key = `${String(item.bookId)}-${Number(item.chapter) || 1}-${Number(item.verse) || 1}`;
              clientKeys.add(key);
              const highlightData = {
                  userId: user.id,
                  bookId: String(item.bookId),
                  chapter: Number(item.chapter) || 1,
                  verse: Number(item.verse) || 1,
                  color: String(item.color || 'yellow')
              };
              const existing = serverMap.get(key);
              if (existing) {
                  await tx.highlight.update({ where: { id: existing.id }, data: { color: highlightData.color } });
              } else {
                  await tx.highlight.create({ data: highlightData });
              }
          }
          // 删除客户端已不存在的高亮（客户端明确移除的）
          for (const [key, serverH] of serverMap) {
              if (!clientKeys.has(key)) {
                  await tx.highlight.delete({ where: { id: serverH.id } });
              }
          }
      }

      // 3. 同步笔记 (merge: 按id匹配，存在则更新，不存在则创建，服务端独有项保留)
      if (Array.isArray(notes)) {
          const validNotes = notes.filter((n: unknown) => n && typeof n === 'object' && (n as Record<string, unknown>).bookId && (n as Record<string, unknown>).id);
          const serverNotes = await tx.note.findMany({ where: { userId: user.id } });
          const serverNoteMap = new Map(serverNotes.map(n => [n.id, n]));
          const clientNoteIds = new Set<string>();

          for (const n of validNotes) {
              const item = n as Record<string, unknown>;
              const noteId = String(item.id);
              clientNoteIds.add(noteId);
              const noteData = {
                  id: noteId,
                  userId: user.id,
                  bookId: String(item.bookId),
                  chapter: Number(item.chapter) || 1,
                  verse: Number(item.verse) || 1,
                  content: String(item.content || '')
              };
              if (serverNoteMap.has(noteId)) {
                  await tx.note.update({ where: { id: noteId }, data: { content: noteData.content, bookId: noteData.bookId, chapter: noteData.chapter, verse: noteData.verse } });
              } else {
                  await tx.note.create({ data: noteData });
              }
          }
          // 删除客户端已不存在的笔记
          for (const [id] of serverNoteMap) {
              if (!clientNoteIds.has(id)) {
                  await tx.note.delete({ where: { id } });
              }
          }
      }

      // 4. 同步阅读记录 (merge: 按唯一键匹配，count取较大值)
      if (Array.isArray(interactions)) {
          const validInteractions = interactions.filter((i: unknown) => i && typeof i === 'object' && (i as Record<string, unknown>).bookId);
          const serverInteractions = await tx.interaction.findMany({ where: { userId: user.id } });
          const serverIntMap = new Map(serverInteractions.map(i => [`${i.bookId}-${i.chapter}`, i]));
          const clientIntKeys = new Set<string>();

          for (const i of validInteractions) {
              const item = i as Record<string, unknown>;
              const key = `${String(item.bookId)}-${Number(item.chapter) || 1}`;
              clientIntKeys.add(key);
              const intData = {
                  userId: user.id,
                  bookId: String(item.bookId),
                  chapter: Number(item.chapter) || 1,
                  count: Number(item.count) || 1
              };
              const existing = serverIntMap.get(key);
              if (existing) {
                  await tx.interaction.update({ where: { id: existing.id }, data: { count: Math.max(existing.count, intData.count) } });
              } else {
                  await tx.interaction.create({ data: intData });
              }
          }
          // 删除客户端已不存在的阅读记录
          for (const [key, serverI] of serverIntMap) {
              if (!clientIntKeys.has(key)) {
                  await tx.interaction.delete({ where: { id: serverI.id } });
              }
          }
      }

        // 5. 同步读经计划 (merge: 按planId匹配，completedTasks合并)
        if (Array.isArray(activePlans)) {
            const serverPlans = await tx.planProgress.findMany({ where: { userId: user.id } });
            const serverPlanMap = new Map(serverPlans.map(p => [p.planId, p]));
            const clientPlanIds = new Set<string>();

            for (const p of activePlans) {
                if (!p || typeof p !== 'object') continue;
                const item = p as Record<string, unknown>;
                const planId = String(item.planId);
                if (!planId) continue;
                clientPlanIds.add(planId);
                const existing = serverPlanMap.get(planId);
                if (existing) {
                    // Merge completedTasks: union of both, 使用 safeJsonParse 防止损坏数据导致崩溃
                    const serverTasks = safeJsonParse(existing.completedTasks);
                    const clientTasks = (item.completedTasks && typeof item.completedTasks === 'object') ? item.completedTasks as Record<string, unknown> : {};
                    const mergedTasks = { ...serverTasks, ...clientTasks };

                    const serverDevotionals = safeJsonParse(existing.savedDevotionals);
                    const clientDevotionals = (item.savedDevotionals && typeof item.savedDevotionals === 'object') ? item.savedDevotionals as Record<string, unknown> : {};
                    const mergedDevotionals = { ...serverDevotionals, ...clientDevotionals };

                    await tx.planProgress.update({
                        where: { id: existing.id },
                        data: {
                            completedTasks: JSON.stringify(mergedTasks),
                            savedDevotionals: JSON.stringify(mergedDevotionals),
                            status: (item.status as string) || existing.status
                        }
                    });
                } else {
                    await tx.planProgress.create({
                        data: {
                            userId: user.id,
                            planId,
                            startDate: new Date(Number(item.startDate) || Date.now()),
                            completedTasks: JSON.stringify((item.completedTasks && typeof item.completedTasks === 'object') ? item.completedTasks : {}),
                            savedDevotionals: JSON.stringify((item.savedDevotionals && typeof item.savedDevotionals === 'object') ? item.savedDevotionals : {}),
                            status: (item.status as string) || 'active'
                        }
                    });
                }
            }
            // 删除客户端已不存在的计划
            for (const [planId, serverP] of serverPlanMap) {
                if (!clientPlanIds.has(planId)) {
                    await tx.planProgress.delete({ where: { id: serverP.id } });
                }
            }
        }

       // 6. 同步火苗统计 (服务端只在值更大时更新，防止被客户端的0覆盖)
       {
         const serverUser = await tx.user.findUnique({ where: { id: user.id }, select: { streakCount: true, lastActiveDate: true } });
         const newStreak = Math.max(serverUser?.streakCount || 0, Number(streakCount) || 0);
         const lastActiveNum = Number(lastActiveDate);
         const newLastActive = lastActiveNum
           ? (serverUser?.lastActiveDate && serverUser.lastActiveDate.getTime() > lastActiveNum ? serverUser.lastActiveDate : new Date(lastActiveNum))
           : serverUser?.lastActiveDate;
         await tx.user.update({
           where: { id: user.id },
           data: {
             streakCount: newStreak,
             lastActiveDate: newLastActive
           }
         });
       }

       // 7. 同步勋章
       if (Array.isArray(badges)) {
         for (const badge of badges) {
           if (!badge || typeof badge !== 'object') continue;
           const b = badge as Record<string, unknown>;
           if (!b.type) continue;
           await tx.badge.upsert({
             where: { userId_type: { userId: user.id, type: String(b.type) } },
             update: { earnedAt: new Date(Number(b.earnedAt) || Date.now()) },
             create: {
               userId: user.id,
               type: String(b.type),
               earnedAt: new Date(Number(b.earnedAt) || Date.now())
             }
           });
         }
       }
     });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Sync save failed" }, { status: 500 });
  }
}
