// app/api/chat/prayer/route.ts
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { note, verseRef } = await req.json();

  // 复用之前的模型获取逻辑 (建议封装到 lib/ai-helper.ts)
  const provider = process.env.AI_PROVIDER || 'openai';
  let model;
  // ... (复制 search/route.ts 里的 getModel 逻辑) ...
  // 为简单起见，这里假设直接初始化:
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  model = openai('gpt-4o-mini'); // 临时简化

  const prompt = `
    用户正在针对圣经经文 (${verseRef.bookId} ${verseRef.chapter}:${verseRef.verse}) 写灵修笔记。
    用户的笔记内容是：“${note}”
    
    请根据这节经文和用户的感动，为他/她写一篇简短、真诚的祷告文（100字以内）。
    祷告文应该回应用户的具体感动，用词优美，富有属灵情感。
    直接输出祷告内容，不要加“好的”等前缀。
  `;

  const { text } = await generateText({
    model,
    prompt
  });

  return NextResponse.json({ prayer: text });
}