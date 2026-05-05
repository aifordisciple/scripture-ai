// components/bible/SearchResults.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { getBookDisplayName } from "@/lib/constants";
import { Loader2, ExternalLink, ChevronDown, ChevronUp, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface SearchResultsProps {
  query: string;
  mode: 'exact' | 'ai';
  cachedResults?: any[];
  onUpdateResults?: (results: any[]) => void;
}

export function SearchResults({ query, mode, cachedResults, onUpdateResults }: SearchResultsProps) {
  const { t } = useTranslation();
  const [results, setResults] = useState<any[]>(cachedResults || []);
  const [loading, setLoading] = useState(!cachedResults);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const { fontSize, lineHeight, tabs, addTab, setActiveTab, setScrollToVerse, apiConfig, locale } = useBibleStore();

  const onUpdateResultsRef = useRef(onUpdateResults);
  useEffect(() => { onUpdateResultsRef.current = onUpdateResults; }, [onUpdateResults]);

  useEffect(() => {
    if (cachedResults) {
        setResults(cachedResults);
        setLoading(false);
        return;
    }

    async function search() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, mode, apiConfig, locale })
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          setError(errJson.error || (locale === 'en' ? 'Search failed, please try again' : '搜索失败，请重试'));
          setResults([]);
          return;
        }
        const json = await res.json();
        const data = json.data || [];
        setResults(data);
        // AI模式下保存总结
        if (mode === 'ai' && json.aiSummary) {
          setAiSummary(json.aiSummary);
        } else {
          setAiSummary('');
        }
        if (onUpdateResultsRef.current) onUpdateResultsRef.current(data);
      } catch (error) {
        console.error(error);
        setError(locale === 'en' ? 'Network error, please check your connection' : '网络错误，请检查网络连接');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
    search();
  }, [query, mode, cachedResults, apiConfig, locale]);

  const handleResultClick = (bookId: string, chapter: number, verse: number) => {
    // 1. 先设置滚动目标，Reader 加载完经文后会处理
    setScrollToVerse(verse);

    // 2. 查找是否已经存在专用的阅读标签页 (type === 'read')
    const readTab = tabs.find((t: any) => t.type === 'read');

    if (readTab) {
       // 3. 如果存在，先更新书卷和章节数据，再激活标签页
       useBibleStore.setState((state) => ({
           tabs: state.tabs.map((t: any) =>
               t.id === readTab.id
                   ? { ...t, book: bookId, chapter: chapter.toString() }
                   : t
           )
       }));
       setActiveTab(readTab.id);
    } else {
       // 4. 只有在极少数情况下（比如用户把阅读页关了），才新建一个标签页
       addTab({ type: 'read', book: bookId, chapter: chapter.toString() });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-[#7a7a7a] gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>
            {mode === 'ai' ? t('search.aiThinking') : t('search.searching')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-[#7a7a7a] gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      <div className="mb-8 border-b pb-4 dark:border-[#3a3a3c]">
        <h1 className="text-2xl font-semibold text-[#1d1d1f] dark:text-white flex items-center gap-2">
          🔍 {t('search.resultsFor', { query })}
        </h1>
        <p className="text-[#7a7a7a] text-sm mt-1">
          {mode === 'exact' ? t('search.modeExact') : t('search.modeAi')} • {t('search.foundCount', { count: results.length })}
        </p>
      </div>

      {/* AI 总结卡片 - 仅在AI模式下显示 */}
      {mode === 'ai' && aiSummary && (
        <div className="mb-6 bg-[#0066cc]/5 dark:bg-[#0066cc]/10 rounded-xl border border-[#0066cc]/20 dark:border-[#0066cc]/30 overflow-hidden">
          <button
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0066cc]" />
              <span className="font-semibold text-[#0066cc] dark:text-[#2997ff]">{t('search.aiInsight')}</span>
            </div>
            {isSummaryExpanded ? (
              <ChevronUp className="w-5 h-5 text-[#0066cc]/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#0066cc]/60" />
            )}
          </button>

          <div className={cn(
            "overflow-hidden transition-all duration-300",
            isSummaryExpanded ? "max-h-[500px] opacity-100" : "max-h-20 opacity-80"
          )}>
            <div className="px-4 pb-4 text-[#1d1d1f]/80 dark:text-white/70 leading-relaxed">
              {!isSummaryExpanded && (
                <p className="line-clamp-2">{aiSummary}</p>
              )}
              {isSummaryExpanded && (
                <p>{aiSummary}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <div className="text-center text-[#7a7a7a] py-10">
          {t('search.noResultsHint')}
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((verse) => (
            <div
              key={verse.id}
              className="bg-[#f5f5f7] dark:bg-[#2a2a2c] rounded-lg p-4 transition-all cursor-pointer group border border-transparent hover:border-[#0066cc]/30 dark:hover:border-[#0066cc]/30 active:scale-[0.98]"
              onClick={() => handleResultClick(verse.bookId, verse.chapter, verse.verse)}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#0066cc] dark:text-[#2997ff] bg-[#0066cc]/10 dark:bg-[#0066cc]/20 px-2 py-1 rounded">
                  {getBookDisplayName(verse.bookId, locale)} {verse.chapter}:{verse.verse}
                </span>
                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-[#0066cc] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div
                className="text-[#1d1d1f] dark:text-white/70 font-serif"
                style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
              >
                {verse.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}