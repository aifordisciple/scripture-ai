// app/api/church/[id]/chat/route.ts
// Group Chat API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get chat messages (paginated)
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    // Check membership
    if (userId) {
      const membership = await prisma.churchMember.findFirst({
        where: { churchId, userId }
      });
      if (!membership) {
        return NextResponse.json({ error: 'Not a member' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const before = searchParams.get('before'); // message ID for pagination

    // Build query
    const where: { churchId: string; id?: { lt: string } } = { churchId };
    if (before) {
      where.id = { lt: before };
    }

    const messages = await prisma.groupChatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Get user info for messages
    const userIds = [...new Set(messages.filter(m => m.type === 'TEXT' || m.type === 'SHARE_VERSE').map(m => m.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Format messages
    const formattedMessages = messages.map(msg => ({
      ...msg,
      user: userMap.get(msg.userId) || { id: msg.userId, name: 'Unknown', image: null },
      metadata: msg.metadata ? JSON.parse(msg.metadata) : null
    }));

    return NextResponse.json({ messages: formattedMessages.reverse() });
  } catch (error) {
    console.error('Get chat messages error:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}

// POST - Send message
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
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

    const { content, type, metadata } = await req.json();

    if (!content && type !== 'SYSTEM') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const message = await prisma.groupChatMessage.create({
      data: {
        churchId,
        userId: session.user.id,
        content: content || '',
        type: type || 'TEXT',
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, image: true }
    });

    return NextResponse.json({
      message: {
        ...message,
        user: user || { id: session.user.id, name: 'Unknown', image: null },
        metadata: message.metadata ? JSON.parse(message.metadata) : null
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}