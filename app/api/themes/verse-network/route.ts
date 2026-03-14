import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 书卷ID到中文名的映射
const BOOK_ID_TO_NAME: Record<string, string> = {
  'Gen': '创', 'Exo': '出', 'Lev': '利', 'Num': '民', 'Deu': '申',
  'Jos': '书', 'Jdg': '士', 'Rut': '得', '1Sa': '撒上', '2Sa': '撒下',
  '1Ki': '王上', '2Ki': '王下', '1Ch': '代上', '2Ch': '代下', 'Ezr': '拉',
  'Neh': '尼', 'Est': '斯', 'Job': '伯', 'Psa': '诗', 'Pro': '箴',
  'Ecc': '传', 'Sng': '歌', 'Isa': '赛', 'Jer': '耶', 'Lam': '哀',
  'Ezk': '结', 'Dan': '但', 'Hos': '何', 'Joel': '珥', 'Amo': '摩',
  'Oba': '俄', 'Jon': '拿', 'Mic': '弥', 'Nah': '鸿', 'Hab': '哈',
  'Zep': '番', 'Hag': '该', 'Zec': '亚', 'Mal': '玛',
  'Mat': '太', 'Mar': '可', 'Luk': '路', 'Jhn': '约', 'Act': '徒',
  'Rom': '罗', '1Co': '林前', '2Co': '林后', 'Gal': '加', 'Eph': '弗',
  'Php': '腓', 'Col': '西', '1Th': '帖前', '2Th': '帖后', '1Ti': '提前',
  '2Ti': '提后', 'Tit': '多', 'Phm': '门', 'Heb': '来', 'Jas': '雅',
  '1Pe': '彼前', '2Pe': '彼后', '1Jn': '约一', '2Jn': '约二', '3Jn': '约三',
  'Jud': '犹', 'Rev': '启',
};

// 格式化经文引用 (如 "约3:16")
function formatVerseRef(bookId: string, chapter: number, verseStart: number, verseEnd?: number | null): string {
  const bookName = BOOK_ID_TO_NAME[bookId] || bookId;
  if (verseEnd && verseEnd !== verseStart) {
    return `${bookName}${chapter}:${verseStart}-${verseEnd}`;
  }
  return `${bookName}${chapter}:${verseStart}`;
}

interface VerseNode {
  id: string;
  type: 'VERSE';
  name: string;
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  verseContent?: string;
  isSource?: boolean;
}

interface ThemeNode {
  id: string;
  type: 'THEME';
  name: string;
  category: string;
  verseCount: number;
}

interface Edge {
  source: string;
  target: string;
  type: 'THEME_THEME' | 'THEME_VERSE';
  strength: number;
}

