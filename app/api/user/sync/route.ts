// app/api/user/sync/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      settings: true,
      highlights: true,
      notes: true,
      interactions: true // [修复] GET 时必须包含 interactions，否则换设备记录会丢失
    }
  });

  if (!user) return new NextResponse("User not found", { status: 404 });

  return NextResponse.json({
    settings: user.settings,
    highlights: user.highlights,
    notes: user.notes,
    interactions: user.interactions
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const data = await req.json();
    const { settings, highlights, notes, interactions } = data;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    await prisma.$transaction(async (tx) => {
      // 1. 同步设置
      if (settings) {
         // [修复] 强制清洗字段，防止前端传入非法属性导致 Prisma 报错，处理 NaN
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
      if (highlights && Array.isArray(highlights)) {
          await tx.highlight.deleteMany({ where: { userId: user.id } });
          if (highlights.length > 0) {
              await tx.highlight.createMany({
                  // [修复] 显式映射字段，防止注入前端的额外 Key
                  data: highlights.map((h: any) => ({
                      userId: user.id,
                      bookId: h.bookId,
                      chapter: h.chapter,
                      verse: h.verse,
                      color: h.color
                  }))
              });
          }
      }

      // 3. 同步笔记
      if (notes && Array.isArray(notes)) {
          await tx.note.deleteMany({ where: { userId: user.id } });
          if (notes.length > 0) {
              await tx.note.createMany({
                  data: notes.map((n: any) => ({
                      id: n.id,
                      userId: user.id,
                      bookId: n.bookId,
                      chapter: n.chapter,
                      verse: n.verse,
                      content: n.content
                  }))
              });
          }
      }

      // 4. 同步阅读记录
      if (interactions && Array.isArray(interactions)) {
          await tx.interaction.deleteMany({ where: { userId: user.id } });
          if (interactions.length > 0) {
               await tx.interaction.createMany({
                  data: interactions.map((i: any) => ({
                      userId: user.id,
                      bookId: i.bookId,
                      chapter: i.chapter,
                      count: i.count
                  }))
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
