// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, getDateRange } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.error!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    const { start, end } = getDateRange(period);

    // 并行获取所有统计数据
    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      activeToday,
      totalChurches,
      publicChurches,
      totalChurchMembers,
      totalFeedback,
      openFeedback,
      inProgressFeedback,
      resolvedFeedback,
      recentActivity,
      dailyActiveUsers,
      newUsersDaily,
    ] = await Promise.all([
      // 用户统计
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: start } }
      }),
      prisma.user.count({
        where: { lastActiveDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
      }),

      // 小组统计
      prisma.church.count(),
      prisma.church.count({ where: { isPublic: true } }),
      prisma.churchMember.count(),

      // 反馈统计
      prisma.feedback.count(),
      prisma.feedback.count({ where: { status: 'OPEN' } }),
      prisma.feedback.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.feedback.count({ where: { status: 'RESOLVED' } }),

      // 最近活动
      prisma.activityLog.count({
        where: { createdAt: { gte: start } }
      }),

      // 每日活跃用户（最近7天）
      getDailyActiveUsers(7),

      // 每日新增用户（最近7天）
      getDailyNewUsers(7),
    ]);

    // 获取阅读计划统计
    const activePlans = await prisma.groupPlan.count({
      where: { status: 'active' }
    });

    const completedPlans = await prisma.groupPlan.count({
      where: { status: 'completed' }
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        activeToday,
      },
      churches: {
        total: totalChurches,
        publicCount: publicChurches,
        totalMembers: totalChurchMembers,
      },
      feedback: {
        total: totalFeedback,
        open: openFeedback,
        inProgress: inProgressFeedback,
        resolved: resolvedFeedback,
      },
      plans: {
        active: activePlans,
        completed: completedPlans,
      },
      activity: {
        recentCount: recentActivity,
        dailyActiveUsers,
        newUsersDaily,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

// 获取每日活跃用户
async function getDailyActiveUsers(days: number) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = await prisma.user.count({
      where: {
        lastActiveDate: {
          gte: date,
          lt: nextDate
        }
      }
    });

    result.push({
      date: date.toISOString().split('T')[0],
      count
    });
  }
  return result;
}

// 获取每日新增用户
async function getDailyNewUsers(days: number) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = await prisma.user.count({
      where: {
        createdAt: {
          gte: date,
          lt: nextDate
        }
      }
    });

    result.push({
      date: date.toISOString().split('T')[0],
      count
    });
  }
  return result;
}