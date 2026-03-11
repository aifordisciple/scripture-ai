// app/api/church/[id]/plan/[planId]/progress/route.ts
// Group Plan Progress API with Fine-grained Task Check-in

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string; planId: string }>;
}

// GET - Get user's progress for a plan
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId, planId } = await params;
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

    // Get plan with tasks
    const plan = await prisma.groupPlan.findFirst({
      where: { id: planId, churchId },
      include: {
        leaderboard: {
          where: { userId: session.user.id }
        }
      }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get all progress records for this user
    const progressRecords = await prisma.groupPlanProgress.findMany({
      where: { planId, userId: session.user.id },
      orderBy: { date: 'asc' }
    });

    // Aggregate completed tasks
    const completedTasks: Record<string, string[]> = {};
    let totalChaptersRead = 0;
    let totalCompletedDays = 0;
    let maxStreak = 0;

    progressRecords.forEach(record => {
      const tasks = JSON.parse(record.completedTasks || '{}');
      Object.assign(completedTasks, tasks);

      totalChaptersRead += record.chaptersRead;
      if (record.streakDays > maxStreak) {
        maxStreak = record.streakDays;
      }
    });

    // Count completed days (days where all tasks are done)
    const tasks = plan.tasks ? JSON.parse(plan.tasks) : null;
    if (tasks) {
      totalCompletedDays = tasks.filter((t: any) => {
        const dayTasks = completedTasks[t.day.toString()] || [];
        const expectedTasks = ['devotional', ...t.readings.map((_: any, i: number) => `reading-${i}`)];
        return expectedTasks.every(et => dayTasks.includes(et));
      }).length;
    }

    return NextResponse.json({
      progress: {
        completedTasks,
        chaptersRead: totalChaptersRead,
        completedDays: totalCompletedDays,
        streakDays: maxStreak,
        status: progressRecords[0]?.status || 'active'
      },
      plan: {
        id: plan.id,
        name: plan.name,
        tasks: plan.tasks,
        sharedDevotionals: plan.sharedDevotionals,
        dailyChapters: plan.dailyChapters
      }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ error: 'Failed to get progress' }, { status: 500 });
  }
}

// POST - Toggle task completion (fine-grained check-in)
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId, planId } = await params;
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

    const { day, taskId, action } = await req.json() as {
      day: number;
      taskId: string; // "devotional" | "reading-0" | "reading-1" ...
      action: 'complete' | 'uncomplete';
    };

    if (!day || !taskId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the plan
    const plan = await prisma.groupPlan.findFirst({
      where: { id: planId, churchId }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Calculate today's date (UTC midnight)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Find or create today's progress record
    let progress = await prisma.groupPlanProgress.findFirst({
      where: { planId, userId: session.user.id, date: today }
    });

    if (!progress) {
      progress = await prisma.groupPlanProgress.create({
        data: {
          planId,
          userId: session.user.id,
          date: today,
          completedTasks: '{}',
          chaptersRead: 0,
          streakDays: 0,
          completedDays: 0,
          status: 'active'
        }
      });
    }

    // Update completed tasks
    const completedTasks = JSON.parse(progress.completedTasks || '{}');
    const dayKey = day.toString();
    const currentTasks = completedTasks[dayKey] || [];

    if (action === 'complete') {
      if (!currentTasks.includes(taskId)) {
        currentTasks.push(taskId);
      }
    } else {
      const index = currentTasks.indexOf(taskId);
      if (index > -1) {
        currentTasks.splice(index, 1);
      }
    }

    completedTasks[dayKey] = currentTasks.sort();

    // Calculate chapters read for this day
    let chaptersReadToday = 0;
    const readings = currentTasks.filter(t => t.startsWith('reading-'));
    chaptersReadToday = readings.length;

    // Calculate streak
    const allProgress = await prisma.groupPlanProgress.findMany({
      where: { planId, userId: session.user.id },
      orderBy: { date: 'desc' }
    });

    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    let streakDays = 1;
    const hasYesterdayProgress = allProgress.some(p => {
      const pDate = new Date(p.date);
      pDate.setUTCHours(0, 0, 0, 0);
      return pDate.getTime() === yesterday.getTime();
    });

    if (hasYesterdayProgress) {
      const yesterdayProgress = allProgress.find(p => {
        const pDate = new Date(p.date);
        pDate.setUTCHours(0, 0, 0, 0);
        return pDate.getTime() === yesterday.getTime();
      });
      if (yesterdayProgress) {
        streakDays = yesterdayProgress.streakDays + 1;
      }
    }

    // Calculate total completed days
    const tasks = plan.tasks ? JSON.parse(plan.tasks) : null;
    let completedDays = 0;
    if (tasks) {
      completedDays = tasks.filter((t: any) => {
        const dayTasks = completedTasks[t.day.toString()] || [];
        const expectedTasks = ['devotional', ...t.readings.map((_: any, i: number) => `reading-${i}`)];
        return expectedTasks.every(et => dayTasks.includes(et));
      }).length;
    }

    // Update progress record
    const updatedProgress = await prisma.groupPlanProgress.update({
      where: { id: progress.id },
      data: {
        completedTasks: JSON.stringify(completedTasks),
        chaptersRead: chaptersReadToday,
        streakDays,
        completedDays,
        lastActiveDate: new Date()
      }
    });

    // Update leaderboard
    // Calculate total stats
    const totalChaptersRead = chaptersReadToday + allProgress
      .filter(p => p.id !== progress.id)
      .reduce((sum, p) => sum + p.chaptersRead, 0);

    const score = totalChaptersRead * 10 + streakDays * 50 + completedDays * 100;

    const leaderboardEntry = await prisma.leaderboardEntry.upsert({
      where: { planId_userId: { planId, userId: session.user.id } },
      update: {
        score,
        chaptersRead: totalChaptersRead,
        streakDays,
        completedDays
      },
      create: {
        planId,
        userId: session.user.id,
        score,
        chaptersRead: totalChaptersRead,
        streakDays,
        completedDays
      }
    });

    // Also update user's personal streak (fire)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (user) {
      const lastActiveDate = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
      const todayStr = today.toDateString();
      const lastDateStr = lastActiveDate?.toDateString();

      let newStreakCount = user.streakCount;
      if (lastDateStr !== todayStr) {
        if (!lastActiveDate) {
          newStreakCount = 1;
        } else {
          const diffTime = today.getTime() - lastActiveDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            newStreakCount = user.streakCount + 1;
          } else if (diffDays === 0) {
            // Same day, no change
          } else {
            newStreakCount = 1;
          }
        }

        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            streakCount: newStreakCount,
            lastActiveDate: new Date()
          }
        });
      }
    }

    return NextResponse.json({
      progress: updatedProgress,
      leaderboard: leaderboardEntry,
      completedTasks
    });
  } catch (error) {
    console.error('Toggle task error:', error);
    return NextResponse.json({ error: 'Failed to toggle task' }, { status: 500 });
  }
}