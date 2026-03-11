// app/api/chat/prayer/route.ts
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';

export async function POST(req: Request) {
  const { apiConfig, body } = await extractApiConfig(req);
  const { note, verseRef } = body as {
    note?: string;
    verseRef?: { bookId?: string; chapter?: number; verse?: number };
  };

  try {
    // 使用集中式 AI 客户端
    const model = await getAIModel(apiConfig);

    const prompt = `
    用户正在针对圣经经文 (${verseRef?.bookId} ${verseRef?.chapter}:${verseRef?.verse}) 写灵修笔记。
    用户的笔记内容是："${note}"

    请根据这节经文和用户的感动，为他/她写一篇简短、真诚的祷告文（100字以内）。
    祷告文应该回应用户的具体感动，用词优美，富有属灵情感。
    直接输出祷告内容，不要加"好的"等前缀。
  `;

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