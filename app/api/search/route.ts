// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateText } from 'ai';
import { getAIModel, extractApiConfig } from '@/lib/ai-client';

export const maxDuration = 60;

const AI_SEARCH_PROMPT_ZH = `你是一位精通《圣经》的属灵导师。根据用户的查询，推荐最贴切的真实经文，并给出有深度的属灵洞见。

【重要】直接返回 JSON 对象，不要有任何思考过程、解释或 Markdown 标记。

JSON 格式：
{
  "summary": "一段温暖、有逻辑、触动人心的属灵总结（150-300字），帮助用户理解这些经文如何回应他的处境",
  "verses": [
    { "bookId": "Gen", "chapter": 1, "verse": 1 },
    { "bookId": "Psa", "chapter": 23, "verse": 1 }
  ]
}

要求：
- summary 要有温度，像一位理解你的牧者在说话
- 推荐 15-30 节最相关的经文
- bookId 必须是标准英文缩写（如：Gen, Exo, Lev, Num, Deu, Jos, Jdg, Rut, 1Sa, 2Sa, 1Ki, 2Ki, 1Ch, 2Ch, Ezr, Neh, Est, Job, Psa, Pro, Ecc, Sng, Isa, Jer, Lam, Eze, Dan, Hos, Jol, Amo, Oba, Jon, Mic, Nah, Hab, Zep, Hag, Zec, Mal, Mat, Mrk, Luk, Jhn, Act, Rom, 1Co, 2Co, Gal, Eph, Php, Col, 1Th, 2Th, 1Ti, 2Ti, Tit, Phm, Heb, Jas, 1Pe, 2Pe, 1Jn, 2Jn, 3Jn, Jud, Rev）
- 章和节必须是真实存在的数字`;

const AI_SEARCH_PROMPT_EN = `You are a wise biblical scholar. Based on the user's query, recommend the most relevant real Bible verses and provide deep spiritual insights.

【IMPORTANT】Return a JSON object directly, without any thinking process, explanation, or Markdown markers.

JSON format:
{
  "summary": "A warm, logical, and touching spiritual summary (150-300 words) helping the user understand how these verses speak to their situation",
  "verses": [
    { "bookId": "Gen", "chapter": 1, "verse": 1 },
    { "bookId": "Psa", "chapter": 23, "verse": 1 }
  ]
}

Requirements:
- summary should be warm, like a caring pastor speaking to you
- Recommend 15-30 most relevant verses
- bookId must be the standard English abbreviation (e.g., Gen, Exo, Lev, Num, Deu, Jos, Jdg, Rut, 1Sa, 2Sa, 1Ki, 2Ki, 1Ch, 2Ch, Ezr, Neh, Est, Job, Psa, Pro, Ecc, Sng, Isa, Jer, Lam, Eze, Dan, Hos, Jol, Amo, Oba, Jon, Mic, Nah, Hab, Zep, Hag, Zec, Mal, Mat, Mrk, Luk, Jhn, Act, Rom, 1Co, 2Co, Gal, Eph, Php, Col, 1Th, 2Th, 1Ti, 2Ti, Tit, Phm, Heb, Jas, 1Pe, 2Pe, 1Jn, 2Jn, 3Jn, Jud, Rev)
- Chapter and verse must be real numbers`;

function cleanAIResponse(text: string): string {
  let jsonString = text;
  jsonString = jsonString.replace(/<think>[\s\S]*?<\/think>/gi, '');
  jsonString = jsonString.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  jsonString = jsonString.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  jsonString = jsonString.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  return jsonString;
}

