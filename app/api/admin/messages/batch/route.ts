// app/api/admin/messages/batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, logAdminAction, getClientIP, buildAuditDetails } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

// POST /api/admin/messages/batch - 批量发送私信给多个用户
export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json();
    const { userIds, title, content, sendToAll } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      );
    }

    let targetUserIds: string[] = [];

    if (sendToAll) {
      // 发送给所有用户
      const users = await prisma.user.findMany({
        where: { role: 'user' },
        select: { id: true }
      });
      targetUserIds = users.map(u => u.id);
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      return NextResponse.json(
        { error: 'userIds array or sendToAll flag is required' },
        { status: 400 }
      );
    }

    // 获取管理员信息
    const admin = await prisma.user.findUnique({
      where: { id: adminCheck.userId! },
      select: { id: true, name: true, email: true }
    });

    const senderInfo = {
      id: admin?.id,
      name: admin?.name || '管理员',
      email: admin?.email
    };

    // 批量创建通知
    const notifications = await prisma.notification.createMany({
      data: targetUserIds.map(userId => ({
        userId,
        type: 'ADMIN_MESSAGE',
        title,
        content,
        metadata: JSON.stringify({
          sender: senderInfo,
          sentAt: new Date().toISOString(),
          batch: true
        })
      }))
    });

    // 记录操作日志
    await logAdminAction(
      adminCheck.userId!,
      'CREATE',
      'ADMIN_MESSAGE',
      {
        targetId: 'batch',
        details: buildAuditDetails('create', null, {
          recipientCount: targetUserIds.length,
          title,
          sendToAll
        }),
        ip: getClientIP(request)
      }
    );

    return NextResponse.json({
      success: true,
      sentCount: notifications.count,
      recipientCount: targetUserIds.length
    }, { status: 201 });
  } catch (error) {
    console.error('Admin batch message send error:', error);
    return NextResponse.json(
      { error: 'Failed to send batch messages' },
      { status: 500 }
    );
  }
}