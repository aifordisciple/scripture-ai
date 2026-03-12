// app/api/church/[id]/comment/route.ts
// Comment API for group interactions

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get comments for a target
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;

    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'targetType and targetId required' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { targetType, targetId },
      include: {
        user: { select: { id: true, name: true, image: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Failed to get comments' }, { status: 500 });
  }
}

// POST - Create comment
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetType, targetId, content } = await req.json();

    if (!targetType || !targetId || !content?.trim()) {
      return NextResponse.json({ error: 'targetType, targetId and content required' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        targetType,
        targetId,
        content: content.trim()
      },
      include: {
        user: { select: { id: true, name: true, image: true } }
      }
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

// DELETE - Delete comment
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'commentId required' }, { status: 400 });
    }

    // Verify ownership
    const comment = await prisma.comment.findFirst({
      where: { id: commentId, userId: session.user.id }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found or not authorized' }, { status: 404 });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    return NextResponse.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}