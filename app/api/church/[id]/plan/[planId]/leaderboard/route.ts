// app/api/church/[id]/plan/[planId]/leaderboard/route.ts
// Leaderboard API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string; planId: string }>;
}

// GET - Get leaderboard for a plan
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId, planId } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    // Check membership
    if (userId) {
      const membership = await prisma.churchMember.findFirst({
        where: { churchId, userId }
      });
      if (!membership) {
        return NextResponse.json({ error: 'Not a member' }, { status: 403 });
      }
    }

    // Get leaderboard entries with user info
    const entries = await prisma.leaderboardEntry.findMany({
      where: { planId },
      orderBy: { score: 'desc' },
      take: 50
    });

    // Get user names
    const userIds = [...new Set(entries.map(e => e.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Calculate ranks
    const leaderboard = entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      user: userMap.get(entry.userId) || { id: entry.userId, name: 'Unknown', image: null }
    }));

    // Get current user's position
    let myEntry = null;
    if (userId) {
      const entry = await prisma.leaderboardEntry.findUnique({
        where: { planId_userId: { planId, userId } }
      });
      if (entry) {
        const rank = entries.findIndex(e => e.userId === userId) + 1;
        myEntry = {
          ...entry,
          rank,
          user: userMap.get(userId) || { id: userId, name: 'You', image: null }
        };
      }
    }

    return NextResponse.json({ leaderboard, myEntry });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to get leaderboard' }, { status: 500 });
  }
}