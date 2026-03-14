// app/api/announcements/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/announcements - 获取公开的系统公告
export async function GET() {
  try {
    const now = new Date();

    const announcements = await prisma.systemAnnouncement.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } }
        ],
        OR: [
          { endsAt: null },
          { endsAt: { gte: now } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        createdAt: true
      }
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Fetch announcements error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}