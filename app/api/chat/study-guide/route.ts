// app/api/chat/study-guide/route.ts
// AI Study Guide Generator - Create personalized Bible study questions

import { generateText } from 'ai';
import { auth } from "@/lib/auth";
import { getAIModel, extractApiConfig } from '@/lib/ai-client';
import { STUDY_GUIDE_PROMPT, type DualLangString } from '@/lib/constants';

export const maxDuration = 180; // 增加到180秒(3分钟)，支持更长的生成时间

export async function POST(req: Request) {
  try {
    const { apiConfig, body } = await extractApiConfig(req);
    const { bookName, chapter, verseRange, verseContent, questionCount = 5, locale = 'zh' } = body as {
      bookName?: string;
      chapter?: number;
      verseRange?: string;
      verseContent?: string;
      questionCount?: number;
      locale?: string;
    };

    const session = await auth();

    // 使用集中式 AI 客户端
    const model = await getAIModel(apiConfig, session?.user?.id);

    // Build prompt
    const resolvedLocale = (locale || 'zh') as keyof DualLangString;
    let prompt = (STUDY_GUIDE_PROMPT[resolvedLocale] || STUDY_GUIDE_PROMPT.zh)
      .replace('{bookName}', bookName || '未指定')
      .replace('{chapter}', String(chapter || ''))
      .replace('{verseRange}', verseRange || '全章');

    // Add verse content if provided
    if (verseContent) {
      prompt += `\n\n### 参考经文\n${verseContent}`;
    }

    const result = await generateText({
      model,
      prompt,
    });

    return new Response(JSON.stringify({
      guide: result.text,
      metadata: {
        bookName,
        chapter,
        verseRange,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ Study Guide API Error:", error);
    return new Response(JSON.stringify({ error: '查经材料生成失败' }), { status: 500 });
  }
}