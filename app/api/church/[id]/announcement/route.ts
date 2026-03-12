// app/api/church/[id]/announcement/route.ts
// Group Announcement API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - List announcements
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

    const announcements = await prisma.groupAnnouncement.findMany({
      where: { churchId },
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 20
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    return NextResponse.json({ error: 'Failed to get announcements' }, { status: 500 });
  }
}

// POST - Create announcement
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin membership
    const membership = await prisma.churchMember.findFirst({
      where: {
        churchId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Only admins can create announcements' }, { status: 403 });
    }

    const { title, content, pinned } = await req.json();

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const announcement = await prisma.groupAnnouncement.create({
      data: {
        churchId,
        title: title.trim(),
        content: content.trim(),
        pinned: pinned || false,
        createdBy: session.user.id
      }
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}

// PUT - Update announcement
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin membership
    const membership = await prisma.churchMember.findFirst({
      where: {
        churchId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Only admins can update announcements' }, { status: 403 });
    }

    const { announcementId, title, content, pinned } = await req.json();

    if (!announcementId) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    // Verify announcement belongs to this church
    const existing = await prisma.groupAnnouncement.findFirst({
      where: { id: announcementId, churchId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (pinned !== undefined) updateData.pinned = pinned;

    const announcement = await prisma.groupAnnouncement.update({
      where: { id: announcementId },
      data: updateData
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error('Update announcement error:', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

// DELETE - Delete announcement
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin membership
    const membership = await prisma.churchMember.findFirst({
      where: {
        churchId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Only admins can delete announcements' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const announcementId = searchParams.get('announcementId');

    if (!announcementId) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    // Verify announcement belongs to this church
    const existing = await prisma.groupAnnouncement.findFirst({
      where: { id: announcementId, churchId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    await prisma.groupAnnouncement.delete({
      where: { id: announcementId }
    });

    return NextResponse.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}