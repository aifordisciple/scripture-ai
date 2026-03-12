// app/api/church/[id]/route.ts
// Church detail, join, leave, member management operations

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
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { joinedAt: 'asc' }
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

// POST - Join/Leave church, Member management
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, targetUserId, role } = body;

    const church = await prisma.church.findUnique({
      where: { id },
      include: { members: true }
    });

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    const isMember = church.members.some(m => m.userId === session.user.id);
    const currentUserMembership = church.members.find(m => m.userId === session.user.id);

    // Join church
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
    }

    // Leave church
    if (action === 'leave') {
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

    // Member management actions (require admin privileges)
    if (!currentUserMembership || !['OWNER', 'ADMIN'].includes(currentUserMembership.role)) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    // Kick member
    if (action === 'kick') {
      if (!targetUserId) {
        return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
      }

      const targetMembership = church.members.find(m => m.userId === targetUserId);
      if (!targetMembership) {
        return NextResponse.json({ error: 'User is not a member' }, { status: 400 });
      }

      // Cannot kick the owner
      if (targetMembership.role === 'OWNER') {
        return NextResponse.json({ error: 'Cannot kick the owner' }, { status: 400 });
      }

      // Admin cannot kick another admin (only owner can)
      if (currentUserMembership.role === 'ADMIN' && targetMembership.role === 'ADMIN') {
        return NextResponse.json({ error: 'Only owner can kick admins' }, { status: 403 });
      }

      await prisma.churchMember.delete({
        where: {
          churchId_userId: {
            churchId: id,
            userId: targetUserId
          }
        }
      });

      return NextResponse.json({ success: true, message: 'Member removed successfully' });
    }

    // Set member role
    if (action === 'setRole') {
      if (!targetUserId || !role) {
        return NextResponse.json({ error: 'Target user ID and role required' }, { status: 400 });
      }

      if (!['ADMIN', 'MEMBER'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role. Use ADMIN or MEMBER' }, { status: 400 });
      }

      const targetMembership = church.members.find(m => m.userId === targetUserId);
      if (!targetMembership) {
        return NextResponse.json({ error: 'User is not a member' }, { status: 400 });
      }

      // Cannot change owner's role
      if (targetMembership.role === 'OWNER') {
        return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 });
      }

      // Only owner can set admin roles
      if (currentUserMembership.role !== 'OWNER' && role === 'ADMIN') {
        return NextResponse.json({ error: 'Only owner can set admin role' }, { status: 403 });
      }

      await prisma.churchMember.update({
        where: {
          churchId_userId: {
            churchId: id,
            userId: targetUserId
          }
        },
        data: { role }
      });

      return NextResponse.json({ success: true, message: 'Role updated successfully' });
    }

    // Disband church (owner only)
    if (action === 'disband') {
      if (currentUserMembership.role !== 'OWNER') {
        return NextResponse.json({ error: 'Only owner can disband the group' }, { status: 403 });
      }

      await prisma.church.delete({
        where: { id }
      });

      return NextResponse.json({ success: true, message: 'Group disbanded successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Church action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
