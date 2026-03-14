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

// 辅助函数：创建主题之间的连接（如果两个主题共享>=3个经文）
async function createThemeConnectionsIfNeeded(themeIds: string[]) {
  if (themeIds.length < 2) return;

  try {
    // 获取每个主题的经文列表
    const themesWithVerses = await prisma.bibleTheme.findMany({
      where: { id: { in: themeIds } },
      include: {
        verseLinks: {
          select: { bookId: true, chapter: true, verseStart: true },
        },
      },
    });

    // 对每对主题检查共享经文
    for (let i = 0; i < themesWithVerses.length; i++) {
      for (let j = i + 1; j < themesWithVerses.length; j++) {
        const themeA = themesWithVerses[i];
        const themeB = themesWithVerses[j];

        // 计算共享经文
        const versesA = new Set(
          themeA.verseLinks.map(v => `${v.bookId}-${v.chapter}-${v.verseStart}`)
        );
        const sharedVerses = themeB.verseLinks.filter(
          v => versesA.has(`${v.bookId}-${v.chapter}-${v.verseStart}`)
        );

        // 如果共享>=3个经文，创建连接
        if (sharedVerses.length >= 3) {
          const strength = sharedVerses.length / Math.max(themeA.verseLinks.length, themeB.verseLinks.length, 1);

          // 检查是否已存在连接
          const existingConn = await prisma.themeConnection.findFirst({
            where: {
              OR: [
                { themeId: themeA.id, relatedThemeId: themeB.id },
                { themeId: themeB.id, relatedThemeId: themeA.id },
              ],
            },
          });

          if (!existingConn) {
            await prisma.themeConnection.create({
              data: {
                themeId: themeA.id,
                relatedThemeId: themeB.id,
                connectionType: 'RELATED',
                strength: Math.min(strength, 1.0),
              },
            });
            console.log(`Created theme connection: ${themeA.nameZh} <-> ${themeB.nameZh} (${sharedVerses.length} shared verses)`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error creating theme connections:', error);
  }
}

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
        verseStart: verseStart || 1,
        source: 'AI',
      },
      include: {
        theme: {
          include: {
            verseLinks: {
              take: 10,
              orderBy: { relevance: 'desc' },
              select: {
                bookId: true,
                chapter: true,
                verseStart: true,
                verseEnd: true,
                relevance: true,
              },
            },
          },
        },
      },
    });

    // 过滤符合 verseEnd 范围的结果
    const filteredLinks = existingLinks.filter(link => {
      if (verseEnd && link.verseEnd) {
        return link.verseEnd === verseEnd;
      }
      return true;
    });

    if (filteredLinks.length > 0) {
      // 已有缓存，直接返回并包含相关经文
      const themesWithVerses = filteredLinks.map(link => ({
        ...link.theme,
        relevance: link.relevance,
        context: link.linkType,
        relatedVerses: link.theme.verseLinks.map(v => ({
          bookId: v.bookId,
          chapter: v.chapter,
          verseStart: v.verseStart,
          verseEnd: v.verseEnd,
          relevance: v.relevance,
        })),
      }));

      // 创建主题之间的连接（如果共享>=3个经文）
      await createThemeConnectionsIfNeeded(themesWithVerses.map(t => t.id));

      return NextResponse.json({
        themes: themesWithVerses,
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

    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    try {
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('AI API error:', errorData);
        return NextResponse.json({ error: 'AI API error', themes: [] }, { status: 500 });
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
      const createdThemeIds: string[] = [];

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
          include: {
            verseLinks: {
              take: 10,
              orderBy: { relevance: 'desc' },
              select: {
                bookId: true,
                chapter: true,
                verseStart: true,
                verseEnd: true,
                relevance: true,
              },
            },
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
            include: {
              verseLinks: {
                take: 10,
                orderBy: { relevance: 'desc' },
                select: {
                  bookId: true,
                  chapter: true,
                  verseStart: true,
                  verseEnd: true,
                  relevance: true,
                },
              },
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

        createdThemeIds.push(theme.id);

        results.push({
          ...theme,
          relevance: extracted.relevance,
          context: extracted.context,
          relatedVerses: theme.verseLinks?.map(v => ({
            bookId: v.bookId,
            chapter: v.chapter,
            verseStart: v.verseStart,
            verseEnd: v.verseEnd,
            relevance: v.relevance,
          })) || [],
        });
      }

      // 创建主题之间的连接（如果共享>=3个经文）
      await createThemeConnectionsIfNeeded(createdThemeIds);

      return NextResponse.json({
        themes: results,
        cached: false,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('AI API timeout');
        return NextResponse.json({ error: 'AI API timeout', themes: [] }, { status: 504 });
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error extracting themes:', error);
    return NextResponse.json({ error: 'Failed to extract themes', themes: [] }, { status: 500 });
  }
}