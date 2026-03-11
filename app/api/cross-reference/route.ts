// app/api/cross-reference/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { embed } from 'ai';
import { getEmbeddingModel, extractApiConfig } from '@/lib/ai-client';
import {
  getCached,
  setCache,
  getCrossRefCacheKey,
  getCrossRefAICacheKey,
  CACHE_TTL,
} from '@/lib/cache';
import { generateConnectionDescriptions, ConnectionType } from '@/lib/cross-reference-ai';

export const maxDuration = 60;

// Types
interface CrossReferenceRequest {
  bookId: string;
  chapter: number;
  verse: number;
  content: string;
  options?: {
    includeTypes?: ConnectionType[];
    limit?: number;
    minStrength?: number;
    enableAI?: boolean;
  };
  apiConfig?: {
    provider?: string;
    model?: string;
    apiKey?: string;
    baseUrl?: string;
  };
}

interface CrossReference {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  content: string;
  type: ConnectionType;
  strength: number;
  description?: string;
  source: 'precomputed' | 'vector';
}

// Chinese book name mapping
const BOOK_ID_TO_NAME: Record<string, string> = {
  Gen: '创世记', Exo: '出埃及记', Lev: '利未记', Num: '民数记', Deu: '申命记',
  Jos: '约书亚记', Jdg: '士师记', Rut: '路得记', '1Sa': '撒母耳记上', '2Sa': '撒母耳记下',
  '1Ki': '列王纪上', '2Ki': '列王纪下', '1Ch': '历代志上', '2Ch': '历代志下',
  Ezr: '以斯拉记', Neh: '尼希米记', Est: '以斯帖记', Job: '约伯记', Psa: '诗篇',
  Pro: '箴言', Ecc: '传道书', Sng: '雅歌', Isa: '以赛亚书', Jer: '耶利米书',
  Lam: '耶利米哀歌', Eze: '以西结书', Dan: '但以理书', Hos: '何西阿书',
  Jol: '约珥书', Amo: '阿摩司书', Oba: '俄巴底亚书', Jon: '约拿书', Mic: '弥迦书',
  Nah: '那鸿书', Hab: '哈巴谷书', Zep: '西番雅书', Hag: '哈该书', Zec: '撒迦利亚书',
  Mal: '玛拉基书', Mat: '马太福音', Mrk: '马可福音', Luk: '路加福音', Jhn: '约翰福音',
  Act: '使徒行传', Rom: '罗马书', '1Co': '哥林多前书', '2Co': '哥林多后书',
  Gal: '加拉太书', Eph: '以弗所书', Php: '腓立比书', Col: '歌罗西书',
  '1Th': '帖撒罗尼迦前书', '2Th': '帖撒罗尼迦后书', '1Ti': '提摩太前书',
  '2Ti': '提摩太后书', Tit: '提多书', Phm: '腓利门书', Heb: '希伯来书',
  Jas: '雅各书', '1Pe': '彼得前书', '2Pe': '彼得后书', '1Jn': '约翰一书',
  '2Jn': '约翰二书', '3Jn': '约翰三书', Jud: '犹大书', Rev: '启示录',
};

