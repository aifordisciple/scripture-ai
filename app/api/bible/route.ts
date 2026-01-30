// app/api/bible/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const book = searchParams.get('book');
  const chapter = searchParams.get('chapter');

  if (!book || !chapter) {
    return NextResponse.json({ error: 'Missing book or chapter' }, { status: 400 });
  }

  try {
    // 关键修改：移除 version: 'CUV' 限制，获取该章节所有版本的数据
    const verses = await prisma.bibleVerse.findMany({
      where: {
        bookId: book,
        chapter: parseInt(chapter),
      },
      orderBy: [
        { verse: 'asc' },   // 先按节排序
        { version: 'asc' }  // 再按版本排序 (CUV, KJV)
      ]
    });

    return NextResponse.json({ data: verses });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Database Error' }, { status: 500 });
  }
}