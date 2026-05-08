// app/api/card-theme/route.ts
// AI 经文卡片主题生成 - 全套推荐（背景+配色+标题+布局+字体）

import { NextRequest, NextResponse } from 'next/server';
import { stripThinkTags } from '@/lib/ai';
import { getEnvConfig } from '@/lib/ai-client';

const LAYOUT_MODES = ['classic', 'poster', 'card', 'modern', 'split', 'frame', 'film', 'minimal', 'magazine', 'stamp'] as const;
type LayoutMode = typeof LAYOUT_MODES[number];

interface AICardThemeResponse {
  title: string;
  gradient: string;
  layoutMode: LayoutMode;
  fontFamily: string;
  textColor: string;
  infoColor: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  bgSearchQuery?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, error: 'content is required' }, { status: 400 });
    }

    const { apiKey, baseUrl, model } = getEnvConfig();

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'AI API key not configured' }, { status: 500 });
    }

    const prompt = `你是一位专业的平面设计师，擅长为经文卡片设计视觉风格。

根据以下经文内容，设计一个完整的卡片视觉方案。请严格按 JSON 格式返回：

{
  "title": "4-8字的精炼标题，概括经文核心信息",
  "gradient": "CSS linear-gradient，如 linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "layoutMode": "推荐布局模式，从以下选择：${LAYOUT_MODES.join(', ')}",
  "fontFamily": "推荐字体，从以下选择：'Noto Serif SC', serif | 'Noto Sans SC', sans-serif | 'KaiTi', serif",
  "textColor": "文字颜色，如 #ffffff",
  "infoColor": "信息颜色，如 #cccccc",
  "fontSize": 推荐字号（数字，14-36之间），
  "textAlign": "对齐方式：left | center | right",
  "bgSearchQuery": "英文搜索关键词，用于在图库搜索背景图片，如 mountain, ocean, sunset"
}

设计原则：
1. 配色与经文情感匹配（安慰性经文用暖色，威严性经文用深色，喜乐性经文用亮色）
2. 布局与经文长度匹配（短经文用 poster/stamp，长经文用 classic/modern）
3. 标题要精炼有力，能触动人心
4. 背景搜索关键词要具体（如 golden sunset 而非 sky）

经文内容：
${content}

请只返回 JSON，不要其他文字。`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return NextResponse.json({ success: false, error: 'AI API error' }, { status: response.status });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    const cleaned = stripThinkTags(rawContent);

    // 解析 JSON
    let theme: AICardThemeResponse;
    try {
      const jsonStr = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      theme = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Parse AI response failed:', cleaned);
      // 降级：返回默认主题
      theme = {
        title: '恩典之路',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        layoutMode: 'classic',
        fontFamily: "'Noto Serif SC', serif",
        textColor: '#ffffff',
        infoColor: '#cccccc',
        fontSize: 22,
        textAlign: 'center',
        bgSearchQuery: 'nature landscape',
      };
    }

    // 验证和修正
    if (!LAYOUT_MODES.includes(theme.layoutMode)) {
      theme.layoutMode = 'classic';
    }
    if (!['left', 'center', 'right'].includes(theme.textAlign)) {
      theme.textAlign = 'center';
    }
    if (typeof theme.fontSize !== 'number' || theme.fontSize < 14 || theme.fontSize > 36) {
      theme.fontSize = 22;
    }

    return NextResponse.json({ success: true, data: theme });
  } catch (error) {
    console.error('Card theme error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}