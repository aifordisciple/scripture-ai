// components/bible/SearchResults.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
  query: string;
  // 增加 'fuzzy' 模式
  mode: 'exact' | 'ai' | 'fuzzy';
  cachedResults?: any[];
  onUpdateResults?: (results: any[]) => void;
}

export function SearchResults({ query, mode, cachedResults, onUpdateResults }: SearchResultsProps) {
  const [results, setResults] = useState<any[]>(cachedResults || []);
  const [loading, setLoading] = useState(!cachedResults);

  const { fontSize, lineHeight, tabs, addTab, setActiveTab, setScrollToVerse, apiConfig } = useBibleStore();
  
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
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, mode, apiConfig })
        });
        const json = await res.json();
        const data = json.data || [];
        setResults(data);
        if (onUpdateResultsRef.current) onUpdateResultsRef.current(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    search();
  }, [query, mode, cachedResults, apiConfig]);

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
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>
            {mode === 'ai' ? "AI 正在思考并查找相关经文..." : 
             mode === 'fuzzy' ? "正在进行语义匹配..." : 
             "正在搜索..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      <div className="mb-8 border-b pb-4 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          🔍 搜索结果: "{query}"
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          模式: {mode === 'exact' ? '精确匹配' : mode === 'fuzzy' ? '模糊语义搜索' : 'AI 智能推荐'} • 找到 {results.length} 条结果
        </p>
      </div>

      {results.length === 0 ? (
        <div className="text-center text-slate-500 py-10">
          未找到相关经文，请尝试更换关键词。
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((verse) => (
            <div 
              key={verse.id} 
              className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
              onClick={() => handleResultClick(verse.bookId, verse.chapter, verse.verse)}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                  {verse.bookName} {verse.chapter}:{verse.verse}
                </span>
                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div 
                className="text-slate-800 dark:text-slate-300 font-serif"
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