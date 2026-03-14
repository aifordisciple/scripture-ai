'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useBibleStore } from '@/store/useBibleStore';
import { Network, List, Clock, Search, Bookmark, BookmarkCheck, Sparkles, TrendingUp, ArrowUpDown, BookOpen } from 'lucide-react';
import ThemeCard from './ThemeCard';
import ThemeSearch from './ThemeSearch';
import ThemeTimeline from './ThemeTimeline';

// 动态导入网络图组件（不支持SSR）
const NetworkGraph = dynamic(() => import('./NetworkGraph'), {
  ssr: false,
  loading: () => <GraphSkeleton />,
});

// 骨架屏组件
function GraphSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
      <div className="relative">
        {/* 模拟网络图的节点骨架 */}
        <div className="flex gap-8">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-16 w-16"></div>
            <div className="bg-gray-300 dark:bg-gray-600 h-3 w-12 rounded"></div>
          </div>
          <div className="animate-pulse flex flex-col items-center gap-2" style={{ marginTop: '20px' }}>
            <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-12 w-12"></div>
            <div className="bg-gray-300 dark:bg-gray-600 h-3 w-10 rounded"></div>
          </div>
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-14 w-14"></div>
            <div className="bg-gray-300 dark:bg-gray-600 h-3 w-11 rounded"></div>
          </div>
        </div>
        {/* 模拟连接线 */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200 dark:bg-gray-700" style={{ zIndex: -1 }}></div>
      </div>
      <p className="mt-6 text-gray-400 dark:text-gray-500 text-sm">加载主题网络中...</p>
    </div>
  );
}

// AI提取动画组件
function ExtractingAnimation() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
      <div className="relative">
        <Sparkles className="w-12 h-12 text-indigo-500 animate-pulse" />
        <div className="absolute inset-0 animate-ping">
          <Sparkles className="w-12 h-12 text-indigo-300" />
        </div>
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">正在分析经文...</p>
      <p className="mt-1 text-gray-400 dark:text-gray-500 text-sm">AI正在提取相关主题</p>
    </div>
  );
}

