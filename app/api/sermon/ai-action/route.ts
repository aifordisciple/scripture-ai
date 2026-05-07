import { streamText } from 'ai';
import { auth } from '@/lib/auth';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';
import { SERMON_ACTION_PROMPTS, type DualLangString } from '@/lib/constants';
import { checkRateLimit } from '@/lib/rate-limit';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const rateLimit = checkRateLimit(`sermon-action-${session.user.id}`, 60_000, 20);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
    }

    const { apiConfig, body } = await extractApiConfig(req);
    const { action, selectedText, verseRefs, style, locale = 'zh' } = body as {
      action: 'continue' | 'polish' | 'insert-verse' | 'add-example' | 'cross-ref';
      selectedText: string;
      verseRefs?: string;
      style?: string;
      locale?: string;
    };

    if (!action || !selectedText) {
      return new Response(JSON.stringify({ error: 'Missing action or selectedText' }), { status: 400 });
    }

    const model = await getAIModel(apiConfig, session.user.id);

    const resolvedLocale = (locale === 'en' ? 'en' : 'zh') as keyof DualLangString;
    const actionPrompt = SERMON_ACTION_PROMPTS[action]?.[resolvedLocale] || SERMON_ACTION_PROMPTS[action]?.zh;

    if (!actionPrompt) {
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
    }

    const styleMap: Record<string, Record<string, string>> = {
      EXPOSITORY: { zh: '释经式', en: 'Expository' },
      TOPICAL: { zh: '主题式', en: 'Topical' },
      NARRATIVE: { zh: '叙事式', en: 'Narrative' },
      FREE: { zh: '自由', en: 'Free' },
    };
    const styleLabel = style ? (styleMap[style]?.[resolvedLocale] || style) : '';

    let fullPrompt = `${actionPrompt}\n\n### Selected Text\n${selectedText}`;
    if (styleLabel) fullPrompt += `\n\n### Sermon Style: ${styleLabel}`;
    if (verseRefs) fullPrompt += `\n### Verse References: ${verseRefs}`;

    const result = await streamText({ model, prompt: fullPrompt, maxTokens: 2048 });

    // Stream the response as plain text for editor consumption
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk))
          }
        } catch (err) {
          console.error('[ai-action] Stream error:', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('❌ Sermon AI Action Error:', error);
    return new Response(JSON.stringify({ error: 'AI action failed' }), { status: 500 });
  }
}