// components/bible/Reader.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { cn } from "@/lib/utils";
import { Loader2, BookOpenCheck, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon, Sparkles, AlertCircle } from "lucide-react";
import { FloatingMenu } from "./FloatingMenu";
import { Button } from "@/components/ui/button";
import { CHAPTER_SUMMARY_PROMPT } from "@/lib/constants";
import { useTranslation, resolveDualLang } from "@/lib/i18n";
import { getBookDisplayName } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { ReaderSkeleton } from "@/components/skeletons/ReaderSkeleton";

import { useBibleData, Verse } from "@/hooks/use-bible-data";
import { BIBLE_PLANS } from "@/lib/plans";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { useVerseMenu } from "@/hooks/use-verse-menu";

interface ReaderProps {
  initialBook: string;
  initialChapter: string;
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: "bg-yellow-200 dark:bg-yellow-800/60 text-yellow-900 dark:text-yellow-100",
  green: "bg-green-200 dark:bg-green-800/60 text-green-900 dark:text-green-100",
  blue: "bg-blue-200 dark:bg-blue-800/60 text-blue-900 dark:text-blue-100",
  red: "bg-red-200 dark:bg-red-800/60 text-red-900 dark:text-red-100",
};

// 优化后的滑动变体：完全的水平位移，纯粹的拉扯感
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 })
};

