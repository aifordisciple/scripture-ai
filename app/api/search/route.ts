// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateObject, embed } from 'ai';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';

export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const mode = searchParams.get('mode') || 'exact'; // 'exact' | 'ai' | 'fuzzy'

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    const provider = process.env.AI_PROVIDER || 'openai';
    const modelName = process.env.OLLAMA_MODEL || 'qwen3.5:9b';
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434/v1';

    // Ollama 实例用于生成向量或本地大模型搜索
    const ollama = createOpenAI({ baseURL: ollamaBaseUrl, apiKey: '' });

    let llmModel;
    if (provider === 'ollama') {
      llmModel = ollama(modelName);
    } else if (provider === 'deepseek') {
       const deepseek = createOpenAI({ baseURL: 'https://api.deepseek.com/v1', apiKey: process.env.DEEPSEEK_API_KEY });
       llmModel = deepseek('deepseek-chat');
    } else {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      llmModel = openai('gpt-4o-mini');
    }

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
      const { object } = await generateObject({
        model: llmModel,
        schema: z.object({
          verses: z.array(z.object({
            bookName: z.string(),
            chapter: z.number(),
            verse: z.number()
          }))
        }),
        prompt: `作为一位精通《圣经》的助手，请根据查询：“${query}”，推荐最贴切的真实经文（15到30节）。必须准确无误地引用真实存在的书卷名、章和节。`
      });

      if (!object.verses || object.verses.length === 0) return NextResponse.json({ data: [] });

      const orConditions = object.verses.map(v => ({
          bookName: v.bookName, chapter: v.chapter, verse: v.verse, version: 'CUV'
      }));

      const results = await prisma.bibleVerse.findMany({ where: { OR: orConditions } });

      const sortedResults = object.verses.map(v => 
         results.find(r => r.bookName === v.bookName && r.chapter === v.chapter && r.verse === v.verse)
      ).filter(Boolean);

      return NextResponse.json({ data: sortedResults });

    } else if (mode === 'fuzzy') {
      // -----------------------------------------
      // 3. 模糊搜索 (基于 BGE-M3 的高精度中文向量检索)
      // -----------------------------------------
      const { embedding } = await embed({
        model: ollama.embedding('bge-m3'), // 使用最新的中文向量模型
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
    
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ data: [] });
  }
}