// POST /api/themes/verse-network - 构建包含主题和经文节点的完整网络图
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { bookId, chapter, verseStart, verseEnd, themeIds } = data;

    if (!themeIds || themeIds.length === 0) {
      return NextResponse.json({ nodes: [], edges: [] });
    }

    const nodes: (VerseNode | ThemeNode)[] = [];
    const edges: Edge[] = [];
    const addedVerseIds = new Set<string>();
    const addedThemeIds = new Set<string>();

    // 源经文ID（用于高亮）
    const sourceVerseId = `verse-${bookId}-${chapter}-${verseStart}${verseEnd ? `-${verseEnd}` : ''}`;

    // 1. 获取主题详情并添加主题节点
    const themes = await prisma.bibleTheme.findMany({
      where: { id: { in: themeIds } },
      include: {
        verseLinks: {
          take: 20, // 每个主题最多20个经文
          orderBy: { relevance: 'desc' },
        },
      },
    });

    // 2. 添加源经文节点（高亮显示）
    let sourceVerseContent: string | undefined;
    if (bookId && chapter && verseStart) {
      // 获取源经文内容
      const sourceVerse = await prisma.bibleVerse.findFirst({
        where: {
          bookId,
          chapter,
          verse: verseStart,
        },
        select: { text: true },
      });
      sourceVerseContent = sourceVerse?.text?.substring(0, 50);

      const sourceNode: VerseNode = {
        id: sourceVerseId,
        type: 'VERSE',
        name: formatVerseRef(bookId, chapter, verseStart, verseEnd),
        bookId,
        chapter,
        verseStart,
        verseEnd,
        verseContent: sourceVerseContent,
        isSource: true,
      };
      nodes.push(sourceNode);
      addedVerseIds.add(sourceVerseId);
    }

    // 3. 构建主题节点和经文节点
    for (const theme of themes) {
      // 添加主题节点
      if (!addedThemeIds.has(theme.id)) {
        nodes.push({
          id: theme.id,
          type: 'THEME',
          name: theme.nameZh,
          category: theme.category,
          verseCount: theme.verseCount,
        });
        addedThemeIds.add(theme.id);
      }

      // 为每个主题添加关联的经文节点
      for (const verseLink of theme.verseLinks) {
        const verseId = `verse-${verseLink.bookId}-${verseLink.chapter}-${verseLink.verseStart}${verseLink.verseEnd ? `-${verseLink.verseEnd}` : ''}`;

        // 添加经文节点（如果尚未添加）
        if (!addedVerseIds.has(verseId)) {
          // 获取经文内容摘要
          let verseContent: string | undefined;
          try {
            const verse = await prisma.bibleVerse.findFirst({
              where: {
                bookId: verseLink.bookId,
                chapter: verseLink.chapter,
                verse: verseLink.verseStart,
              },
              select: { text: true },
            });
            verseContent = verse?.text?.substring(0, 50);
          } catch (e) {
            // 忽略错误
          }

          nodes.push({
            id: verseId,
            type: 'VERSE',
            name: formatVerseRef(verseLink.bookId, verseLink.chapter, verseLink.verseStart, verseLink.verseEnd),
            bookId: verseLink.bookId,
            chapter: verseLink.chapter,
            verseStart: verseLink.verseStart,
            verseEnd: verseLink.verseEnd,
            verseContent,
            isSource: verseId === sourceVerseId,
          });
          addedVerseIds.add(verseId);
        }

        // 添加主题-经文边
        edges.push({
          source: theme.id,
          target: verseId,
          type: 'THEME_VERSE',
          strength: verseLink.relevance || 0.5,
        });
      }
    }

    // 4. 获取主题之间的连接关系
    const themeConnections = await prisma.themeConnection.findMany({
      where: {
        OR: [
          { themeId: { in: themeIds } },
          { relatedThemeId: { in: themeIds } },
        ],
      },
    });

    // 添加主题-主题边
    const addedEdges = new Set<string>();
    for (const conn of themeConnections) {
      // 只添加两端主题都在我们列表中的连接
      if (addedThemeIds.has(conn.themeId) && addedThemeIds.has(conn.relatedThemeId)) {
        const edgeKey = [conn.themeId, conn.relatedThemeId].sort().join('-');
        if (!addedEdges.has(edgeKey)) {
          edges.push({
            source: conn.themeId,
            target: conn.relatedThemeId,
            type: 'THEME_THEME',
            strength: conn.strength || 0.5,
          });
          addedEdges.add(edgeKey);
        }
      }
    }

    // 5. 按类型排序节点：主题在前，经文在后
    nodes.sort((a, b) => {
      if (a.type === 'THEME' && b.type === 'VERSE') return -1;
      if (a.type === 'VERSE' && b.type === 'THEME') return 1;
      // 源经文排在经文最前面
      if (a.type === 'VERSE' && b.type === 'VERSE') {
        if ((a as VerseNode).isSource) return -1;
        if ((b as VerseNode).isSource) return 1;
      }
      return 0;
    });

    return NextResponse.json({
      nodes,
      edges,
      sourceVerseId,
    });
  } catch (error) {
    console.error('Error building verse network:', error);
    return NextResponse.json({ error: 'Failed to build verse network' }, { status: 500 });
  }
}