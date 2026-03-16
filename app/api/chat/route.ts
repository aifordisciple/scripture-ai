// app/api/chat/route.ts
import { streamText } from 'ai';
import { SYSTEM_PROMPT } from '@/lib/constants';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAIModel, extractApiConfig } from '@/lib/ai-client';

export const maxDuration = 300; // 增加到300秒(5分钟)，支持更长的流式输出

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
          }).catch(err => console.error("Failed to save user message:", err));
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
      // 设置最大 token 数，确保输出完整
      maxTokens: 4096,
      // AI 流式输出完成后，保存回复到数据库
      onFinish: async ({ text, finishReason, usage }) => {
         // 记录完成原因，便于调试
         console.log(`[AI] Stream finished. Reason: ${finishReason}, Tokens: ${usage?.totalTokens || 'N/A'}`);

         // 检查是否异常中断
         if (finishReason && finishReason !== 'stop' && finishReason !== 'length') {
           console.warn(`[AI] Stream may have been interrupted: ${finishReason}`);
         }

         if (userId && text) {
            try {
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
            } catch (err) {
              console.error("Failed to save assistant message:", err);
            }
         }
      },
      onError: async ({ error }) => {
        console.error('[AI] Stream error:', error);
      }
    });

    // 返回流式响应，设置适当的 headers
    const response = result.toDataStreamResponse();
    // 设置响应头以支持流式传输
    response.headers.set('Connection', 'keep-alive');
    response.headers.set('Keep-Alive', 'timeout=300');
    return response;

  } catch (error) {
    console.error("❌ API 路由致命错误:", error);
    // 返回更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : '后端处理失败';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}