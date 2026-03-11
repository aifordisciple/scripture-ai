// app/api/card-theme/route.ts
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';

export async function POST(req: Request) {
  const { apiConfig, body } = await extractApiConfig(req);
  const { content } = body as { content?: string };

  try {
    // 使用集中式 AI 客户端
    const model = await getAIModel(apiConfig);

    const prompt = `
    任务：为这段圣经经文生成一个社交媒体分享卡片的主题。
    经文内容："${content?.substring(0, 300) || ''}..."

    请返回一个纯 JSON 对象（不要 Markdown），包含两个字段：
    1. "title": 4-8个字的短标题，总结经文核心（如"信心的力量"、"爱的真谛"）。
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