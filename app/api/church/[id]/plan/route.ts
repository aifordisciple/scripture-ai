// app/api/church/[id]/plan/route.ts
// Group Reading Plan API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - List group plans
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    const plans = await prisma.groupPlan.findMany({
      where: { churchId: id },
      include: {
        progress: userId ? {
          where: { userId }
        } : false,
        _count: { select: { progress: true, leaderboard: true } }
      },
      orderBy: { startDate: 'desc' }
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('List group plans error:', error);
    return NextResponse.json({ error: 'Failed to list plans' }, { status: 500 });
  }
}

// POST - Create group plan
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership
    const membership = await prisma.churchMember.findFirst({
      where: {
        churchId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Only admins can create group plans' }, { status: 403 });
    }

    const {
      name,
      description,
      startDate,
      endDate,
      dailyChapters,
      tasks,
      sharedDevotionals,
      source,
      mode,
      challengeConfig
    } = await req.json();

    if (!name || !startDate || !dailyChapters?.length) {
      return NextResponse.json({
        error: 'Missing required fields: name, startDate, dailyChapters'
      }, { status: 400 });
    }

    const plan = await prisma.groupPlan.create({
      data: {
        churchId,
        name,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        dailyChapters,
        tasks: tasks || null,
        sharedDevotionals: sharedDevotionals || '{}',
        source: source || 'MANUAL',
        mode: mode || 'NORMAL',
        challengeConfig: challengeConfig ? JSON.stringify(challengeConfig) : null
      }
    });

    // Create initial leaderboard entries for all members
    const members = await prisma.churchMember.findMany({
      where: { churchId },
      select: { userId: true }
    });

    for (const member of members) {
      await prisma.leaderboardEntry.create({
        data: {
          planId: plan.id,
          userId: member.userId,
          score: 0,
          chaptersRead: 0,
          streakDays: 0,
          completedDays: 0
        }
      }).catch(() => {
        // Ignore duplicate errors
      });
    }

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Create group plan error:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
