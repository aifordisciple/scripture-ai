// app/api/church/[id]/plan/[planId]/progress/route.ts
// Sync Progress to Leaderboard API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string; planId: string }>;
}

// POST - Sync progress to leaderboard
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId, planId } = await params;
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

    const { chaptersRead, streakDays, completedDays } = await req.json();

    // Calculate score
    // Score = chaptersRead * 10 + streakDays * 50 + completedDays * 100
    const score = (chaptersRead || 0) * 10 + (streakDays || 0) * 50 + (completedDays || 0) * 100;

    // Upsert leaderboard entry
    const entry = await prisma.leaderboardEntry.upsert({
      where: { planId_userId: { planId, userId: session.user.id } },
      update: {
        score,
        chaptersRead: chaptersRead || 0,
        streakDays: streakDays || 0,
        completedDays: completedDays || 0
      },
      create: {
        planId,
        userId: session.user.id,
        score,
        chaptersRead: chaptersRead || 0,
        streakDays: streakDays || 0,
        completedDays: completedDays || 0
      }
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Sync progress error:', error);
    return NextResponse.json({ error: 'Failed to sync progress' }, { status: 500 });
  }
}