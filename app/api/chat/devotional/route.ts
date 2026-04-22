// app/api/chat/devotional/route.ts
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';
import { DEVOTIONAL_PROMPT, type DualLangString } from '@/lib/constants';

export async function POST(req: Request) {
  const { apiConfig, body } = await extractApiConfig(req);
  const { planTitle, day, readings, locale = 'zh' } = body as {
    planTitle?: string;
    day?: number;
    readings?: Array<{ book: string; chapter: number }>;
    locale?: string;
  };

  try {
    // 使用集中式 AI 客户端
    const model = await getAIModel(apiConfig);

    const readingsStr = readings?.map((r) => `${r.book} ${r.chapter}章`).join('，') || '';

    const resolvedLocale = (locale || 'zh') as keyof DualLangString;
    const systemPrompt = (DEVOTIONAL_PROMPT[resolvedLocale] || DEVOTIONAL_PROMPT.zh)
      .replace('{planTitle}', planTitle || '')
      .replace('{day}', String(day || ''))
      .replace('{readingsStr}', readingsStr);

    const { text } = await generateText({
      model: model,
      system: systemPrompt,
      prompt: "请为我生成今天的导读。",
      temperature: 0.7,
    });

    // 清理文本：移除 Markdown 标记和 AI 思考标签
    let cleanText = text.trim();

    // 移除 <think>...</think> 标签（某些 AI 模型会返回）
    cleanText = cleanText.replace(/<think>[\s\S]*?<\/think>/gi, '');
    cleanText = cleanText.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

    // 移除常见的 Markdown 标记
    cleanText = cleanText.replace(/\*\*(.+?)\*\*/g, '$1'); // 粗体
    cleanText = cleanText.replace(/\*(.+?)\*/g, '$1'); // 斜体
    cleanText = cleanText.replace(/^#{1,6}\s*/gm, ''); // 标题
    cleanText = cleanText.replace(/`(.+?)`/g, '$1'); // 行内代码
    cleanText = cleanText.replace(/```[\s\S]*?```/g, ''); // 代码块

    // 清理多余空行
    cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();

    return NextResponse.json({ devotional: cleanText });
  } catch (e) {
    console.error("AI Devotional Error:", e);
    return NextResponse.json({ error: "Failed to generate devotional" }, { status: 500 });
  }
}