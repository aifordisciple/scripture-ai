// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// 记录页面访问
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, referrer, sessionId } = body;

    if (!path || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 获取用户ID（如果已登录）
    const session = await auth();
    const userId = session?.user?.id || null;

    // 获取客户端信息
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    const userAgent = req.headers.get('user-agent') || null;

    // 记录访问
    await prisma.pageView.create({
      data: {
        path,
        userId,
        sessionId,
        referrer: referrer || null,
        userAgent,
        ip,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Error recording page view:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// 获取统计数据（管理员专用）
export async function GET(req: NextRequest) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7');

    // 计算日期范围
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // 获取今日统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayPV, todayUV] = await Promise.all([
      prisma.pageView.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.pageView.groupBy({
        by: ['sessionId'],
        where: { createdAt: { gte: today } },
        _count: true,
      }).then(r => r.length),
    ]);

    // 获取趋势数据
    const pageViews = await prisma.pageView.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, sessionId: true },
    });

    // 按天聚合
    const dailyStats: Record<string, { pv: number; sessions: Set<string> }> = {};

    for (const pv of pageViews) {
      const dateKey = pv.createdAt.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { pv: 0, sessions: new Set() };
      }
      dailyStats[dateKey].pv++;
      dailyStats[dateKey].sessions.add(pv.sessionId);
    }

    // 转换为数组格式
    const trend = Object.entries(dailyStats)
      .map(([date, data]) => ({
        date,
        pv: data.pv,
        uv: data.sessions.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 获取热门页面
    const topPages = await prisma.pageView.groupBy({
      by: ['path'],
      where: { createdAt: { gte: startDate } },
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    });

    return NextResponse.json({
      today: { pv: todayPV, uv: todayUV },
      trend,
      topPages: topPages.map(p => ({ path: p.path, count: p._count.path })),
    });
  } catch (error) {
    console.error('[Analytics] Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}