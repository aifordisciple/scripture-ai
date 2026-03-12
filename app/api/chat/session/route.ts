// app/api/chat/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BIBLE_BOOKS } from '@/lib/constants';

// GET: 获取用户的所有会话
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

    const sessions = await prisma.chatSession.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // 只取第一条消息用于预览
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: 创建新会话
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bookId, chapter, startVerse, endVerse, mode = 'general' } = body;

    // 自动生成标题
    let title = '';
    if (bookId && chapter) {
      const book = BIBLE_BOOKS.find(b => b.id === bookId);
      const bookName = book?.name || bookId;
      const date = new Date().toLocaleDateString('zh-CN');
      title = `《${bookName}》第${chapter}章 - ${date}`;
    }

    const newSession = await prisma.chatSession.create({
      data: {
        userId: session.user.id,
        bookId,
        chapter,
        startVerse,
        endVerse,
        title,
        mode,
      },
    });

    return NextResponse.json(newSession);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: 更新会话
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, mode } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
    }

    // 验证会话属于当前用户
    const existingSession = await prisma.chatSession.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (mode) updateData.mode = mode;

    const updatedSession = await prisma.chatSession.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: 删除会话
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
    }

    // 验证会话属于当前用户
    const existingSession = await prisma.chatSession.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 删除会话及其消息
    await prisma.chatMessage.deleteMany({
      where: { sessionId: id },
    });

    await prisma.chatSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}