// app/api/highlight/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 模拟用户ID (在没有 NextAuth 之前的临时方案)
const TEMP_USER_ID = "user_12345";

// 获取高亮
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get('bookId');
  const chapter = searchParams.get('chapter');

  if (!bookId || !chapter) return NextResponse.json({ data: [] });

  // 确保临时用户存在
  await ensureUserExists();

  const highlights = await prisma.highlight.findMany({
    where: {
      userId: TEMP_USER_ID,
      bookId: bookId,
      chapter: parseInt(chapter)
    }
  });

  return NextResponse.json({ data: highlights });
}

// 保存或删除高亮
export async function POST(req: Request) {
  const { bookId, chapter, verses, color } = await req.json();
  
  await ensureUserExists();

  try {
    const operations = [];

    // 如果 color 是 null，说明是清除高亮
    if (!color) {
      operations.push(prisma.highlight.deleteMany({
        where: {
          userId: TEMP_USER_ID,
          bookId,
          chapter,
          verse: { in: verses }
        }
      }));
    } else {
      // Upsert: 有则更新颜色，无则创建
      for (const verse of verses) {
        operations.push(prisma.highlight.upsert({
          where: {
            userId_bookId_chapter_verse: {
              userId: TEMP_USER_ID,
              bookId,
              chapter,
              verse
            }
          },
          update: { color },
          create: {
            userId: TEMP_USER_ID,
            bookId,
            chapter,
            verse,
            color
          }
        }));
      }
    }

    await prisma.$transaction(operations);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

async function ensureUserExists() {
  const user = await prisma.user.findUnique({ where: { id: TEMP_USER_ID } });
  if (!user) {
    await prisma.user.create({
      data: { id: TEMP_USER_ID, email: 'demo@example.com', name: 'Demo User' }
    });
  }
}