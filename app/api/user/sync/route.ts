// app/api/user/sync/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
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

    if (!user) return new NextResponse("User not found", { status: 404 });

    // [修复] 显式声明变量类型为 any[]
    let activePlans: any[] = [];
    if (user.planProgress && Array.isArray(user.planProgress)) {
        activePlans = user.planProgress.map((p: any) => ({
            planId: p.planId,
            startDate: p.startDate.getTime(),
            completedTasks: JSON.parse(p.completedTasks || "{}"),
            savedDevotionals: JSON.parse(p.savedDevotionals || "{}"),
            status: p.status || 'active'
        }));
    }

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
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const data = await req.json();
    const { settings, highlights, notes, interactions, activePlans, streakCount, lastActiveDate, badges } = data || {};

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    await prisma.$transaction(async (tx) => {
      // 1. 同步设置
      if (settings) {
         const safeSettings = {
             fontSize: Number(settings.fontSize) || 18,
             lineHeight: Number(settings.lineHeight) || 1.8,
             isDarkMode: Boolean(settings.isDarkMode),
             showEnglish: Boolean(settings.showEnglish),
             lastBook: settings.lastBook || null,
             lastChapter: settings.lastChapter ? Number(settings.lastChapter) : null,
             customPlans: settings.customPlans ? JSON.stringify(settings.customPlans) : "[]",
         };
         await tx.userSetting.upsert({
             where: { userId: user.id },
             update: safeSettings,
             create: { ...safeSettings, userId: user.id }
         });
      }

      // 2. 同步高亮 (merge: 按唯一键匹配，存在则更新，不存在则创建，服务端独有项保留)
      if (Array.isArray(highlights)) {
          const validHighlights = highlights.filter(h => h && h.bookId);
          // 获取服务端当前高亮
          const serverHighlights = await tx.highlight.findMany({ where: { userId: user.id } });
          const serverMap = new Map(serverHighlights.map(h => [`${h.bookId}-${h.chapter}-${h.verse}`, h]));
          const clientKeys = new Set<string>();

          for (const h of validHighlights) {
              const key = `${String(h.bookId)}-${Number(h.chapter) || 1}-${Number(h.verse) || 1}`;
              clientKeys.add(key);
              const data = {
                  userId: user.id,
                  bookId: String(h.bookId),
                  chapter: Number(h.chapter) || 1,
                  verse: Number(h.verse) || 1,
                  color: String(h.color || 'yellow')
              };
              const existing = serverMap.get(key);
              if (existing) {
                  await tx.highlight.update({ where: { id: existing.id }, data: { color: data.color } });
              } else {
                  await tx.highlight.create({ data });
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
          const validNotes = notes.filter(n => n && n.bookId && n.id);
          const serverNotes = await tx.note.findMany({ where: { userId: user.id } });
          const serverNoteMap = new Map(serverNotes.map(n => [n.id, n]));
          const clientNoteIds = new Set<string>();

          for (const n of validNotes) {
              const noteId = String(n.id);
              clientNoteIds.add(noteId);
              const data = {
                  id: noteId,
                  userId: user.id,
                  bookId: String(n.bookId),
                  chapter: Number(n.chapter) || 1,
                  verse: Number(n.verse) || 1,
                  content: String(n.content || '')
              };
              if (serverNoteMap.has(noteId)) {
                  await tx.note.update({ where: { id: noteId }, data: { content: data.content, bookId: data.bookId, chapter: data.chapter, verse: data.verse } });
              } else {
                  await tx.note.create({ data });
              }
          }
          // 删除客户端已不存在的笔记
          for (const [id, _] of serverNoteMap) {
              if (!clientNoteIds.has(id)) {
                  await tx.note.delete({ where: { id } });
              }
          }
      }

      // 4. 同步阅读记录 (merge: 按唯一键匹配，count取较大值)
      if (Array.isArray(interactions)) {
          const validInteractions = interactions.filter(i => i && i.bookId);
          const serverInteractions = await tx.interaction.findMany({ where: { userId: user.id } });
          const serverIntMap = new Map(serverInteractions.map(i => [`${i.bookId}-${i.chapter}`, i]));
          const clientIntKeys = new Set<string>();

          for (const i of validInteractions) {
              const key = `${String(i.bookId)}-${Number(i.chapter) || 1}`;
              clientIntKeys.add(key);
              const data = {
                  userId: user.id,
                  bookId: String(i.bookId),
                  chapter: Number(i.chapter) || 1,
                  count: Number(i.count) || 1
              };
              const existing = serverIntMap.get(key);
              if (existing) {
                  await tx.interaction.update({ where: { id: existing.id }, data: { count: Math.max(existing.count, data.count) } });
              } else {
                  await tx.interaction.create({ data });
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
                const planId = String(p.planId);
                clientPlanIds.add(planId);
                const existing = serverPlanMap.get(planId);
                if (existing) {
                    // Merge completedTasks: union of both
                    const mergedTasks = { ...JSON.parse(existing.completedTasks || '{}'), ...JSON.parse(JSON.stringify(p.completedTasks || {})) };
                    const mergedDevotionals = { ...JSON.parse(existing.savedDevotionals || '{}'), ...JSON.parse(JSON.stringify(p.savedDevotionals || {})) };
                    await tx.planProgress.update({
                        where: { id: existing.id },
                        data: {
                            completedTasks: JSON.stringify(mergedTasks),
                            savedDevotionals: JSON.stringify(mergedDevotionals),
                            status: p.status || existing.status
                        }
                    });
                } else {
                    await tx.planProgress.create({
                        data: {
                            userId: user.id,
                            planId,
                            startDate: new Date(p.startDate || Date.now()),
                            completedTasks: JSON.stringify(p.completedTasks || {}),
                            savedDevotionals: JSON.stringify(p.savedDevotionals || {}),
                            status: p.status || 'active'
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
         const newStreak = Math.max(serverUser?.streakCount || 0, streakCount || 0);
         const newLastActive = lastActiveDate
           ? (serverUser?.lastActiveDate && serverUser.lastActiveDate.getTime() > lastActiveDate ? serverUser.lastActiveDate : new Date(lastActiveDate))
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
           await tx.badge.upsert({
             where: { userId_type: { userId: user.id, type: badge.type } },
             update: { earnedAt: new Date(badge.earnedAt) },
             create: {
               userId: user.id,
               type: badge.type,
               earnedAt: new Date(badge.earnedAt)
             }
           });
         }
       }
     });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Sync error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
