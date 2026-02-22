// scripts/generate-embeddings.ts
import { PrismaClient } from '@prisma/client';
import { embedMany } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const prisma = new PrismaClient();

// [关键修改] 配置为本地的 Ollama 接口
const ollama = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434/v1',
  apiKey: 'ollama', // 本地运行不需要真实 key
});

async function main() {
  console.log("🚀 开始使用 bge-m3 生成经文向量...");

  // 每次处理 100 节（本地模型处理批量太大可能会爆显存或超时，100是个比较安全的数值）
  const batchSize = 100; 
  
  while (true) {
    // 找出 embedding 字段为空的经文
    const verses = await prisma.$queryRaw<any[]>`
      SELECT id, content, "book_name", chapter, verse 
      FROM bible_verses 
      WHERE embedding IS NULL 
      AND version = 'CUV'
      ORDER BY id ASC 
      LIMIT ${batchSize};
    `;

    if (verses.length === 0) {
      console.log("✅ 所有经文均已完成向量化！");
      break;
    }

    console.log(`⏳ 正在处理本批次 ${verses.length} 节经文... (起始ID: ${verses[0].id})`);

    // 将书卷、章节和经文内容拼接，提高语义匹配准确度
    const textsToEmbed = verses.map(v => 
      `${v.book_name} ${v.chapter}:${v.verse} - ${v.content}`
    );

    try {
      // 调用本地 Ollama 的 bge-m3 模型
      const { embeddings } = await embedMany({
        model: ollama.embedding('bge-m3'),
        values: textsToEmbed,
      });

      // 将生成的 768 维向量存回数据库
      for (let i = 0; i < verses.length; i++) {
        const verseId = verses[i].id;
        const vector = embeddings[i];
        
        await prisma.$executeRawUnsafe(
          `UPDATE bible_verses SET embedding = $1::vector WHERE id = $2`,
          `[${vector.join(',')}]`, 
          verseId
        );
      }

      console.log(`✨ 本批次处理成功！(已完成 ${verses[verses.length - 1].book_name} ${verses[verses.length - 1].chapter}:${verses[verses.length - 1].verse})`);

    } catch (error) {
      console.error("❌ 生成向量时出错:", error);
      break; 
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });