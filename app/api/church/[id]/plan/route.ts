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

// PUT - Update group plan
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin membership
    const membership = await prisma.churchMember.findFirst({
      where: {
        churchId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Only admins can update group plans' }, { status: 403 });
    }

    const {
      planId,
      name,
      description,
      startDate,
      endDate,
      dailyChapters,
      tasks,
      mode,
      challengeConfig
    } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Verify the plan belongs to this church
    const existingPlan = await prisma.groupPlan.findFirst({
      where: { id: planId, churchId }
    });

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (dailyChapters !== undefined) updateData.dailyChapters = dailyChapters;
    if (tasks !== undefined) updateData.tasks = tasks;
    if (mode !== undefined) updateData.mode = mode;
    if (challengeConfig !== undefined) updateData.challengeConfig = challengeConfig ? JSON.stringify(challengeConfig) : null;

    const plan = await prisma.groupPlan.update({
      where: { id: planId },
      data: updateData
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Update group plan error:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE - Delete group plan
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin membership
    const membership = await prisma.churchMember.findFirst({
      where: {
        churchId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Only admins can delete group plans' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Verify the plan belongs to this church
    const existingPlan = await prisma.groupPlan.findFirst({
      where: { id: planId, churchId }
    });

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Delete the plan (cascade will handle related records)
    await prisma.groupPlan.delete({
      where: { id: planId }
    });

    return NextResponse.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Delete group plan error:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
