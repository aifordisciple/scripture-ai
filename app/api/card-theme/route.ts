// app/api/card-theme/route.ts
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { content } = await req.json();

  // 复用模型配置逻辑
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

  const prompt = `
    任务：为这段圣经经文生成一个社交媒体分享卡片的主题。
    经文内容："${content.substring(0, 300)}..."

    请返回一个纯 JSON 对象（不要 Markdown），包含两个字段：
    1. "title": 4-8个字的短标题，总结经文核心（如“信心的力量”、“爱的真谛”）。
    2. "gradient": 一个 CSS linear-gradient 字符串，颜色要符合经文的意境（例如：
       - 温暖/爱 -> 暖色调/粉/橙
       - 威严/神 -> 金色/深蓝
       - 生命/成长 -> 绿色
       - 悔改/苦难 -> 深紫/灰蓝）。
    
    JSON 示例：
    {
      "title": "耶和华是我的牧者",
      "gradient": "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)"
    }
  `;

  try {
    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.7,
    });

    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(jsonStr);
    return NextResponse.json(json);
  } catch (error) {
    console.error("Theme Gen Error:", error);
    return NextResponse.json({ 
      title: "圣经金句", 
      gradient: "linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)" 
    });
  }
}