export async function POST(req: Request) {
  const { apiConfig, body } = await extractApiConfig(req);
  const {
    bookId,
    chapter,
    verse,
    content,
    options = {},
  } = body as CrossReferenceRequest;

  // Validate required fields
  if (!bookId || chapter === undefined || verse === undefined || !content) {
    return NextResponse.json(
      { error: 'Missing required fields: bookId, chapter, verse, content' },
      { status: 400 }
    );
  }

  const {
    includeTypes,
    limit = 10,
    minStrength = 0.5,
    enableAI = false,
  } = options;

  try {
    const cacheKey = getCrossRefCacheKey(bookId, chapter, verse);

    // 1. Try to get from cache first
    const cached = await getCached<CrossReference[]>(cacheKey);
    let connections: CrossReference[];

    if (cached) {
      connections = cached;
    } else {
      // 2. Query precomputed connections from database
      const precomputedConnections = await prisma.verseConnection.findMany({
        where: {
          sourceBookId: bookId,
          sourceChapter: chapter,
          sourceVerse: verse,
          ...(includeTypes && { type: { in: includeTypes } }),
          strength: { gte: minStrength },
        },
        orderBy: { strength: 'desc' },
        take: limit,
      });

      // 3. If not enough precomputed, use vector search
      if (precomputedConnections.length < limit) {
        const vectorConnections = await vectorSearchCrossRefs(
          bookId,
          chapter,
          verse,
          content,
          limit - precomputedConnections.length,
          minStrength
        );

        // Merge results, avoiding duplicates
        const existingKeys = new Set(
          precomputedConnections.map(
            (c) => `${c.targetBookId}-${c.targetChapter}-${c.targetVerse}`
          )
        );
        const newConnections = vectorConnections.filter(
          (c) => !existingKeys.has(`${c.bookId}-${c.chapter}-${c.verse}`)
        );

        connections = [
          ...precomputedConnections.map((c) => ({
            bookId: c.targetBookId,
            bookName: BOOK_ID_TO_NAME[c.targetBookId] || c.targetBookId,
            chapter: c.targetChapter,
            verse: c.targetVerse,
            content: '', // Will be fetched below
            type: c.type as ConnectionType,
            strength: c.strength,
            description: c.description || undefined,
            source: 'precomputed' as const,
          })),
          ...newConnections,
        ];
      } else {
        connections = precomputedConnections.map((c) => ({
          bookId: c.targetBookId,
          bookName: BOOK_ID_TO_NAME[c.targetBookId] || c.targetBookId,
          chapter: c.targetChapter,
          verse: c.targetVerse,
          content: '', // Will be fetched below
          type: c.type as ConnectionType,
          strength: c.strength,
          description: c.description || undefined,
          source: 'precomputed' as const,
        }));
      }

      // 4. Fetch content for all connections
      if (connections.length > 0) {
        const verses = await prisma.bibleVerse.findMany({
          where: {
            OR: connections.map((c) => ({
              bookId: c.bookId,
              chapter: c.chapter,
              verse: c.verse,
              version: 'CUV',
            })),
          },
        });

        const verseMap = new Map(
          verses.map((v) => [`${v.bookId}-${v.chapter}-${v.verse}`, v.content])
        );

        connections = connections.map((c) => ({
          ...c,
          content: verseMap.get(`${c.bookId}-${c.chapter}-${c.verse}`) || '',
        }));

        // Filter out connections without content
        connections = connections.filter((c) => c.content);
      }

      // 5. Cache the results
      await setCache(cacheKey, connections, CACHE_TTL.crossref);
    }

    // 6. Filter by type if specified
    if (includeTypes && includeTypes.length > 0) {
      connections = connections.filter((c) => includeTypes.includes(c.type));
    }

    // 7. AI description enhancement (optional)
    if (enableAI && connections.length > 0) {
      const aiCacheKey = getCrossRefAICacheKey(bookId, chapter, verse);
      let descriptions = await getCached<Map<string, string>>(aiCacheKey);

      if (!descriptions) {
        descriptions = await generateConnectionDescriptions(
          {
            bookName: BOOK_ID_TO_NAME[bookId] || bookId,
            chapter,
            verse,
            content,
          },
          connections,
          apiConfig
        );
        await setCache(aiCacheKey, descriptions, CACHE_TTL.crossrefAI);
      }

      // Merge AI descriptions
      connections = connections.map((conn) => ({
        ...conn,
        description:
          descriptions?.get(`${conn.bookName} ${conn.chapter}:${conn.verse}`) ||
          conn.description,
      }));
    }

    // 8. Build response
    const response = {
      source: {
        bookId,
        bookName: BOOK_ID_TO_NAME[bookId] || bookId,
        chapter,
        verse,
        content,
      },
      connections: connections.slice(0, limit),
      cached: !!cached,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[CrossRef API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Vector search for cross-references
 */
async function vectorSearchCrossRefs(
  sourceBookId: string,
  sourceChapter: number,
  sourceVerse: number,
  content: string,
  limit: number,
  minStrength: number
): Promise<CrossReference[]> {
  try {
    // Generate embedding for the verse content
    const embeddingModel = getEmbeddingModel('bge-m3');
    const { embedding } = await embed({
      model: embeddingModel,
      value: content,
    });

    const vectorString = `[${embedding.join(',')}]`;
    const minSimilarity = minStrength;

    // Vector search using pgvector
    const results = await prisma.$queryRaw`
      SELECT
        book_id as "bookId",
        book_name as "bookName",
        chapter,
        verse,
        content,
        1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM bible_verses
      WHERE version = 'CUV'
        AND NOT (book_id = ${sourceBookId} AND chapter = ${sourceChapter})
        AND (1 - (embedding <=> ${vectorString}::vector)) >= ${minSimilarity}
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT ${limit * 2}
    ` as Array<{
      bookId: string;
      bookName: string;
      chapter: number;
      verse: number;
      content: string;
      similarity: number;
    }>;

    // Deduplicate by book+chapter to get more variety
    const seen = new Set<string>();
    const dedupedResults: typeof results = [];

    for (const r of results) {
      const key = `${r.bookId}-${r.chapter}`;
      if (!seen.has(key) && dedupedResults.length < limit) {
        seen.add(key);
        dedupedResults.push(r);
      }
    }

    return dedupedResults.map((r) => ({
      bookId: r.bookId,
      bookName: r.bookName,
      chapter: r.chapter,
      verse: r.verse,
      content: r.content,
      type: inferConnectionType(sourceBookId, r.bookId) as ConnectionType,
      strength: r.similarity,
      source: 'vector' as const,
    }));
  } catch (error) {
    console.error('[CrossRef Vector Search] Error:', error);
    return [];
  }
}

/**
 * Infer connection type based on book relationships
 */
function inferConnectionType(
  sourceBookId: string,
  targetBookId: string
): ConnectionType {
  const isOTSource = isOldTestament(sourceBookId);
  const isNTSource = !isOTSource;
  const isOTTarget = isOldTestament(targetBookId);
  const isNTTarget = !isOTTarget;

  // OT quoted in NT -> Quotation
  if (isOTSource && isNTTarget) {
    return 'QUOTATION';
  }

  // NT quoting OT -> Quotation
  if (isNTSource && isOTTarget) {
    return 'QUOTATION';
  }

  // Gospel parallels
  if (
    ['Mat', 'Mrk', 'Luk', 'Jhn'].includes(sourceBookId) &&
    ['Mat', 'Mrk', 'Luk', 'Jhn'].includes(targetBookId) &&
    sourceBookId !== targetBookId
  ) {
    return 'PARALLEL';
  }

  // Samuel/Kings/Chronicles parallels
  if (
    ['1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch'].includes(sourceBookId) &&
    ['1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch'].includes(targetBookId)
  ) {
    return 'PARALLEL';
  }

  // Prophetic books -> Prophecy
  if (
    isOTSource &&
    isNTTarget &&
    ['Isa', 'Jer', 'Eze', 'Dan', 'Hos', 'Jol', 'Amo', 'Oba', 'Jon', 'Mic', 'Nah', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal'].includes(sourceBookId)
  ) {
    return 'PROPHECY';
  }

  // Default to thematic
  return 'THEMATIC';
}

/**
 * Check if a book is in the Old Testament
 */
function isOldTestament(bookId: string): boolean {
  const otBooks = [
    'Gen', 'Exo', 'Lev', 'Num', 'Deu',
    'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch',
    'Ezr', 'Neh', 'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'Sng',
    'Isa', 'Jer', 'Lam', 'Eze', 'Dan',
    'Hos', 'Jol', 'Amo', 'Oba', 'Jon', 'Mic', 'Nah', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal',
  ];
  return otBooks.includes(bookId);
}