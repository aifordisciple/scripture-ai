import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/themes/verses - 获取主题关联的经文
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const themeId = searchParams.get('themeId');
    const bookId = searchParams.get('bookId');
    const chapter = searchParams.get('chapter');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (themeId) {
      // 获取某主题关联的所有经文
      const verseLinks = await prisma.themeVerseLink.findMany({
        where: { themeId },
        take: limit,
        orderBy: [
          { bookId: 'asc' },
          { chapter: 'asc' },
          { verseStart: 'asc' },
        ],
      });

      // 获取经文内容
      const verseRefs = verseLinks.map(vl => ({
        bookId: vl.bookId,
        chapter: vl.chapter,
        verseStart: vl.verseStart,
        verseEnd: vl.verseEnd,
      }));

      // 批量获取经文内容
      const verses = await prisma.bibleVerse.findMany({
        where: {
          OR: verseRefs.map(ref => ({
            bookId: ref.bookId,
            chapter: ref.chapter,
            verse: { gte: ref.verseStart, lte: ref.verseEnd || ref.verseStart },
          })),
        },
      });

      // 组装结果
      const results = verseLinks.map(vl => {
        const relatedVerses = verses.filter(v =>
          v.bookId === vl.bookId &&
          v.chapter === vl.chapter &&
          v.verse >= vl.verseStart &&
          v.verse <= (vl.verseEnd || vl.verseStart)
        );

        return {
          ...vl,
          content: relatedVerses.map(v => v.content).join(''),
        };
      });

      return NextResponse.json({ verseLinks: results });
    }

    if (bookId && chapter) {
      // 获取某章经文关联的所有主题
      const verseLinks = await prisma.themeVerseLink.findMany({
        where: {
          bookId,
          chapter: parseInt(chapter),
        },
        include: {
          theme: {
            select: {
              id: true,
              nameZh: true,
              nameEn: true,
              category: true,
            },
          },
        },
      });

      return NextResponse.json({ verseLinks });
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching theme verses:', error);
    return NextResponse.json({ error: 'Failed to fetch theme verses' }, { status: 500 });
  }
}

// POST /api/themes/verses - 创建主题-经文关联
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const verseLink = await prisma.themeVerseLink.create({
      data: {
        themeId: data.themeId,
        bookId: data.bookId,
        chapter: data.chapter,
        verseStart: data.verseStart,
        verseEnd: data.verseEnd,
        relevance: data.relevance || 1.0,
        linkType: data.linkType || 'SECONDARY',
        source: data.source || 'MANUAL',
      },
      include: {
        theme: true,
      },
    });

    // 更新主题的经文计数
    await prisma.bibleTheme.update({
      where: { id: data.themeId },
      data: {
        verseCount: { increment: 1 },
      },
    });

    return NextResponse.json({ verseLink });
  } catch (error) {
    console.error('Error creating theme verse link:', error);
    return NextResponse.json({ error: 'Failed to create theme verse link' }, { status: 500 });
  }
}