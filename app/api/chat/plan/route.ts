// app/api/chat/plan/route.ts
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';

export async function POST(req: Request) {
  const { apiConfig, body } = await extractApiConfig(req);
  const { prompt } = body as { prompt?: string };

  try {
    // 使用集中式 AI 客户端
    const model = await getAIModel(apiConfig);

    const systemPrompt = `你是一位专业的圣经学者和牧者。请根据用户的需求，生成一个专属的读经计划。

【重要】直接返回 JSON 对象，不要有任何思考过程、解释或 Markdown 标记。直接以 { 开始，以 } 结束。

JSON 格式要求：
{
  "id": "custom-随机字母",
  "title": "计划标题（如：7天战胜焦虑）",
  "description": "简短的介绍",
  "durationDays": 计划天数,
  "tags": ["标签1", "标签2"],
  "tasks": [
    {
      "day": 1,
      "devotional": "一段优美、有启发性的灵修摘要，说明为什么为今天挑选了这些经文，以及它们如何回应用户的主题需求。",
      "readings": [
        { "book": "Gen", "chapter": 1 },
        { "book": "Gen", "chapter": 2 }
      ]
    }
  ]
}
注意：每天可以安排一章或多章经文。
合法书卷ID必须是以下之一（切勿使用其他缩写）：
Gen,Exo,Lev,Num,Deu,Jos,Jdg,Rut,1Sa,2Sa,1Ki,2Ki,1Ch,2Ch,Ezr,Neh,Est,Job,Psa,Pro,Ecc,Sng,Isa,Jer,Lam,Eze,Dan,Hos,Jol,Amo,Oba,Jon,Mic,Nah,Hab,Zep,Hag,Zec,Mal,Mat,Mrk,Luk,Jhn,Act,Rom,1Co,2Co,Gal,Eph,Php,Col,1Th,2Th,1Ti,2Ti,Tit,Phm,Heb,Jas,1Pe,2Pe,1Jn,2Jn,3Jn,Jud,Rev。`;

    const { text } = await generateText({
      model: model,
      system: systemPrompt,
      prompt: prompt || '',
      temperature: 0.7,
    });

    // Clean response: remove MiniMax thinking tags and markdown
    let jsonString = text;

    // Remove MiniMax thinking blocks (<?,  Or  Or Or Or Or Or  Or  tags)
    jsonString = jsonString.replace(/<think>[\s\S]*?<\/think>/gi, '');
    jsonString = jsonString.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    jsonString = jsonString.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
    // Remove thinking content at the beginning (MiniMax M2.5 specific)
    jsonString = jsonString.replace(/^ purported_thinking[\s\S]*?(?=\{)/i, '');
    jsonString = jsonString.replace(/^Thinking[\s\S]*?(?=\{)/i, '');

    // Remove thinking tags like  ...
    jsonString = jsonString.replace(/##\s*思考[\s\S]*?(?=\{)/i, '');
    jsonString = jsonString.replace(/##\s*思考过程[\s\S]*?(?=\{)/i, '');

    // Remove thinking tags - MiniMax specific
    jsonString = jsonString.replace(/\n\n---+\n\n[\s\S]*?(?=\{)/, '');

    // Remove markdown code blocks
    jsonString = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    // Try to find JSON object in the response
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    console.log('[Plan] Cleaned JSON length:', jsonString.length);

    const plan = JSON.parse(jsonString);

    return NextResponse.json({ plan });
  } catch (e) {
    console.error("AI Plan Gen Error:", e);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}