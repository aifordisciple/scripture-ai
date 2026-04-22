// app/api/chat/prayer/route.ts
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';
import { PRAYER_PROMPT, type DualLangString } from '@/lib/constants';

export async function POST(req: Request) {
  const { apiConfig, body } = await extractApiConfig(req);
  const { note, verseRef, locale = 'zh' } = body as {
    note?: string;
    verseRef?: { bookId?: string; chapter?: number; verse?: number };
    locale?: string;
  };

  try {
    // 使用集中式 AI 客户端
    const model = await getAIModel(apiConfig);

    const verseStr = `${verseRef?.bookId || ''} ${verseRef?.chapter || ''}:${verseRef?.verse || ''}`;
    const resolvedLocale = (locale || 'zh') as keyof DualLangString;
    const prompt = (PRAYER_PROMPT[resolvedLocale] || PRAYER_PROMPT.zh)
      .replace('{verse}', verseStr)
      .replace('{content}', note || '');

    const { text } = await generateText({
      model,
      prompt
    });

    return NextResponse.json({ prayer: text });
  } catch (e) {
    console.error("AI Prayer Error:", e);
    return NextResponse.json({ error: "Failed to generate prayer" }, { status: 500 });
  }
}