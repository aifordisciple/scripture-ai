import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/themes/graph - 获取主题网络图数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const themeId = searchParams.get('themeId');
    const depth = parseInt(searchParams.get('depth') || '2');
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];

    if (!themeId) {
      // 返回所有主题的网络图数据
      const themes = await prisma.bibleTheme.findMany({
        where: categories.length > 0 ? { category: { in: categories } } : {},
        take: 100,
        orderBy: { verseCount: 'desc' },
        include: {
          connections: {
            include: {
              relatedTheme: {
                select: { id: true, nameZh: true, category: true, verseCount: true },
              },
            },
          },
        },
      });

      // 构建网络图数据
      const nodes = themes.map(t => ({
        id: t.id,
        name: t.nameZh,
        category: t.category,
        verseCount: t.verseCount,
      }));

      const edges: { source: string; target: string; type: string; strength: number }[] = [];
      const addedEdges = new Set<string>();

      themes.forEach(theme => {
        theme.connections.forEach(conn => {
          const edgeKey = [theme.id, conn.relatedThemeId].sort().join('-');
          if (!addedEdges.has(edgeKey)) {
            edges.push({
              source: theme.id,
              target: conn.relatedThemeId,
              type: conn.connectionType,
              strength: conn.strength,
            });
            addedEdges.add(edgeKey);
          }
        });
      });

      return NextResponse.json({ nodes, edges });
    }

    // 以特定主题为中心构建网络图
    const visitedThemeIds = new Set<string>();
    const nodes: any[] = [];
    const edges: { source: string; target: string; type: string; strength: number }[] = [];

    async function fetchThemeNetwork(id: string, currentDepth: number) {
      if (visitedThemeIds.has(id) || currentDepth > depth) return;
      visitedThemeIds.add(id);

      const theme = await prisma.bibleTheme.findUnique({
        where: { id },
        include: {
          connections: {
            include: {
              relatedTheme: true,
            },
          },
          relatedThemes: {
            include: {
              theme: true,
            },
          },
        },
      });

      if (!theme) return;

      nodes.push({
        id: theme.id,
        name: theme.nameZh,
        category: theme.category,
        verseCount: theme.verseCount,
      });

      // 添加出边
      theme.connections.forEach(conn => {
        const edgeKey = [theme.id, conn.relatedThemeId].sort().join('-');
        edges.push({
          source: theme.id,
          target: conn.relatedThemeId,
          type: conn.connectionType,
          strength: conn.strength,
        });

        if (currentDepth < depth && !visitedThemeIds.has(conn.relatedThemeId)) {
          fetchThemeNetwork(conn.relatedThemeId, currentDepth + 1);
        }
      });

      // 添加入边
      theme.relatedThemes.forEach(rel => {
        const edgeKey = [theme.id, rel.themeId].sort().join('-');
        if (!edges.find(e =>
          (e.source === theme.id && e.target === rel.themeId) ||
          (e.target === theme.id && e.source === rel.themeId)
        )) {
          edges.push({
            source: rel.themeId,
            target: theme.id,
            type: rel.connectionType,
            strength: rel.strength,
          });
        }

        if (currentDepth < depth && !visitedThemeIds.has(rel.themeId)) {
          fetchThemeNetwork(rel.themeId, currentDepth + 1);
        }
      });
    }

    await fetchThemeNetwork(themeId, 1);

    // 过滤节点，只保留在edges中出现的
    const connectedNodeIds = new Set<string>();
    edges.forEach(e => {
      connectedNodeIds.add(e.source);
      connectedNodeIds.add(e.target);
    });

    const filteredNodes = nodes.filter(n => connectedNodeIds.has(n.id));

    return NextResponse.json({ nodes: filteredNodes, edges });
  } catch (error) {
    console.error('Error fetching theme graph:', error);
    return NextResponse.json({ error: 'Failed to fetch theme graph' }, { status: 500 });
  }
}