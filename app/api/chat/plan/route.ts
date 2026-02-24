// app/api/chat/plan/route.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
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
      "readings": [
        { "book": "Gen", "chapter": 1 }
      ]
    }
  ]
}
合法书卷ID必须是以下之一：
Gen,Ex,Lev,Num,Deut,Jos,Judg,Ruth,1Sa,2Sa,1Ki,2Ki,1Chr,2Chr,Ezr,Neh,Esth,Job,Ps,Prov,Eccl,Song,Isa,Jer,Lam,Ezek,Dan,Hos,Joel,Amos,Obad,Jonah,Mic,Nah,Hab,Zeph,Hag,Zech,Mal,Mt,Mk,Lk,Jn,Act,Rom,1Cor,2Cor,Gal,Eph,Phil,Col,1Thess,2Thess,1Tim,2Tim,Tit,Phlm,Heb,Jas,1Pet,2Pet,1Jn,2Jn,3Jn,Jude,Rev。`;

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: prompt,
    });

    const jsonString = text.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    const plan = JSON.parse(jsonString);

    return NextResponse.json({ plan });
  } catch (e) {
    console.error("AI Plan Gen Error:", e);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
