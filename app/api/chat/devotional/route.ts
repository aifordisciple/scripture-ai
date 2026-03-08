import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const provider = process.env.AI_PROVIDER || 'openai';
  let model;
  
  if (provider === 'ollama') {
    const ollama = createOpenAI({
      baseURL: process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434/v1',
      apiKey: '', 
    });
    model = ollama(process.env.OLLAMA_MODEL || 'qwen3.5:9b');
  } else if (provider === 'deepseek') {
    const deepseek = createOpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
    model = deepseek('deepseek-chat');
  } else {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    model = openai('gpt-4o-mini');
  }

  try {
    const { planTitle, day, readings } = await req.json();
    const readingsStr = readings.map((r: any) => `${r.book} ${r.chapter}章`).join('，');

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

    return NextResponse.json({ devotional: text.trim() });
  } catch (e) {
    console.error("AI Devotional Error:", e);
    return NextResponse.json({ error: "Failed to generate devotional" }, { status: 500 });
  }
}
