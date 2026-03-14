import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// AI提取主题信息的提示词
const EXTRACT_THEME_PROMPT = `你是一个圣经学者和神学专家。从以下经文中提取主要主题。

请返回JSON数组格式，每个主题包含：
- nameZh: 中文主题名称
- nameEn: 英文主题名称（如果知道）
- relevance: 相关度评分（0.0-1.0）
- context: 在该经文中的体现

只返回JSON数组，不要其他说明文字。最多返回5个最重要的主题。

经文：
{verseContent}`;

// POST /api/themes/ai-extract - AI从经文中提取主题信息
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { bookId, chapter, verseStart, verseEnd, verseContent, apiConfig } = data;

    if (!verseContent) {
      return NextResponse.json({ error: 'Missing verse content' }, { status: 400 });
    }

    // 检查是否已有缓存的提取结果
    const existingLinks = await prisma.themeVerseLink.findMany({
      where: {
        bookId,
        chapter,
        verseStart: { gte: verseStart || 1 },
        source: 'AI',
      },
      include: {
        theme: true,
      },
    });

    if (existingLinks.length > 0) {
      // 已有缓存，直接返回
      return NextResponse.json({
        themes: existingLinks.map(link => ({
          ...link.theme,
          relevance: link.relevance,
          context: link.linkType,
        })),
        cached: true,
      });
    }

    // 调用AI提取主题
    const prompt = EXTRACT_THEME_PROMPT.replace('{verseContent}', verseContent);

    // 获取API配置
    const baseUrl = apiConfig?.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const apiKey = apiConfig?.apiKey || process.env.OPENAI_API_KEY;
    const model = apiConfig?.model || process.env.AI_MODEL || 'gpt-3.5-turbo';

    console.log('Theme AI Extract - Config:', {
      baseUrl,
      hasApiKey: !!apiKey,
      model,
    });

    if (!apiKey) {
      console.error('No API key configured');
      return NextResponse.json({ error: 'No API key configured', themes: [] }, { status: 200 });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI API error:', errorData);
      return NextResponse.json({ error: 'AI API error' }, { status: 500 });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '[]';

    // 解析AI返回的JSON
    let extractedThemes: any[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        extractedThemes = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json({ themes: [], cached: false });
    }

    // 匹配或创建主题，并创建关联
    const results = [];
    for (const extracted of extractedThemes) {
      // 查找匹配的主题
      let theme = await prisma.bibleTheme.findFirst({
        where: {
          OR: [
            { nameZh: extracted.nameZh },
            { nameEn: extracted.nameEn },
            { aliases: { has: extracted.nameZh } },
          ],
        },
      });

      if (!theme) {
        // 创建新主题
        theme = await prisma.bibleTheme.create({
          data: {
            nameZh: extracted.nameZh,
            nameEn: extracted.nameEn || extracted.nameZh,
            category: 'THEOLOGICAL', // 默认分类
            verseCount: 1,
          },
        });
      } else {
        // 更新主题的经文计数
        await prisma.bibleTheme.update({
          where: { id: theme.id },
          data: { verseCount: { increment: 1 } },
        });
      }

      // 创建主题-经文关联
      await prisma.themeVerseLink.create({
        data: {
          themeId: theme.id,
          bookId,
          chapter,
          verseStart: verseStart || 1,
          verseEnd: verseEnd,
          relevance: extracted.relevance || 0.8,
          linkType: 'SECONDARY',
          source: 'AI',
        },
      });

      results.push({
        ...theme,
        relevance: extracted.relevance,
        context: extracted.context,
      });
    }

    return NextResponse.json({
      themes: results,
      cached: false,
    });
  } catch (error) {
    console.error('Error extracting themes:', error);
    return NextResponse.json({ error: 'Failed to extract themes' }, { status: 500 });
  }
}