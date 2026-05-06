import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, type, isActive } = body;

    const announcement = await prisma.systemAnnouncement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error('[Admin Announcement PUT]', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.systemAnnouncement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Announcement DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}
