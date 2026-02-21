// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { embed } from 'ai'; // 注意这里改用 embed，专门用于生成向量
import { createOpenAI } from '@ai-sdk/openai';

// 配置本地 Ollama
const ollama = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  apiKey: 'ollama', 
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const mode = searchParams.get('mode') || 'exact'; 

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    if (mode === 'exact') {
      // --- 精确搜索 (原逻辑保持不变) ---
      const results = await prisma.bibleVerse.findMany({
        where: {
          content: { contains: query },
          version: 'CUV' 
        },
        take: 50,
        orderBy: { id: 'asc' }
      });
      return NextResponse.json({ data: results });

    } else {
      // --- AI 向量语义检索 (RAG 核心) ---
      console.log(`[Search] Vector Searching for: "${query}"`);
      const startTime = Date.now();
      
      // 1. 将用户的查询意图转化为 768 维的向量
      const { embedding } = await embed({
        model: ollama.embedding('nomic-embed-text'),
        value: query,
      });

      // 将数组转换为 pgvector 可识别的字符串格式: "[0.1, 0.2, ...]"
      const vectorString = `[${embedding.join(',')}]`;

      // 2. 向量相似度检索 (Cosine Similarity)
      // 使用 <=> 运算符计算余弦距离，距离越小代表语义越接近
      const results = await prisma.$queryRaw`
        SELECT 
          id, 
          book_id as "bookId", 
          book_name as "bookName", 
          chapter, 
          verse, 
          content, 
          version 
        FROM bible_verses 
        WHERE version = 'CUV'
        ORDER BY embedding <=> ${vectorString}::vector 
        LIMIT 20;
      `;

      const endTime = Date.now();
      console.log(`[Search] 检索完成，找到 ${Array.isArray(results) ? results.length : 0} 条经文，耗时: ${endTime - startTime}ms`);

      return NextResponse.json({ data: results });
    }
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ data: [] });
  }
}