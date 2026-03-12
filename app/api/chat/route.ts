// app/api/chat/route.ts
import { streamText } from 'ai';
import { SYSTEM_PROMPT } from '@/lib/constants';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAIModel, extractApiConfig } from '@/lib/ai-client';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { apiConfig, body } = await extractApiConfig(req);
    const { messages, context, sessionId, verseRef, verseContent } = body as {
      messages?: Array<{role: string; content: string}>;
      context?: any;
      sessionId?: string;
      verseRef?: string;
      verseContent?: string;
    };

    if (!messages) {
      return new Response(JSON.stringify({ error: 'Missing messages' }), { status: 400 });
    }

    // 获取当前登录用户会话
    const session = await auth();
    const userId = session?.user?.id;

    // 如果用户已登录，保存用户的提问到数据库
    if (userId) {
       const lastUserMessage = messages[messages.length - 1];
       if (lastUserMessage && lastUserMessage.role === 'user') {
          await prisma.chatMessage.create({
             data: {
               userId,
               role: 'user',
               content: lastUserMessage.content,
               sessionId: sessionId || null,
               verseRef: verseRef || null,
               verseContent: verseContent || null,
             }
          });
       }
    }

    // --- 构造分层的 Context Prompt ---
    let userContext = "";
    if (context) {
      const focusText = context.selectedText || context.content;
      const backgroundText = context.contextText || "";

      userContext = `
【当前任务】
用户正在阅读《${context.bookName}》第 ${context.chapter} 章。
请针对用户选中的经文进行深入且严谨的解读。

【🎯 用户选中的经文 (重点解读对象)】
${focusText}

【📖 上下文参考 (仅供理解背景，无需逐字解释)】
${backgroundText}
`;
    }

    // 使用集中式 AI 客户端
    const model = await getAIModel(apiConfig);

    // 合并 system prompt，避免多个 system 消息导致 MiniMax 等API报错
    const fullSystemPrompt = context
      ? `${SYSTEM_PROMPT}\n\n${userContext}`
      : SYSTEM_PROMPT;

    const result = await streamText({
      model: model,
      system: fullSystemPrompt,
      messages: messages,
      // AI 流式输出完成后，保存回复到数据库
      onFinish: async ({ text }) => {
         if (userId) {
            await prisma.chatMessage.create({
               data: {
                 userId,
                 role: 'assistant',
                 content: text,
                 sessionId: sessionId || null,
                 verseRef: verseRef || null,
                 verseContent: verseContent || null,
               }
            });
         }
      }
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error("❌ API 路由致命错误:", error);
    return new Response(JSON.stringify({ error: '后端处理失败' }), { status: 500 });
  }
}