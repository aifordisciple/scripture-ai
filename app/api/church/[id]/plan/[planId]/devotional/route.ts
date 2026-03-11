// app/api/church/[id]/plan/[planId]/devotional/route.ts
// Group Plan Devotional API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateText } from 'ai';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';
import { BIBLE_BOOKS } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ id: string; planId: string }>;
}

// GET - Get devotional for a specific day
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId, planId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership
    const membership = await prisma.churchMember.findFirst({
      where: { churchId, userId: session.user.id }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const day = parseInt(searchParams.get('day') || '1');

    // Get the plan
    const plan = await prisma.groupPlan.findFirst({
      where: { id: planId, churchId }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check sharedDevotionals
    const sharedDevotionals = JSON.parse(plan.sharedDevotionals || '{}');

    if (sharedDevotionals[day.toString()]) {
      return NextResponse.json({ devotional: sharedDevotionals[day.toString()] });
    }

    return NextResponse.json({ devotional: null });
  } catch (error) {
    console.error('Get devotional error:', error);
    return NextResponse.json({ error: 'Failed to get devotional' }, { status: 500 });
  }
}

// POST - Generate or regenerate devotional for a specific day
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: churchId, planId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership (allow all members to generate)
    const membership = await prisma.churchMember.findFirst({
      where: { churchId, userId: session.user.id }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    // Extract API config and request body
    const { apiConfig, body } = await extractApiConfig(req);
    const { day, forceRegenerate } = body as {
      day?: number;
      forceRegenerate?: boolean;
    };

    if (!day) {
      return NextResponse.json({ error: 'Missing day parameter' }, { status: 400 });
    }

    // Get the plan
    const plan = await prisma.groupPlan.findFirst({
      where: { id: planId, churchId }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check existing devotional
    const sharedDevotionals = JSON.parse(plan.sharedDevotionals || '{}');

    if (sharedDevotionals[day.toString()] && !forceRegenerate) {
      return NextResponse.json({ devotional: sharedDevotionals[day.toString()] });
    }

    // Get readings for this day
    let readings: { book: string; chapter: number }[] = [];

    // Try to get from structured tasks first
    if (plan.tasks) {
      try {
        const tasks = JSON.parse(plan.tasks);
        const task = tasks.find((t: any) => t.day === day);
        if (task?.readings) {
          readings = task.readings;
        }
      } catch (e) {
        console.error('Failed to parse tasks:', e);
      }
    }

    // Fallback to dailyChapters
    if (readings.length === 0 && plan.dailyChapters[day - 1]) {
      const chaptersStr = plan.dailyChapters[day - 1];
      const chapters = chaptersStr.split(',');
      readings = chapters.map(c => {
        const [book, chapter] = c.split('-');
        return { book, chapter: parseInt(chapter) };
      });
    }

    if (readings.length === 0) {
      return NextResponse.json({ error: 'No readings found for this day' }, { status: 400 });
    }

    // Generate devotional using AI
    const model = await getAIModel(apiConfig);

    const readingsDesc = readings.map(r => {
      const bookName = BIBLE_BOOKS.find(b => b.id === r.book)?.name || r.book;
      return `${bookName} ${r.chapter}章`;
    }).join('、');

    const systemPrompt = `你是一位专业的圣经学者和牧者。请为小组读经生成一段灵修导读。

【重要】直接返回纯文本，不要有任何额外格式、标题或标记。

要求：
1. 长度约 200-300 字
2. 语言优美、有启发性
3. 适合小组讨论
4. 可以包含 1-2 个讨论问题
5. 说明这些经文与日常生活的关联`;

    const userPrompt = `请为第 ${day} 天的读经内容生成灵修导读。今天的经文是：${readingsDesc}`;

    const { text } = await generateText({
      model: model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Clean response - remove think tags and other AI artifacts
    let devotional = text.trim();

    // Remove MiniMax thinking blocks (<?,  Or  Or  Or  Or  Or  Or  Or  Or  tags)
    devotional = devotional.replace(/<tool_call>[\s\S]*?<\/think>/gi, '');
    devotional = devotional.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    devotional = devotional.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
    // Remove thinking content at the beginning (MiniMax M2.5 specific)
    devotional = devotional.replace(/^ purported_thinking[\s\S]*?(?=\S)/i, '');
    devotional = devotional.replace(/^Thinking[\s\S]*?(?=\S)/i, '');

    // Remove thinking tags like  ...
    devotional = devotional.replace(/##\s*思考[\s\S]*?(?=\S)/i, '');
    devotional = devotional.replace(/##\s*思考过程[\s\S]*?(?=\S)/i, '');

    // Remove thinking tags - MiniMax specific
    devotional = devotional.replace(/\n\n---+\n\n[\s\S]*?(?=\S)/, '');

    // Remove markdown code blocks if any
    devotional = devotional.replace(/^```text\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

    // Final trim
    devotional = devotional.trim();

    // Save to sharedDevotionals
    sharedDevotionals[day.toString()] = devotional;

    await prisma.groupPlan.update({
      where: { id: planId },
      data: { sharedDevotionals: JSON.stringify(sharedDevotionals) }
    });

    return NextResponse.json({ devotional });
  } catch (error) {
    console.error('Generate devotional error:', error);
    return NextResponse.json({ error: 'Failed to generate devotional' }, { status: 500 });
  }
}