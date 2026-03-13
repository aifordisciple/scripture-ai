import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// AI提取地点信息的提示词
const EXTRACT_LOCATION_PROMPT = `你是一个圣经地理专家。从以下经文中提取所有地点信息。

请返回JSON数组格式，每个地点包含：
- nameZh: 中文名称
- nameEn: 英文名称（如果知道）
- context: 在该经文中的意义或事件

只返回JSON数组，不要其他说明文字。

经文：
{verseContent}`;

// 备用方案：直接从数据库匹配地点名称
async function matchLocationsFromDatabase(verseContent: string) {
  // 获取所有地点
  const allLocations = await prisma.bibleLocation.findMany({
    select: {
      id: true,
      nameZh: true,
      nameEn: true,
      aliases: true,
      latitude: true,
      longitude: true,
      region: true,
      description: true,
      significance: true,
    },
  });

  const matchedLocations: any[] = [];

  for (const location of allLocations) {
    // 检查经文中是否包含地点名称或别名
    if (verseContent.includes(location.nameZh)) {
      matchedLocations.push({
        ...location,
        context: `经文中提到了「${location.nameZh}」`,
      });
    } else if (location.aliases.some((alias) => verseContent.includes(alias))) {
      matchedLocations.push({
        ...location,
        context: `经文中提到了「${location.nameZh}」`,
      });
    }
  }

  return matchedLocations;
}

// POST /api/atlas/ai-extract - AI从经文中提取地点信息
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { bookId, chapter, verseStart, verseEnd, verseContent, apiConfig } = data;

    if (!verseContent) {
      return NextResponse.json({ error: 'Missing verse content' }, { status: 400 });
    }

    // 检查是否已有缓存的提取结果
    const existingLocations = await prisma.bibleVerseLocation.findMany({
      where: {
        bookId,
        chapter,
        verse: { gte: verseStart || 1, lte: verseEnd || 200 },
      },
      include: {
        location: true,
      },
    });

    if (existingLocations.length > 0) {
      // 已有缓存，直接返回
      return NextResponse.json({
        locations: existingLocations.map(vl => ({
          ...vl.location,
          mentionType: vl.mentionType,
          verse: vl.verse,
        })),
        cached: true,
      });
    }

    // 调用AI提取地点
    const prompt = EXTRACT_LOCATION_PROMPT.replace('{verseContent}', verseContent);

    // 获取API配置 - 优先使用前端传递的 apiConfig，其次使用环境变量
    const baseUrl = apiConfig?.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const apiKey = apiConfig?.apiKey || process.env.OPENAI_API_KEY;
    const model = apiConfig?.model || process.env.AI_MODEL || 'MiniMax-M2.5';

    // 日志：显示配置来源
    console.log('AI Extract - Config source:', {
      userConfig: apiConfig ? {
        provider: apiConfig.provider,
        baseUrl: apiConfig.baseUrl,
        hasApiKey: !!apiConfig.apiKey,
        model: apiConfig.model,
      } : 'none',
      envConfig: {
        baseUrl: process.env.OPENAI_BASE_URL,
        hasApiKey: !!process.env.OPENAI_API_KEY,
        model: process.env.AI_MODEL,
      },
      actualConfig: {
        baseUrl,
        hasApiKey: !!apiKey,
        model,
      }
    });

    if (!apiKey) {
      console.error('No API key configured');
      return NextResponse.json({ error: 'No API key configured', locations: [] }, { status: 200 });
    }

    console.log(`Calling AI API: ${baseUrl} with model ${model}`);

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
      console.error('AI API error:', response.status, errorData);
      return NextResponse.json({ error: 'AI API error', locations: [] }, { status: 200 });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '[]';

    console.log('AI response:', content.substring(0, 200));

    // 解析AI返回的JSON
    let extractedLocations: any[] = [];
    try {
      // 尝试提取JSON数组
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        extractedLocations = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json({ locations: [], cached: false });
    }

    // 匹配数据库中的地点并创建关联
    const results = [];
    for (const extracted of extractedLocations) {
      // 查找匹配的地点
      let location = await prisma.bibleLocation.findFirst({
        where: {
          OR: [
            { nameZh: extracted.nameZh },
            { nameEn: extracted.nameEn },
            { aliases: { has: extracted.nameZh } },
          ],
        },
      });

      if (location) {
        // 创建经文-地点关联
        try {
          await prisma.bibleVerseLocation.create({
            data: {
              locationId: location.id,
              bookId,
              chapter,
              verse: verseStart || 1,
              mentionType: 'MENTIONED',
            },
          });
        } catch (e) {
          // 忽略重复创建错误
        }

        results.push({
          ...location,
          context: extracted.context,
          verse: verseStart || 1,
        });
      }
    }

    return NextResponse.json({
      locations: results,
      cached: false,
    });
  } catch (error) {
    console.error('Error extracting locations:', error);

    // 备用方案：直接从数据库匹配地点名称
    console.log('Falling back to database matching...');
    try {
      const matchedLocations = await matchLocationsFromDatabase(verseContent);
      console.log(`Database matching found ${matchedLocations.length} locations`);

      // 缓存匹配结果
      for (const location of matchedLocations) {
        try {
          await prisma.bibleVerseLocation.create({
            data: {
              locationId: location.id,
              bookId,
              chapter,
              verse: verseStart || 1,
              mentionType: 'MENTIONED',
            },
          });
        } catch (e) {
          // 忽略重复创建错误
        }
      }

      return NextResponse.json({
        locations: matchedLocations,
        cached: false,
        fallback: true,
      });
    } catch (fallbackError) {
      console.error('Fallback matching also failed:', fallbackError);
      return NextResponse.json({ error: 'Failed to extract locations', locations: [] }, { status: 200 });
    }
  }
}