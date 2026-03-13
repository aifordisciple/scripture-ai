// app/api/church/[id]/activity/route.ts
// Group Check-in Activity API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get group activity feed (paginated)
export async function GET(req: Request, { params }: RouteParams) {
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const planId = searchParams.get('planId') || undefined;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { churchId };
    if (planId) {
      where.planId = planId;
    }

    // Fetch activities with user info
    const activities = await prisma.groupCheckInActivity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Get total count for pagination
    const total = await prisma.groupCheckInActivity.count({ where });

    // Get likes for these activities
    const activityIds = activities.map(a => a.id);
    const likes = await prisma.like.findMany({
      where: {
        targetType: 'GROUP_ACTIVITY',
        targetId: { in: activityIds }
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    // Group likes by activity
    const likesByActivity: Record<string, typeof likes> = {};
    likes.forEach(like => {
      if (!likesByActivity[like.targetId]) {
        likesByActivity[like.targetId] = [];
      }
      likesByActivity[like.targetId].push(like as any);
    });

    // Check which activities the current user has liked
    const userLikes = await prisma.like.findMany({
      where: {
        userId: session.user.id,
        targetType: 'GROUP_ACTIVITY',
        targetId: { in: activityIds }
      },
      select: { targetId: true }
    });
    const likedIds = new Set(userLikes.map(l => l.targetId));

    // Format response
    const formattedActivities = activities.map(activity => {
      const activityLikes = likesByActivity[activity.id] || [];
      return {
        id: activity.id,
        day: activity.day,
        taskType: activity.taskType,
        bookId: activity.bookId,
        chapter: activity.chapter,
        createdAt: activity.createdAt,
        user: activity.user,
        plan: activity.plan,
        likes: activityLikes.map(l => ({
          id: l.id,
          userId: l.userId,
          userName: l.user.name
        })),
        likeCount: activityLikes.length,
        isLiked: likedIds.has(activity.id)
      };
    });

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json({ error: 'Failed to get activities' }, { status: 500 });
  }
}

// POST - Create a new activity (usually done automatically via progress API)
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

    const { planId, day, taskType, bookId, chapter } = await req.json() as {
      planId: string;
      day: number;
      taskType: string;
      bookId?: string;
      chapter?: number;
    };

    if (!planId || !day || !taskType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create activity
    const activity = await prisma.groupCheckInActivity.create({
      data: {
        churchId,
        planId,
        userId: session.user.id,
        day,
        taskType,
        bookId,
        chapter
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Create activity error:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}