export function Reader({ initialBook, initialChapter }: ReaderProps) {
  const searchParams = useSearchParams();
  const { t, locale } = useTranslation();

  // Version linkage: bibleVersion from store (defaults from locale but overridable)
  const bibleVersion = useBibleStore((state) => state.bibleVersion);
  const primaryVersion = bibleVersion;
  const secondaryVersion = bibleVersion === 'CUV' ? 'KJV' : 'CUV';

  // 使用 ref 追踪 initial 值的变化，确保外部更新时能响应
  const prevInitialRef = useRef({ book: initialBook, chapter: initialChapter });
  const [book, setBook] = useState(() => searchParams.get("book") || initialBook);
  const [chapter, setChapter] = useState(() => searchParams.get("chapter") || initialChapter);

  // 当 initialBook 或 initialChapter 变化时，更新内部状态
  useEffect(() => {
    if (initialBook !== prevInitialRef.current.book || initialChapter !== prevInitialRef.current.chapter) {
      setBook(initialBook);
      setChapter(initialChapter);
      prevInitialRef.current = { book: initialBook, chapter: initialChapter };
    }
  }, [initialBook, initialChapter]);

  const {
    fontSize, lineHeight, selectedVerses, showDualVersion, highlights, enqueueAI, scrollToVerse, setScrollToVerse, clearSelection, addTab, setAtlasPanelOpen, setAtlasVerseContext
  } = useBibleStore();

  const { verses, loading, error, refetch } = useBibleData(book, chapter);
  const { direction, handleNextChapter, handlePrevChapter, handleTouchStart, handleTouchEnd } = useSwipeNavigation(book, chapter);
  const { menuPosition, isMenuVisible, setIsMenuVisible, handleVerseClick, handleAIExplain, handleCopy, showAbove } = useVerseMenu(verses);

  // [新增] 当书卷或章节在内部状态发生变化时，强制真实的滚动容器瞬间回到顶部
  useEffect(() => {
    const container = document.getElementById('reader-scroll-container');
    if (container) {
      container.scrollTo(0, 0);
    }
    // 章节切换时清除经文选择，避免FloatingMenu显示错误引用
    clearSelection();
  }, [book, chapter]);

  // 使用 ref 持久保存 scrollToVerse 目标，避免 useEffect 依赖项时序问题
  const scrollToVerseRef = useRef<{ bookId: string; chapter: string; verse: number } | null>(null);

  // 每次 scrollToVerse store 值变化时，同步到 ref
  useEffect(() => {
    scrollToVerseRef.current = scrollToVerse;
  }, [scrollToVerse]);

  // 当数据加载完成时，检查 ref 中是否有待处理的 scrollToVerse
  // 这种方式不依赖 useEffect 依赖项的触发时序，而是主动在数据就绪时检查
  useEffect(() => {
    if (loading) return;
    if (verses.length === 0) return;

    const target = scrollToVerseRef.current;
    if (!target) return;

    // 校验当前章节是否匹配目标章节
    if (target.bookId !== book || target.chapter !== chapter) return;

    const verseNum = target.verse;
    // 立即清除 ref 和 store，防止重复触发
    scrollToVerseRef.current = null;
    setScrollToVerse(null);

    const timer = setTimeout(() => {
        const element = document.getElementById(`verse-${verseNum}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add("animate-highlight-pulse");
            setTimeout(() => element.classList.remove("animate-highlight-pulse"), 2500);
        }
    }, 300);
    return () => clearTimeout(timer);
  }, [loading, verses.length, book, chapter, setScrollToVerse]);

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
            // Shift+A 打开 AI 模式选择器（保持选择状态）
            if (e.shiftKey) {
              e.preventDefault();
              // 打开 AI 侧边栏并显示模式选择
              state.setAiOpen(true);
              // 触觉反馈
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(30);
              }
            } else {
              e.preventDefault();
              // 一键唤起 AI 解读
              const primaryVerses = verses.filter(v => v.version === primaryVersion && state.selectedVerses.includes(v.verse));
              if (primaryVerses.length > 0) {
                 const content = primaryVerses.map(v => `[${v.verse}] ${v.content}`).join('\n');
                 const context = verses.filter(v => v.version === primaryVersion).map(v => `[${v.verse}] ${v.content}`).join('\n');
                 const ref = { bookName: getBookDisplayName(primaryVerses[0].bookId, locale), chapter: primaryVerses[0].chapter, verse: primaryVerses[0].verse };

                 state.enqueueAI(t('reader.aiInterpretPrompt'), content, context, ref);
                 state.setAiOpen(true);
                 clearSelection();
                 setIsMenuVisible(false);
              }
            }
          }
          break;

        case 'p':
        case 'P':
          if (hasSelection) {
            e.preventDefault();
            // 祷告生成
            const primaryVerses = verses.filter(v => v.version === primaryVersion && state.selectedVerses.includes(v.verse));
            if (primaryVerses.length > 0) {
              const content = primaryVerses.map(v => `[${v.verse}] ${v.content}`).join('\n');
              const context = verses.filter(v => v.version === primaryVersion).map(v => `[${v.verse}] ${v.content}`).join('\n');
              const ref = { bookName: getBookDisplayName(primaryVerses[0].bookId, locale), chapter: primaryVerses[0].chapter, verse: primaryVerses[0].verse };

              state.enqueueAI(t('reader.prayerPrompt'), content, context, ref);
              state.setAiOpen(true);
              clearSelection();
              setIsMenuVisible(false);
            }
          }
          break;

        case 's':
        case 'S':
          // 章节摘要：需要选中经文才触发，防止误触
          if (hasSelection) {
            e.preventDefault();
            const primaryVersesForSummary = verses.filter(v => v.version === primaryVersion);
            if (primaryVersesForSummary.length > 0) {
              const fullContext = primaryVersesForSummary.map(v => `[${v.chapter}:${v.verse}] ${v.content}`).join('\n');
              state.enqueueAI(resolveDualLang(CHAPTER_SUMMARY_PROMPT, locale), t('reader.fullChapter', { book: getBookDisplayName(primaryVersesForSummary[0].bookId, locale), chapter: primaryVersesForSummary[0].chapter }), fullContext, { bookName: getBookDisplayName(primaryVersesForSummary[0].bookId, locale), chapter: primaryVersesForSummary[0].chapter, verse: 0 });
              state.setAiOpen(true);
            }
          }
          break;

        case '?':
          e.preventDefault();
          // 快速提问模式 - 打开 AI 侧边栏并聚焦输入框
          state.setAiOpen(true);
          // 可以通过状态传递一个标志，让 AI 侧边栏自动聚焦输入框
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [book, chapter, verses, handlePrevChapter, handleNextChapter, clearSelection, setIsMenuVisible, locale, primaryVersion]);


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

  // [新增] 处理经文串珠 - 在新标签页打开
  const handleCrossRef = useCallback(() => {
    if (selectedVerses.length === 0) return;

    const primaryVerses = verses.filter(v => v.version === primaryVersion && selectedVerses.includes(v.verse));
    if (primaryVerses.length === 0) return;

    const firstVerse = primaryVerses[0];
    const content = primaryVerses.map(v => v.content).join('');

    // 在新标签页打开串珠
    addTab({
      type: 'cross-ref',
      crossRefSource: {
        bookId: firstVerse.bookId,
        bookName: firstVerse.bookName,
        chapter: firstVerse.chapter,
        verse: firstVerse.verse,
        content,
      },
    });
    setIsMenuVisible(false);
    clearSelection();
  }, [selectedVerses, verses, addTab, setIsMenuVisible, clearSelection, primaryVersion]);

  // [新增] 处理查看地图 - 打开Atlas面板并提取地点
  const handleAtlas = useCallback(() => {
    if (selectedVerses.length === 0) return;

    const primaryVerses = verses.filter(v => v.version === primaryVersion && selectedVerses.includes(v.verse));
    if (primaryVerses.length === 0) return;

    const firstVerse = primaryVerses[0];
    const verseContent = primaryVerses.map(v => v.content).join(' ');
    const verseStart = Math.min(...selectedVerses);
    const verseEnd = Math.max(...selectedVerses);

    // 设置经文上下文到 store
    setAtlasVerseContext({
      bookId: firstVerse.bookId,
      bookName: firstVerse.bookName,
      chapter: firstVerse.chapter,
      verseStart,
      verseEnd,
      verseContent,
    });

    // 打开Atlas面板
    addTab({ type: 'atlas' });
    setAtlasPanelOpen(true);
    setIsMenuVisible(false);
    clearSelection();
  }, [selectedVerses, verses, addTab, setAtlasPanelOpen, setIsMenuVisible, clearSelection, setAtlasVerseContext, primaryVersion]);

  return (
    <div className="w-full flex flex-row relative transition-colors duration-500" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      
      {/* 左侧导航 */}
      <div className="hidden md:flex flex-1 self-stretch group items-start justify-center">
        <div className="sticky top-[50vh] -translate-y-1/2 p-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrevChapter(); }} title={t('reader.prevChapter')}>
           <div className="bg-[var(--apple-chip-translucent)]/64 dark:bg-white/10 p-[10px] rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground dark:hover:text-white active:scale-95 transition-all duration-300">
              <ChevronLeft className="w-8 h-8 opacity-50 group-hover:opacity-100" />
           </div>
        </div>
      </div>

      {/* 中间阅读区 - 增加 overflow-x-hidden */}
      <div className="w-full max-w-5xl xl:max-w-6xl px-4 py-6 md:px-10 pb-4 z-0 overflow-x-hidden">
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
                <ReaderSkeleton
                  verseCount={20}
                  showDualVersion={showDualVersion}
                  fontSize={fontSize}
                />
            ) : error ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                    <p className="text-lg font-semibold text-destructive mb-2">{error}</p>
                    <Button variant="outline" onClick={refetch} className="mt-4">
                        <Loader2 className="w-4 h-4 mr-2" />
                        {t('common.retry')}
                    </Button>
                </div>
            ) : renderList.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <BookOpenCheck className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <p className="text-lg font-semibold text-muted-foreground mb-2">{t('reader.noContent')}</p>
                    <p className="text-sm text-muted-foreground/70">{t('reader.noContentHint')}</p>
                </div>
            ) : (
                <>  
                    <div className="flex items-center justify-center mb-10 md:mb-16 relative mt-4">
                        <h1 className="text-[34px] font-semibold tracking-[-0.374px] leading-[1.47] text-foreground select-none text-center">
                            {getBookDisplayName(book, locale)} <span className="opacity-80 mx-1">·</span> {chapter}
                        </h1>
                    </div>

                    <div className="space-y-0.5 md:space-y-2">
                    {renderList.map((verseNum) => {
                        const entry = verseMap.get(verseNum)!;
                        const cuvVerse = entry.CUV;
                        const kjvVerse = entry.KJV;

                        // Version linkage: primary verse depends on locale
                        const mainVerse = primaryVersion === 'KJV' ? kjvVerse : cuvVerse;
                        const altVerse = primaryVersion === 'KJV' ? cuvVerse : kjvVerse;

                        if (!mainVerse) return null;
                        const isSelected = selectedVerses.includes(verseNum);
                        const highlight = highlights.find(h => h.verse === verseNum && h.bookId === book && h.chapter === parseInt(chapter));
                        const highlightClass = highlight ? HIGHLIGHT_COLORS[highlight.color] : "";

                        return (
                        <div
                            id={`verse-${verseNum}`}
                            key={mainVerse.id}
                            onClick={(e) => handleVerseClick(mainVerse, e)}
                            className={cn(
                                "relative flex items-start px-3 md:px-5 py-2.5 rounded-2xl cursor-pointer transition-all duration-300 group/verse",
                                isSelected ? "bg-primary/10 border-l-[3px] border-l-primary" :
                                highlightClass ? `${highlightClass}` : "hover:bg-black/5 dark:hover:bg-white/5"
                            )}
                        >
                            <span
                              className={cn("text-[14px] font-regular tracking-[-0.224px] leading-[1.43] mr-4 select-none shrink-0 mt-[0.3em] transition-opacity duration-300", isSelected ? "text-primary opacity-100" : "text-foreground/50 group-hover/verse:text-foreground/70")}
                              style={{ fontSize: Math.max(fontSize * 0.55, 10) }}
                            >
                                {verseNum}
                            </span>

                            <div className="flex-1 min-w-0">
                                <div
                                  className={cn("text-[17px] font-regular tracking-[-0.374px] leading-[1.47] transition-colors text-start", isSelected ? "text-foreground font-semibold" : "text-foreground/90")}
                                  style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                                >
                                    {mainVerse.content}
                                </div>
                                {showDualVersion && altVerse && (
                                    <div className="mt-3 text-muted-foreground font-sans tracking-wide" style={{ fontSize: `${fontSize * 0.85}px`, lineHeight: 1.6 }}>
                                        {altVerse.content}
                                    </div>
                                )}
                            </div>

                            {/* [新增] AI 解读快捷按钮 - 仅桌面端悬浮显示 */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const content = mainVerse.content;
                                    const context = verses.filter(v => v.version === primaryVersion).map(v => `[${v.verse}] ${v.content}`).join('\n');
                                    const ref = { bookName: getBookDisplayName(mainVerse.bookId, locale), chapter: mainVerse.chapter, verse: mainVerse.verse };
                                    enqueueAI(t('reader.aiInterpretPrompt'), content, context, ref);
                                    useBibleStore.getState().setAiOpen(true);
                                }}
                                className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/verse:opacity-100 transition-all duration-200 p-1.5 rounded-full bg-primary/5 hover:bg-primary/10 text-primary active:scale-95"
                                title={t('reader.aiInterpret')}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        );
                    })}
                    </div>

                    {/* 全章摘要按钮 */}
                    <div className="mt-20 text-center pb-32">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const primaryVerses = verses.filter(v => v.version === primaryVersion);
                            if (primaryVerses.length > 0) {
                                const fullContext = primaryVerses.map(v => `[${v.chapter}:${v.verse}] ${v.content}`).join('\n');
                                enqueueAI(resolveDualLang(CHAPTER_SUMMARY_PROMPT, locale), t('reader.fullChapter', { book: getBookDisplayName(primaryVerses[0].bookId, locale), chapter: primaryVerses[0].chapter }), fullContext, { bookName: primaryVerses[0].bookName, chapter: primaryVerses[0].chapter, verse: 0 });
                            }
                        }} 
                        className={cn(
                          "group inline-flex items-center gap-2.5 px-[22px] py-[11px] rounded-full",
                          "bg-primary hover:bg-apple-focus text-white text-[17px] font-regular tracking-[-0.374px]",
                          "active:scale-95 transition-all duration-300"
                        )}
                    >
                        <BookOpenCheck className="w-5 h-5 text-white transition-transform duration-300" />
                        {t('reader.chapterSummary', { chapter })}
                    </button>
                    </div>
                </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 右侧导航 */}
      <div className="hidden md:flex flex-1 self-stretch group items-start justify-center">
        <div className="sticky top-[50vh] -translate-y-1/2 p-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNextChapter(); }} title={t('reader.nextChapter')}>
           <div className="bg-[var(--apple-chip-translucent)]/64 dark:bg-white/10 p-[10px] rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground dark:hover:text-white active:scale-95 transition-all duration-300">
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
        onCrossRef={handleCrossRef}
        onAtlas={handleAtlas}
        showAbove={showAbove}
      />
    </div>
  );
}