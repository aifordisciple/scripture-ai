// app/api/feedback/route.ts
// User Feedback API - Submit and list user feedback

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper to check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user?.role === 'admin';
}

// GET /api/feedback - List feedbacks
// For regular users: returns their own feedbacks
// For admins: returns all feedbacks
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const admin = searchParams.get('admin') === 'true';

    // Check if user is admin
    const isUserAdmin = await isAdmin(session.user.id);

    // If admin=true param and user is admin, return all feedbacks
    const where: any = {};

    if (admin && isUserAdmin) {
      // Admin view - all feedbacks
      if (status) where.status = status;
      if (type) where.type = type;
    } else {
      // Regular user view - only their feedbacks
      where.userId = session.user.id;
      if (status) where.status = status;
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });

    // Get counts for admin dashboard
    let counts = null;
    if (isUserAdmin && admin) {
      const [total, open, inProgress, resolved] = await Promise.all([
        prisma.feedback.count(),
        prisma.feedback.count({ where: { status: 'OPEN' } }),
        prisma.feedback.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.feedback.count({ where: { status: 'RESOLVED' } }),
      ]);
      counts = { total, open, inProgress, resolved };
    }

    return NextResponse.json({ feedbacks, counts, isAdmin: isUserAdmin });
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

    // Notify all admins about new feedback
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'admin' },
        select: { id: true }
      });

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true }
      });

      // Create notifications for all admins
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'NEW_FEEDBACK',
          title: `新反馈: ${title}`,
          content: `${user?.name || user?.email || '用户'} 提交了一个${type === 'BUG_REPORT' ? 'Bug报告' : type === 'FEATURE_REQUEST' ? '功能建议' : type === 'QUESTION' ? '问题咨询' : '反馈'}`,
          metadata: JSON.stringify({
            feedbackId: feedback.id,
            type,
            senderId: session.user.id
          })
        }))
      });
    } catch (notifyError) {
      console.error('Failed to notify admins:', notifyError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error('Create feedback error:', error);
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 });
  }
}

// PUT /api/feedback - Update feedback (admin reply, user reply, or status change)
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, adminReply, userReply } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Feedback ID required' }, { status: 400 });
    }

    const existingFeedback = await prisma.feedback.findUnique({
      where: { id }
    });

    if (!existingFeedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const isUserAdmin = await isAdmin(session.user.id);

    // Permission check
    if (existingFeedback.userId !== session.user.id && !isUserAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check mute status for user replies
    if (userReply !== undefined && !isUserAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isMuted: true }
      });
      if (user?.isMuted) {
        return NextResponse.json({ error: '您已被禁言，无法回复' }, { status: 403 });
      }
    }

    // Build update data
    const updateData: any = {};
    if (status) updateData.status = status;

    if (adminReply !== undefined) {
      // Only admins can reply
      if (!isUserAdmin) {
        return NextResponse.json({ error: 'Only admins can reply to feedback' }, { status: 403 });
      }
      updateData.adminReply = adminReply;

      // Add to replies history
      const replies = existingFeedback.replies ? JSON.parse(existingFeedback.replies) : [];
      replies.push({
        type: 'admin',
        content: adminReply,
        createdAt: new Date().toISOString()
      });
      updateData.replies = JSON.stringify(replies);
    }

    if (userReply !== undefined && !isUserAdmin) {
      // Only the feedback owner can reply as user
      if (existingFeedback.userId !== session.user.id) {
        return NextResponse.json({ error: 'Only feedback owner can reply' }, { status: 403 });
      }
      updateData.userReply = userReply;

      // Add to replies history
      const replies = existingFeedback.replies ? JSON.parse(existingFeedback.replies) : [];
      replies.push({
        type: 'user',
        content: userReply,
        createdAt: new Date().toISOString()
      });
      updateData.replies = JSON.stringify(replies);

      // Reopen feedback if it was resolved
      if (existingFeedback.status === 'RESOLVED') {
        updateData.status = 'IN_PROGRESS';
      }
    }

    const feedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });

    // Notify the feedback owner if admin replied
    if (adminReply && isUserAdmin && existingFeedback.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: existingFeedback.userId,
          type: 'FEEDBACK_REPLY',
          title: '您的反馈收到了回复',
          content: adminReply.substring(0, 100),
          metadata: JSON.stringify({
            feedbackId: id,
            adminId: session.user.id
          })
        }
      });
    }

    // Notify admins if user replied
    if (userReply && !isUserAdmin) {
      const admins = await prisma.user.findMany({
        where: { role: 'admin' },
        select: { id: true }
      });

      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'NEW_FEEDBACK',
          title: `用户回复了反馈: ${existingFeedback.title}`,
          content: userReply.substring(0, 100),
          metadata: JSON.stringify({
            feedbackId: id,
            userId: session.user.id
          })
        }))
      });
    }

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

    const feedback = await prisma.feedback.findUnique({
      where: { id }
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const isUserAdmin = await isAdmin(session.user.id);

    // Only owner or admin can delete
    if (feedback.userId !== session.user.id && !isUserAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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