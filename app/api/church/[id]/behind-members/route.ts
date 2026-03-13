// app/api/church/[id]/behind-members/route.ts
// API for viewing members who are behind on their reading progress

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get members who are behind on their progress
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const membership = await prisma.churchMember.findFirst({
      where: { churchId, userId: session.user.id }
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json({ error: 'planId required' }, { status: 400 });
    }

    // Get the plan
    const plan = await prisma.groupPlan.findFirst({
      where: { id: planId, churchId }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Calculate current day
    const startDate = new Date(plan.startDate);
    const startMidnight = startDate.setHours(0, 0, 0, 0);
    const todayMidnight = new Date().setHours(0, 0, 0, 0);
    const currentDay = Math.max(1, Math.round((todayMidnight - startMidnight) / 86400000) + 1);

    // Parse tasks
    const tasks = plan.tasks ? JSON.parse(plan.tasks) : [];
    const totalDays = tasks.length || plan.dailyChapters.length;

    // Get all members with their progress
    const members = await prisma.churchMember.findMany({
      where: { churchId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    // Get all progress records for this plan
    const allProgress = await prisma.groupPlanProgress.findMany({
      where: { planId },
      select: {
        userId: true,
        completedTasks: true,
        streakDays: true,
        completedDays: true,
        lastActiveDate: true
      }
    });

    // Create a map of user progress
    const progressMap = new Map<string, {
      completedTasks: Record<string, string[]>;
      streakDays: number;
      completedDays: number;
      lastActiveDate: Date | null;
    }>();

    allProgress.forEach(p => {
      const completedTasks = JSON.parse(p.completedTasks || '{}');
      // Merge all completed tasks
      const existing = progressMap.get(p.userId);
      if (existing) {
        Object.assign(existing.completedTasks, completedTasks);
        existing.streakDays = Math.max(existing.streakDays, p.streakDays);
        existing.completedDays = Math.max(existing.completedDays, p.completedDays);
        if (p.lastActiveDate) {
          if (!existing.lastActiveDate || p.lastActiveDate > existing.lastActiveDate) {
            existing.lastActiveDate = p.lastActiveDate;
          }
        }
      } else {
        progressMap.set(p.userId, {
          completedTasks,
          streakDays: p.streakDays,
          completedDays: p.completedDays,
          lastActiveDate: p.lastActiveDate
        });
      }
    });

    // Analyze each member
    const behindMembers: Array<{
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
      behindDays: number[];
      completedDays: number;
      lastActiveDate: Date | null;
      streakDays: number;
      daysSinceActive: number;
    }> = [];

    for (const member of members) {
      const progress = progressMap.get(member.userId) || {
        completedTasks: {},
        streakDays: 0,
        completedDays: 0,
        lastActiveDate: null
      };

      // Find behind days
      const behindDays: number[] = [];
      for (let day = 1; day < currentDay; day++) {
        const dayTasks = progress.completedTasks[day.toString()] || [];
        const task = tasks.find((t: any) => t.day === day);

        if (task) {
          const hasDevotional = task.devotional;
          const devotionalCompleted = !hasDevotional || dayTasks.includes('devotional');
          const readingsCompleted = task.readings.every((_: any, i: number) => dayTasks.includes(`reading-${i}`));

          if (!devotionalCompleted || !readingsCompleted) {
            behindDays.push(day);
          }
        } else if (plan.dailyChapters[day - 1]) {
          // Fallback for old format
          if (dayTasks.length === 0) {
            behindDays.push(day);
          }
        }
      }

      // Only include if behind
      if (behindDays.length > 0) {
        const now = new Date();
        const daysSinceActive = progress.lastActiveDate
          ? Math.floor((now.getTime() - new Date(progress.lastActiveDate).getTime()) / 86400000)
          : 999; // Never active

        behindMembers.push({
          user: member.user,
          behindDays,
          completedDays: progress.completedDays,
          lastActiveDate: progress.lastActiveDate,
          streakDays: progress.streakDays,
          daysSinceActive
        });
      }
    }

    // Sort by most behind first
    behindMembers.sort((a, b) => b.behindDays.length - a.behindDays.length);

    return NextResponse.json({
      currentDay,
      totalDays,
      behindMembers,
      stats: {
        totalMembers: members.length,
        behindCount: behindMembers.length,
        onTrackCount: members.length - behindMembers.length
      }
    });
  } catch (error) {
    console.error('Get behind members error:', error);
    return NextResponse.json({ error: 'Failed to get behind members' }, { status: 500 });
  }
}