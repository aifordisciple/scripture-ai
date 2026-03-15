// app/api/parse-verse/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Bible book names mapping
const BIBLE_BOOKS_MAP: Record<string, string> = {
  '创世记': 'Gen', '创': 'Gen',
  '出埃及记': 'Exod', '出': 'Exod',
  '利未记': 'Lev', '利': 'Lev',
  '民数记': 'Num', '民': 'Num',
  '申命记': 'Deut', '申': 'Deut',
  '约书亚记': 'Josh', '书': 'Josh',
  '士师记': 'Judg', '士': 'Judg',
  '路得记': 'Ruth', '得': 'Ruth',
  '撒母耳记上': '1Sam', '撒上': '1Sam',
  '撒母耳记下': '2Sam', '撒下': '2Sam',
  '列王纪上': '1Kgs', '王上': '1Kgs',
  '列王纪下': '2Kgs', '王下': '2Kgs',
  '历代志上': '1Chr', '代上': '1Chr',
  '历代志下': '2Chr', '代下': '2Chr',
  '以斯拉记': 'Ezra', '拉': 'Ezra',
  '尼希米记': 'Neh', '尼': 'Neh',
  '以斯帖记': 'Esth', '斯': 'Esth',
  '约伯记': 'Job', '伯': 'Job',
  '诗篇': 'Ps', '诗': 'Ps',
  '箴言': 'Prov', '箴': 'Prov',
  '传道书': 'Eccl', '传': 'Eccl',
  '雅歌': 'Song', '歌': 'Song',
  '以赛亚书': 'Isa', '赛': 'Isa',
  '耶利米书': 'Jer', '耶': 'Jer',
  '耶利米哀歌': 'Lam', '哀': 'Lam',
  '以西结书': 'Ezek', '结': 'Ezek',
  '但以理书': 'Dan', '但': 'Dan',
  '何西阿书': 'Hos', '何': 'Hos',
  '约珥书': 'Joel', '珥': 'Joel',
  '阿摩司书': 'Amos', '摩': 'Amos',
  '俄巴底亚书': 'Obad', '俄': 'Obad',
  '约拿书': 'Jonah', '拿': 'Jonah',
  '弥迦书': 'Mic', '弥': 'Mic',
  '那鸿书': 'Nah', '鸿': 'Nah',
  '哈巴谷书': 'Hab', '哈': 'Hab',
  '西番雅书': 'Zeph', '番': 'Zeph',
  '哈该书': 'Hag', '该': 'Hag',
  '撒迦利亚书': 'Zech', '亚': 'Zech',
  '玛拉基书': 'Mal', '玛': 'Mal',
  '马太福音': 'Matt', '太': 'Matt',
  '马可福音': 'Mark', '可': 'Mark',
  '路加福音': 'Luke', '路': 'Luke',
  '约翰福音': 'John', '约': 'John',
  '使徒行传': 'Acts', '徒': 'Acts',
  '罗马书': 'Rom', '罗': 'Rom',
  '哥林多前书': '1Cor', '林前': '1Cor',
  '哥林多后书': '2Cor', '林后': '2Cor',
  '加拉太书': 'Gal', '加': 'Gal',
  '以弗所书': 'Eph', '弗': 'Eph',
  '腓立比书': 'Phil', '腓': 'Phil',
  '歌罗西书': 'Col', '西': 'Col',
  '帖撒罗尼迦前书': '1Thess', '帖前': '1Thess',
  '帖撒罗尼迦后书': '2Thess', '帖后': '2Thess',
  '提摩太前书': '1Tim', '提前': '1Tim',
  '提摩太后书': '2Tim', '提后': '2Tim',
  '提多书': 'Titus', '多': 'Titus',
  '腓利门书': 'Phlm', '门': 'Phlm',
  '希伯来书': 'Heb', '来': 'Heb',
  '雅各书': 'Jas', '雅': 'Jas',
  '彼得前书': '1Pet', '彼前': '1Pet',
  '彼得后书': '2Pet', '彼后': '2Pet',
  '约翰一书': '1John', '约一': '1John',
  '约翰二书': '2John', '约二': '2John',
  '约翰三书': '3John', '约三': '3John',
  '犹大书': 'Jude', '犹': 'Jude',
  '启示录': 'Rev', '启': 'Rev',
};

interface ParseResult {
  bookId: string | null;
  bookName: string | null;
  chapter: number | null;
  verse: number | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
}

export async function POST(request: NextRequest) {
  try {
    const { content, apiConfig } = await request.json();

    if (!content) {
      return NextResponse.json({ error: '缺少内容' }, { status: 400 });
    }

    // 构建AI提示
    const prompt = `你是一个圣经经文引用解析助手。请从以下文本中识别出圣经经文引用。

文本内容：
"""
${content.substring(0, 2000)}
"""

请分析这段文本，找出其中引用的圣经经文。返回JSON格式结果：
{
  "bookId": "书卷ID（如Gen, Matt等）",
  "bookName": "中文书卷名",
  "chapter": 章节数字,
  "verse": 节数字（如果是整章则为0）,
  "confidence": "high/medium/low/none"
}

判断置信度：
- high: 明确的经文引用格式，如"创世记1:1"或"马太福音5章"
- medium: 可以推断但格式不标准
- low: 只有模糊的引用
- none: 完全无法识别

注意：
1. 如果有多处引用，选择最主要/最先提到的
2. 书卷ID需要使用英文缩写
3. 只返回JSON，不要其他内容`;

    // 获取API配置
    const baseUrl = apiConfig?.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const apiKey = apiConfig?.apiKey || process.env.OPENAI_API_KEY;
    const model = apiConfig?.model || process.env.AI_MODEL || 'gpt-3.5-turbo';

    if (!apiKey) {
      // 如果没有API key，返回无法识别
      const result: ParseResult = {
        bookId: null,
        bookName: null,
        chapter: null,
        verse: null,
        confidence: 'none'
      };
      return NextResponse.json(result);
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
          { role: 'system', content: '你是一个专门解析圣经经文引用的助手。只返回JSON格式结果。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return NextResponse.json({
        bookId: null,
        bookName: null,
        chapter: null,
        verse: null,
        confidence: 'none'
      });
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';

    // 解析AI返回的JSON
    try {
      // 尝试提取JSON
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // 验证并转换bookId
        let bookId = parsed.bookId;
        if (parsed.bookName && !bookId) {
          bookId = BIBLE_BOOKS_MAP[parsed.bookName];
        }

        const result: ParseResult = {
          bookId: bookId || null,
          bookName: parsed.bookName || null,
          chapter: typeof parsed.chapter === 'number' ? parsed.chapter : null,
          verse: typeof parsed.verse === 'number' ? parsed.verse : null,
          confidence: parsed.confidence || 'low'
        };

        return NextResponse.json(result);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    // 解析失败
    return NextResponse.json({
      bookId: null,
      bookName: null,
      chapter: null,
      verse: null,
      confidence: 'none'
    });

  } catch (error) {
    console.error('Parse verse error:', error);
    return NextResponse.json({
      bookId: null,
      bookName: null,
      chapter: null,
      verse: null,
      confidence: 'none'
    });
  }
}