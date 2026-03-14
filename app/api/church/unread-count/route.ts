// app/api/church/unread-count/route.ts
// 获取用户所有群组的未读消息总数

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 获取用户所在的所有群组
    const memberships = await prisma.churchMember.findMany({
      where: { userId },
      select: { churchId: true }
    });

    if (memberships.length === 0) {
      return NextResponse.json({ totalUnread: 0, groups: [] });
    }

    const churchIds = memberships.map(m => m.churchId);

    // 获取每个群组的已读状态
    const readStatuses = await prisma.groupChatReadStatus.findMany({
      where: {
        userId,
        churchId: { in: churchIds }
      }
    });

    const readStatusMap = new Map(readStatuses.map(r => [r.churchId, r.lastReadAt]));

    // 统计每个群组的未读消息数
    const groupUnreadCounts = await Promise.all(
      churchIds.map(async (churchId) => {
        const lastReadAt = readStatusMap.get(churchId);

        const where: { churchId: string; createdAt?: { gt: Date } } = { churchId };
        if (lastReadAt) {
          where.createdAt = { gt: lastReadAt };
        }

        const count = await prisma.groupChatMessage.count({
          where
        });

        return { churchId, unreadCount: count };
      })
    );

    const totalUnread = groupUnreadCounts.reduce((sum, g) => sum + g.unreadCount, 0);

    return NextResponse.json({
      totalUnread,
      groups: groupUnreadCounts.filter(g => g.unreadCount > 0)
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return NextResponse.json({ error: 'Failed to get unread count' }, { status: 500 });
  }
}