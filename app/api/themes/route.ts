import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/themes - 获取主题列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (query) {
      where.OR = [
        { nameZh: { contains: query, mode: 'insensitive' } },
        { nameEn: { contains: query, mode: 'insensitive' } },
        { aliases: { has: query } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const themes = await prisma.bibleTheme.findMany({
      where,
      take: limit,
      orderBy: [
        { verseCount: 'desc' },
        { nameZh: 'asc' },
      ],
    });

    return NextResponse.json({ themes });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 });
  }
}

// POST /api/themes - 创建新主题
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const theme = await prisma.bibleTheme.create({
      data: {
        nameZh: data.nameZh,
        nameEn: data.nameEn,
        aliases: data.aliases || [],
        category: data.category,
        summary: data.summary,
        description: data.description,
        keyVerses: data.keyVerses || [],
      },
    });

    return NextResponse.json({ theme });
  } catch (error) {
    console.error('Error creating theme:', error);
    return NextResponse.json({ error: 'Failed to create theme' }, { status: 500 });
  }
}