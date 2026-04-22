// app/api/chat/sermon/route.ts
// AI Sermon Outline Generator - Create sermon outlines from Bible passages

import { generateText } from 'ai';
import { auth } from "@/lib/auth";
import { getAIModel, extractApiConfig } from '@/lib/ai-client';
import { SERMON_PROMPT, type DualLangString } from '@/lib/constants';

export const maxDuration = 180; // 增加到180秒(3分钟)，支持更长的生成时间

export async function POST(req: Request) {
  try {
    const { apiConfig, body } = await extractApiConfig(req);
    const { verseRef, bookName, chapter, verses, title, style = 'expository', locale = 'zh' } = body as {
      verseRef?: string;
      bookName?: string;
      chapter?: number;
      verses?: string;
      title?: string;
      style?: string;
      locale?: string;
    };

    const session = await auth();

    // 使用集中式 AI 客户端
    const model = await getAIModel(apiConfig, session?.user?.id);

    // Build prompt
    const resolvedLocale = (locale || 'zh') as keyof DualLangString;
    let prompt = (SERMON_PROMPT[resolvedLocale] || SERMON_PROMPT.zh)
      .replace('{verseRef}', verseRef || `${bookName || ''} ${chapter || ''}:${verses || ''}`);

    if (verses) {
      prompt += `\n\n### 参考经文内容\n${verses}`;
    }

    if (title) {
      prompt += `\n\n### 指定主题: ${title}`;
    }

    if (style) {
      prompt += `\n\n### 讲道风格: ${style === 'expository' ? '释经式讲道' : style === 'topical' ? '主题式讲道' : '叙事式讲道'}`;
    }

    const result = await generateText({
      model,
      prompt,
    });

    return new Response(JSON.stringify({
      sermon: result.text,
      metadata: {
        verseRef,
        bookName,
        chapter,
        verses,
        title,
        style,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ Sermon API Error:", error);
    return new Response(JSON.stringify({ error: '讲道大纲生成失败' }), { status: 500 });
  }
}