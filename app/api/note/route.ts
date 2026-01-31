// app/api/note/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TEMP_USER_ID = "user_12345";

export async function POST(req: Request) {
  const { bookId, chapter, verse, content } = await req.json();

  const note = await prisma.note.create({
    data: {
      userId: TEMP_USER_ID,
      bookId,
      chapter,
      verse,
      content,
      // 可以在这里调用 AI 函数来提取标签 tags (此处略)
    }
  });

  return NextResponse.json({ data: note });
}