// 空状态组件 - 热门主题推荐
function EmptyState({ hotThemes, onThemeSelect }: {
  hotThemes: any[];
  onThemeSelect: (theme: any) => void;
}) {
  const categoryColors: Record<string, string> = {
    THEOLOGICAL: 'indigo',
    ETHICAL: 'emerald',
    HISTORICAL: 'amber',
    PROPHETIC: 'red',
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Network className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          探索主题网络
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          搜索主题或选择经文，发现圣经概念之间的关联
        </p>

        {/* 热门主题推荐 */}
        <div className="mb-4">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <TrendingUp className="w-4 h-4" />
            热门主题
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {hotThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onThemeSelect(theme)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                  categoryColors[theme.category] === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50' :
                  categoryColors[theme.category] === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50' :
                  categoryColors[theme.category] === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50' :
                  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                }`}
              >
                {theme.nameZh}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ThemeGraphPanelProps {
  onClose?: () => void;
  initialThemeId?: string;
}

export default function ThemeGraphPanel({ onClose, initialThemeId }: ThemeGraphPanelProps) {
  const {
    isDarkMode,
    graphViewMode,
    setGraphViewMode,
    selectedThemeId,
    setSelectedThemeId,
    selectedTheme,
    setSelectedTheme,
    graphData,
    setGraphData,
    savedThemes,
    addSavedTheme,
    removeSavedTheme,
    isThemeGraphPanelOpen,
    setThemeGraphPanelOpen,
    graphDepth,
    setGraphDepth,
    // 从 store 读取经文上下文
    themeGraphVerseContext,
    apiConfig,
    // 阅读器导航相关
    tabs,
    activeTabId,
    setActiveTab,
    addTab,
    updateActiveTab,
    scrollToVerse,
    setScrollToVerse,
  } = useBibleStore();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [extractingThemes, setExtractingThemes] = useState(false);
  const [extractedThemes, setExtractedThemes] = useState<any[]>([]);
  const [hotThemes, setHotThemes] = useState<any[]>([]);
  const [sourceVerse, setSourceVerse] = useState<{
    bookId: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
  } | null>(null);

  // 加载热门主题
  useEffect(() => {
    async function loadHotThemes() {
      try {
        const res = await fetch('/api/themes?limit=8&sortBy=verseCount');
        const data = await res.json();
        setHotThemes(data.themes || []);
      } catch (error) {
        console.error('Failed to load hot themes:', error);
      }
    }
    loadHotThemes();
  }, []);

  // 加载网络图数据
  const loadGraphData = useCallback(async (themeId?: string) => {
    setLoading(true);
    try {
      const url = themeId
        ? `/api/themes/graph?themeId=${themeId}&depth=${graphDepth}`
        : `/api/themes/graph`;
      const res = await fetch(url);
      const data = await res.json();
      setGraphData({
        nodes: data.nodes || [],
        edges: data.edges || [],
      });
    } catch (error) {
      console.error('Failed to load graph data:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [graphDepth, setGraphData]);

  // 初始化
  useEffect(() => {
    if (initialThemeId) {
      setSelectedThemeId(initialThemeId);
      loadGraphData(initialThemeId);
    } else {
      // 不自动加载全部图，等用户选择
      setInitialLoading(false);
    }
  }, [initialThemeId]);

  // 当有经文上下文时，提取主题
  useEffect(() => {
    if (!themeGraphVerseContext) return;

    async function extractThemes() {
      setExtractingThemes(true);
      console.log('ThemeGraphPanel - extracting themes from verse context:', themeGraphVerseContext);

      // 保存源经文信息
      setSourceVerse({
        bookId: themeGraphVerseContext.bookId,
        chapter: themeGraphVerseContext.chapter,
        verseStart: themeGraphVerseContext.verseStart,
        verseEnd: themeGraphVerseContext.verseEnd,
      });

      try {
        // 第一步：调用AI提取API
        const res = await fetch('/api/themes/ai-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId: themeGraphVerseContext.bookId,
            chapter: themeGraphVerseContext.chapter,
            verseStart: themeGraphVerseContext.verseStart,
            verseEnd: themeGraphVerseContext.verseEnd,
            verseContent: themeGraphVerseContext.verseContent,
            apiConfig,
          }),
        });

        const data = await res.json();
        console.log('ThemeGraphPanel - extracted themes:', data);

        if (data.themes && data.themes.length > 0) {
          setExtractedThemes(data.themes);
          setSelectedTheme(data.themes[0]);
          setSelectedThemeId(data.themes[0].id);

          // 第二步：调用verse-network API构建完整网络图
          try {
            const networkRes = await fetch('/api/themes/verse-network', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookId: themeGraphVerseContext.bookId,
                chapter: themeGraphVerseContext.chapter,
                verseStart: themeGraphVerseContext.verseStart,
                verseEnd: themeGraphVerseContext.verseEnd,
                themeIds: data.themes.map((t: any) => t.id),
              }),
            });

            const networkData = await networkRes.json();
            console.log('ThemeGraphPanel - verse network:', networkData);

            if (networkData.nodes && networkData.nodes.length > 0) {
              setGraphData({
                nodes: networkData.nodes,
                edges: networkData.edges,
              });
            }
          } catch (networkError) {
            console.error('Failed to load verse network:', networkError);
            // 回退到只显示主题节点
            loadGraphData(data.themes[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to extract themes:', error);
      } finally {
        setExtractingThemes(false);
      }
    }

    extractThemes();
  }, [themeGraphVerseContext, apiConfig, setSelectedTheme, setSelectedThemeId, setGraphData, loadGraphData]);

  // 当选中主题变化时，重新加载图数据
  useEffect(() => {
    if (selectedThemeId) {
      loadGraphData(selectedThemeId);
    }
  }, [selectedThemeId, graphDepth]);

  const handleThemeSelect = useCallback((theme: any) => {
    setSelectedTheme(theme);
    setSelectedThemeId(theme.id);
  }, [setSelectedTheme, setSelectedThemeId]);

  const toggleSaveTheme = useCallback((themeId: string) => {
    if (savedThemes.includes(themeId)) {
      removeSavedTheme(themeId);
    } else {
      addSavedTheme(themeId);
    }
  }, [savedThemes, addSavedTheme, removeSavedTheme]);

  // 处理经文节点点击 - 跳转到阅读器
  const handleVerseNodeClick = useCallback((node: any) => {
    console.log('Verse node clicked:', node);

    // 书卷ID转换（从简写到中文名）
    const bookIdToName: Record<string, string> = {
      'Gen': '创世记', 'Exo': '出埃及记', 'Lev': '利未记', 'Num': '民数记', 'Deu': '申命记',
      'Jos': '约书亚记', 'Jdg': '士师记', 'Rut': '路得记', '1Sa': '撒母耳记上', '2Sa': '撒母耳记下',
      '1Ki': '列王纪上', '2Ki': '列王纪下', '1Ch': '历代志上', '2Ch': '历代志下', 'Ezr': '以斯拉记',
      'Neh': '尼希米记', 'Est': '以斯帖记', 'Job': '约伯记', 'Psa': '诗篇', 'Pro': '箴言',
      'Ecc': '传道书', 'Sng': '雅歌', 'Isa': '以赛亚书', 'Jer': '耶利米书', 'Lam': '耶利米哀歌',
      'Ezk': '以西结书', 'Dan': '但以理书', 'Hos': '何西阿书', 'Joel': '约珥书', 'Amo': '阿摩司书',
      'Oba': '俄巴底亚书', 'Jon': '约拿书', 'Mic': '弥迦书', 'Nah': '那鸿书', 'Hab': '哈巴谷书',
      'Zep': '西番雅书', 'Hag': '哈该书', 'Zec': '撒迦利亚书', 'Mal': '玛拉基书',
      'Mat': '马太福音', 'Mar': '马可福音', 'Luk': '路加福音', 'Jhn': '约翰福音', 'Act': '使徒行传',
      'Rom': '罗马书', '1Co': '哥林多前书', '2Co': '哥林多后书', 'Gal': '加拉太书', 'Eph': '以弗所书',
      'Php': '腓立比书', 'Col': '歌罗西书', '1Th': '帖撒罗尼迦前书', '2Th': '帖撒罗尼迦后书',
      '1Ti': '提摩太前书', '2Ti': '提摩太后书', 'Tit': '提多书', 'Phm': '腓利门书', 'Heb': '希伯来书',
      'Jas': '雅各书', '1Pe': '彼得前书', '2Pe': '彼得后书', '1Jn': '约翰一书', '2Jn': '约翰二书',
      '3Jn': '约翰三书', 'Jud': '犹大书', 'Rev': '启示录',
    };

    const bookName = bookIdToName[node.bookId] || node.bookId;

    // 查找或创建阅读标签页
    const existingReadTab = tabs.find(t => t.type === 'read');
    if (existingReadTab) {
      setActiveTab(existingReadTab.id);
      updateActiveTab({
        book: bookName,
        chapter: node.chapter.toString(),
      });
    } else {
      addTab({
        type: 'read',
        book: bookName,
        chapter: node.chapter.toString(),
      });
    }

    // 设置滚动到指定经文
    setScrollToVerse(node.verseStart);
  }, [tabs, setActiveTab, addTab, updateActiveTab, setScrollToVerse]);

  const viewModes = [
    { id: 'network', label: '网络图', icon: Network },
    { id: 'timeline', label: '时间线', icon: Clock },
    { id: 'list', label: '列表', icon: List },
  ] as const;

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${isDarkMode ? 'dark' : ''}`}>
      {/* 搜索栏 */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <ThemeSearch onSelectTheme={handleThemeSelect} />
      </div>

      {/* 深度控制 */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-500 dark:text-gray-400">展开深度：</span>
        {[1, 2, 3].map((depth) => (
          <button
            key={depth}
            onClick={() => setGraphDepth(depth)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              graphDepth === depth
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {depth}层
          </button>
        ))}
      </div>

      {/* Tab 切换 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {viewModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setGraphViewMode(mode.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              graphViewMode === mode.id
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <mode.icon className="w-4 h-4" />
            {mode.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {graphViewMode === 'network' && (
          <div className="h-full relative">
            {/* AI提取动画 */}
            {extractingThemes && <ExtractingAnimation />}

            {/* 加载骨架屏 */}
            {loading && !extractingThemes && <GraphSkeleton />}

            {/* 空状态 - 热门主题推荐 */}
            {!loading && !extractingThemes && graphData.nodes.length === 0 && (
              <EmptyState hotThemes={hotThemes} onThemeSelect={handleThemeSelect} />
            )}

            {/* 网络图 */}
            {!loading && !extractingThemes && graphData.nodes.length > 0 && (
              <NetworkGraph
                data={graphData}
                selectedNodeId={selectedThemeId}
                onNodeClick={(node) => {
                  handleThemeSelect(node);
                }}
                onVerseNodeClick={handleVerseNodeClick}
              />
            )}

            {/* 主题详情卡片 */}
            {selectedTheme && !extractingThemes && (
              <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80">
                <ThemeCard
                  theme={selectedTheme}
                  onClose={() => {
                    setSelectedTheme(null);
                    setSelectedThemeId(null);
                  }}
                  isSaved={savedThemes.includes(selectedTheme.id)}
                  onToggleSave={() => toggleSaveTheme(selectedTheme.id)}
                />
              </div>
            )}
          </div>
        )}

        {graphViewMode === 'timeline' && (
          <ThemeTimeline selectedThemeId={selectedThemeId} />
        )}

        {graphViewMode === 'list' && (
          <ThemeList onSelectTheme={handleThemeSelect} selectedThemeId={selectedThemeId} />
        )}
      </div>
    </div>
  );
}

