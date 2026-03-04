// app/api/church/[id]/route.ts
// Church detail, join, leave operations

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    const church = await prisma.church.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } },
        members: { 
          include: { user: { select: { id: true, name: true, email: true } } } 
        },
        groupPlans: {
          include: {
            _count: { select: { progress: true } }
          }
        }
      }
    });

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    // Check if user is member
    const isMember = userId ? 
      church.members.some(m => m.userId === userId) : 
      false;

    return NextResponse.json({ church, isMember });
  } catch (error) {
    console.error('Get church error:', error);
    return NextResponse.json({ error: 'Failed to get church' }, { status: 500 });
  }
}

// POST - Join/Leave church
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json(); // 'join' | 'leave'

    const church = await prisma.church.findUnique({
      where: { id },
      include: { members: true }
    });

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    const isMember = church.members.some(m => m.userId === session.user.id);

    if (action === 'join') {
      if (isMember) {
        return NextResponse.json({ error: 'Already a member' }, { status: 400 });
      }

      if (!church.allowJoin) {
        return NextResponse.json({ error: 'This church does not allow joining' }, { status: 403 });
      }

      await prisma.churchMember.create({
        data: {
          churchId: id,
          userId: session.user.id,
          role: 'MEMBER'
        }
      });

      return NextResponse.json({ success: true, message: 'Joined successfully' });
    } else if (action === 'leave') {
      if (!isMember) {
        return NextResponse.json({ error: 'Not a member' }, { status: 400 });
      }

      // Owner cannot leave
      if (church.ownerId === session.user.id) {
        return NextResponse.json({ error: 'Owner cannot leave. Transfer ownership first.' }, { status: 400 });
      }

      await prisma.churchMember.delete({
        where: {
          churchId_userId: {
            churchId: id,
            userId: session.user.id
          }
        }
      });

      return NextResponse.json({ success: true, message: 'Left successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Church action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
