// app/api/memory/route.ts
// Spaced Repetition Memory System - Ebbinghaus curve implementation

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// SM-2 Algorithm helper
function calculateNextReview(
  quality: number, // 0-5: 0-2 = fail, 3-5 = pass
  repetitions: number,
  easeFactor: number,
  interval: number
) {
  let newRepetitions = repetitions;
  let newEaseFactor = easeFactor;
  let newInterval = interval;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Incorrect response - reset
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update ease factor (minimum 1.3)
  newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextReview,
    status: newRepetitions >= 5 ? 'MASTERED' as const : 
            newRepetitions > 0 ? 'REVIEW' as const : 'LEARNING' as const
  };
}

// GET /api/memory - Get due cards for review
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get cards due for review
    const dueCards = await prisma.memoryCard.findMany({
      where: {
        userId: session.user.id,
        nextReview: { lte: new Date() },
        status: { not: 'PAUSED' }
      },
      orderBy: { nextReview: 'asc' },
      take: 20
    });

    // Get stats
    const stats = await prisma.memoryCard.groupBy({
      by: ['status'],
      where: { userId: session.user.id },
      _count: true
    });

    return NextResponse.json({
      cards: dueCards,
      stats: stats.reduce((acc, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    console.error('Get memory error:', error);
    return NextResponse.json({ error: 'Failed to get memory cards' }, { status: 500 });
  }
}

// POST /api/memory - Add new memory card
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId, chapter, verse, content, reference } = await req.json();

    if (!bookId || !chapter || !content || !reference) {
      return NextResponse.json({ 
        error: 'Missing required fields: bookId, chapter, content, reference' 
      }, { status: 400 });
    }

    const card = await prisma.memoryCard.upsert({
      where: {
        userId_bookId_chapter_verse: {
          userId: session.user.id,
          bookId,
          chapter,
          verse: verse || 0
        }
      },
      update: {
        content,
        reference,
        status: 'LEARNING',
        nextReview: new Date(),
        repetitions: 0,
        interval: 1
      },
      create: {
        userId: session.user.id,
        bookId,
        chapter,
        verse,
        content,
        reference
      }
    });

    return NextResponse.json({ card });
  } catch (error) {
    console.error('Create memory error:', error);
    return NextResponse.json({ error: 'Failed to create memory card' }, { status: 500 });
  }
}

// PUT /api/memory - Review a card (update with SM-2 algorithm)
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId, quality, responseMs } = await req.json();

    if (!cardId || quality === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: cardId, quality' 
      }, { status: 400 });
    }

    // Get current card
    const card = await prisma.memoryCard.findUnique({
      where: { id: cardId }
    });

    if (!card || card.userId !== session.user.id) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // [P2-8修复] 钳制 quality 到 0-5 范围，防止 SM-2 调度错误
    const clampedQuality = Math.min(5, Math.max(0, Number(quality)));

    // Calculate new review parameters
    const review = calculateNextReview(
      clampedQuality,
      card.repetitions,
      card.easeFactor,
      card.interval
    );

    // Update card
    const updated = await prisma.memoryCard.update({
      where: { id: cardId },
      data: {
        easeFactor: review.easeFactor,
        interval: review.interval,
        repetitions: review.repetitions,
        nextReview: review.nextReview,
        lastReview: new Date(),
        status: review.status
      }
    });

    // Log the review
    await prisma.reviewLog.create({
      data: {
        cardId,
        quality,
        responseMs
      }
    });

    return NextResponse.json({ 
      card: updated,
      nextReview: review.nextReview,
      interval: review.interval
    });
  } catch (error) {
    console.error('Review memory error:', error);
    return NextResponse.json({ error: 'Failed to review card' }, { status: 500 });
  }
}

// DELETE /api/memory - Remove a card
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get('id');

    if (!cardId) {
      return NextResponse.json({ error: 'Missing cardId' }, { status: 400 });
    }

    // 所有权验证：只能删除自己的记忆卡
    const card = await prisma.memoryCard.findUnique({
      where: { id: cardId },
      select: { userId: true }
    });
    if (!card || card.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.memoryCard.delete({
      where: { id: cardId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete memory error:', error);
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
  }
}
