import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// 1. 初始化模型配置
function getModel() {
  const provider = process.env.AI_PROVIDER || 'openai';

  if (provider === 'ollama') {
    const ollama = createOpenAI({
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
      apiKey: 'ollama', 
    });
    return ollama(process.env.OLLAMA_MODEL || 'llama3');
  } 
  
  if (provider === 'deepseek') {
    const deepseek = createOpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
    return deepseek('deepseek-chat');
  }

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return openai('gpt-4o-mini');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const mode = searchParams.get('mode') || 'exact'; 

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    if (mode === 'exact') {
      // --- 精确搜索 ---
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
      
      const model = getModel();

      const prompt = `
        你是一个专业的圣经搜索引擎。
        用户输入了查询意图："${query}"。
        
        请分析用户的意图，并在圣经中寻找最相关的经文。
        请列出 5 到 10 处最相关的经文引用。
        
        **非常重要：你必须只返回一个纯 JSON 数组，不要包含任何 Markdown 标记、反引号或解释性文字。**
        
        JSON 格式要求：
        [
          {"bookId": "Gen", "chapter": 1, "verse": 1},
          {"bookId": "Jhn", "chapter": 3, "verse": 16}
        ]
        
        BookId 必须严格使用以下标准缩写：
        Gen, Exo, Lev, Num, Deu, Jos, Jdg, Rut, 1Sa, 2Sa, 1Ki, 2Ki, 1Ch, 2Ch, Ezr, Neh, Est, Job, Psa, Pro, Ecc, Sng, Isa, Jer, Lam, Eze, Dan, Hos, Jol, Amo, Oba, Jon, Mic, Nah, Hab, Zep, Hag, Zec, Mal, Mat, Mrk, Luk, Jhn, Act, Rom, 1Co, 2Co, Gal, Eph, Php, Col, 1Th, 2Th, 1Ti, 2Ti, Tit, Phm, Heb, Jas, 1Pe, 2Pe, 1Jn, 2Jn, 3Jn, Jud, Rev
      `;

      const { text } = await generateText({
        model: model,
        prompt: prompt,
        temperature: 0.1, 
      });

      let rawReferences = [];
      try {
        const cleanJson = text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        rawReferences = JSON.parse(cleanJson);
      } catch (e) {
        console.error("AI JSON Parse Error. Raw Output:", text);
        return NextResponse.json({ data: [] });
      }

      if (!Array.isArray(rawReferences) || rawReferences.length === 0) {
        return NextResponse.json({ data: [] });
      }

      // --- 关键修复：数据清洗与展开 ---
      // 将 "6-7" 这样的字符串范围拆解为多个单一查询条件
      const conditions: any[] = [];
      
      for (const ref of rawReferences) {
        // 确保 chapter 是整数
        const chapter = parseInt(ref.chapter);
        if (isNaN(chapter)) continue;

        // 处理 verse
        const verseRaw = String(ref.verse); // 强制转字符串处理
        
        if (verseRaw.includes('-')) {
          // 处理范围: "6-7" -> 6, 7
          const [startStr, endStr] = verseRaw.split('-');
          const start = parseInt(startStr);
          const end = parseInt(endStr);
          
          if (!isNaN(start) && !isNaN(end)) {
            // 限制范围防止死循环，最多取10节
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
          // 处理单节: 6 -> 6
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

      // 5. 查询数据库
      const dbResults = await prisma.bibleVerse.findMany({
        where: { OR: conditions }
      });

      // 6. 重新排序：按照 AI 推荐的顺序（rawReferences）来排列
      // 因为我们拆解了范围，所以这里做一个简单的映射：如果 AI 推荐了 Range，只要找到了其中任何一节，都算匹配
      const sortedResults: any[] = [];
      const addedIds = new Set(); // 防止重复

      // 遍历 AI 原始推荐
      for (const ref of rawReferences) {
         // 在数据库结果中找匹配该推荐的所有经文
         // (简单的做法是直接按顺序 push dbResults，但这会打乱 AI 的优先级)
         // 这里我们尽量保持 AI 的顺序
         
         // 重新解析一遍范围来做匹配
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
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}