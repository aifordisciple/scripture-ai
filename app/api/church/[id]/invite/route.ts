// app/api/church/[id]/invite/route.ts
// Invite Code Management API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Generate 6-character alphanumeric code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET - List invite codes for church
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a member
    const membership = await prisma.churchMember.findFirst({
      where: { churchId: id, userId: session.user.id }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    const codes = await prisma.inviteCode.findMany({
      where: { churchId: id },
      orderBy: { createdAt: 'desc' }
    });

    // Filter out expired invite codes and mark them inactive in DB
    const now = new Date();
    const expiredIds = codes
      .filter(c => c.expiresAt && c.expiresAt < now && c.isActive)
      .map(c => c.id);

    if (expiredIds.length > 0) {
      await prisma.inviteCode.updateMany({
        where: { id: { in: expiredIds } },
        data: { isActive: false }
      });
    }

    const activeCodes = codes.filter(c => !c.expiresAt || c.expiresAt >= now);

    return NextResponse.json({ codes: activeCodes });
  } catch (error) {
    console.error('List invite codes error:', error);
    return NextResponse.json({ error: 'Failed to list invite codes' }, { status: 500 });
  }
}

// POST - Create invite code (admin only)
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const membership = await prisma.churchMember.findFirst({
      where: {
        churchId: id,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Only admins can create invite codes' }, { status: 403 });
    }

    const { maxUses, expiresAt } = await req.json();

    // Generate unique code
    let code = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.inviteCode.findUnique({ where: { code } });
      if (!existing) break;
      code = generateInviteCode();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
    }

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        churchId: id,
        createdBy: session.user.id,
        maxUses: maxUses || 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    return NextResponse.json({ inviteCode }, { status: 201 });
  } catch (error) {
    console.error('Create invite code error:', error);
    return NextResponse.json({ error: 'Failed to create invite code' }, { status: 500 });
  }
}

// DELETE - Delete invite code
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const membership = await prisma.churchMember.findFirst({
      where: {
        churchId: id,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Only admins can delete invite codes' }, { status: 403 });
    }

    const { codeId } = await req.json();

    // Verify the invite code belongs to this church
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { id: codeId }
    });

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code not found' }, { status: 404 });
    }

    if (inviteCode.churchId !== id) {
      return NextResponse.json({ error: 'Invite code does not belong to this church' }, { status: 403 });
    }

    await prisma.inviteCode.delete({
      where: { id: codeId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete invite code error:', error);
    return NextResponse.json({ error: 'Failed to delete invite code' }, { status: 500 });
  }
}