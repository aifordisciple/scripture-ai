// app/api/church/[id]/stats/route.ts
// Group Statistics API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get group statistics
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    // Check membership
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.churchMember.findFirst({
      where: { churchId, userId }
    });
    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get('planId');
    const days = parseInt(searchParams.get('days') || '30');

    // Get group basic info
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      include: {
        members: { select: { userId: true } },
        groupPlans: {
          select: {
            id: true,
            name: true,
            mode: true,
            startDate: true,
            tasks: true,
            dailyChapters: true
          }
        }
      }
    });

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get activity logs for all members
    const memberIds = church.members.map(m => m.userId);
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        userId: { in: memberIds },
        date: { gte: startDate, lte: endDate }
      },
      select: {
        userId: true,
        date: true,
        actionType: true,
        duration: true
      }
    });

    // Get leaderboard entries if planId provided
    let leaderboardData: any[] = [];
    if (planId) {
      leaderboardData = await prisma.leaderboardEntry.findMany({
        where: { planId },
        include: {
          user: { select: { id: true, name: true, image: true } }
        },
        orderBy: { score: 'desc' }
      });
    }

    // Get progress data - only for plans in this church
    const planIds = church.groupPlans.map(p => p.id);
    const progressData = await prisma.groupPlanProgress.findMany({
      where: planId
        ? { planId }
        : { planId: { in: planIds } },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    // Calculate daily activity
    const dailyActivity: Record<string, { date: string; count: number; duration: number }> = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyActivity[dateStr] = { date: dateStr, count: 0, duration: 0 };
    }

    activityLogs.forEach(log => {
      const dateStr = new Date(log.date).toISOString().split('T')[0];
      if (dailyActivity[dateStr]) {
        dailyActivity[dateStr].count++;
        dailyActivity[dateStr].duration += log.duration || 0;
      }
    });

    // Calculate member stats
    const memberStats = await Promise.all(memberIds.map(async (memberId) => {
      const userLogs = activityLogs.filter(l => l.userId === memberId);
      const totalDuration = userLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
      const activeDays = new Set(userLogs.map(l => new Date(l.date).toISOString().split('T')[0])).size;

      const user = await prisma.user.findUnique({
        where: { id: memberId },
        select: { id: true, name: true, image: true }
      });

      return {
        userId: memberId,
        user,
        totalDuration,
        activeDays,
        lastActive: userLogs.length > 0
          ? userLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
          : null
      };
    }));

    // Calculate overall stats
    const totalChaptersRead = leaderboardData.reduce((sum, e) => sum + e.chaptersRead, 0);
    const totalStreakDays = Math.max(...leaderboardData.map(e => e.streakDays), 0);
    const avgCompletionRate = progressData.length > 0
      ? Math.round(progressData.reduce((sum, p) => sum + p.completedDays, 0) / progressData.length)
      : 0;

    const stats = {
      groupInfo: {
        name: church.name,
        memberCount: church.members.length,
        planCount: church.groupPlans.length
      },
      overview: {
        totalChaptersRead,
        maxStreakDays: totalStreakDays,
        avgCompletionRate,
        totalActivityLogs: activityLogs.length
      },
      dailyActivity: Object.values(dailyActivity).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
      memberStats: memberStats.sort((a, b) => b.activeDays - a.activeDays),
      leaderboard: leaderboardData.slice(0, 10)
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Failed to get statistics' }, { status: 500 });
  }
}