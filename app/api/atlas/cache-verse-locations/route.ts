import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/atlas/cache-verse-locations - 批量缓存地点-经文关联
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { locationId, verses } = data;

    if (!locationId || !verses || !Array.isArray(verses)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 批量创建关联（忽略重复）
    const results = [];
    for (const v of verses) {
      try {
        const result = await prisma.bibleVerseLocation.create({
          data: {
            locationId,
            bookId: v.bookId,
            chapter: v.chapter,
            verse: v.verse,
            mentionType: 'MENTIONED',
          },
        });
        results.push(result);
      } catch (e) {
        // 忽略重复创建错误
      }
    }

    return NextResponse.json({ cached: results.length });
  } catch (error) {
    console.error('Error caching verse locations:', error);
    return NextResponse.json({ error: 'Failed to cache verse locations' }, { status: 500 });
  }
}