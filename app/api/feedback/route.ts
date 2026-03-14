// app/api/feedback/route.ts
// User Feedback API - Submit and list user feedback

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/feedback - List user's own feedback
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const where: any = { userId: session.user.id };
    if (status) {
      where.status = status;
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error('Get feedbacks error:', error);
    return NextResponse.json({ error: 'Failed to get feedbacks' }, { status: 500 });
  }
}

// POST /api/feedback - Submit new feedback
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, title, content, screenshot } = await req.json();

    if (!type || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate type
    const validTypes = ['BUG_REPORT', 'FEATURE_REQUEST', 'QUESTION', 'OTHER'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: session.user.id,
        type,
        title,
        content,
        screenshot: screenshot || null,
        status: 'OPEN'
      }
    });

    // Create notification for admins (optional - could be expanded)
    // For now, we just return the created feedback

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error('Create feedback error:', error);
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 });
  }
}

// PUT /api/feedback - Update feedback (for admin use, or user updating)
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, adminReply } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Feedback ID required' }, { status: 400 });
    }

    // Check if feedback exists and belongs to user (or user is admin)
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id }
    });

    if (!existingFeedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    // For now, only allow user to view their own feedback
    // Admin functionality can be added later
    if (existingFeedback.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;

    const feedback = await prisma.feedback.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Update feedback error:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}

// DELETE /api/feedback - Delete feedback
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Feedback ID required' }, { status: 400 });
    }

    // Verify ownership
    const feedback = await prisma.feedback.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    await prisma.feedback.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete feedback error:', error);
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 });
  }
}