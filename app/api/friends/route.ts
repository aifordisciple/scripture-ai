// app/api/friends/route.ts
// Friends API - add, remove, list friends

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/friends - List friends
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { userId: session.user.id, status: 'ACCEPTED' },
          { friendId: session.user.id, status: 'ACCEPTED' }
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, bio: true }
        },
        friend: {
          select: { id: true, name: true, image: true, bio: true }
        }
      }
    });

    // Transform to flat list
    const friendList = friends.map(f => 
      f.userId === session.user.id ? f.friend : f.user
    );

    return NextResponse.json({ friends: friendList });
  } catch (error) {
    console.error('Get friends error:', error);
    return NextResponse.json({ error: 'Failed to get friends' }, { status: 500 });
  }
}

// POST /api/friends - Add friend
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await req.json();

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });
    }

    // Check if already friends
    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: targetUser.id },
          { userId: targetUser.id, friendId: session.user.id }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Already friends or pending' }, { status: 400 });
    }

    // Create friend request
    const friend = await prisma.friend.create({
      data: {
        userId: session.user.id,
        friendId: targetUser.id,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, friend });
  } catch (error) {
    console.error('Add friend error:', error);
    return NextResponse.json({ error: 'Failed to add friend' }, { status: 500 });
  }
}

// DELETE /api/friends - Remove friend
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const friendId = searchParams.get('friendId');

    if (!friendId) {
      return NextResponse.json({ error: 'Missing friendId' }, { status: 400 });
    }

    await prisma.friend.deleteMany({
      where: {
        OR: [
          { userId: session.user.id, friendId },
          { userId: friendId, friendId: session.user.id }
        ]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove friend error:', error);
    return NextResponse.json({ error: 'Failed to remove friend' }, { status: 500 });
  }
}

// PATCH /api/friends - Accept/decline friend request
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendId, action } = await req.json();

    if (action === 'accept') {
      await prisma.friend.update({
        where: {
          userId_friendId: {
            userId: friendId,
            friendId: session.user.id
          }
        },
        data: { status: 'ACCEPTED' }
      });
    } else if (action === 'decline') {
      await prisma.friend.delete({
        where: {
          userId_friendId: {
            userId: friendId,
            friendId: session.user.id
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Friend action error:', error);
    return NextResponse.json({ error: 'Failed to process friend action' }, { status: 500 });
  }
}