// Book ID mapping: normalize any AI-returned abbreviation to our database format
// Database stores: Gen, Exo, Lev, Num, Deu, Jos, Jdg, Rut, 1Sa, 2Sa, 1Ki, 2Ki,
//   1Ch, 2Ch, Ezr, Neh, Est, Job, Psa, Pro, Ecc, Sng, Isa, Jer, Lam, Eze, Dan,
//   Hos, Jol, Amo, Oba, Jon, Mic, Nah, Hab, Zep, Hag, Zec, Mal, Mat, Mrk, Luk,
//   Jhn, Act, Rom, 1Co, 2Co, Gal, Eph, Php, Col, 1Th, 2Th, 1Ti, 2Ti, Tit, Phm,
//   Heb, Jas, 1Pe, 2Pe, 1Jn, 2Jn, 3Jn, Jud, Rev
const BOOK_ID_MAP: Record<string, string> = {
  // OT
  'GEN': 'Gen', 'EXO': 'Exo', 'LEV': 'Lev', 'NUM': 'Num', 'DEU': 'Deu',
  'JOS': 'Jos', 'JDG': 'Jdg', 'RUT': 'Rut', 'RUTH': 'Rut',
  '1SA': '1Sa', '2SA': '2Sa', '1KI': '1Ki', '2KI': '2Ki',
  '1CH': '1Ch', '2CH': '2Ch', 'EZR': 'Ezr', 'NEH': 'Neh', 'EST': 'Est',
  'JOB': 'Job', 'PSA': 'Psa', 'PRO': 'Pro', 'ECC': 'Ecc',
  'SNG': 'Sng', 'SGS': 'Sng', 'SOS': 'Sng', 'SONG': 'Sng',
  'ISA': 'Isa', 'JER': 'Jer', 'LAM': 'Lam', 'EZE': 'Eze',
  'DAN': 'Dan', 'HOS': 'Hos', 'JOL': 'Jol', 'JOE': 'Jol', 'JOEL': 'Jol',
  'AMO': 'Amo', 'OBA': 'Oba', 'JON': 'Jon', 'MIC': 'Mic',
  'NAH': 'Nah', 'HAB': 'Hab', 'ZEP': 'Zep', 'HAG': 'Hag', 'ZEC': 'Zec', 'MAL': 'Mal',
  // NT
  'MAT': 'Mat', 'MRK': 'Mrk', 'MAR': 'Mrk', 'MK': 'Mrk',
  'LUK': 'Luk', 'JHN': 'Jhn', 'JOH': 'Jhn', 'JN': 'Jhn',
  'ACT': 'Act', 'ROM': 'Rom',
  '1CO': '1Co', '2CO': '2Co', 'GAL': 'Gal', 'EPH': 'Eph', 'PHP': 'Php', 'PHI': 'Php',
  'COL': 'Col', '1TH': '1Th', '2TH': '2Th', '1TI': '1Ti', '2TI': '2Ti',
  'TIT': 'Tit', 'PHM': 'Phm', 'HEB': 'Heb', 'JAS': 'Jas',
  '1PE': '1Pe', '2PE': '2Pe',
  '1JN': '1Jn', '2JN': '2Jn', '3JN': '3Jn', '1JO': '1Jn', '2JO': '2Jn', '3JO': '3Jn',
  'JUD': 'Jud', 'REV': 'Rev',
};

function normalizeBookId(bookId: string): string {
  const upper = (bookId || '').toUpperCase().trim();
  return BOOK_ID_MAP[upper] || bookId;
}

function buildBookIdConditions(verses: any[], searchVersion: string) {
  return verses
    .map((v: any) => ({
      bookId: normalizeBookId(v.bookId),
      chapter: v.chapter,
      verse: v.verse,
      version: searchVersion,
    }))
    .filter((v: any) => v.bookId);
}

function matchByBookId(verses: any[], results: any[]) {
  return verses
    .map((v: any) =>
      results.find((r: any) => r.bookId === normalizeBookId(v.bookId) && r.chapter === v.chapter && r.verse === v.verse)
    )
    .filter(Boolean);
}

