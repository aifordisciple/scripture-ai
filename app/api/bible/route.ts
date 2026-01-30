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
    const verses = await prisma.bibleVerse.findMany({
      where: {
        bookId: book,
        chapter: parseInt(chapter),
        version: 'CUV'
      },
      orderBy: { verse: 'asc' }
    });
    return NextResponse.json({ data: verses });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Database Error' }, { status: 500 });
  }
}
