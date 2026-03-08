// app/api/chat/plan/route.ts
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {

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

  try {
    const { prompt } = await req.json();

    const systemPrompt = `你是一位专业的圣经学者和牧者。请根据用户的需求，生成一个专属的读经计划。
请严格返回 JSON 格式，不要包含任何 Markdown 标记（如 \`\`\`json ）。
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
      prompt: prompt,
      temperature: 0.7,
    });

    const jsonString = text.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    const plan = JSON.parse(jsonString);

    return NextResponse.json({ plan });
  } catch (e) {
    console.error("AI Plan Gen Error:", e);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
