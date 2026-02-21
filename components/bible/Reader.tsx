// components/bible/Reader.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { cn } from "@/lib/utils";
import { Loader2, BookOpenCheck, ChevronLeft, ChevronRight } from "lucide-react"; 
import { FloatingMenu } from "./FloatingMenu";
import { CHAPTER_SUMMARY_PROMPT } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

// 引入我们刚刚提取的自定义 Hooks
import { useBibleData, Verse } from "@/hooks/use-bible-data";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { useVerseMenu } from "@/hooks/use-verse-menu";

interface ReaderProps {
  initialBook: string;
  initialChapter: string;
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: "bg-yellow-200/50 dark:bg-yellow-900/30",
  green: "bg-green-200/50 dark:bg-green-900/30",
  blue: "bg-blue-200/50 dark:bg-blue-900/30",
  red: "bg-red-200/50 dark:bg-red-900/30",
};

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0, scale: 0.98 }),
  center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 100 : -100, opacity: 0, scale: 0.98 })
};

export function Reader({ initialBook, initialChapter }: ReaderProps) {
  const searchParams = useSearchParams();
  const book = searchParams.get("book") || initialBook;
  const chapter = searchParams.get("chapter") || initialChapter;

  const { fontSize, lineHeight, selectedVerses, showEnglish, highlights, triggerAI, scrollToVerse, setScrollToVerse, clearSelection } = useBibleStore();

  // 1. 数据获取 Hook
  const { verses, loading } = useBibleData(book, chapter);
  
  // 2. 翻页导航 Hook
  const { direction, handleNextChapter, handlePrevChapter, handleTouchStart, handleTouchEnd } = useSwipeNavigation(book, chapter);
  
  // 3. 经文交互 Hook
  const { menuPosition, isMenuVisible, setIsMenuVisible, handleVerseClick, handleAIExplain, handleCopy } = useVerseMenu(verses);

// --- 自动滚动逻辑 ---
  useEffect(() => {
    if (!loading && scrollToVerse && verses.length > 0) {
        setTimeout(() => {
            const element = document.getElementById(`verse-${scrollToVerse}`);
            if (element) {
                // 平滑滚动到屏幕中间
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // 添加呼吸灯动画类
                element.classList.add("animate-highlight-pulse");
                // 动画播放完毕后移除类
                setTimeout(() => element.classList.remove("animate-highlight-pulse"), 2500);
                
                setScrollToVerse(null);
            }
        }, 300); // 留出一点渲染时间
    }
  }, [loading, scrollToVerse, verses, setScrollToVerse]);

  // --- 准备渲染数据 ---
  const { verseMap, renderList } = useMemo(() => {
    const map = new Map<number, { CUV?: Verse, KJV?: Verse }>();
    verses.forEach(v => {
      if (!map.has(v.verse)) map.set(v.verse, {});
      const entry = map.get(v.verse)!;
      if (v.version === 'CUV') entry.CUV = v;
      if (v.version === 'KJV') entry.KJV = v;
    });
    return { verseMap: map, renderList: Array.from(map.keys()).sort((a, b) => a - b) };
  }, [verses]);

  return (
    <div className="w-full min-h-screen flex flex-row relative bg-white dark:bg-slate-950 transition-colors duration-300" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      
      {/* 左侧导航 */}
      <div className="hidden md:flex flex-1 self-stretch group items-start justify-center transition-colors">
        <div className="sticky top-[50vh] -translate-y-1/2 p-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrevChapter(); }} title="上一章">
           <div className="bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-full shadow-sm backdrop-blur-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 transition-all">
              <ChevronLeft className="w-8 h-8" />
           </div>
        </div>
      </div>

      {/* 中间阅读区 */}
      <div className="w-full max-w-5xl px-4 py-8 md:px-8 pb-32 bg-white dark:bg-slate-950 shadow-sm min-h-screen z-0">
        <AnimatePresence mode='wait' custom={direction} initial={false}>
          <motion.div
            key={`${book}-${chapter}`} 
            custom={direction}
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
            className="w-full"
          >
            {loading ? (
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            ) : (
                <>  
                    <div className="flex items-center justify-center mb-8 relative">
                        <h1 className="text-3xl font-serif font-bold text-slate-800 dark:text-slate-100 select-none text-center">
                            {verses[0]?.bookName || book} 第 {chapter} 章
                        </h1>
                    </div>

                    <div className="space-y-2">
                    {renderList.map((verseNum) => {
                        const entry = verseMap.get(verseNum)!;
                        const cuvVerse = entry.CUV;
                        const kjvVerse = entry.KJV;
                        
                        if (!cuvVerse) return null;
                        const isSelected = selectedVerses.includes(verseNum);
                        const highlight = highlights.find(h => h.verse === verseNum && h.bookId === book && h.chapter === parseInt(chapter));
                        const highlightClass = highlight ? HIGHLIGHT_COLORS[highlight.color] : "";

                        return (
                        <div
                            id={`verse-${verseNum}`}
                            key={cuvVerse.id}
                            onClick={(e) => handleVerseClick(cuvVerse, e)}
                            className={cn(
                                "relative flex items-start px-2 py-1.5 rounded cursor-pointer transition-all duration-200 group/verse border border-transparent",
                                isSelected ? "bg-blue-100 dark:bg-blue-900/60 border-blue-300 dark:border-blue-500 shadow-sm" : 
                                highlightClass ? `${highlightClass} border-transparent` : "hover:bg-slate-50 dark:hover:bg-slate-900"
                            )}
                        >
                            <span className={cn("font-bold mr-3 select-none shrink-0 mt-0.5", isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-600")} style={{ fontSize: fontSize * 0.6 }}>
                                {verseNum}
                            </span>
                            
                            <div className="flex-1 min-w-0">
                                <div className={cn("font-serif transition-colors text-justify", isSelected ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-800 dark:text-slate-300")} style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}>
                                    {cuvVerse.content}
                                </div>
                                {showEnglish && kjvVerse && (
                                    <div className="mt-2 text-slate-500 dark:text-slate-500 font-sans tracking-wide" style={{ fontSize: `${fontSize * 0.85}px`, lineHeight: 1.5 }}>
                                        {kjvVerse.content}
                                    </div>
                                )}
                            </div>
                        </div>
                        );
                    })}
                    </div>

                    {/* 全章摘要按钮 */}
                    <div className="mt-16 text-center">
                    <button onClick={(e) => { 
                        e.stopPropagation(); 
                        const cuvVerses = verses.filter(v => v.version === 'CUV'); 
                        if (cuvVerses.length > 0) { 
                            const fullContext = cuvVerses.map(v => `[${v.chapter}:${v.verse}] ${v.content}`).join('\n'); 
                            triggerAI(CHAPTER_SUMMARY_PROMPT, `【${cuvVerses[0].bookName} 第 ${cuvVerses[0].chapter} 章】全章`, fullContext, { bookName: cuvVerses[0].bookName, chapter: cuvVerses[0].chapter, verse: 0 }); 
                        } 
                    }} className="shadow-md inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full transition-colors font-medium text-sm">
                        <BookOpenCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        生成第 {chapter} 章摘要
                    </button>
                    </div>
                </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 右侧导航 */}
      <div className="hidden md:flex flex-1 self-stretch group items-start justify-center transition-colors">
        <div className="sticky top-[50vh] -translate-y-1/2 p-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNextChapter(); }} title="下一章">
           <div className="bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-full shadow-sm backdrop-blur-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 transition-all">
              <ChevronRight className="w-8 h-8" />
           </div>
        </div>
      </div>

      {/* 浮动菜单 */}
      <FloatingMenu 
        visible={isMenuVisible && selectedVerses.length > 0} 
        position={menuPosition}
        selectedCount={selectedVerses.length}
        onClose={() => { setIsMenuVisible(false); clearSelection(); }}
        onExplain={handleAIExplain}
        currentBook={book}
        currentChapter={parseInt(chapter)}
        onCopy={handleCopy}
      />
    </div>
  );
}