// 主题列表组件
function ThemeList({ onSelectTheme, selectedThemeId }: {
  onSelectTheme: (theme: any) => void;
  selectedThemeId?: string | null;
}) {
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'verseCount' | 'connectionCount' | 'nameZh'>('verseCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchThemes() {
      try {
        const res = await fetch('/api/themes?limit=100');
        const data = await res.json();
        setThemes(data.themes || []);
      } catch (error) {
        console.error('Failed to fetch themes:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchThemes();
  }, []);

  const categories = ['THEOLOGICAL', 'ETHICAL', 'HISTORICAL', 'PROPHETIC'];
  const categoryLabels: Record<string, string> = {
    THEOLOGICAL: '神学主题',
    ETHICAL: '伦理主题',
    HISTORICAL: '历史主题',
    PROPHETIC: '预言主题',
  };

  const categoryColors: Record<string, string> = {
    THEOLOGICAL: 'indigo',
    ETHICAL: 'emerald',
    HISTORICAL: 'amber',
    PROPHETIC: 'red',
  };

  // 筛选和排序
  const filteredThemes = themes
    .filter(t => !selectedCategory || t.category === selectedCategory)
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nameZh') {
        comparison = a.nameZh.localeCompare(b.nameZh, 'zh');
      } else {
        comparison = (a[sortBy] || 0) - (b[sortBy] || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-2 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-2 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <p className="text-sm text-gray-400">加载主题列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 筛选和排序控制 */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 flex-wrap">
        {/* 分类筛选 */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">分类：</span>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              !selectedCategory
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === cat
                  ? `bg-${categoryColors[cat]}-100 dark:bg-${categoryColors[cat]}-900/30 text-${categoryColors[cat]}-700 dark:text-${categoryColors[cat]}-300`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* 排序控制 */}
        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="w-3 h-3 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-transparent text-gray-600 dark:text-gray-400 border-none focus:ring-0"
          >
            <option value="verseCount">经文数</option>
            <option value="connectionCount">关联数</option>
            <option value="nameZh">名称</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* 主题列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(theme)}
              className={`p-3 rounded-lg text-left transition-all hover:shadow-md ${
                theme.id === selectedThemeId
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-400 dark:border-indigo-600'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{theme.nameZh}</div>
                  {theme.nameEn && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{theme.nameEn}</div>
                  )}
                </div>
                <div className={`px-1.5 py-0.5 text-xs rounded ${
                  categoryColors[theme.category] === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300' :
                  categoryColors[theme.category] === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300' :
                  categoryColors[theme.category] === 'amber' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300' :
                  'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300'
                }`}>
                  {theme.verseCount}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <span>{categoryLabels[theme.category]}</span>
                {theme.connectionCount > 0 && (
                  <>
                    <span>·</span>
                    <span>{theme.connectionCount} 关联</span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>

        {filteredThemes.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            没有找到匹配的主题
          </div>
        )}
      </div>
    </div>
  );
}