// app/api/church/[id]/like/route.ts
// Like API for group interactions

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get likes for a target
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'targetType and targetId required' }, { status: 400 });
    }

    const likes = await prisma.like.findMany({
      where: { targetType, targetId },
      include: {
        user: { select: { id: true, name: true, image: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check if current user has liked
    const userLiked = userId
      ? likes.some(l => l.userId === userId)
      : false;

    return NextResponse.json({
      likes,
      count: likes.length,
      userLiked
    });
  } catch (error) {
    console.error('Get likes error:', error);
    return NextResponse.json({ error: 'Failed to get likes' }, { status: 500 });
  }
}

// POST - Toggle like (like if not liked, unlike if already liked)
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetType, targetId } = await req.json();

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'targetType and targetId required' }, { status: 400 });
    }

    // Check if already liked
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: session.user.id,
        targetType,
        targetId
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      return NextResponse.json({ liked: false, message: 'Unliked successfully' });
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId: session.user.id,
          targetType,
          targetId
        }
      });
      return NextResponse.json({ liked: true, message: 'Liked successfully' }, { status: 201 });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}