// app/api/chat/route.ts
import { streamText } from 'ai';
import { SYSTEM_PROMPT, type DualLangString } from '@/lib/constants';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAIModel, extractApiConfig } from '@/lib/ai-client';
import { ChatError, ChatErrorCode, logChatError } from '@/lib/errors/chat-errors';
import { getAIContextPrompt } from '@/lib/ai-context-builder';

export const maxDuration = 300; // 增加到300秒(5分钟)，支持更长的流式输出

export async function POST(req: Request) {
  try {
    const { apiConfig, body } = await extractApiConfig(req);
    const { messages, context, sessionId, verseRef, verseContent, locale = 'zh' } = body as {
      messages?: Array<{role: 'user' | 'assistant' | 'system'; content: string}>;
      context?: any;
      sessionId?: string;
      verseRef?: string;
      verseContent?: string;
      locale?: string;
    };

    if (!messages) {
      return new Response(JSON.stringify({
        error: 'Missing messages',
        code: 'INVALID_REQUEST',
        recoverable: false,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取当前登录用户会话
    const session = await auth();
    const userId = session?.user?.id;

    // 如果用户已登录且有有效的 sessionId，使用事务保存用户消息
    let userMessageId: string | null = null;
    if (userId && sessionId && !sessionId.startsWith('temp-')) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage && lastUserMessage.role === 'user') {
        try {
          // 使用事务确保消息和会话更新的一致性
          const result = await prisma.$transaction(async (tx) => {
            // 保存用户消息
            const msg = await tx.chatMessage.create({
              data: {
                userId,
                role: 'user',
                content: lastUserMessage.content,
                sessionId: sessionId,
                verseRef: verseRef || null,
                verseContent: verseContent || null,
              }
            });

            // 更新会话的 updatedAt
            await tx.chatSession.update({
              where: { id: sessionId },
              data: { updatedAt: new Date() },
            });

            return msg;
          });

          userMessageId = result.id;
          console.log('[AI] User message saved:', userMessageId);
        } catch (err) {
          const chatError = ChatError.fromError(err, ChatErrorCode.MESSAGE_SAVE_FAILED);
          logChatError(chatError, { sessionId, userId, role: 'user' });
          // 继续执行，不影响 AI 生成
        }
      }
    } else if (userId) {
      // 没有 sessionId 的情况下，仅保存消息（向后兼容）
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
        }).catch(err => {
          console.error("[AI] Failed to save user message:", err);
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

    // 获取用户上下文记忆 (异步并行获取)
    const userAIContext = await getAIContextPrompt(userId);

    // 合并 system prompt，避免多个 system 消息导致 MiniMax 等API报错
    // 结构: 系统提示词 + 用户偏好记忆 + 当前经文上下文
    const resolvedLocale = (locale === 'en') ? 'en' : 'zh';
    let fullSystemPrompt = SYSTEM_PROMPT[resolvedLocale as keyof DualLangString] || SYSTEM_PROMPT.zh;
    if (userAIContext) {
      fullSystemPrompt += `\n\n---\n### 👤 用户个性化记忆\n${userAIContext}`;
    }
    if (context) {
      fullSystemPrompt += `\n\n---\n${userContext}`;
    }

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

        // 保存 AI 回复
        if (userId && text) {
          try {
            // 如果有有效的 sessionId，使用事务保存
            if (sessionId && !sessionId.startsWith('temp-')) {
              await prisma.$transaction(async (tx) => {
                await tx.chatMessage.create({
                  data: {
                    userId,
                    role: 'assistant',
                    content: text,
                    sessionId: sessionId,
                    verseRef: verseRef || null,
                    verseContent: verseContent || null,
                  }
                });

                // 更新会话的 updatedAt
                await tx.chatSession.update({
                  where: { id: sessionId },
                  data: { updatedAt: new Date() },
                });
              });
              console.log('[AI] Assistant message saved for session:', sessionId);
            } else {
              // 向后兼容：没有 sessionId 的情况
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
          } catch (err) {
            const chatError = ChatError.fromError(err, ChatErrorCode.MESSAGE_SAVE_FAILED);
            logChatError(chatError, { sessionId, userId, role: 'assistant', textLength: text.length });
          }
        }
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

    const chatError = ChatError.fromError(error, ChatErrorCode.UNKNOWN_ERROR);

    return new Response(JSON.stringify({
      error: chatError.userMessage,
      code: chatError.code,
      recoverable: chatError.recoverable,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}