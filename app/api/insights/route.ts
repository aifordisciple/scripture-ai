// app/api/insights/route.ts
// AI 解读收藏 API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 获取用户收藏的 AI 解读
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');
    const chapter = searchParams.get('chapter');

    // 构建查询条件
    const where: any = { userId: session.user.id };
    if (bookId) where.bookId = bookId;
    if (chapter) where.chapter = parseInt(chapter);

    const insights = await prisma.savedInsight.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: 收藏 AI 解读
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { messageId, bookId, chapter, verse, title, tags = [] } = body;

    if (!messageId || !bookId || !chapter) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 检查是否已收藏
    const existing = await prisma.savedInsight.findUnique({
      where: {
        userId_messageId: {
          userId: session.user.id,
          messageId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already saved' }, { status: 400 });
    }

    const insight = await prisma.savedInsight.create({
      data: {
        userId: session.user.id,
        messageId,
        bookId,
        chapter,
        verse,
        title,
        tags,
      },
    });

    return NextResponse.json(insight);
  } catch (error) {
    console.error('Error saving insight:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: 取消收藏
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const messageId = searchParams.get('messageId');

    if (!id && !messageId) {
      return NextResponse.json({ error: 'Missing id or messageId' }, { status: 400 });
    }

    if (id) {
      await prisma.savedInsight.deleteMany({
        where: { id, userId: session.user.id },
      });
    } else if (messageId) {
      await prisma.savedInsight.deleteMany({
        where: { messageId, userId: session.user.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting insight:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}