export async function POST(req: Request) {
  const { apiConfig, body } = await extractApiConfig(req);
  const { query, mode = 'exact', locale = 'zh' } = body as { query?: string; mode?: string; locale?: string };
  const searchVersion = locale === 'en' ? 'KJV' : 'CUV';

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    const llmModel = await getAIModel(apiConfig);

    if (mode === 'exact') {
      const results = await prisma.bibleVerse.findMany({
        where: {
          content: { contains: query, mode: 'insensitive' },
          version: searchVersion
        },
        take: 50,
        orderBy: { id: 'asc' }
      });
      return NextResponse.json({ data: results });

    } else if (mode === 'ai') {
      const systemPrompt = locale === 'en' ? AI_SEARCH_PROMPT_EN : AI_SEARCH_PROMPT_ZH;

      const { text } = await generateText({
        model: llmModel,
        system: systemPrompt,
        prompt: locale === 'en' ? `Query: "${query}"` : `查询："${query}"`,
        temperature: 0.7,
        timeout: 60000,
      });

      const jsonString = cleanAIResponse(text);
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return NextResponse.json({ data: [], error: 'AI returned invalid format' });

      let parsed: any;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return NextResponse.json({ data: [], error: 'AI returned malformed JSON' });
      }
      const verses = parsed.verses || [];
      const aiSummary = parsed.summary || '';

      if (!Array.isArray(verses) || verses.length === 0) {
        console.log('[Search] AI returned no verses. Parsed:', JSON.stringify(parsed).slice(0, 500));
        return NextResponse.json({ data: [], aiSummary });
      }

      console.log('[Search] AI returned verses:', verses.slice(0, 5).map((v: any) => `${v.bookId} ${v.chapter}:${v.verse}`).join(', '), `... total ${verses.length}`);

      const orConditions = buildBookIdConditions(verses, searchVersion);
      const results = orConditions.length > 0
        ? await prisma.bibleVerse.findMany({ where: { OR: orConditions } })
        : [];
      const sortedResults = matchByBookId(verses, results);

      console.log('[Search] DB found:', results.length, 'matched:', sortedResults.length);

      return NextResponse.json({ data: sortedResults, aiSummary });

    }

    return NextResponse.json({ data: [] });

  } catch (error) {
    console.error("Search API Error:", error);
    const isTimeout = error instanceof Error && ('code' in error && (error as any).code === 'TIMEOUT_ERROR');
    const msg = isTimeout
      ? (locale === 'en' ? 'AI search timed out, please try again' : 'AI搜索超时，请重试')
      : (locale === 'en' ? 'Search failed, please try again' : '搜索失败，请重试');
    return NextResponse.json({ data: [], error: msg }, { status: 500 });
  }
}

// Keep GET for backwards compatibility
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const mode = searchParams.get('mode') || 'exact';
  const locale = searchParams.get('locale') || 'zh';
  const searchVersion = locale === 'en' ? 'KJV' : 'CUV';

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    const llmModel = await getAIModel();

    if (mode === 'exact') {
      const results = await prisma.bibleVerse.findMany({
        where: {
          content: { contains: query, mode: 'insensitive' },
          version: searchVersion
        },
        take: 50,
        orderBy: { id: 'asc' }
      });
      return NextResponse.json({ data: results });

    } else if (mode === 'ai') {
      const systemPrompt = locale === 'en' ? AI_SEARCH_PROMPT_EN : AI_SEARCH_PROMPT_ZH;

      const { text } = await generateText({
        model: llmModel,
        system: systemPrompt,
        prompt: locale === 'en' ? `Query: "${query}"` : `查询："${query}"`,
        temperature: 0.7,
        timeout: 60000,
      });

      const jsonString = cleanAIResponse(text);
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return NextResponse.json({ data: [], error: 'AI returned invalid format' });

      let parsed: any;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return NextResponse.json({ data: [], error: 'AI returned malformed JSON' });
      }
      const verses = parsed.verses || [];
      const aiSummary = parsed.summary || '';

      if (!Array.isArray(verses) || verses.length === 0) return NextResponse.json({ data: [] });

      const orConditions = buildBookIdConditions(verses, searchVersion);
      const results = orConditions.length > 0
        ? await prisma.bibleVerse.findMany({ where: { OR: orConditions } })
        : [];
      const sortedResults = matchByBookId(verses, results);

      return NextResponse.json({ data: sortedResults, aiSummary });

    }

    return NextResponse.json({ data: [] });

  } catch (error) {
    console.error("Search API Error:", error);
    const isTimeout = error instanceof Error && ('code' in error && (error as any).code === 'TIMEOUT_ERROR');
    const msg = isTimeout
      ? (locale === 'en' ? 'AI search timed out, please try again' : 'AI搜索超时，请重试')
      : (locale === 'en' ? 'Search failed, please try again' : '搜索失败，请重试');
    return NextResponse.json({ data: [], error: msg }, { status: 500 });
  }
}