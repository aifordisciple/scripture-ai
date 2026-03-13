import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/themes/similar - 使用向量搜索查找相似主题
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const themeId = searchParams.get('themeId');
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (themeId) {
      // 基于主题的关联主题查找
      const connections = await prisma.themeConnection.findMany({
        where: { themeId },
        include: {
          relatedTheme: true,
        },
        orderBy: { strength: 'desc' },
        take: limit,
      });

      const similarThemes = connections.map(c => ({
        ...c.relatedTheme,
        connectionType: c.connectionType,
        strength: c.strength,
      }));

      return NextResponse.json({ similarThemes });
    }

    if (query) {
      // 基于查询文本的主题搜索
      const themes = await prisma.bibleTheme.findMany({
        where: {
          OR: [
            { nameZh: { contains: query, mode: 'insensitive' } },
            { nameEn: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } },
            { aliases: { has: query } },
          ],
        },
        take: limit,
        orderBy: { verseCount: 'desc' },
      });

      return NextResponse.json({ similarThemes: themes });
    }

    return NextResponse.json({ error: 'Missing themeId or query' }, { status: 400 });
  } catch (error) {
    console.error('Error finding similar themes:', error);
    return NextResponse.json({ error: 'Failed to find similar themes' }, { status: 500 });
  }
}