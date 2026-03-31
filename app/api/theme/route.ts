// app/api/theme/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // 获取所有主题
    const themes = await prisma.bibleTheme.findMany({
      select: {
        id: true,
        nameZh: true,
        nameEn: true,
        category: true,
        summary: true,
        description: true,
        keyVerses: true,
        verseCount: true,
        connectionCount: true,
      },
      orderBy: [
        { category: 'asc' },
        { verseCount: 'desc' },
      ],
    });

    // 获取所有连接
    const connections = await prisma.themeConnection.findMany({
      select: {
        id: true,
        themeId: true,
        relatedThemeId: true,
        connectionType: true,
        strength: true,
      },
    });

    return NextResponse.json({
      success: true,
      themes,
      connections,
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch themes' },
      { status: 500 }
    );
  }
}