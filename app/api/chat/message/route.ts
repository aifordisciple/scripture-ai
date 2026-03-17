// app/api/chat/message/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BIBLE_BOOKS } from '@/lib/constants';
import { ChatError, ChatErrorCode } from '@/lib/errors/chat-errors';

/**
 * 原子化消息保存 API
 *
 * POST: 创建会话并保存用户消息（原子操作）
 * 请求体:
 * - createSession: boolean - 是否创建新会话
 * - sessionData: { mode, title, bookId, chapter, startVerse, endVerse }
 * - message: { content, role, verseRef, verseContent }
 * - sessionId: string (可选，如果 createSession 为 false 则必填)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    const body = await req.json();
    const {
      createSession,
      sessionData,
      message,
      sessionId: providedSessionId,
    } = body;

    if (!message?.content) {
      return NextResponse.json(
        { error: 'Missing message content', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // 使用事务确保原子性
    const result = await prisma.$transaction(async (tx) => {
      let finalSessionId = providedSessionId as string | undefined;

      // 如果需要创建会话
      if (createSession) {
        const { mode = 'general', title: providedTitle, bookId, chapter, startVerse, endVerse } = sessionData || {};

        // 生成标题
        let title = providedTitle as string | undefined;
        if (!title && bookId && chapter) {
          const book = BIBLE_BOOKS.find(b => b.id === bookId);
          const bookName = book?.name || bookId;
          title = `${bookName} ${chapter}${startVerse ? `:${startVerse}` : ''}`;
        }
        if (!title) {
          title = '新对话';
        }

        const newSession = await tx.chatSession.create({
          data: {
            userId,
            bookId,
            chapter,
            startVerse,
            endVerse,
            title,
            mode,
          },
        });

        finalSessionId = newSession.id;
      }

      if (!finalSessionId) {
        throw new ChatError(
          ChatErrorCode.SESSION_NOT_FOUND,
          'Session ID is required when not creating a new session'
        );
      }

      // 保存用户消息
      const userMessage = await tx.chatMessage.create({
        data: {
          userId,
          sessionId: finalSessionId,
          role: message.role || 'user',
          content: message.content,
          verseRef: message.verseRef || null,
          verseContent: message.verseContent || null,
        },
      });

      // 更新会话的 updatedAt
      await tx.chatSession.update({
        where: { id: finalSessionId },
        data: { updatedAt: new Date() },
      });

      return {
        sessionId: finalSessionId,
        message: userMessage,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[API] Message save error:', error);

    if (error instanceof ChatError) {
      return NextResponse.json(
        {
          error: error.userMessage,
          code: error.code,
          recoverable: error.recoverable,
        },
        { status: error.code === ChatErrorCode.SESSION_NOT_FOUND ? 404 : 500 }
      );
    }

    const chatError = ChatError.fromError(error, ChatErrorCode.MESSAGE_SAVE_FAILED);
    return NextResponse.json(
      {
        error: chatError.userMessage,
        code: chatError.code,
        recoverable: chatError.recoverable,
      },
      { status: 500 }
    );
  }
}

/**
 * 保存 AI 回复（在流式输出完成后调用）
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    const body = await req.json();
    const { sessionId, content, verseRef, verseContent } = body;

    if (!sessionId || !content) {
      return NextResponse.json(
        { error: 'Missing sessionId or content', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // 使用事务保存 AI 回复并更新会话
    const result = await prisma.$transaction(async (tx) => {
      // 验证会话存在且属于当前用户
      const existingSession = await tx.chatSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (!existingSession) {
        throw new ChatError(
          ChatErrorCode.SESSION_NOT_FOUND,
          'Session not found or does not belong to user'
        );
      }

      // 保存 AI 回复
      const aiMessage = await tx.chatMessage.create({
        data: {
          userId,
          sessionId,
          role: 'assistant',
          content,
          verseRef: verseRef || null,
          verseContent: verseContent || null,
        },
      });

      // 更新会话的 updatedAt
      await tx.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      return aiMessage;
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[API] AI message save error:', error);

    if (error instanceof ChatError) {
      return NextResponse.json(
        {
          error: error.userMessage,
          code: error.code,
          recoverable: error.recoverable,
        },
        { status: error.code === ChatErrorCode.SESSION_NOT_FOUND ? 404 : 500 }
      );
    }

    const chatError = ChatError.fromError(error, ChatErrorCode.MESSAGE_SAVE_FAILED);
    return NextResponse.json(
      {
        error: chatError.userMessage,
        code: chatError.code,
        recoverable: chatError.recoverable,
      },
      { status: 500 }
    );
  }
}