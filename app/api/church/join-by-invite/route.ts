// app/api/church/join-by-invite/route.ts
// Join Church by Invite Code API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Join church by invite code
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid invite code format' }, { status: 400 });
    }

    // Find invite code
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: code.toUpperCase() },
      include: { church: true }
    });

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code not found' }, { status: 404 });
    }

    if (!inviteCode.isActive) {
      return NextResponse.json({ error: 'This invite code has been deactivated' }, { status: 400 });
    }

    // Check expiration
    if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
      return NextResponse.json({ error: 'This invite code has expired' }, { status: 400 });
    }

    // Check usage limit
    if (inviteCode.maxUses > 0 && inviteCode.usedCount >= inviteCode.maxUses) {
      return NextResponse.json({ error: 'This invite code has reached its usage limit' }, { status: 400 });
    }

    // Check if church allows joining
    if (!inviteCode.church.allowJoin) {
      return NextResponse.json({ error: 'This group is not accepting new members' }, { status: 403 });
    }

    // Check if already a member
    const existingMember = await prisma.churchMember.findFirst({
      where: {
        churchId: inviteCode.churchId,
        userId: session.user.id
      }
    });

    if (existingMember) {
      return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 });
    }

    // Join the church
    await prisma.$transaction([
      prisma.churchMember.create({
        data: {
          churchId: inviteCode.churchId,
          userId: session.user.id,
          role: 'MEMBER'
        }
      }),
      prisma.inviteCode.update({
        where: { id: inviteCode.id },
        data: { usedCount: { increment: 1 } }
      })
    ]);

    return NextResponse.json({
      success: true,
      church: {
        id: inviteCode.churchId,
        name: inviteCode.church.name
      }
    });
  } catch (error) {
    console.error('Join by invite error:', error);
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  }
}