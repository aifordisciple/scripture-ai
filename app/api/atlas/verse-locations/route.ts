import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/atlas/verse-locations - 获取经文关联的地点
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const chapter = searchParams.get('chapter');
    const verse = searchParams.get('verse');
    const locationId = searchParams.get('locationId');

    if (locationId) {
      // 获取某地点关联的所有经文
      const verseLocations = await prisma.bibleVerseLocation.findMany({
        where: { locationId },
        include: {
          location: true,
        },
        orderBy: [
          { bookId: 'asc' },
          { chapter: 'asc' },
          { verse: 'asc' },
        ],
      });

      return NextResponse.json({ verseLocations });
    }

    if (bookId && chapter) {
      // 获取某章经文关联的所有地点
      const where: any = {
        bookId,
        chapter: parseInt(chapter),
      };

      if (verse) {
        where.verse = parseInt(verse);
      }

      const verseLocations = await prisma.bibleVerseLocation.findMany({
        where,
        include: {
          location: true,
        },
      });

      return NextResponse.json({ verseLocations });
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching verse locations:', error);
    return NextResponse.json({ error: 'Failed to fetch verse locations' }, { status: 500 });
  }
}

// POST /api/atlas/verse-locations - 创建经文-地点关联
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const verseLocation = await prisma.bibleVerseLocation.create({
      data: {
        locationId: data.locationId,
        bookId: data.bookId,
        chapter: data.chapter,
        verse: data.verse,
        mentionType: data.mentionType || 'MENTIONED',
      },
      include: {
        location: true,
      },
    });

    return NextResponse.json({ verseLocation });
  } catch (error) {
    console.error('Error creating verse location:', error);
    return NextResponse.json({ error: 'Failed to create verse location' }, { status: 500 });
  }
}