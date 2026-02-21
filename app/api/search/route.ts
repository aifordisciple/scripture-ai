// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// [修复 1] 统一模型配置 (与 Chat 接口保持一致)
// 移除复杂的 getModel 判断，直接读取 .env 中的 OPENAI_BASE_URL
const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1',
  apiKey: process.env.OPENAI_API_KEY || 'ollama',
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
      // --- 精确搜索 (保留原逻辑) ---
      const results = await prisma.bibleVerse.findMany({
        where: {
          content: {
            contains: query, 
          },
          version: 'CUV' 
        },
        take: 50,
        orderBy: { id: 'asc' }
      });
      return NextResponse.json({ data: results });

    } else {
      // --- AI 语义搜索 ---
      console.log(`[Search] AI Searching for: ${query}`);
      
      // [修复 2] 使用统一配置的模型实例
      // 读取 .env 中的模型名，默认为 deepseek-r1:70b 或 qwen2.5
      const modelName = process.env.OPENAI_API_MODEL || 'qwen3.5:cloud';
      const model = openai(modelName);

      // [优化] 减少请求数量到 10-20 条，避免本地模型生成太慢导致超时
      const prompt = `
        你是一个专业的圣经搜索引擎。
        用户输入了查询意图："${query}"。
        
        请分析用户的意图，并在圣经中寻找最相关的经文。
        请列出 10 - 20 处最相关的经文引用。
        
        **非常重要：你必须只返回一个纯 JSON 数组，不要包含任何 Markdown 标记、反引号或解释性文字。**
        
        JSON 格式要求：
        [
          {"bookId": "Gen", "chapter": 1, "verse": 1},
          {"bookId": "Jhn", "chapter": 3, "verse": 16}
        ]
        
        BookId 必须严格使用以下标准缩写：
        Gen, Exo, Lev, Num, Deu, Jos, Jdg, Rut, 1Sa, 2Sa, 1Ki, 2Ki, 1Ch, 2Ch, Ezr, Neh, Est, Job, Psa, Pro, Ecc, Sng, Isa, Jer, Lam, Eze, Dan, Hos, Jol, Amo, Oba, Jon, Mic, Nah, Hab, Zep, Hag, Zec, Mal, Mat, Mrk, Luk, Jhn, Act, Rom, 1Co, 2Co, Gal, Eph, Php, Col, 1Th, 2Th, 1Ti, 2Ti, Tit, Phm, Heb, Jas, 1Pe, 2Pe, 1Jn, 2Jn, 3Jn, Jud, Rev
      `;

      // 使用 generateText
      const { text } = await generateText({
        model: model,
        prompt: prompt,
        temperature: 0.1, // 保持低温度以确保 JSON 格式稳定
      });

      // --- [新增功能] 提取并打印思维链 (DeepSeek R1 等推理模型) ---
      const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkMatch) {
        console.log("\n🧠 [AI Thought Process]:");
        console.log(thinkMatch[1].trim());
        console.log("------------------------\n");
      } else {
        console.log(`[Search] No <think> tags found or using standard model.`);
      }

      // [修改] 清理数据：先去除 <think> 块，再处理 Markdown
      const textWithoutThink = text.replace(/<think>[\s\S]*?<\/think>/g, '');

      let rawReferences = [];
      try {
        // 清理 AI 可能输出的 Markdown 代码块标记
        const cleanJson = textWithoutThink
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        rawReferences = JSON.parse(cleanJson);
      } catch (e) {
        console.error("AI JSON Parse Error.");
        console.error("Raw Output (Cleaned):", textWithoutThink);
        // 如果解析失败，返回空数组，避免前端一直转圈
        return NextResponse.json({ data: [] });
      }

      if (!Array.isArray(rawReferences) || rawReferences.length === 0) {
        return NextResponse.json({ data: [] });
      }

      // --- 经文查找与数据展开 (保留原有的范围处理逻辑) ---
      const conditions: any[] = [];
      
      for (const ref of rawReferences) {
        const chapter = parseInt(ref.chapter);
        if (isNaN(chapter)) continue;

        const verseRaw = String(ref.verse);
        
        if (verseRaw.includes('-')) {
          const [startStr, endStr] = verseRaw.split('-');
          const start = parseInt(startStr);
          const end = parseInt(endStr);
          
          if (!isNaN(start) && !isNaN(end)) {
            const safeEnd = Math.min(end, start + 10); 
            for (let v = start; v <= safeEnd; v++) {
              conditions.push({
                bookId: ref.bookId,
                chapter: chapter,
                verse: v,
                version: 'CUV'
              });
            }
          }
        } else {
          const verse = parseInt(verseRaw);
          if (!isNaN(verse)) {
            conditions.push({
              bookId: ref.bookId,
              chapter: chapter,
              verse: verse,
              version: 'CUV'
            });
          }
        }
      }

      if (conditions.length === 0) {
        return NextResponse.json({ data: [] });
      }

      const dbResults = await prisma.bibleVerse.findMany({
        where: { OR: conditions }
      });

      // 重新排序：严格按照 AI 推荐的顺序
      const sortedResults: any[] = [];
      const addedIds = new Set();

      for (const ref of rawReferences) {
         let targetVerses: number[] = [];
         const vRaw = String(ref.verse);
         if (vRaw.includes('-')) {
            const [s, e] = vRaw.split('-').map(Number);
            if (!isNaN(s) && !isNaN(e)) {
                for (let i = s; i <= Math.min(e, s+10); i++) targetVerses.push(i);
            }
         } else {
            targetVerses.push(parseInt(vRaw));
         }

         const matches = dbResults.filter(r => 
            r.bookId === ref.bookId && 
            r.chapter === parseInt(ref.chapter) && 
            targetVerses.includes(r.verse)
         );

         for (const match of matches) {
            if (!addedIds.has(match.id)) {
                sortedResults.push(match);
                addedIds.add(match.id);
            }
         }
      }

      return NextResponse.json({ data: sortedResults });
    }
  } catch (error) {
    console.error("Search API Error:", error);
    // 返回空结果而不是 500 错误，防止前端报错
    return NextResponse.json({ data: [] });
  }
}