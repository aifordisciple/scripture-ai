// app/api/church/[id]/badges/check/route.ts
// Auto-check and award badges based on achievements

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Check and auto-award eligible badges
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership
    const membership = await prisma.churchMember.findFirst({
      where: { churchId, userId: session.user.id }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    const { planId } = await req.json() as { planId?: string };

    // Get church data
    const members = await prisma.churchMember.findMany({
      where: { churchId }
    });

    const plans = await prisma.groupPlan.findMany({
      where: { churchId, status: 'active' },
      include: {
        progress: true,
        leaderboard: true
      }
    });

    const newlyAwarded: string[] = [];

    // Helper to check and award badge
    const awardBadgeIfEligible = async (type: string, name: string, description: string, eligible: boolean) => {
      if (!eligible) return;

      const existing = await prisma.groupBadge.findUnique({
        where: { churchId_type: { churchId, type } }
      });

      if (!existing) {
        await prisma.groupBadge.create({
          data: {
            churchId,
            type,
            name,
            description,
            iconUrl: getBadgeIcon(type)
          }
        });
        newlyAwarded.push(type);
      }
    };

    // Check CHAPTERS_100
    const totalChapters = plans.reduce((sum, plan) => {
      return sum + plan.leaderboard.reduce((s, l) => s + l.chaptersRead, 0);
    }, 0);

    await awardBadgeIfEligible(
      'CHAPTERS_100',
      '百章成就',
      '小组累计阅读100章',
      totalChapters >= 100
    );

    // Check CHAPTERS_500
    await awardBadgeIfEligible(
      'CHAPTERS_500',
      '五百章成就',
      '小组累计阅读500章',
      totalChapters >= 500
    );

    // Check STREAK_7
    const maxStreak = plans.reduce((max, plan) => {
      const planMaxStreak = plan.leaderboard.reduce((s, l) => Math.max(s, l.streakDays), 0);
      return Math.max(max, planMaxStreak);
    }, 0);

    await awardBadgeIfEligible(
      'STREAK_7',
      '连续7天',
      '小组连续7天全员打卡',
      maxStreak >= 7
    );

    // Check STREAK_30
    await awardBadgeIfEligible(
      'STREAK_30',
      '连续30天',
      '小组连续30天全员打卡',
      maxStreak >= 30
    );

    // Check ALL_COMPLETE for a specific plan
    if (planId) {
      const plan = await prisma.groupPlan.findFirst({
        where: { id: planId, churchId },
        include: {
          progress: true,
          leaderboard: true
        }
      });

      if (plan) {
        // Check if all active members have completed
        const tasks = plan.tasks ? JSON.parse(plan.tasks) : [];
        const totalDays = tasks.length || plan.dailyChapters.length;

        // Get all members who have progress in this plan
        const membersWithProgress = await prisma.groupPlanProgress.findMany({
          where: { planId },
          select: { userId: true, completedDays: true }
        });

        const allComplete = membersWithProgress.length > 0 &&
          membersWithProgress.every(p => p.completedDays >= totalDays);

        if (allComplete) {
          const userIds = membersWithProgress.map(p => p.userId);
          const existing = await prisma.groupBadge.findUnique({
            where: { churchId_type: { churchId, type: 'ALL_COMPLETE' } }
          });

          if (!existing) {
            await prisma.groupBadge.create({
              data: {
                churchId,
                type: 'ALL_COMPLETE',
                name: '全员完读',
                description: `所有成员完成「${plan.name}」`,
                iconUrl: '🏆',
                userIds
              }
            });
            newlyAwarded.push('ALL_COMPLETE');
          }
        }

        // Check FIRST_PLAN
        const completedPlansCount = await prisma.groupPlan.count({
          where: {
            churchId,
            status: 'completed'
          }
        });

        if (completedPlansCount >= 1 || allComplete) {
          await awardBadgeIfEligible(
            'FIRST_PLAN',
            '启程',
            '完成第一个读经计划',
            true
          );
        }
      }
    }

    return NextResponse.json({
      newlyAwarded,
      stats: {
        totalChapters,
        maxStreak,
        memberCount: members.length
      }
    });
  } catch (error) {
    console.error('Badge check error:', error);
    return NextResponse.json({ error: 'Failed to check badges' }, { status: 500 });
  }
}

function getBadgeIcon(type: string): string {
  const icons: Record<string, string> = {
    'ALL_COMPLETE': '🏆',
    'STREAK_7': '🔥',
    'STREAK_30': '🌟',
    'CHAPTERS_100': '📚',
    'CHAPTERS_500': '📖',
    'ENCOURAGER': '💝',
    'FIRST_PLAN': '🎯'
  };
  return icons[type] || '🏅';
}