// app/api/church/[id]/remind/route.ts
// API for group admins to send reminders to members

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Send a reminder to a member
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminMembership = await prisma.churchMember.findFirst({
      where: { churchId, userId: session.user.id }
    });

    if (!adminMembership || (adminMembership.role !== 'OWNER' && adminMembership.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { targetUserId, planId, message, type } = await req.json() as {
      targetUserId: string;
      planId: string;
      message?: string;
      type: 'reminder' | 'encouragement' | 'custom';
    };

    if (!targetUserId || !type) {
      return NextResponse.json({ error: 'targetUserId and type required' }, { status: 400 });
    }

    // Get church and plan info
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: { name: true }
    });

    const plan = planId ? await prisma.groupPlan.findUnique({
      where: { id: planId },
      select: { name: true }
    }) : null;

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Generate notification content based on type
    let notificationTitle = '';
    let notificationContent = '';
    const senderName = sender?.name || '小组长';

    switch (type) {
      case 'reminder':
        notificationTitle = `📖 读经提醒`;
        notificationContent = message || `${senderName} 提醒你不要忘记今天的读经任务哦！`;
        break;
      case 'encouragement':
        notificationTitle = `💪 加油鼓励`;
        notificationContent = message || `${senderName} 给你发来了鼓励，继续加油！`;
        break;
      case 'custom':
        notificationTitle = `📩 来自 ${senderName} 的消息`;
        notificationContent = message || '';
        break;
    }

    // Add plan info if available
    if (plan) {
      notificationContent += `\n\n计划：${plan.name}`;
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'GROUP_REMINDER',
        title: notificationTitle,
        content: notificationContent,
        metadata: JSON.stringify({
          churchId,
          planId,
          senderId: session.user.id,
          senderName: sender?.name,
          churchName: church?.name,
          reminderType: type
        })
      }
    });

    // Also create a system message in group chat (optional)
    if (type === 'reminder' || type === 'encouragement') {
      await prisma.groupChatMessage.create({
        data: {
          churchId,
          userId: session.user.id,
          content: notificationContent,
          type: 'SYSTEM',
          metadata: JSON.stringify({
            targetUserId,
            targetType: 'reminder'
          })
        }
      });
    }

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        title: notification.title,
        createdAt: notification.createdAt
      }
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
  }
}