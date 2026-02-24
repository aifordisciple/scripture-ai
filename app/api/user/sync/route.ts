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
        planProgress: true
      }
    });

    if (!user) return new NextResponse("User not found", { status: 404 });

    let activePlan = null;
    if (user.planProgress) {
        try {
            activePlan = {
                planId: user.planProgress.planId,
                startDate: user.planProgress.startDate.getTime(),
                completedDays: JSON.parse(user.planProgress.completedDays || "[]")
            };
        } catch (e) { console.error("Failed to parse planProgress", e); }
    }

    return NextResponse.json({
      settings: user.settings,
      highlights: user.highlights,
      notes: user.notes,
      interactions: user.interactions,
      activePlan
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
    const { settings, highlights, notes, interactions, activePlan } = data || {};

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
         };
         await tx.userSetting.upsert({
             where: { userId: user.id },
             update: safeSettings,
             create: { ...safeSettings, userId: user.id }
         });
      }

      // 2. 同步高亮
      if (Array.isArray(highlights)) {
          await tx.highlight.deleteMany({ where: { userId: user.id } });
          const validHighlights = highlights.filter(h => h && h.bookId);
          if (validHighlights.length > 0) {
              await tx.highlight.createMany({
                  data: validHighlights.map((h: any) => ({
                      userId: user.id,
                      bookId: String(h.bookId),
                      chapter: Number(h.chapter) || 1,
                      verse: Number(h.verse) || 1,
                      color: String(h.color || 'yellow')
                  }))
              });
          }
      }

      // 3. 同步笔记
      if (Array.isArray(notes)) {
          await tx.note.deleteMany({ where: { userId: user.id } });
          const validNotes = notes.filter(n => n && n.bookId && n.id);
          if (validNotes.length > 0) {
              await tx.note.createMany({
                  data: validNotes.map((n: any) => ({
                      id: String(n.id),
                      userId: user.id,
                      bookId: String(n.bookId),
                      chapter: Number(n.chapter) || 1,
                      verse: Number(n.verse) || 1,
                      content: String(n.content || '')
                  }))
              });
          }
      }

      // 4. 同步阅读记录
      if (Array.isArray(interactions)) {
          await tx.interaction.deleteMany({ where: { userId: user.id } });
          const validInteractions = interactions.filter(i => i && i.bookId);
          if (validInteractions.length > 0) {
               await tx.interaction.createMany({
                  data: validInteractions.map((i: any) => ({
                      userId: user.id,
                      bookId: String(i.bookId),
                      chapter: Number(i.chapter) || 1,
                      count: Number(i.count) || 1
                  }))
              });
          }
      }

      // 5. 同步读经计划
      if (activePlan !== undefined) {
        if (activePlan === null) {
          await tx.planProgress.deleteMany({ where: { userId: user.id } });
        } else {
          const safePlan = {
            planId: String(activePlan.planId),
            startDate: new Date(activePlan.startDate || Date.now()),
            completedDays: JSON.stringify(activePlan.completedDays || [])
          };
          await tx.planProgress.upsert({
            where: { userId: user.id },
            update: safePlan,
            create: { ...safePlan, userId: user.id }
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
