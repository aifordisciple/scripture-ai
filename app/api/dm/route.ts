// app/api/dm/route.ts
// Direct Message API - Private messaging between users

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/dm - Get conversations or messages with a specific user
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId'); // Get conversation with specific user
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // For pagination

    if (userId) {
      // Get messages with specific user
      const where: any = {
        OR: [
          { senderId: session.user.id, receiverId: userId },
          { senderId: userId, receiverId: session.user.id }
        ]
      };

      if (before) {
        where.createdAt = { lt: new Date(before) };
      }

      const messages = await prisma.directMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          sender: { select: { id: true, name: true, image: true } },
          receiver: { select: { id: true, name: true, image: true } }
        }
      });

      // Mark messages as read
      await prisma.directMessage.updateMany({
        where: {
          senderId: userId,
          receiverId: session.user.id,
          read: false
        },
        data: { read: true }
      });

      return NextResponse.json({ messages: messages.reverse() });
    } else {
      // Get list of conversations
      const sentMessages = await prisma.directMessage.findMany({
        where: { senderId: session.user.id },
        select: { receiverId: true, createdAt: true, content: true, read: true },
        orderBy: { createdAt: 'desc' }
      });

      const receivedMessages = await prisma.directMessage.findMany({
        where: { receiverId: session.user.id },
        select: { senderId: true, createdAt: true, content: true, read: true },
        orderBy: { createdAt: 'desc' }
      });

      // Build conversation list
      const conversationMap = new Map<string, {
        userId: string;
        lastMessage: string;
        lastMessageTime: Date;
        unreadCount: number;
      }>();

      // Process sent messages
      for (const msg of sentMessages) {
        const existing = conversationMap.get(msg.receiverId);
        if (!existing || msg.createdAt > existing.lastMessageTime) {
          conversationMap.set(msg.receiverId, {
            userId: msg.receiverId,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unreadCount: existing?.unreadCount || 0
          });
        }
      }

      // Process received messages
      for (const msg of receivedMessages) {
        const existing = conversationMap.get(msg.senderId);
        if (!existing || msg.createdAt > existing.lastMessageTime) {
          conversationMap.set(msg.senderId, {
            userId: msg.senderId,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unreadCount: existing?.unreadCount || 0
          });
        }
        if (!msg.read) {
          const conv = conversationMap.get(msg.senderId);
          if (conv) {
            conv.unreadCount++;
          }
        }
      }

      // Get user details for each conversation
      const userIds = Array.from(conversationMap.keys());
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, image: true }
      });

      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime())
        .map(conv => ({
          ...conv,
          user: users.find(u => u.id === conv.userId)
        }));

      return NextResponse.json({ conversations });
    }
  } catch (error) {
    console.error('Get DM error:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}

// POST /api/dm - Send a direct message
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is muted
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isMuted: true, role: true }
    });

    if (sender?.isMuted) {
      return NextResponse.json({ error: '您已被禁言，无法发送消息' }, { status: 403 });
    }

    const { receiverId, content, type, metadata } = await req.json();

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check privacy settings
    const privacySettings = await prisma.privacySettings.findUnique({
      where: { userId: receiverId }
    });

    if (privacySettings) {
      if (privacySettings.allowDmFrom === 'nobody') {
        return NextResponse.json({ error: 'User does not accept direct messages' }, { status: 403 });
      }

      if (privacySettings.allowDmFrom === 'friends') {
        const friendship = await prisma.friend.findFirst({
          where: {
            OR: [
              { userId: session.user.id, friendId: receiverId, status: 'ACCEPTED' },
              { userId: receiverId, friendId: session.user.id, status: 'ACCEPTED' }
            ]
          }
        });

        if (!friendship) {
          return NextResponse.json({ error: 'Only friends can send messages to this user' }, { status: 403 });
        }
      }
    }

    const message = await prisma.directMessage.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
        type: type || 'TEXT',
        metadata: metadata ? JSON.stringify(metadata) : null
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } }
      }
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'NEW_MESSAGE',
        title: `${message.sender.name || '用户'}给您发来了私信`,
        content: content.substring(0, 100),
        metadata: JSON.stringify({
          senderId: session.user.id,
          messageId: message.id
        })
      }
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Send DM error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// PUT /api/dm - Mark messages as read
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, markAllRead } = await req.json();

    if (markAllRead) {
      await prisma.directMessage.updateMany({
        where: {
          receiverId: session.user.id,
          read: false
        },
        data: { read: true }
      });
      return NextResponse.json({ success: true });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    await prisma.directMessage.updateMany({
      where: {
        senderId: userId,
        receiverId: session.user.id,
        read: false
      },
      data: { read: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}

// DELETE /api/dm - Delete a message
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    // Verify ownership (can only delete own messages)
    const message = await prisma.directMessage.findFirst({
      where: { id, senderId: session.user.id }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found or not authorized' }, { status: 404 });
    }

    await prisma.directMessage.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete DM error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}