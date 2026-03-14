'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useBibleStore } from '@/store/useBibleStore';
import { Network, List, Clock, Search, Bookmark, BookmarkCheck, Sparkles, TrendingUp } from 'lucide-react';
import ThemeCard from './ThemeCard';
import ThemeSearch from './ThemeSearch';

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
  } = useBibleStore();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [extractingThemes, setExtractingThemes] = useState(false);
  const [extractedThemes, setExtractedThemes] = useState<any[]>([]);
  const [hotThemes, setHotThemes] = useState<any[]>([]);

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

      try {
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
          // 选中的第一个主题
          setSelectedTheme(data.themes[0]);
          setSelectedThemeId(data.themes[0].id);
        }
      } catch (error) {
        console.error('Failed to extract themes:', error);
      } finally {
        setExtractingThemes(false);
      }
    }

    extractThemes();
  }, [themeGraphVerseContext, apiConfig, setSelectedTheme, setSelectedThemeId]);

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
          <div className="h-full overflow-y-auto p-4">
            <ThemeTimeline selectedThemeId={selectedThemeId} />
          </div>
        )}

        {graphViewMode === 'list' && (
          <div className="h-full overflow-y-auto p-4">
            <ThemeList onSelectTheme={handleThemeSelect} selectedThemeId={selectedThemeId} />
          </div>
        )}
      </div>
    </div>
  );
}

// 主题时间线组件
function ThemeTimeline({ selectedThemeId }: { selectedThemeId?: string | null }) {
  const [verseLinks, setVerseLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedThemeId) {
      setVerseLinks([]);
      return;
    }

    async function fetchVerses() {
      setLoading(true);
      try {
        const res = await fetch(`/api/themes/verses?themeId=${selectedThemeId}`);
        const data = await res.json();
        setVerseLinks(data.verseLinks || []);
      } catch (error) {
        console.error('Failed to fetch theme verses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchVerses();
  }, [selectedThemeId]);

  if (!selectedThemeId) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        请先选择一个主题
      </div>
    );
  }

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400">加载中...</div>;
  }

  // 按书卷分组
  const groupedByBook = verseLinks.reduce((acc, link) => {
    const book = link.bookId;
    if (!acc[book]) acc[book] = [];
    acc[book].push(link);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">主题发展时间线</h3>
      {Object.entries(groupedByBook).map(([bookId, links]) => (
        <div key={bookId} className="border-l-2 border-indigo-500 pl-4">
          <div className="font-medium text-gray-900 dark:text-white">{bookId}</div>
          <div className="mt-2 space-y-2">
            {links.map((link, index) => (
              <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
                第{link.chapter}章:{link.verseStart}
                {link.verseEnd && `-${link.verseEnd}`}
              </div>
            ))}
          </div>
        </div>
      ))}
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

  useEffect(() => {
    async function fetchThemes() {
      try {
        const res = await fetch('/api/themes?limit=50');
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

  if (loading) {
    return <div className="text-gray-500 dark:text-gray-400">加载中...</div>;
  }

  const categories = ['THEOLOGICAL', 'ETHICAL', 'HISTORICAL', 'PROPHETIC'];
  const categoryLabels: Record<string, string> = {
    THEOLOGICAL: '神学主题',
    ETHICAL: '伦理主题',
    HISTORICAL: '历史主题',
    PROPHETIC: '预言主题',
  };

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryThemes = themes.filter(t => t.category === category);
        if (categoryThemes.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
              {categoryLabels[category]}
            </h3>
            <div className="space-y-2">
              {categoryThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onSelectTheme(theme)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    theme.id === selectedThemeId
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{theme.nameZh}</div>
                  {theme.nameEn && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">{theme.nameEn}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {theme.verseCount} 处经文
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}