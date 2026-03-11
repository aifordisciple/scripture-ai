// app/api/chat/devotional/route.ts
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';

export async function POST(req: Request) {
  const { apiConfig, body } = await extractApiConfig(req);
  const { planTitle, day, readings } = body as {
    planTitle?: string;
    day?: number;
    readings?: Array<{ book: string; chapter: number }>;
  };

  try {
    // 使用集中式 AI 客户端
    const model = await getAIModel(apiConfig);

    const readingsStr = readings?.map((r) => `${r.book} ${r.chapter}章`).join('，') || '';

    const systemPrompt = `你是一位充满属灵洞察力、温暖且专业的牧者。
用户正在进行名为【${planTitle}】的读经计划，今天是第 ${day} 天。
今天的阅读经文是：${readingsStr}。

请撰写一段约 150-250 字的优美灵修导读（Devotional）。
要求：
1. 提炼这些经文的核心信息，或者说明它们如何相互呼应。
2. 给出能在今天日常生活中实际应用的属灵鼓励。
3. 语气要像是一位老朋友或导师在对面轻声交谈。
4. 直接输出导读文本，绝对不要包含任何 Markdown 标记或多余的解释。`;

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