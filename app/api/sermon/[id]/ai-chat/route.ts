import { streamText, type CoreMessage } from 'ai';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';
import { SERMON_CHAT_PROMPT, type DualLangString } from '@/lib/constants';
import { checkRateLimit } from '@/lib/rate-limit';

export const maxDuration = 180;

function buildSermonContext(sermon: { title: string; verseRefs: string; style: string; content: string }, locale: string): string {
  const styleMap: Record<string, Record<string, string>> = {
    EXPOSITORY: { zh: '释经式', en: 'Expository' },
    TOPICAL: { zh: '主题式', en: 'Topical' },
    NARRATIVE: { zh: '叙事式', en: 'Narrative' },
    FREE: { zh: '自由', en: 'Free' },
  };

  const lang = locale === 'en' ? 'en' : 'zh';
  const styleLabel = styleMap[sermon.style]?.[lang] || sermon.style;

  // Extract text from Markdown content (max ~2000 chars)
  const contentExcerpt = sermon.content.slice(0, 2000)

  if (lang === 'zh') {
    return `### 当前讲章上下文
- 标题: ${sermon.title || '无标题'}
- 经文引用: ${sermon.verseRefs || '无'}
- 讲道风格: ${styleLabel}
- 内容摘录:\n${contentExcerpt || '（空）'}`;
  }

  return `### Current Sermon Context
- Title: ${sermon.title || 'Untitled'}
- Verse References: ${sermon.verseRefs || 'None'}
- Style: ${styleLabel}
- Content Excerpt:\n${contentExcerpt || '(empty)'}`;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const rateLimit = checkRateLimit(`sermon-chat-${session.user.id}`, 60_000, 20);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
    }

    const { id } = await params;
    const { apiConfig, body } = await extractApiConfig(req);
    const { messages, locale = 'zh' } = body as {
      messages: Array<{ role: string; content: string }>;
      locale?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Missing messages' }), { status: 400 });
    }

    const model = await getAIModel(apiConfig, session.user.id);

    // Load sermon context from database - verify ownership
    const sermon = await prisma.sermon.findFirst({
      where: { id, userId: session.user.id },
      select: { title: true, verseRefs: true, style: true, content: true },
    });

    if (!sermon) {
      return new Response(JSON.stringify({ error: 'Sermon not found' }), { status: 404 });
    }

    const resolvedLocale = (locale === 'en' ? 'en' : 'zh') as keyof DualLangString;
    const sermonContext = buildSermonContext(sermon, resolvedLocale);
    const fullSystemPrompt = (SERMON_CHAT_PROMPT[resolvedLocale] || SERMON_CHAT_PROMPT.zh) + '\n\n' + sermonContext;

    const result = await streamText({
      model,
      system: fullSystemPrompt,
      messages: messages as CoreMessage[],
      maxTokens: 4096,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('❌ Sermon AI Chat Error:', error);
    return new Response(JSON.stringify({ error: 'AI chat failed' }), { status: 500 });
  }
}