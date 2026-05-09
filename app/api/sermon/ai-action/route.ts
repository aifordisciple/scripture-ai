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
    const { action, selectedText, verseRefs, style, locale = 'zh', sermonContext, voiceProfile, typeHint, injectedContext } = body as {
      action: string;
      selectedText: string;
      verseRefs?: string;
      style?: string;
      locale?: string;
      sermonContext?: string;
      expandDegree?: 'slight' | 'moderate' | 'extensive';
      expandDirection?: 'depth' | 'breadth' | 'illustration';
      voiceProfile?: { tone?: string; formality?: string; audience?: string; description?: string };
      typeHint?: string;
      injectedContext?: string;
    };

    if (!action || !selectedText) {
      return new Response(JSON.stringify({ error: 'Missing action or selectedText' }), { status: 400 });
    }

    const model = await getAIModel(apiConfig, session.user.id);

    const resolvedLocale = (locale === 'en' ? 'en' : 'zh') as keyof DualLangString;
    const actionPrompt = SERMON_ACTION_PROMPTS[action]?.[resolvedLocale] || SERMON_ACTION_PROMPTS[action]?.zh;

    // For new action types without predefined prompts, generate from typeHint or action name
    const effectivePrompt = actionPrompt || typeHint || (resolvedLocale === 'zh'
      ? `请根据以下内容执行"${action}"操作：`
      : `Perform the "${action}" action based on the following content:`);

    if (!effectivePrompt) {
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
    }

    // Degree modifiers for expand/shrink actions
    const degreeModifiers: Record<string, Record<string, string>> = {
      expand: {
        slight: resolvedLocale === 'zh' ? '请仅略微扩展，增加1-2个补充说明即可，不要大幅改写。' : 'Expand only slightly, adding 1-2 supplementary points. Do not heavily rewrite.',
        moderate: '', // default prompt is already moderate
        extensive: resolvedLocale === 'zh' ? '请大幅扩展，深入阐述每个论点，添加详细的经文分析、例证和应用。' : 'Expand extensively, deeply elaborating each point with detailed Scripture analysis, illustrations, and applications.',
      },
      shrink: {
        slight: resolvedLocale === 'zh' ? '请仅略微精简，去除少量冗余表达即可，保留大部分内容。' : 'Condense only slightly, removing minor redundancies while preserving most content.',
        moderate: '', // default prompt is already moderate
        extensive: resolvedLocale === 'zh' ? '请大幅精简，只保留最核心的论点，去除所有非必要的阐述和例证。' : 'Condense extensively, keeping only the core arguments and removing all non-essential elaboration and illustrations.',
      },
    };

    const styleMap: Record<string, Record<string, string>> = {
      EXPOSITORY: { zh: '释经式', en: 'Expository' },
      TOPICAL: { zh: '主题式', en: 'Topical' },
      NARRATIVE: { zh: '叙事式', en: 'Narrative' },
      FREE: { zh: '自由', en: 'Free' },
    };
    const styleLabel = style ? (styleMap[style]?.[resolvedLocale] || style) : '';

    // Build user message with action prompt and selected text
    let userMessage = `${actionPrompt}`;
    // Apply degree modifier if applicable
    const degree = body.expandDegree as string | undefined;
    if (degree && degreeModifiers[action]?.[degree]) {
      userMessage += `\n\n${degreeModifiers[action][degree]}`;
    }
    userMessage += `\n\n### Selected Text\n${selectedText}`;
    if (styleLabel) userMessage += `\n\n### Sermon Style: ${styleLabel}`;
    if (verseRefs) userMessage += `\n### Verse References: ${verseRefs}`;
    // [@-command] Inject user-selected context (scripture, commentary, outline, etc.)
    if (injectedContext) userMessage += `\n\n### User-Injected Context\n${injectedContext}`;

    // Build system message with sermon context for full-text awareness
    const systemParts: string[] = [];
    systemParts.push(resolvedLocale === 'en'
      ? 'You are an experienced sermon writing assistant. Help write and improve sermon content with biblical faithfulness and pastoral warmth.'
      : '你是一位经验丰富的讲章写作助手，帮助撰写和改进讲章内容，确保圣经真理的准确性和牧养的温暖。'
    );
    if (sermonContext) {
      systemParts.push(sermonContext);
    }
    // [P2.1] Inject voice profile into system prompt
    if (voiceProfile) {
      const toneMap: Record<string, Record<string, string>> = {
        solemn: { zh: '庄重、敬畏、神圣', en: 'solemn, reverent, sacred' },
        warm: { zh: '温暖、关怀、贴近', en: 'warm, caring, approachable' },
        passionate: { zh: '充满热情、激励人心', en: 'passionate, inspiring, fervent' },
        gentle: { zh: '柔和、安慰、医治', en: 'gentle, comforting, healing' },
        scholarly: { zh: '严谨、深入、思辨', en: 'rigorous, deep, analytical' },
        conversational: { zh: '轻松、互动、日常', en: 'relaxed, interactive, everyday' },
      };
      const formalityMap: Record<string, Record<string, string>> = {
        formal: { zh: '正式', en: 'formal' },
        'semi-formal': { zh: '半正式', en: 'semi-formal' },
        casual: { zh: '随意', en: 'casual' },
      };
      const audienceMap: Record<string, Record<string, string>> = {
        general: { zh: '一般会众', en: 'general congregation' },
        youth: { zh: '青年', en: 'youth' },
        elderly: { zh: '长者', en: 'elderly' },
        scholarly: { zh: '学者', en: 'scholarly audience' },
        'new-believer': { zh: '初信者', en: 'new believers' },
      };
      const lang = resolvedLocale;
      const voiceParts: string[] = [];
      if (voiceProfile.tone) voiceParts.push(lang === 'zh' ? `语气风格：${toneMap[voiceProfile.tone]?.zh || voiceProfile.tone}` : `Tone: ${toneMap[voiceProfile.tone]?.en || voiceProfile.tone}`);
      if (voiceProfile.formality) voiceParts.push(lang === 'zh' ? `正式程度：${formalityMap[voiceProfile.formality]?.zh || voiceProfile.formality}` : `Formality: ${formalityMap[voiceProfile.formality]?.en || voiceProfile.formality}`);
      if (voiceProfile.audience) voiceParts.push(lang === 'zh' ? `目标听众：${audienceMap[voiceProfile.audience]?.zh || voiceProfile.audience}` : `Audience: ${audienceMap[voiceProfile.audience]?.en || voiceProfile.audience}`);
      if (voiceProfile.description) voiceParts.push(lang === 'zh' ? `自定义风格：${voiceProfile.description}` : `Custom voice: ${voiceProfile.description}`);
      if (voiceParts.length > 0) {
        systemParts.push(lang === 'zh' ? `### 语音特征要求\n${voiceParts.join('\n')}\n\n请确保生成的内容符合以上语音特征。` : `### Voice Profile\n${voiceParts.join('\n')}\n\nEnsure generated content matches the above voice profile.`);
      }
    }
    const systemMessage = systemParts.join('\n\n');

    const result = await streamText({
      model,
      system: systemMessage,
      prompt: userMessage,
      maxTokens: 2048,
    });

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