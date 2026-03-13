import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/atlas/journeys - 获取旅程列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get('id');
    const journeyType = searchParams.get('type');

    if (journeyId) {
      // 获取单个旅程详情
      const journey = await prisma.bibleJourney.findUnique({
        where: { id: journeyId },
        include: {
          stops: {
            orderBy: { order: 'asc' },
            include: {
              location: true,
            },
          },
        },
      });

      if (!journey) {
        return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
      }

      return NextResponse.json({ journey });
    }

    const where: any = {};
    if (journeyType) {
      where.journeyType = journeyType;
    }

    const journeys = await prisma.bibleJourney.findMany({
      where,
      include: {
        stops: {
          orderBy: { order: 'asc' },
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
        },
      },
      orderBy: { yearStart: 'asc' },
    });

    return NextResponse.json({ journeys });
  } catch (error) {
    console.error('Error fetching journeys:', error);
    return NextResponse.json({ error: 'Failed to fetch journeys' }, { status: 500 });
  }
}

// POST /api/atlas/journeys - 创建新旅程
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const journey = await prisma.bibleJourney.create({
      data: {
        titleZh: data.titleZh,
        personId: data.personId,
        yearStart: data.yearStart,
        yearEnd: data.yearEnd,
        journeyType: data.journeyType,
        stops: data.stops ? {
          create: data.stops.map((stop: any, index: number) => ({
            locationId: stop.locationId,
            order: index,
            verseRef: stop.verseRef,
          })),
        } : undefined,
      },
      include: {
        stops: {
          include: {
            location: true,
          },
        },
      },
    });

    return NextResponse.json({ journey });
  } catch (error) {
    console.error('Error creating journey:', error);
    return NextResponse.json({ error: 'Failed to create journey' }, { status: 500 });
  }
}