// app/api/admin/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, logAdminAction, getClientIP, buildAuditDetails } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

// GET /api/admin/messages - 获取已发送私信历史
export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.error!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    // 查询管理员发送的私信通知
    const where: any = {
      type: 'ADMIN_MESSAGE'
    };

    // 获取所有管理员发送的私信
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true }
          }
        }
      }),
      prisma.notification.count({ where })
    ]);

    // 从 metadata 中提取发送者信息
    const messagesWithSender = notifications.map(n => {
      let senderInfo = null;
      if (n.metadata) {
        try {
          const meta = JSON.parse(n.metadata);
          senderInfo = meta.sender || null;
        } catch (e) {
          // ignore parse error
        }
      }
      return {
        ...n,
        sender: senderInfo
      };
    });

    return NextResponse.json({
      messages: messagesWithSender,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin messages list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/admin/messages - 发送私信给单个用户
export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json();
    const { userId, title, content } = body;

    if (!userId || !title || !content) {
      return NextResponse.json(
        { error: 'userId, title and content are required' },
        { status: 400 }
      );
    }

    // 验证用户存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 获取管理员信息
    const admin = await prisma.user.findUnique({
      where: { id: adminCheck.userId! },
      select: { id: true, name: true, email: true }
    });

    // 创建通知
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: 'ADMIN_MESSAGE',
        title,
        content,
        metadata: JSON.stringify({
          sender: {
            id: admin?.id,
            name: admin?.name || '管理员',
            email: admin?.email
          },
          sentAt: new Date().toISOString()
        })
      }
    });

    // 记录操作日志
    await logAdminAction(
      adminCheck.userId!,
      'CREATE',
      'ADMIN_MESSAGE',
      {
        targetId: notification.id,
        details: buildAuditDetails('create', null, {
          recipient: user.email,
          title
        }),
        ip: getClientIP(request)
      }
    );

    return NextResponse.json({
      success: true,
      notification,
      recipient: user
    }, { status: 201 });
  } catch (error) {
    console.error('Admin message send error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}