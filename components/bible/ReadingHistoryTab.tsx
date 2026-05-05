// components/bible/ReadingHistoryTab.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { BIBLE_BOOKS } from "@/lib/constants";
import { History, Clock, TrendingUp, Search, X, Trash2, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDateClient, formatTimeClient } from "@/lib/locale";

export function ReadingHistoryTab() {
  const router = useRouter();
  const { readingHistory, clearReadingHistory, getContinueReading, tabs, addTab, setActiveTab } = useBibleStore();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // ConfirmDialog state for clear history confirmation
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 搜索过滤
  const filteredHistory = useMemo(() => {
    if (!searchQuery) return readingHistory;
    const query = searchQuery.toLowerCase();
    return readingHistory.filter(h => {
      const bookName = BIBLE_BOOKS.find(b => b.id === h.bookId)?.name || h.bookId;
      return bookName.toLowerCase().includes(query);
    });
  }, [readingHistory, searchQuery]);

  // 按日期分组
  const groupedHistory = useMemo(() => {
    const groups: Record<string, typeof readingHistory> = {};
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

  // 今日阅读统计
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const todayRecords = readingHistory.filter(h => h.timestamp >= todayTimestamp);
    const totalDuration = todayRecords.reduce((sum, h) => sum + h.duration, 0);
    const chaptersRead = new Set(todayRecords.map(h => `${h.bookId}-${h.chapter}`)).size;

    return { totalDuration, chaptersRead, recordCount: todayRecords.length };
  }, [readingHistory]);

  // 续读推荐
  const continueReading = useMemo(() => getContinueReading(), [getContinueReading, readingHistory]);

  // 格式化时长
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return t('bible.secondsUnit', { count: seconds });
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) return secs > 0 ? t('bible.minutesSecondsUnit', { minutes, seconds: secs }) : t('bible.minutesUnit', { count: minutes });
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? t('bible.hoursMinutesUnit', { hours, minutes: mins }) : t('bible.hoursUnit', { count: hours });
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return formatTimeClient(date, { hour: '2-digit', minute: '2-digit' });
  };

  // 跳转到章节
  const handleJump = (bookId: string, chapter: number) => {
    const readTab = tabs.find(t => t.type === 'read');
    if (readTab) {
      useBibleStore.setState((state) => ({
        tabs: state.tabs.map(t => t.id === readTab.id ? { ...t, book: bookId, chapter: chapter.toString() } : t)
      }));
      setActiveTab(readTab.id);
    } else {
      addTab({ type: 'read', book: bookId, chapter: chapter.toString() });
    }
    router.push(`/?book=${bookId}&chapter=${chapter}`);
  };

  // 继续阅读
  const handleContinueReading = () => {
    if (continueReading) {
      handleJump(continueReading.bookId, continueReading.chapter);
    }
  };

  // 清除历史
  const handleClearHistory = () => {
    setShowClearConfirm(true);
  };

  const executeClearHistory = () => {
    clearReadingHistory();
    setShowClearConfirm(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-4">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-border">
        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <History className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t('bible.readingHistory')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('bible.historyCount', { count: readingHistory.length })}
          </p>
        </div>
        {readingHistory.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
            onClick={handleClearHistory}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {t('bible.clearHistory')}
          </Button>
        )}
      </div>

      {/* 今日统计 */}
      {todayStats.recordCount > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/40 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold">{t('bible.todayReading')}</span>
            </div>
            <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
              {formatDuration(todayStats.totalDuration)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-semibold">{t('bible.readChapters')}</span>
            </div>
            <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">
              {t('bible.chaptersUnit', { count: todayStats.chaptersRead })}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/40 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-semibold">{t('bible.readCount')}</span>
            </div>
            <p className="text-2xl font-semibold text-purple-700 dark:text-purple-300">
              {t('bible.countUnit', { count: todayStats.recordCount })}
            </p>
          </div>
        </div>
      )}

      {/* 续读推荐 */}
      {continueReading && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <ChevronRight className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('bible.continueReading')}</p>
                <p className="font-semibold text-foreground">
                  {t('bible.continueReadingChapter', { book: BIBLE_BOOKS.find(b => b.id === continueReading.bookId)?.name, chapter: continueReading.chapter })}
                </p>
              </div>
            </div>
            <Button onClick={handleContinueReading} size="sm">
              {t('bible.continueReading')}
            </Button>
          </div>
        </div>
      )}

      {/* 搜索框 */}
      {readingHistory.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('bible.searchHistory')}
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
      )}

      {/* 历史列表 */}
      {readingHistory.length === 0 ? (
        <div className="text-center py-20 opacity-40 select-none">
          <History className="w-16 h-16 mx-auto mb-4 stroke-[1.5]" />
          <p className="text-lg">{t('bible.noHistory')}</p>
          <p className="text-sm mt-2">{t('bible.startReadingHint')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {date}
              </h2>
              <div className="space-y-2">
                {items.map((item) => {
                  const bookName = BIBLE_BOOKS.find(b => b.id === item.bookId)?.name || item.bookId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleJump(item.bookId, item.chapter)}
                      className={cn(
                        "group flex items-center justify-between p-4 rounded-xl cursor-pointer",
                        "bg-card border dark:border-border",
                        "hover:border-emerald-200 dark:hover:border-emerald-800",
                        "shadow-sm hover:shadow-md transition-all duration-300"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.chapter}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{bookName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(item.timestamp)} · {formatDuration(item.duration)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title={t('common.confirm')}
        description={t('bible.confirmClearHistory')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        variant="destructive"
        onConfirm={executeClearHistory}
      />
    </div>
  );
}