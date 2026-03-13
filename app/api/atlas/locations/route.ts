import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/atlas/locations - 获取地点列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const region = searchParams.get('region');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (query) {
      where.OR = [
        { nameZh: { contains: query, mode: 'insensitive' } },
        { nameEn: { contains: query, mode: 'insensitive' } },
        { aliases: { has: query } },
      ];
    }

    if (region) {
      where.region = region;
    }

    const locations = await prisma.bibleLocation.findMany({
      where,
      take: limit,
      orderBy: { nameZh: 'asc' },
    });

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

// POST /api/atlas/locations - 创建新地点
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const location = await prisma.bibleLocation.create({
      data: {
        nameZh: data.nameZh,
        nameEn: data.nameEn,
        nameOriginal: data.nameOriginal,
        aliases: data.aliases || [],
        latitude: data.latitude,
        longitude: data.longitude,
        region: data.region,
        modernCountry: data.modernCountry,
        description: data.description,
        significance: data.significance,
      },
    });

    return NextResponse.json({ location });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}