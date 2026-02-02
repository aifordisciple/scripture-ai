// components/bible/Reader.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { cn } from "@/lib/utils";
import { Loader2, BookOpenCheck, ChevronLeft, ChevronRight } from "lucide-react"; 
import { FloatingMenu } from "./FloatingMenu";
import { CHAPTER_SUMMARY_PROMPT, BIBLE_BOOKS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion"; // 引入动画库

interface Verse {
  id: number;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  content: string;
  version: string;
}

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

// 定义切换动画变体 (滑动效果)
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.98
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.98
  })
};

export function Reader({ initialBook, initialChapter }: ReaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const book = searchParams.get("book") || initialBook;
  const chapter = searchParams.get("chapter") || initialChapter;

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  // 新增：方向状态，1 为下一章，-1 为上一章
  const [direction, setDirection] = useState(0);

  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const { 
    fontSize, lineHeight, selectedVerses, toggleVerseSelection, 
    clearSelection, triggerAI, showEnglish, highlights, setHighlights 
  } = useBibleStore();

  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      clearSelection();
      setIsMenuVisible(false);
      try {
        const [versesRes, highlightsRes] = await Promise.all([
          fetch(`/api/bible?book=${book}&chapter=${chapter}`),
          fetch(`/api/highlight?bookId=${book}&chapter=${chapter}`)
        ]);

        const versesJson = await versesRes.json();
        const highlightsJson = await highlightsRes.json();

        if (versesJson.data) setVerses(versesJson.data);
        if (highlightsJson.data) setHighlights(highlightsJson.data);

      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [book, chapter, clearSelection, setHighlights]);

  const navigateTo = (newBook: string, newChapter: number) => {
      router.push(`/?book=${newBook}&chapter=${newChapter}`);
  };

  const handleNextChapter = () => {
      setDirection(1); // 设置动画方向：向左滑入
      const currentBookIndex = BIBLE_BOOKS.findIndex(b => b.id === book);
      if (currentBookIndex === -1) return;
      const currentBookConfig = BIBLE_BOOKS[currentBookIndex];
      const currentChapterInt = parseInt(chapter);
      if (currentChapterInt < currentBookConfig.chapters) {
          navigateTo(book, currentChapterInt + 1);
      } else if (currentBookIndex < BIBLE_BOOKS.length - 1) {
          const nextBook = BIBLE_BOOKS[currentBookIndex + 1];
          navigateTo(nextBook.id, 1);
      }
  };

  const handlePrevChapter = () => {
      setDirection(-1); // 设置动画方向：向右滑入
      const currentBookIndex = BIBLE_BOOKS.findIndex(b => b.id === book);
      if (currentBookIndex === -1) return;
      const currentChapterInt = parseInt(chapter);
      if (currentChapterInt > 1) {
          navigateTo(book, currentChapterInt - 1);
      } else if (currentBookIndex > 0) {
          const prevBook = BIBLE_BOOKS[currentBookIndex - 1];
          navigateTo(prevBook.id, prevBook.chapters);
      }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const diffX = touchStartRef.current.x - e.changedTouches[0].clientX;
      const diffY = touchStartRef.current.y - e.changedTouches[0].clientY;
      if (Math.abs(diffX) > 80 && Math.abs(diffY) < 60) {
          if (diffX > 0) handleNextChapter(); else handlePrevChapter();
      }
      touchStartRef.current = null;
  };

  const handleVerseClick = (v: Verse, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); 
    toggleVerseSelection(v.verse);
    
    // 计算菜单位置，确保不溢出屏幕
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 200; 
    const screenWidth = window.innerWidth;
    
    let left = rect.left + rect.width / 2;
    if (left - menuWidth / 2 < 10) left = menuWidth / 2 + 10;
    if (left + menuWidth / 2 > screenWidth - 10) left = screenWidth - menuWidth / 2 - 10;

    setMenuPosition({ 
        top: rect.top - 10, 
        left: left
    });
    setIsMenuVisible(true);
  };

  const handleAIExplain = () => {
    if (selectedVerses.length === 0) return;
    const selectedVerseObjects = verses.filter(v => selectedVerses.includes(v.verse));
    if (selectedVerseObjects.length === 0) return;
    const cuvVerses = selectedVerseObjects.filter(v => v.version === 'CUV');
    if (cuvVerses.length === 0) return; 
    const combinedContent = cuvVerses.map(v => `[${v.chapter}:${v.verse}] ${v.content}`).join("\n");
    const minVerseIdx = verses.findIndex(v => v.verse === Math.min(...selectedVerses));
    const maxVerseIdx = verses.findIndex(v => v.verse === Math.max(...selectedVerses));
    const start = Math.max(0, minVerseIdx - 5);
    const end = Math.min(verses.length, maxVerseIdx + 6);
    const contextContent = verses.slice(start, end)
        .filter(v => v.version === 'CUV')
        .map(v => `[${v.chapter}:${v.verse}] ${v.content}`).join("\n");
    const firstV = cuvVerses[0];
    triggerAI("请详细解读这段经文，包含背景、逐节释经和现代应用。", combinedContent, contextContent, { 
        bookName: firstV.bookName, chapter: firstV.chapter, verse: firstV.verse 
    });
    setIsMenuVisible(false);
    clearSelection(); // 触发后清除选择
  };

  const handleCopy = async () => {
    const selectedContent = verses
      .filter(v => selectedVerses.includes(v.verse))
      .sort((a, b) => a.verse - b.verse)
      .reduce((acc, curr) => {
        const existing = acc.find(item => item.verse === curr.verse);
        if (!existing) { acc.push(curr); } 
        else if (curr.version === 'CUV') { const index = acc.indexOf(existing); acc[index] = curr; }
        return acc;
      }, [] as Verse[])
      .map(v => `${v.content} (${v.bookName} ${v.chapter}:${v.verse})`)
      .join("\n");

    if (!selectedContent) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(selectedContent); return; } 
      catch (err) { console.warn("Clipboard API failed, trying fallback...", err); }
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = selectedContent;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999); 
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (e) {
      console.error("Fallback copy failed:", e);
      alert("复制失败，请手动复制");
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setIsMenuVisible(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const verseMap = new Map<number, { CUV?: Verse, KJV?: Verse }>();
  verses.forEach(v => {
    if (!verseMap.has(v.verse)) verseMap.set(v.verse, {});
    const entry = verseMap.get(v.verse)!;
    if (v.version === 'CUV') entry.CUV = v;
    if (v.version === 'KJV') entry.KJV = v;
  });
  const renderList = Array.from(verseMap.keys()).sort((a, b) => a - b);

  return (
    <div className="w-full min-h-screen flex flex-row relative bg-white dark:bg-slate-950 transition-colors duration-300" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      
      {/* 左侧导航区域 */}
      <div className="hidden md:flex flex-1 self-stretch group items-start justify-center transition-colors">
        <div 
            className="sticky top-[50vh] -translate-y-1/2 p-4 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); handlePrevChapter(); }} 
            title="上一章"
        >
           <div className="bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-full shadow-sm backdrop-blur-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 transition-all">
              <ChevronLeft className="w-8 h-8" />
           </div>
        </div>
      </div>

      {/* 中间阅读区 (添加了动画容器) */}
      <div className="w-full max-w-5xl px-4 py-8 md:px-8 pb-32 bg-white dark:bg-slate-950 shadow-sm min-h-screen z-0">
        
        {/* 使用 AnimatePresence 管理进出场动画 */}
        <AnimatePresence mode='wait' custom={direction} initial={false}>
          <motion.div
            key={`${book}-${chapter}`} // 关键：key 变化触发动画
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="w-full"
          >
            {loading ? (
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            ) : (
                <>
                    <h1 className="text-3xl font-serif font-bold text-center mb-8 text-slate-800 dark:text-slate-100 select-none">
                    {verses[0]?.bookName || book} 第 {chapter} 章
                    </h1>

                    <div className="space-y-2">
                    {renderList.map((verseNum) => {
                        const entry = verseMap.get(verseNum)!;
                        const cuvVerse = entry.CUV;
                        const kjvVerse = entry.KJV;
                        
                        if (!cuvVerse) return null;
                        const isSelected = selectedVerses.includes(verseNum);
                        
                        const highlight = highlights.find(h => h.verse === verseNum);
                        const highlightClass = highlight ? HIGHLIGHT_COLORS[highlight.color] : "";

                        return (
                        <div
                            key={cuvVerse.id}
                            onClick={(e) => handleVerseClick(cuvVerse, e)}
                            className={cn(
                            "relative flex items-start px-2 py-1.5 rounded cursor-pointer transition-all duration-200 group/verse border border-transparent",
                            isSelected 
                                ? "bg-blue-100 dark:bg-blue-900/60 border-blue-300 dark:border-blue-500 shadow-sm" 
                                : highlightClass 
                                ? `${highlightClass} border-transparent`
                                : "hover:bg-slate-50 dark:hover:bg-slate-900"
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

                    <div className="mt-16 text-center">
                    <button onClick={(e) => { e.stopPropagation(); const cuvVerses = verses.filter(v => v.version === 'CUV'); if (cuvVerses.length > 0) { const fullContext = cuvVerses.map(v => `[${v.chapter}:${v.verse}] ${v.content}`).join('\n'); triggerAI(CHAPTER_SUMMARY_PROMPT, `【${cuvVerses[0].bookName} 第 ${cuvVerses[0].chapter} 章】全章`, fullContext, { bookName: cuvVerses[0].bookName, chapter: cuvVerses[0].chapter, verse: 0 }); } }} className="shadow-md inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full transition-colors font-medium text-sm">
                        <BookOpenCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        生成第 {chapter} 章摘要
                    </button>
                    </div>
                </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 右侧导航区域 */}
      <div className="hidden md:flex flex-1 self-stretch group items-start justify-center transition-colors">
        <div 
            className="sticky top-[50vh] -translate-y-1/2 p-4 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); handleNextChapter(); }} 
            title="下一章"
        >
           <div className="bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-full shadow-sm backdrop-blur-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 transition-all">
              <ChevronRight className="w-8 h-8" />
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