// app/api/chat/tutor/route.ts
// AI Tutor - Socratic method Bible study assistant

import { streamText } from 'ai';
import { auth } from "@/lib/auth";
import { getAIModel, extractApiConfig } from '@/lib/ai-client';
import { TUTOR_PROMPT, type DualLangString } from '@/lib/constants';

export const maxDuration = 180; // 增加到180秒(3分钟)，支持更长的流式输出

export async function POST(req: Request) {
  try {
    const { apiConfig, body } = await extractApiConfig(req);
    const { question, verseRef, verseContent, conversationHistory, locale = 'zh' } = body as {
      question?: string;
      verseRef?: string;
      verseContent?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      locale?: string;
    };

    const session = await auth();
    const userId = session?.user?.id;

    // 使用集中式 AI 客户端
    const model = await getAIModel(apiConfig, userId);

    // Build conversation context
    const resolvedLocale = (locale || 'zh') as keyof DualLangString;
    const systemPrompt = (TUTOR_PROMPT[resolvedLocale] || TUTOR_PROMPT.zh)
      .replace('{userQuestion}', question || '无')
      .replace('{verseRef}', verseRef || '未指定');

    // Build messages
    const messages = [
      { role: 'system' as const, content: systemPrompt },
    ];

    // Add conversation history (last 4 messages for context)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-4);
      recentHistory.forEach((msg) => {
        messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
      });
    }

    // Add current question
    messages.push({
      role: 'user' as const,
      content: verseContent ?
        `问题: ${question}\n相关经文: ${verseRef}\n${verseContent}` :
        `问题: ${question}`
    });

    const result = await streamText({
      model,
      messages,
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error("❌ Tutor API Error:", error);
    return new Response(JSON.stringify({ error: '导师服务暂时不可用' }), { status: 500 });
  }
}