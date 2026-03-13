// app/api/church/[id]/badges/route.ts
// Group Badge API - Manage group badges and achievements

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Badge definitions
const BADGE_DEFINITIONS = [
  {
    type: 'ALL_COMPLETE',
    name: '全员完读',
    description: '所有成员完成读经计划',
    icon: '🏆',
    requirement: '所有成员完成计划'
  },
  {
    type: 'STREAK_7',
    name: '连续7天',
    description: '小组连续7天全员打卡',
    icon: '🔥',
    requirement: '连续7天全员打卡'
  },
  {
    type: 'STREAK_30',
    name: '连续30天',
    description: '小组连续30天全员打卡',
    icon: '🌟',
    requirement: '连续30天全员打卡'
  },
  {
    type: 'CHAPTERS_100',
    name: '百章成就',
    description: '小组累计阅读100章',
    icon: '📚',
    requirement: '累计阅读100章'
  },
  {
    type: 'CHAPTERS_500',
    name: '五百章成就',
    description: '小组累计阅读500章',
    icon: '📖',
    requirement: '累计阅读500章'
  },
  {
    type: 'ENCOURAGER',
    name: '鼓励大师',
    description: '发送超过50次鼓励消息',
    icon: '💝',
    requirement: '发送50次鼓励'
  },
  {
    type: 'FIRST_PLAN',
    name: '启程',
    description: '完成第一个读经计划',
    icon: '🎯',
    requirement: '完成第一个计划'
  }
];

// GET - Get all badges for a church
export async function GET(req: Request, { params }: RouteParams) {
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

    // Get earned badges
    const earnedBadges = await prisma.groupBadge.findMany({
      where: { churchId },
      orderBy: { earnedAt: 'desc' }
    });

    // Get badge progress
    const members = await prisma.churchMember.findMany({
      where: { churchId }
    });

    const plans = await prisma.groupPlan.findMany({
      where: { churchId },
      include: {
        progress: true,
        leaderboard: true
      }
    });

    // Calculate progress for each badge
    const badgeProgress: Record<string, { current: number; target: number; percentage: number }> = {};

    // CHAPTERS badges
    const totalChapters = plans.reduce((sum, plan) => {
      return sum + plan.leaderboard.reduce((s, l) => s + l.chaptersRead, 0);
    }, 0);

    badgeProgress['CHAPTERS_100'] = {
      current: totalChapters,
      target: 100,
      percentage: Math.min(100, (totalChapters / 100) * 100)
    };

    badgeProgress['CHAPTERS_500'] = {
      current: totalChapters,
      target: 500,
      percentage: Math.min(100, (totalChapters / 500) * 100)
    };

    // STREAK badges - find max streak across all plans
    const maxStreak = plans.reduce((max, plan) => {
      const planMaxStreak = plan.leaderboard.reduce((s, l) => Math.max(s, l.streakDays), 0);
      return Math.max(max, planMaxStreak);
    }, 0);

    badgeProgress['STREAK_7'] = {
      current: maxStreak,
      target: 7,
      percentage: Math.min(100, (maxStreak / 7) * 100)
    };

    badgeProgress['STREAK_30'] = {
      current: maxStreak,
      target: 30,
      percentage: Math.min(100, (maxStreak / 30) * 100)
    };

    // MEMBER_COUNT badge
    badgeProgress['MEMBER_COUNT'] = {
      current: members.length,
      target: 10,
      percentage: Math.min(100, (members.length / 10) * 100)
    };

    // Combine with definitions
    const allBadges = BADGE_DEFINITIONS.map(def => {
      const earned = earnedBadges.find(b => b.type === def.type);
      const progress = badgeProgress[def.type];

      return {
        ...def,
        earned: !!earned,
        earnedAt: earned?.earnedAt || null,
        earnedBy: earned?.userIds || [],
        progress
      };
    });

    return NextResponse.json({
      badges: allBadges,
      stats: {
        totalBadges: BADGE_DEFINITIONS.length,
        earnedCount: earnedBadges.length,
        totalChapters,
        memberCount: members.length,
        maxStreak
      }
    });
  } catch (error) {
    console.error('Get badges error:', error);
    return NextResponse.json({ error: 'Failed to get badges' }, { status: 500 });
  }
}

// POST - Award a badge (admin only)
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status
    const membership = await prisma.churchMember.findFirst({
      where: { churchId, userId: session.user.id }
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { type, userIds } = await req.json() as {
      type: string;
      userIds?: string[];
    };

    // Check if badge type is valid
    const badgeDef = BADGE_DEFINITIONS.find(b => b.type === type);
    if (!badgeDef) {
      return NextResponse.json({ error: 'Invalid badge type' }, { status: 400 });
    }

    // Check if already earned
    const existing = await prisma.groupBadge.findUnique({
      where: { churchId_type: { churchId, type } }
    });

    if (existing) {
      // Update with new userIds
      const updated = await prisma.groupBadge.update({
        where: { id: existing.id },
        data: {
          userIds: userIds || existing.userIds
        }
      });
      return NextResponse.json({ badge: updated, updated: true });
    }

    // Create new badge
    const badge = await prisma.groupBadge.create({
      data: {
        churchId,
        type,
        name: badgeDef.name,
        description: badgeDef.description,
        iconUrl: badgeDef.icon,
        userIds: userIds || []
      }
    });

    return NextResponse.json({ badge, created: true });
  } catch (error) {
    console.error('Award badge error:', error);
    return NextResponse.json({ error: 'Failed to award badge' }, { status: 500 });
  }
}