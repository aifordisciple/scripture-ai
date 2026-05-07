import { streamText } from 'ai';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';
import { type DualLangString } from '@/lib/constants';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  type SermonFlowStage,
  FLOW_STAGES,
  detectFlowStage,
} from '@/lib/sermon-flow';

export const maxDuration = 60;

const SERMON_SUGGEST_PROMPT: DualLangString = {
  zh: `你是一位讲章预备助手。根据当前讲章的阶段和内容，建议2-3个具体的下一步操作。每个建议用一句话描述，要具体可操作。`,
  en: `You are a sermon preparation assistant. Based on the current sermon stage and content, suggest 2-3 specific next actions. Each suggestion should be one sentence, concrete and actionable.`,
};

const STAGE_DESCRIPTIONS: Record<SermonFlowStage, DualLangString> = {
  'verse-study': {
    zh: '经文研读阶段 — 研读经文背景、原文含义和神学主题',
    en: 'Scripture Study stage — Study the background, original language, and theological themes',
  },
  outline: {
    zh: '大纲构建阶段 — 构建讲章大纲，确定主要论点',
    en: 'Outline stage — Build the sermon outline and determine main points',
  },
  draft: {
    zh: '初稿撰写阶段 — 撰写讲章初稿，充实每个论点',
    en: 'First Draft stage — Write the first draft, fleshing out each point',
  },
  refine: {
    zh: '内容精修阶段 — 润色表达、补充例证、完善应用',
    en: 'Refinement stage — Polish expression, add illustrations, refine applications',
  },
  review: {
    zh: '审查完善阶段 — AI审查讲章质量，根据建议完善',
    en: 'Review stage — AI review sermon quality, improve based on suggestions',
  },
};

function buildSuggestContext(
  sermon: { title: string; verseRefs: string; style: string; content: string },
  stage: SermonFlowStage,
  locale: string
): string {
  const lang = locale === 'en' ? 'en' : 'zh';
  const styleMap: Record<string, Record<string, string>> = {
    EXPOSITORY: { zh: '释经式', en: 'Expository' },
    TOPICAL: { zh: '主题式', en: 'Topical' },
    NARRATIVE: { zh: '叙事式', en: 'Narrative' },
    FREE: { zh: '自由', en: 'Free' },
  };
  const styleLabel = styleMap[sermon.style]?.[lang] || sermon.style;
  const stageInfo = FLOW_STAGES.find(s => s.stage === stage);
  const stageDesc = STAGE_DESCRIPTIONS[stage];
  const contentExcerpt = sermon.content.slice(0, 1500);

  if (lang === 'zh') {
    return `### 当前讲章
- 标题: ${sermon.title || '无标题'}
- 经文引用: ${sermon.verseRefs || '无'}
- 讲道风格: ${styleLabel}
- 当前阶段: ${stageDesc.zh}（进度 ${stageInfo?.progress ?? 0}%）
- 内容摘录:\n${contentExcerpt || '（空）'}`;
  }

  return `### Current Sermon
- Title: ${sermon.title || 'Untitled'}
- Verse References: ${sermon.verseRefs || 'None'}
- Style: ${styleLabel}
- Current Stage: ${stageDesc.en} (Progress ${stageInfo?.progress ?? 0}%)
- Content Excerpt:\n${contentExcerpt || '(empty)'}`;
}

const VALID_STAGES: Set<string> = new Set([
  'verse-study',
  'outline',
  'draft',
  'refine',
  'review',
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const rateLimit = checkRateLimit(`sermon-suggest-${session.user.id}`, 60_000, 20);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
    }

    const { id } = await params;
    const { apiConfig, body } = await extractApiConfig(req);
    const { stage, locale = 'zh' } = body as {
      stage?: string;
      locale?: string;
    };

    const model = await getAIModel(apiConfig, session.user.id);

    // Load sermon from DB and verify ownership
    const sermon = await prisma.sermon.findFirst({
      where: { id, userId: session.user.id },
      select: { title: true, verseRefs: true, style: true, content: true, wordCount: true },
    });

    if (!sermon) {
      return new Response(JSON.stringify({ error: 'Sermon not found' }), { status: 404 });
    }

    const resolvedLocale = locale === 'en' ? 'en' : 'zh';
    // Use provided stage if valid, otherwise detect from content
    const resolvedStage: SermonFlowStage = VALID_STAGES.has(stage ?? '')
      ? (stage as SermonFlowStage)
      : detectFlowStage(sermon.content, sermon.wordCount);

    const systemPrompt = resolvedLocale === 'en'
      ? SERMON_SUGGEST_PROMPT.en
      : SERMON_SUGGEST_PROMPT.zh;
    const sermonContext = buildSuggestContext(sermon, resolvedStage, resolvedLocale);
    const fullPrompt = `${systemPrompt}\n\n${sermonContext}`;

    const result = await streamText({ model, prompt: fullPrompt, maxTokens: 1024 });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Sermon AI Suggest Error:', error);
    return new Response(JSON.stringify({ error: 'AI suggestion failed' }), { status: 500 });
  }
}
