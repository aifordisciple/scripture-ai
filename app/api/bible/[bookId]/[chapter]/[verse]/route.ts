// app/api/bible/[bookId]/[chapter]/[verse]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookId: string; chapter: string; verse: string }> }
) {
  try {
    const { bookId, chapter, verse } = await params;
    const chapterNum = parseInt(chapter);
    const verseNum = parseInt(verse);

    if (isNaN(chapterNum) || isNaN(verseNum)) {
      return NextResponse.json({ error: 'Invalid chapter or verse number' }, { status: 400 });
    }

    const verseData = await prisma.bibleVerse.findFirst({
      where: {
        bookId: bookId.toUpperCase(),
        chapter: chapterNum,
        verse: verseNum,
        version: 'CUV',
      },
      select: {
        id: true,
        bookId: true,
        bookName: true,
        chapter: true,
        verse: true,
        content: true,
      },
    });

    if (!verseData) {
      return NextResponse.json({ error: 'Verse not found' }, { status: 404 });
    }

    return NextResponse.json(verseData);
  } catch (error) {
    console.error('Error fetching verse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}