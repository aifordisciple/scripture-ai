// app/api/bible/[bookId]/[chapter]/[verse]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_VERSION } from '@/lib/constants';

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

    // Accept version from query param, default based on locale
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get('locale') || 'zh') as 'zh' | 'en';
    const version = (searchParams.get('version') || DEFAULT_VERSION[locale]) as 'CUV' | 'KJV';

    const verseData = await prisma.bibleVerse.findFirst({
      where: {
        bookId: bookId.toUpperCase(),
        chapter: chapterNum,
        verse: verseNum,
        version,
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