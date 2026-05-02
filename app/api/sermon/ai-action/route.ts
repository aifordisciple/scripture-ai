import { generateText } from 'ai';
import { auth } from '@/lib/auth';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';
import { SERMON_ACTION_PROMPTS, type DualLangString } from '@/lib/constants';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
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

    const session = await auth();
    const model = await getAIModel(apiConfig, session?.user?.id);

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

    const result = await generateText({ model, prompt: fullPrompt, maxTokens: 2048 });

    return new Response(JSON.stringify({ result: result.text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Sermon AI Action Error:', error);
    return new Response(JSON.stringify({ error: 'AI action failed' }), { status: 500 });
  }
}
