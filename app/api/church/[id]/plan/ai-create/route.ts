// app/api/church/[id]/plan/ai-create/route.ts
// AI-powered Group Plan Creation API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateText } from 'ai';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Create group plan using AI
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership
    const membership = await prisma.churchMember.findFirst({
      where: {
        churchId,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Only admins can create group plans' }, { status: 403 });
    }

    // Extract API config and request body
    const { apiConfig, body } = await extractApiConfig(req);
    const { prompt, durationDays, mode } = body as {
      prompt?: string;
      durationDays?: number;
      mode?: 'NORMAL' | 'CHALLENGE';
    };

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    // Use AI to generate plan
    const model = await getAIModel(apiConfig);

    const systemPrompt = `你是一位专业的圣经学者和牧者。请根据用户的需求，生成一个小组读经计划。

【重要】直接返回 JSON 对象，不要有任何思考过程、解释或 Markdown 标记。直接以 { 开始，以 } 结束。

JSON 格式要求：
{
  "name": "计划标题（如：7天小组战胜焦虑）",
  "description": "简短的介绍，适合小组共同阅读",
  "durationDays": 计划天数,
  "tasks": [
    {
      "day": 1,
      "devotional": "一段优美、有启发性的灵修摘要，适合小组讨论，说明为什么为今天挑选了这些经文，以及它们如何回应用户的主题需求。",
      "readings": [
        { "book": "Gen", "chapter": 1 },
        { "book": "Gen", "chapter": 2 }
      ]
    }
  ]
}
注意：
1. 每天可以安排一章或多章经文
2. 灵修导读应该适合小组讨论，可以包含讨论问题
3. 经文选择要适合多人共同阅读
合法书卷ID必须是以下之一（切勿使用其他缩写）：
Gen,Exo,Lev,Num,Deu,Jos,Jdg,Rut,1Sa,2Sa,1Ki,2Ki,1Ch,2Ch,Ezr,Neh,Est,Job,Psa,Pro,Ecc,Sng,Isa,Jer,Lam,Eze,Dan,Hos,Jol,Amo,Oba,Jon,Mic,Nah,Hab,Zep,Hag,Zec,Mal,Mat,Mrk,Luk,Jhn,Act,Rom,1Co,2Co,Gal,Eph,Php,Col,1Th,2Th,1Ti,2Ti,Tit,Phm,Heb,Jas,1Pe,2Pe,1Jn,2Jn,3Jn,Jud,Rev。`;

    const userPrompt = `请为我的小组创建一个${durationDays ? durationDays + '天的' : ''}读经计划：${prompt}`;

    const { text } = await generateText({
      model: model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Clean response: remove thinking tags and markdown
    let jsonString = text;

    // Remove various thinking blocks
    jsonString = jsonString.replace(/<tool_call>[\s\S]*?<\/think>/gi, '');
    jsonString = jsonString.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    jsonString = jsonString.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
    jsonString = jsonString.replace(/^ purported_thinking[\s\S]*?(?=\{)/i, '');
    jsonString = jsonString.replace(/^Thinking[\s\S]*?(?=\{)/i, '');
    jsonString = jsonString.replace(/##\s*思考[\s\S]*?(?=\{)/i, '');
    jsonString = jsonString.replace(/##\s*思考过程[\s\S]*?(?=\{)/i, '');
    jsonString = jsonString.replace(/\n\n---+\n\n[\s\S]*?(?=\{)/, '');

    // Remove markdown code blocks
    jsonString = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    // Find JSON object in the response
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    const planData = JSON.parse(jsonString);

    // Build tasks and dailyChapters
    const tasks = planData.tasks || [];
    const dailyChapters: string[] = [];
    const sharedDevotionals: Record<string, string> = {};

    tasks.forEach((task: any) => {
      // Build daily chapters for backward compatibility
      const chapters = task.readings.map((r: any) => `${r.book}-${r.chapter}`);
      dailyChapters.push(chapters.join(','));

      // Store devotionals
      if (task.devotional) {
        sharedDevotionals[task.day.toString()] = task.devotional;
      }
    });

    // Create the plan
    const plan = await prisma.groupPlan.create({
      data: {
        churchId,
        name: planData.name,
        description: planData.description,
        startDate: new Date(),
        dailyChapters,
        tasks: JSON.stringify(tasks),
        sharedDevotionals: JSON.stringify(sharedDevotionals),
        source: 'AI_GENERATED',
        mode: mode || 'NORMAL',
        challengeConfig: mode === 'CHALLENGE' ? JSON.stringify({
          targetDays: planData.durationDays,
          rewardTitle: `完成${planData.name}`,
          rewardBadge: '挑战者'
        }) : null
      }
    });

    // Create initial progress records for all members
    const members = await prisma.churchMember.findMany({
      where: { churchId },
      select: { userId: true }
    });

    // Create initial leaderboard entries
    for (const member of members) {
      await prisma.leaderboardEntry.create({
        data: {
          planId: plan.id,
          userId: member.userId,
          score: 0,
          chaptersRead: 0,
          streakDays: 0,
          completedDays: 0
        }
      });
    }

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('AI create group plan error:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}