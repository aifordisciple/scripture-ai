// components/bible/HighlightsTab.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { BIBLE_BOOKS } from "@/lib/constants";
import { Loader2, BookMarked, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 高亮颜色映射表 (与 Reader.tsx 保持一致)
const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: "border-yellow-400 dark:border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10",
  green: "border-green-400 dark:border-green-500/50 bg-green-50/50 dark:bg-green-900/10",
  blue: "border-blue-400 dark:border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/10",
  red: "border-red-400 dark:border-red-500/50 bg-red-50/50 dark:bg-red-900/10",
};

interface PopulatedHighlight {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  color: string;
  content: string;
}

export function HighlightsTab() {
  const router = useRouter();
  const { highlights, removeHighlightLocally, tabs, addTab, setActiveTab, updateActiveTab } = useBibleStore();
  const [populatedHighlights, setPopulatedHighlights] = useState<PopulatedHighlight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 当进入页面时，根据本地存储的 ref 去 fetch 具体的经文文本
  useEffect(() => {
    async function fetchHighlightContents() {
      if (highlights.length === 0) {
        setPopulatedHighlights([]);
        return;
      }

      setIsLoading(true);
      try {
        const promises = highlights.map(async (h) => {
          const res = await fetch(`/api/bible?book=${h.bookId}&chapter=${h.chapter}`);
          const json = await res.json();
          const verseData = json.data?.find((v: any) => v.version === 'CUV' && v.verse === h.verse);
          const bookName = BIBLE_BOOKS.find(b => b.id === h.bookId)?.name || h.bookId;
          return {
            ...h,
            bookName,
            content: verseData ? verseData.content : "获取经文内容失败..."
          };
        });
        const results = await Promise.all(promises);
        setPopulatedHighlights(results);
      } catch (err) {
        console.error("Failed to fetch highlight contents", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHighlightContents();
  }, [highlights]);

  // 将高亮数据按书卷进行分组
  const groupedHighlights = useMemo(() => {
    const groups: Record<string, PopulatedHighlight[]> = {};
    populatedHighlights.forEach(h => {
      if (!groups[h.bookName]) groups[h.bookName] = [];
      groups[h.bookName].push(h);
    });

    // 对每卷书内的经文按章节、节数进行排序
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
      });
    });

    return groups;
  }, [populatedHighlights]);

  // 点击卡片，跳转到阅读器对应位置
  const handleJump = (bookId: string, chapter: number, verse: number) => {
    const readTab = tabs.find(t => t.type === 'read');
    if (readTab) {
      setActiveTab(readTab.id);
      useBibleStore.setState((state) => ({
        tabs: state.tabs.map(t => t.id === readTab.id ? { ...t, book: bookId, chapter: chapter.toString() } : t)
      }));
    } else {
      addTab({ type: 'read', book: bookId, chapter: chapter.toString() });
    }
    // 设置阅读器滚动锚点
    useBibleStore.getState().setScrollToVerse(verse);

    // 强制修改 URL，触发 Next.js 和 Reader 的跨章节数据抓取
    router.push(`/?book=${bookId}&chapter=${chapter}`);
  };

  const handleRemove = (e: React.MouseEvent, bookId: string, chapter: number, verse: number) => {
    e.stopPropagation();
    removeHighlightLocally(bookId, chapter, verse);
    setPopulatedHighlights(prev => prev.filter(h => !(h.bookId === bookId && h.chapter === chapter && h.verse === verse)));
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-32 min-h-screen">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b dark:border-slate-800">
        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
          <BookMarked className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">我的高亮</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共标记了 {highlights.length} 节经文。点击卡片可快速定位到原文。
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p className="text-sm">正在整理您的灵修足迹...</p>
        </div>
      ) : highlights.length === 0 ? (
        <div className="text-center py-20 opacity-40 select-none">
          <BookMarked className="w-16 h-16 mx-auto mb-4 stroke-[1.5]" />
          <p className="text-lg">您还没有高亮过任何经文</p>
          <p className="text-sm mt-2">在阅读经文时选中文字即可添加高亮</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedHighlights).map(([bookName, items]) => (
            <div key={bookName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-bold font-serif text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-primary rounded-full inline-block"></span>
                {bookName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <div
                    key={`${item.bookId}-${item.chapter}-${item.verse}`}
                    onClick={() => handleJump(item.bookId, item.chapter, item.verse)}
                    className={cn(
                      "group relative flex flex-col p-4 rounded-2xl cursor-pointer border-l-[3px] shadow-sm hover:shadow-md transition-all duration-300",
                      HIGHLIGHT_COLORS[item.color] || HIGHLIGHT_COLORS['yellow']
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {item.bookName} {item.chapter}:{item.verse}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full"
                          onClick={(e) => handleRemove(e, item.bookId, item.chapter, item.verse)}
                          title="移除高亮"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-[15px] leading-relaxed font-serif text-foreground/90 line-clamp-3">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
