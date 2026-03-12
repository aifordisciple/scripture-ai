// app/api/chat/verse/route.ts
// 按经文查询历史 AI 解读
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');
    const chapter = searchParams.get('chapter');
    const verse = searchParams.get('verse');

    if (!bookId || !chapter) {
      return NextResponse.json({ error: 'Missing bookId or chapter' }, { status: 400 });
    }

    // 构建查询条件
    const where: any = {
      userId: session.user.id,
      verseRef: { not: null },
    };

    // 匹配经文引用格式 (如 "Gen 1:1-3" 或 "Gen 1:1")
    const chapterNum = parseInt(chapter);
    const versePattern = verse
      ? `${bookId} ${chapterNum}:${verse}`
      : `${bookId} ${chapterNum}`;

    // 查询包含该经文引用的消息
    const messages = await prisma.chatMessage.findMany({
      where: {
        userId: session.user.id,
        OR: [
          // 精确匹配
          { verseRef: { equals: versePattern } },
          // 范围匹配 (如 Gen 1:1-3 匹配 Gen 1:1)
          { verseRef: { contains: `${bookId} ${chapterNum}:` } },
        ],
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            mode: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 按会话分组
    const groupedBySession = messages.reduce((acc: any, msg) => {
      const sessionId = msg.sessionId || 'default';
      if (!acc[sessionId]) {
        acc[sessionId] = {
          sessionId,
          sessionTitle: msg.session?.title || '历史对话',
          mode: msg.session?.mode || 'general',
          messages: [],
        };
      }
      acc[sessionId].messages.push({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        verseRef: msg.verseRef,
        createdAt: msg.createdAt,
      });
      return acc;
    }, {});

    return NextResponse.json(Object.values(groupedBySession));
  } catch (error) {
    console.error('Error fetching verse history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}