// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateText, embed } from 'ai';
import { getAIModel, getEmbeddingModel, extractApiConfig } from '@/lib/ai-client';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { apiConfig, body } = await extractApiConfig(req);
  const { query, mode = 'exact' } = body as { query?: string; mode?: string };

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    // 使用集中式 AI 客户端
    const llmModel = await getAIModel(apiConfig);

    if (mode === 'exact') {
      // -----------------------------------------
      // 1. 精确搜索 (包含指定词汇)
      // -----------------------------------------
      const results = await prisma.bibleVerse.findMany({
        where: { content: { contains: query }, version: 'CUV' },
        take: 50,
        orderBy: { id: 'asc' }
      });
      return NextResponse.json({ data: results });

    } else if (mode === 'ai') {
      // -----------------------------------------
      // 2. AI 智能推荐 (大模型推理 + 数据库验真)
      // -----------------------------------------
      const { text } = await generateText({
        model: llmModel,
        system: `你是一位精通《圣经》的助手。根据用户的查询，推荐最贴切的真实经文。

【重要】直接返回 JSON 数组，不要有任何思考过程、解释或 Markdown 标记。直接以 [ 开始，以 ] 结束。

JSON 格式：
[
  { "bookName": "创世记", "chapter": 1, "verse": 1 },
  { "bookName": "诗篇", "chapter": 23, "verse": 1 }
]

要求：
- 推荐 15-30 节最相关的经文
- 必须使用中文书卷名（如：创世记、诗篇、马太福音、启示录等）
- 章和节必须是真实存在的数字`,
        prompt: `查询："${query}"`,
        temperature: 0.7,
      });

      // Clean response: remove thinking tags and markdown
      let jsonString = text;
      jsonString = jsonString.replace(/<think>[\s\S]*?<\/think>/gi, '');
      jsonString = jsonString.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
      jsonString = jsonString.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
      jsonString = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      // Try to find JSON array in the response
      const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return NextResponse.json({ data: [] });

      const verses = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(verses) || verses.length === 0) return NextResponse.json({ data: [] });

      const orConditions = verses.map((v: any) => ({
          bookName: v.bookName, chapter: v.chapter, verse: v.verse, version: 'CUV'
      }));

      const results = await prisma.bibleVerse.findMany({ where: { OR: orConditions } });

      const sortedResults = verses.map((v: any) =>
         results.find(r => r.bookName === v.bookName && r.chapter === v.chapter && r.verse === v.verse)
      ).filter(Boolean);

      return NextResponse.json({ data: sortedResults });

    } else if (mode === 'fuzzy') {
      // -----------------------------------------
      // 3. 模糊搜索 (基于 BGE-M3 的高精度中文向量检索)
      // -----------------------------------------
      const embeddingModel = getEmbeddingModel('bge-m3');
      const { embedding } = await embed({
        model: embeddingModel,
        value: query,
      });

      const vectorString = `[${embedding.join(',')}]`;

      const results = await prisma.$queryRaw`
        SELECT id, book_id as "bookId", book_name as "bookName", chapter, verse, content, version
        FROM bible_verses
        WHERE version = 'CUV'
        ORDER BY embedding <=> ${vectorString}::vector
        LIMIT 20;
      `;
      return NextResponse.json({ data: results });
    }

    return NextResponse.json({ data: [] });

  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ data: [] });
  }
}

// Keep GET for backwards compatibility
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const mode = searchParams.get('mode') || 'exact';

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    // 使用集中式 AI 客户端 (环境变量模式)
    const llmModel = await getAIModel();

    if (mode === 'exact') {
      const results = await prisma.bibleVerse.findMany({
        where: { content: { contains: query }, version: 'CUV' },
        take: 50,
        orderBy: { id: 'asc' }
      });
      return NextResponse.json({ data: results });

    } else if (mode === 'ai') {
      const { text } = await generateText({
        model: llmModel,
        system: `你是一位精通《圣经》的助手。根据用户的查询，推荐最贴切的真实经文。

【重要】直接返回 JSON 数组，不要有任何思考过程、解释或 Markdown 标记。直接以 [ 开始，以 ] 结束。

JSON 格式：
[
  { "bookName": "创世记", "chapter": 1, "verse": 1 },
  { "bookName": "诗篇", "chapter": 23, "verse": 1 }
]

要求：
- 推荐 15-30 节最相关的经文
- 必须使用中文书卷名（如：创世记、诗篇、马太福音、启示录等）
- 章和节必须是真实存在的数字`,
        prompt: `查询："${query}"`,
        temperature: 0.7,
      });

      // Clean response
      let jsonString = text;
      jsonString = jsonString.replace(/<tool_call>[\s\S]*?<\/think>/gi, '');
      jsonString = jsonString.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
      jsonString = jsonString.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
      jsonString = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return NextResponse.json({ data: [] });

      const verses = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(verses) || verses.length === 0) return NextResponse.json({ data: [] });

      const orConditions = verses.map((v: any) => ({
          bookName: v.bookName, chapter: v.chapter, verse: v.verse, version: 'CUV'
      }));

      const results = await prisma.bibleVerse.findMany({ where: { OR: orConditions } });

      const sortedResults = verses.map((v: any) =>
         results.find(r => r.bookName === v.bookName && r.chapter === v.chapter && r.verse === v.verse)
      ).filter(Boolean);

      return NextResponse.json({ data: sortedResults });

    } else if (mode === 'fuzzy') {
      const embeddingModel = getEmbeddingModel('bge-m3');
      const { embedding } = await embed({
        model: embeddingModel,
        value: query,
      });

      const vectorString = `[${embedding.join(',')}]`;

      const results = await prisma.$queryRaw`
        SELECT id, book_id as "bookId", book_name as "bookName", chapter, verse, content, version
        FROM bible_verses
        WHERE version = 'CUV'
        ORDER BY embedding <=> ${vectorString}::vector
        LIMIT 20;
      `;
      return NextResponse.json({ data: results });
    }

    return NextResponse.json({ data: [] });

  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ data: [] });
  }
}