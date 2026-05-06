// components/bible/SearchHistoryTab.tsx
"use client";

import { useMemo, useState } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Search, TextSearch, Sparkles, Clock, X, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateClient, formatTimeClient } from "@/lib/locale";

export function SearchHistoryTab() {
  const { searchHistory, removeSearchHistory, clearSearchHistory, addTab, setActiveTab, tabs } = useBibleStore();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 搜索过滤
  const filteredHistory = useMemo(() => {
    if (!searchQuery) return searchHistory;
    const query = searchQuery.toLowerCase();
    return searchHistory.filter(h => h.query.toLowerCase().includes(query));
  }, [searchHistory, searchQuery]);

  // 按日期分组
  const groupedHistory = useMemo(() => {
    const groups: Record<string, typeof searchHistory> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    const yesterdayTimestamp = todayTimestamp - 24 * 60 * 60 * 1000;
    const weekAgoTimestamp = todayTimestamp - 7 * 24 * 60 * 60 * 1000;

    filteredHistory.forEach(h => {
      let groupKey: string;
      if (h.timestamp >= todayTimestamp) {
        groupKey = t('bible.today');
      } else if (h.timestamp >= yesterdayTimestamp) {
        groupKey = t('bible.yesterday');
      } else if (h.timestamp >= weekAgoTimestamp) {
        groupKey = t('bible.thisWeek');
      } else {
        const date = new Date(h.timestamp);
        groupKey = formatDateClient(date, { month: 'long', day: 'numeric' });
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(h);
    });

    return groups;
  }, [filteredHistory]);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return formatTimeClient(date, { hour: '2-digit', minute: '2-digit' });
  };

  // 重新搜索
  const handleReSearch = (query: string, searchMode: 'exact' | 'ai') => {
    addTab({ type: 'search', query, searchMode });
  };

  // 清除历史
  const handleClearHistory = () => {
    setShowClearConfirm(true);
  };

  const executeClearHistory = () => {
    clearSearchHistory();
    setShowClearConfirm(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-4">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-border">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
          <Search className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t('bible.searchHistoryTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('bible.searchHistoryCount', { count: searchHistory.length })}
          </p>
        </div>
        {searchHistory.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full"
            onClick={handleClearHistory}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {t('bible.clearSearchHistory')}
          </Button>
        )}
      </div>

      {/* 搜索过滤框 */}
      {searchHistory.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('bible.filterSearchHistory')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 rounded-full"
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
      )}

      {/* 历史列表 */}
      {searchHistory.length === 0 ? (
        <div className="text-center py-20 opacity-40 select-none">
          <Search className="w-16 h-16 mx-auto mb-4 stroke-[1.5]" />
          <p className="text-lg">{t('bible.noSearchHistory')}</p>
          <p className="text-sm mt-2">{t('bible.noSearchHistoryHint')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                {date}
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleReSearch(item.query, item.searchMode)}
                    className={cn(
                      "group flex items-center justify-between p-4 rounded-xl cursor-pointer",
                      "bg-card border dark:border-border",
                      "hover:border-primary/30 dark:hover:border-primary/30",
                      "transition-all duration-300 active:scale-[0.98]"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        item.searchMode === 'ai'
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      )}>
                        {item.searchMode === 'ai' ? (
                          <Sparkles className="w-5 h-5" />
                        ) : (
                          <TextSearch className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground truncate max-w-[300px]">{item.query}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.searchMode === 'ai' ? t('search.aiLabel') : t('search.exactLabel')} · {formatTime(item.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSearchHistory(item.id); }}
                        className={cn(
                          "opacity-0 group-hover:opacity-100 transition-opacity",
                          "p-1.5 rounded-full",
                          "text-muted-foreground hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20",
                          "active:scale-95"
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title={t('common.confirm')}
        description={t('bible.confirmClearSearchHistory')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        variant="destructive"
        onConfirm={executeClearHistory}
      />
    </div>
  );
}
