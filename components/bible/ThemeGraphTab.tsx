// components/bible/ThemeGraphTab.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { BIBLE_BOOKS } from "@/lib/constants";
import {
  Network,
  Search,
  X,
  ChevronRight,
  BookOpen,
  Filter,
  Loader2,
  Info,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface Theme {
  id: string;
  nameZh: string;
  nameEn?: string;
  category: string;
  summary?: string;
  description?: string;
  verseCount: number;
  connectionCount?: number;
  keyVerses?: string[];
}

interface ThemeConnection {
  id: string;
  themeId: string;
  relatedThemeId: string;
  connectionType: string;
  strength: number;
}

const CATEGORY_CONFIG: Record<string, { labelKey: string; color: string; bgColor: string }> = {
  THEOLOGICAL: { labelKey: "bible.categoryTheological", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  ETHICAL: { labelKey: "bible.categoryEthical", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  HISTORICAL: { labelKey: "bible.categoryHistorical", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  PROPHETIC: { labelKey: "bible.categoryProphetic", color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
};

const CONNECTION_TYPE_CONFIG: Record<string, { labelKey: string; color: string }> = {
  PARENT: { labelKey: "bible.connParent", color: "text-blue-500" },
  CHILD: { labelKey: "bible.connChild", color: "text-green-500" },
  RELATED: { labelKey: "bible.connRelated", color: "text-amber-500" },
  CONTRAST: { labelKey: "bible.connContrast", color: "text-red-500" },
  FULFILLS: { labelKey: "bible.connFulfills", color: "text-purple-500" },
};

export function ThemeGraphTab() {
  const router = useRouter();
  const { tabs, addTab, setActiveTab } = useBibleStore();
  const { t } = useTranslation();

  const [themes, setThemes] = useState<Theme[]>([]);
  const [connections, setConnections] = useState<ThemeConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  // 加载主题数据
  useEffect(() => {
    async function loadThemes() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/theme");
        if (res.ok) {
          const data = await res.json();
          setThemes(data.themes || []);
          setConnections(data.connections || []);
        }
      } catch (err) {
        console.error("Failed to load themes", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadThemes();
  }, []);

  // 搜索过滤
  const filteredThemes = useMemo(() => {
    let result = themes;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.nameZh.toLowerCase().includes(query) ||
          t.nameEn?.toLowerCase().includes(query) ||
          t.summary?.toLowerCase().includes(query)
      );
    }
    if (selectedCategory) {
      result = result.filter((t) => t.category === selectedCategory);
    }
    return result;
  }, [themes, searchQuery, selectedCategory]);

  // 按分类分组
  const groupedThemes = useMemo(() => {
    const groups: Record<string, Theme[]> = {};
    filteredThemes.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredThemes]);

  // 获取主题的连接
  const getThemeConnections = useCallback(
    (themeId: string) => {
      return connections.filter(
        (c) => c.themeId === themeId || c.relatedThemeId === themeId
      );
    },
    [connections]
  );

  // 获取连接的主题
  const getConnectedTheme = useCallback(
    (connection: ThemeConnection, currentThemeId: string) => {
      const connectedId =
        connection.themeId === currentThemeId
          ? connection.relatedThemeId
          : connection.themeId;
      return themes.find((t) => t.id === connectedId);
    },
    [themes]
  );

  // 跳转到经文
  const handleVerseClick = (verseRef: string) => {
    // 解析经文引用 (如 "Gen 1:1")
    const match = verseRef.match(/^(\w+)\s+(\d+):(\d+)$/);
    if (match) {
      const [, bookId, chapter] = match;
      const readTab = tabs.find((t) => t.type === "read");
      if (readTab) {
        useBibleStore.setState((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === readTab.id
              ? { ...t, book: bookId, chapter: chapter }
              : t
          ),
        }));
        setActiveTab(readTab.id);
      } else {
        addTab({ type: "read", book: bookId, chapter: chapter });
      }
      router.push(`/?book=${bookId}&chapter=${chapter}`);
    }
  };

  // 渲染主题卡片
  const renderThemeCard = (theme: Theme) => {
    const config = CATEGORY_CONFIG[theme.category] || CATEGORY_CONFIG.THEOLOGICAL;
    const themeConnections = getThemeConnections(theme.id);

    return (
      <div
        key={theme.id}
        onClick={() => setSelectedTheme(selectedTheme?.id === theme.id ? null : theme)}
        className={cn(
          "group relative p-4 rounded-xl cursor-pointer border shadow-sm hover:shadow-md transition-all duration-300",
          "bg-white dark:bg-slate-900 dark:border-slate-800",
          selectedTheme?.id === theme.id && "ring-2 ring-primary/50"
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-2 py-0.5 text-xs rounded-full font-medium",
                config.bgColor,
                config.color
              )}
            >
              {t(config.labelKey)}
            </span>
            {theme.connectionCount && theme.connectionCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Link2 className="w-3 h-3" />
                {theme.connectionCount}
              </span>
            )}
          </div>
          <ChevronRight
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              selectedTheme?.id === theme.id && "rotate-90"
            )}
          />
        </div>

        <h3 className="font-bold text-foreground mb-1">{theme.nameZh}</h3>
        {theme.nameEn && (
          <p className="text-xs text-muted-foreground mb-2">{theme.nameEn}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {t('bible.versesUnit', { count: theme.verseCount })}
          </span>
        </div>

        {/* 展开的详情 */}
        {selectedTheme?.id === theme.id && (
          <div className="mt-4 pt-4 border-t dark:border-slate-800 space-y-3">
            {theme.summary && (
              <p className="text-sm text-foreground/80">{theme.summary}</p>
            )}

            {/* 关联主题 */}
            {themeConnections.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('bible.relatedThemes')}</p>
                <div className="flex flex-wrap gap-2">
                  {themeConnections.slice(0, 5).map((conn) => {
                    const connectedTheme = getConnectedTheme(conn, theme.id);
                    if (!connectedTheme) return null;
                    const connConfig = CONNECTION_TYPE_CONFIG[conn.connectionType] || CONNECTION_TYPE_CONFIG.RELATED;
                    return (
                      <span
                        key={conn.id}
                        className={cn(
                          "px-2 py-1 text-xs rounded-full border",
                          "bg-slate-50 dark:bg-slate-800",
                          connConfig.color
                        )}
                      >
                        {connectedTheme.nameZh}
                        <span className="text-muted-foreground ml-1">({t(connConfig.labelKey)})</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 关键经文 */}
            {theme.keyVerses && theme.keyVerses.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('bible.keyVerses')}</p>
                <div className="flex flex-wrap gap-1">
                  {theme.keyVerses.slice(0, 5).map((verse, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerseClick(verse);
                      }}
                      className="px-2 py-1 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      {verse}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-4">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-slate-800">
        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Network className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('bible.themeGraph')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('bible.exploreThemeHint')}
          </p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('bible.searchTheme')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              {t('bible.allCategories')}
            </Button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(key)}
              >
                {t(config.labelKey)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p className="text-sm">{t('bible.loadingThemes')}</p>
        </div>
      ) : filteredThemes.length === 0 ? (
        <div className="text-center py-20 opacity-40 select-none">
          <Network className="w-16 h-16 mx-auto mb-4 stroke-[1.5]" />
          <p className="text-lg">
            {searchQuery || selectedCategory ? t('bible.noMatchTheme') : t('bible.noThemeData')}
          </p>
          <p className="text-sm mt-2">{t('bible.themeDataHint')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedThemes).map(([category, categoryThemes]) => {
            const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.THEOLOGICAL;
            return (
              <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2
                  className={cn(
                    "text-lg font-bold mb-4 flex items-center gap-2",
                    config.color
                  )}
                >
                  <span className={cn("w-1 h-5 rounded-full", config.bgColor)}></span>
                  {t('bible.themeCategoryLabel', { category: t(config.labelKey) })}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({categoryThemes.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryThemes.map(renderThemeCard)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}