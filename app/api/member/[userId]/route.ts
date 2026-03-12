// app/api/member/[userId]/route.ts
// Member Profile API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// GET - Get member profile
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const session = await auth();

    const { searchParams } = new URL(req.url);
    const churchId = searchParams.get('churchId');

    // Get user basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        streakCount: true,
        lastActiveDate: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user badges
    const badges = await prisma.badge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' }
    });

    // Get reading stats
    const interactions = await prisma.interaction.findMany({
      where: { userId },
      select: { bookId: true, chapter: true, count: true }
    });

    const totalChaptersRead = interactions.reduce((sum, i) => sum + i.count, 0);
    const uniqueBooksRead = new Set(interactions.map(i => i.bookId)).size;

    // Get notes shared to group (if churchId provided)
    let sharedNotes: any[] = [];
    if (churchId) {
      sharedNotes = await prisma.note.findMany({
        where: {
          userId,
          isPublic: true,
          sharedTo: churchId
        },
        select: {
          id: true,
          bookId: true,
          chapter: true,
          verse: true,
          content: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
    }

    // Get plan progress (if churchId provided)
    let planProgress: any[] = [];
    if (churchId) {
      const groupPlans = await prisma.groupPlan.findMany({
        where: { churchId },
        select: { id: true, name: true }
      });

      const planIds = groupPlans.map(p => p.id);

      if (planIds.length > 0) {
        const progress = await prisma.groupPlanProgress.findMany({
          where: {
            userId,
            planId: { in: planIds }
          },
          include: {
            plan: {
              select: { id: true, name: true }
            }
          }
        });

        planProgress = progress.map(p => ({
          planId: p.planId,
          planName: p.plan.name,
          chaptersRead: p.chaptersRead,
          streakDays: p.streakDays,
          completedDays: p.completedDays,
          completedTasks: p.completedTasks
        }));
      }
    }

    // Get leaderboard entries for this user
    const leaderboardEntries = await prisma.leaderboardEntry.findMany({
      where: { userId },
      include: {
        plan: {
          select: { id: true, name: true, churchId: true }
        }
      }
    });

    const totalScore = leaderboardEntries.reduce((sum, e) => sum + e.score, 0);

    return NextResponse.json({
      user,
      stats: {
        totalChaptersRead,
        uniqueBooksRead,
        totalScore,
        streakDays: user.streakCount
      },
      badges,
      sharedNotes,
      planProgress,
      leaderboardEntries
    });
  } catch (error) {
    console.error('Get member profile error:', error);
    return NextResponse.json({ error: 'Failed to get member profile' }, { status: 500 });
  }
}