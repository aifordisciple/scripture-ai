// app/api/chat/session/generate-title/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';
import { generateText } from 'ai';

export const maxDuration = 30;

/**
 * 使用AI生成会话标题
 * 输入: sessionId 或 content（用于生成标题的消息内容）
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { apiConfig, body } = await extractApiConfig(req);
    const { sessionId, content, bookName, chapter, verse, locale = 'zh' } = body as {
      sessionId?: string;
      content?: string;
      bookName?: string;
      chapter?: number;
      verse?: number;
      locale?: string;
    };

    if (!sessionId && !content) {
      return NextResponse.json({ error: 'Missing sessionId or content' }, { status: 400 });
    }

    let messageContent = content;

    // 如果提供了sessionId但没有content，从数据库获取第一条用户消息
    if (sessionId && !messageContent) {
      const firstMessage = await prisma.chatMessage.findFirst({
        where: { sessionId, role: 'user' },
        orderBy: { createdAt: 'asc' },
      });
      messageContent = firstMessage?.content || '';
    }

    if (!messageContent) {
      return NextResponse.json({ error: 'No content to generate title' }, { status: 400 });
    }

    // 使用AI生成简短标题
    const model = await getAIModel(apiConfig);

    // 构建上下文提示
    const isEn = locale === 'en';
    let contextHint = '';
    if (bookName && chapter) {
      contextHint = isEn
        ? `The user is reading ${bookName} Chapter ${chapter}${verse ? `:${verse}` : ''}.`
        : `用户正在阅读《${bookName}》第${chapter}章${verse ? `第${verse}节` : ''}。`;
    }

    const titleInstruction = isEn
      ? `Generate a short title (max 20 characters) for the following conversation. Return only the title, no quotes or extra symbols.`
      : `请为以下对话生成一个简短的标题（不超过15个字），只返回标题本身，不要加引号或其他符号。`;

    const result = await generateText({
      model,
      prompt: `${contextHint}
${titleInstruction}

${isEn ? 'Conversation content:' : '对话内容：'}
${messageContent.substring(0, 500)}`,
      maxTokens: 30,
    });

    const title = result.text.trim().substring(0, 30);

    // 如果提供了sessionId，更新会话标题
    if (sessionId) {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title },
      });
    }

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}