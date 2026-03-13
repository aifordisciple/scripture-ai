import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/atlas/events - 获取事件列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearStart = searchParams.get('yearStart');
    const yearEnd = searchParams.get('yearEnd');
    const category = searchParams.get('category');
    const testament = searchParams.get('testament');
    const locationId = searchParams.get('locationId');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: any = {};

    if (yearStart !== null || yearEnd !== null) {
      where.OR = [];
      if (yearStart !== null && yearEnd !== null) {
        // 事件时间范围与查询范围有交集
        where.OR.push({
          AND: [
            { yearStart: { gte: parseInt(yearStart) } },
            { yearStart: { lte: parseInt(yearEnd) } },
          ],
        });
        where.OR.push({
          AND: [
            { yearEnd: { gte: parseInt(yearStart) } },
            { yearEnd: { lte: parseInt(yearEnd) } },
          ],
        });
        where.OR.push({
          AND: [
            { yearStart: { lte: parseInt(yearStart) } },
            { yearEnd: { gte: parseInt(yearEnd) } },
          ],
        });
      }
    }

    if (category) {
      where.category = category;
    }

    if (testament) {
      where.testament = testament;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    const events = await prisma.bibleEvent.findMany({
      where,
      take: limit,
      orderBy: { yearStart: 'asc' },
      include: {
        location: {
          select: {
            id: true,
            nameZh: true,
            nameEn: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/atlas/events - 创建新事件
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const event = await prisma.bibleEvent.create({
      data: {
        titleZh: data.titleZh,
        titleEn: data.titleEn,
        description: data.description,
        yearStart: data.yearStart,
        yearEnd: data.yearEnd,
        yearApprox: data.yearApprox || false,
        periodLabel: data.periodLabel,
        locationId: data.locationId,
        bookId: data.bookId,
        chapterStart: data.chapterStart,
        chapterEnd: data.chapterEnd,
        category: data.category,
        testament: data.testament,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}