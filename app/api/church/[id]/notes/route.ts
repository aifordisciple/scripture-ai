// app/api/church/[id]/notes/route.ts
// Shared Notes API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get shared notes for a group
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const bookId = searchParams.get('bookId');

    // Build where clause
    const where: any = {
      isPublic: true,
      sharedTo: churchId
    };
    if (bookId) {
      where.bookId = bookId;
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Get shared notes error:', error);
    return NextResponse.json({ error: 'Failed to get shared notes' }, { status: 500 });
  }
}

// POST - Share a note to group
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

    const { noteId, action } = await req.json();

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    // Verify note ownership
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId: session.user.id }
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (action === 'share') {
      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: {
          isPublic: true,
          sharedTo: churchId
        }
      });
      return NextResponse.json({ note: updatedNote, message: '笔记已分享到小组' });
    }

    if (action === 'unshare') {
      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: {
          isPublic: false,
          sharedTo: null
        }
      });
      return NextResponse.json({ note: updatedNote, message: '已取消分享' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Share note error:', error);
    return NextResponse.json({ error: 'Failed to share note' }, { status: 500 });
  }
}