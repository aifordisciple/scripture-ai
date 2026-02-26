// components/bible/Reader.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { cn } from "@/lib/utils";
import { Loader2, BookOpenCheck, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon } from "lucide-react";
import { FloatingMenu } from "./FloatingMenu";
import { Button } from "@/components/ui/button";
import { CHAPTER_SUMMARY_PROMPT } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

import { useBibleData, Verse } from "@/hooks/use-bible-data";
import { BIBLE_PLANS } from "@/lib/plans";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { useVerseMenu } from "@/hooks/use-verse-menu";

interface ReaderProps {
  initialBook: string;
  initialChapter: string;
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: "bg-yellow-100/80 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100",
  green: "bg-green-100/80 dark:bg-green-900/30 text-green-900 dark:text-green-100",
  blue: "bg-blue-100/80 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100",
  red: "bg-red-100/80 dark:bg-red-900/30 text-red-900 dark:text-red-100",
};

// 优化后的滑动变体：完全的水平位移，纯粹的拉扯感
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 })
};

export function Reader({ initialBook, initialChapter }: ReaderProps) {
  const searchParams = useSearchParams();
  const book = searchParams.get("book") || initialBook;
  const chapter = searchParams.get("chapter") || initialChapter;

  const {
    fontSize, lineHeight, selectedVerses, showEnglish, highlights, triggerAI, scrollToVerse, setScrollToVerse, clearSelection
  } = useBibleStore();

  const { verses, loading } = useBibleData(book, chapter);
  const { direction, handleNextChapter, handlePrevChapter, handleTouchStart, handleTouchEnd } = useSwipeNavigation(book, chapter);
  const { menuPosition, isMenuVisible, setIsMenuVisible, handleVerseClick, handleAIExplain, handleCopy } = useVerseMenu(verses);

  // [新增] 当书卷或章节在内部状态发生变化时，强制真实的滚动容器瞬间回到顶部
  useEffect(() => {
    const container = document.getElementById('reader-scroll-container');
    if (container) {
      container.scrollTo(0, 0);
    }
  }, [book, chapter]);

  useEffect(() => {
    if (!loading && scrollToVerse && verses.length > 0) {
        setTimeout(() => {
            const element = document.getElementById(`verse-${scrollToVerse}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add("animate-highlight-pulse");
                setTimeout(() => element.classList.remove("animate-highlight-pulse"), 2500);
                setScrollToVerse(null);
            }
        }, 300);
    }
  }, [loading, scrollToVerse, verses, setScrollToVerse]);

// [新增探针] 自动判定阅读有效性
  // 逻辑：只要用户在一个加载完毕的章节停留超过 3.5 秒，就自动在 Store 记录 1 个互动权重。
  useEffect(() => {
    if (!loading && verses.length > 0) {
        const timer = setTimeout(() => {
            // 注意：因为只追加互动量，所以即使后续清空了高亮，阅读痕迹也永远存在
            useBibleStore.getState().recordInteraction(book, parseInt(chapter), 1);
        }, 30000); 
        return () => clearTimeout(timer);
    }
  }, [book, chapter, loading, verses]);

// [新增] 注册阅读器专属快捷键 (左右翻页、高亮、AI解读、取消选中)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 安全检查：防止在做笔记时触发
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return; 

      const state = useBibleStore.getState();
      const hasSelection = state.selectedVerses.length > 0;

      switch (e.key) {
        // --- 翻页快捷键 ---
        case 'ArrowLeft':
        case '[':
          e.preventDefault();
          handlePrevChapter();
          break;
        case 'ArrowRight':
        case ']':
          e.preventDefault();
          handleNextChapter();
          break;

        // --- 选中状态下的快捷键 ---
        case 'Escape':
        case 'c':
        case 'C':
          if (hasSelection) {
            e.preventDefault();
            clearSelection();
            setIsMenuVisible(false);
          }
          break;

        case 'h':
        case 'H':
          if (hasSelection) {
            e.preventDefault();
            // 一键黄底高亮或取消高亮
            state.selectedVerses.forEach(verseNum => {
               const isHighlighted = state.highlights.some(h => h.bookId === book && h.chapter === parseInt(chapter) && h.verse === verseNum);
               if (isHighlighted) {
                   state.removeHighlightLocally(book, parseInt(chapter), verseNum);
               } else {
                   state.addHighlightLocally({ bookId: book, chapter: parseInt(chapter), verse: verseNum, color: 'yellow' });
               }
            });
            clearSelection();
            setIsMenuVisible(false);
          }
          break;

        case 'a':
        case 'A':
          if (hasSelection) {
            e.preventDefault();
            // 一键唤起 AI 解读
            const cuvVerses = verses.filter(v => v.version === 'CUV' && state.selectedVerses.includes(v.verse));
            if (cuvVerses.length > 0) {
               const content = cuvVerses.map(v => `[${v.verse}] ${v.content}`).join('\n');
               const context = verses.filter(v => v.version === 'CUV').map(v => `[${v.verse}] ${v.content}`).join('\n');
               const ref = { bookName: cuvVerses[0].bookName, chapter: cuvVerses[0].chapter, verse: cuvVerses[0].verse };
               
               state.triggerAI("请深入解读以下经文。", content, context, ref);
               state.setAiOpen(true);
               clearSelection();
               setIsMenuVisible(false);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [book, chapter, verses, handlePrevChapter, handleNextChapter, clearSelection, setIsMenuVisible]);


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
    <div className="w-full min-h-screen flex flex-row relative transition-colors duration-500" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      
      {/* 左侧导航 */}
      <div className="hidden md:flex flex-1 self-stretch group items-start justify-center">
        <div className="sticky top-[50vh] -translate-y-1/2 p-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrevChapter(); }} title="上一章">
           <div className="glass-panel p-3 rounded-full text-muted-foreground hover:text-foreground hover:scale-110 transition-all duration-300">
              <ChevronLeft className="w-8 h-8 opacity-50 group-hover:opacity-100" />
           </div>
        </div>
      </div>

      {/* 中间阅读区 - 增加 overflow-x-hidden */}
      <div className="w-full max-w-5xl xl:max-w-6xl px-4 py-8 md:px-10 pb-32 min-h-screen z-0 overflow-x-hidden">
        <AnimatePresence mode='wait' custom={direction} initial={false}>
          <motion.div
            key={`${book}-${chapter}`} 
            custom={direction}
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ x: { type: "spring", stiffness: 350, damping: 35, mass: 0.8 }, opacity: { duration: 0.15 } }}
            className="w-full"
          >
            {loading ? (
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                </div>
            ) : (
                <>  
                    <div className="flex items-center justify-center mb-10 md:mb-16 relative mt-4">
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground/90 select-none text-center tracking-wider">
                            {verses[0]?.bookName || book} <span className="opacity-80 mx-1">·</span> {chapter}
                        </h1>
                    </div>

                    <div className="space-y-1 md:space-y-2">
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
                                "relative flex items-start px-3 md:px-5 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 group/verse",
                                isSelected ? "bg-primary/10 dark:bg-primary/20 shadow-[inset_4px_0_0_0_hsl(var(--primary))]" : 
                                highlightClass ? `${highlightClass}` : "hover:bg-black/5 dark:hover:bg-white/5"
                            )}
                        >
                            <span 
                              className={cn("font-sans font-semibold mr-4 select-none shrink-0 mt-[0.3em] transition-opacity duration-300", isSelected ? "text-primary opacity-100" : "text-foreground/30 group-hover/verse:text-foreground/50")} 
                              style={{ fontSize: fontSize * 0.55 }}
                            >
                                {verseNum}
                            </span>
                            
                            <div className="flex-1 min-w-0">
                                <div 
                                  className={cn("font-serif tracking-wide transition-colors text-justify", isSelected ? "text-foreground font-medium" : "text-foreground/90")} 
                                  style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                                >
                                    {cuvVerse.content}
                                </div>
                                {showEnglish && kjvVerse && (
                                    <div className="mt-3 text-muted-foreground font-sans tracking-wide" style={{ fontSize: `${fontSize * 0.85}px`, lineHeight: 1.6 }}>
                                        {kjvVerse.content}
                                    </div>
                                )}
                            </div>
                        </div>
                        );
                    })}
                    </div>

                    {/* 全章摘要按钮 */}
                    <div className="mt-20 text-center pb-4">
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            const cuvVerses = verses.filter(v => v.version === 'CUV'); 
                            if (cuvVerses.length > 0) { 
                                const fullContext = cuvVerses.map(v => `[${v.chapter}:${v.verse}] ${v.content}`).join('\n'); 
                                triggerAI(CHAPTER_SUMMARY_PROMPT, `【${cuvVerses[0].bookName} 第 ${cuvVerses[0].chapter} 章】全章`, fullContext, { bookName: cuvVerses[0].bookName, chapter: cuvVerses[0].chapter, verse: 0 }); 
                            } 
                        }} 
                        className={cn(
                          "group inline-flex items-center gap-2.5 px-8 py-3.5 glass-panel rounded-full",
                          "bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-foreground font-medium text-sm",
                          // 核心动画类名：悬浮上浮投影放大，点击时回缩(scale-95)
                          "transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 active:scale-95 active:translate-y-0 active:shadow-sm"
                        )}
                    >
                        <BookOpenCheck className="w-5 h-5 text-primary group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                        阅读第 {chapter} 章精意
                    </button>
                    </div>
                </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 右侧导航 */}
      <div className="hidden md:flex flex-1 self-stretch group items-start justify-center">
        <div className="sticky top-[50vh] -translate-y-1/2 p-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNextChapter(); }} title="下一章">
           <div className="glass-panel p-3 rounded-full text-muted-foreground hover:text-foreground hover:scale-110 transition-all duration-300">
              <ChevronRight className="w-8 h-8 opacity-50 group-hover:opacity-100" />
           </div>
        </div>
      </div>

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