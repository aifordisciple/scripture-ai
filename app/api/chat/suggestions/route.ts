// app/api/chat/suggestions/route.ts
// 根据上下文生成 3-5 个引导式后续问题

import { generateText } from 'ai';
import { auth } from '@/lib/auth';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';
import { type DualLangString } from '@/lib/constants';
import { ChatError, ChatErrorCode } from '@/lib/errors/chat-errors';
import { stripAllThinkTags } from '@/lib/ai';

export const maxDuration = 30;

const SUGGESTION_PROMPTS = {
  zh: `你是圣经学习助手。基于用户的提问和AI的回复，生成 3 到 5 个简短的后续引导问题。

要求：
- 问题应紧扣当前对话主题，自然延伸
- 长度不超过 18 个汉字
- 不要重复已问过的问题
- 多样化：包含应用、神学背景、串珠、深度思考等不同角度
- 使用第二人称"你"
- 严格以 JSON 数组格式输出，例如：["问题1", "问题2", "问题3"]`,
  en: `You are a Bible study assistant. Based on the user's question and the AI's reply, generate 3 to 5 brief follow-up guided questions.

Requirements:
- Questions should closely follow the current conversation topic and naturally extend it
- Each question no more than 12 words
- Do not repeat questions already asked
- Diversified: include application, theological background, cross-references, deep thinking, etc.
- Use second person
- Output strictly as a JSON array, e.g. ["question1", "question2", "question3"]`,
} as const;

export async function POST(req: Request) {
  try {
    const { apiConfig, body } = await extractApiConfig(req);
    const { lastUserMessage, lastAssistantMessage, locale = 'zh' } = body as {
      lastUserMessage?: string;
      lastAssistantMessage?: string;
      locale?: string;
    };

    if (!lastAssistantMessage || lastAssistantMessage.trim().length === 0) {
      return Response.json({ suggestions: [] });
    }

    const session = await auth();
    const userId = session?.user?.id;
    const resolvedLocale = (locale === 'en' ? 'en' : 'zh') as keyof DualLangString;
    const systemPrompt = SUGGESTION_PROMPTS[resolvedLocale] || SUGGESTION_PROMPTS.zh;

    const userContent = resolvedLocale === 'en'
      ? `[User's last question]\n${(lastUserMessage || '').slice(-500)}\n\n[AI's reply (last 1500 chars)]\n${lastAssistantMessage.slice(-1500)}`
      : `【用户最后的问题】\n${(lastUserMessage || '').slice(-500)}\n\n【AI 的回复（最后 1500 字）】\n${lastAssistantMessage.slice(-1500)}`;

    const model = await getAIModel(apiConfig, userId);

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: userContent,
    });

    const cleaned = stripAllThinkTags(result.text || '').trim();

    let suggestions: string[] = [];
    try {
      const jsonMatch = cleaned.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          suggestions = parsed
            .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
            .map(s => s.trim())
            .slice(0, 5);
        }
      }
    } catch {
      suggestions = cleaned
        .split('\n')
        .map(l => l.replace(/^[\d\.\-\*\s]+/, '').replace(/^["']|["']$/g, '').trim())
        .filter(l => l.length > 0 && l.length < 50)
        .slice(0, 5);
    }

    if (suggestions.length < 3) {
      return Response.json({ suggestions: [] });
    }

    return Response.json({ suggestions: suggestions.slice(0, 5) });
  } catch (error) {
    console.error('❌ Suggestions API Error:', error);
    const chatError = ChatError.fromError(error, ChatErrorCode.UNKNOWN_ERROR);
    return Response.json({
      suggestions: [],
      error: chatError.userMessage,
    }, { status: 200 });
  }
}
