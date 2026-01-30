// components/bible/Reader.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { cn } from "@/lib/utils";
import { Loader2, BookOpenCheck, ChevronLeft, ChevronRight } from "lucide-react"; 
import { FloatingMenu } from "./FloatingMenu";
import { CHAPTER_SUMMARY_PROMPT, BIBLE_BOOKS } from "@/lib/constants";

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

export function Reader({ initialBook, initialChapter }: ReaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 优先读取 URL 参数
  const book = searchParams.get("book") || initialBook;
  const chapter = searchParams.get("chapter") || initialChapter;

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  // 浮动菜单状态
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // Store
  const { 
    fontSize, 
    lineHeight, 
    selectedVerses, 
    toggleVerseSelection, 
    clearSelection, 
    triggerAI, 
    showEnglish 
  } = useBibleStore();

  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
    async function fetchVerses() {
      setLoading(true);
      clearSelection();
      setIsMenuVisible(false);
      try {
        const res = await fetch(`/api/bible?book=${book}&chapter=${chapter}`);
        const json = await res.json();
        if (json.data) setVerses(json.data);
      } catch (error) {
        console.error("Failed to fetch verses:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchVerses();
  }, [book, chapter, clearSelection]);

  // --- 导航逻辑 ---
  const navigateTo = (newBook: string, newChapter: number) => {
      router.push(`/?book=${newBook}&chapter=${newChapter}`);
  };

  const handleNextChapter = () => {
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

  // --- 手势处理 ---
  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
      };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touchEnd = {
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY
      };
      const diffX = touchStartRef.current.x - touchEnd.x; 
      const diffY = touchStartRef.current.y - touchEnd.y;

      if (Math.abs(diffX) > 80 && Math.abs(diffY) < 60) {
          if (diffX > 0) handleNextChapter();
          else handlePrevChapter();
      }
      touchStartRef.current = null;
  };

  // --- 点击与AI处理 ---
  const handleVerseClick = (v: Verse, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); 
    toggleVerseSelection(v.verse);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({ top: rect.top - 10, left: rect.left + rect.width / 2 });
    setIsMenuVisible(true);
  };

  const handleAIExplain = () => {
    if (selectedVerses.length === 0) return;
    const selectedVerseObjects = verses.filter(v => selectedVerses.includes(v.verse));
    if (selectedVerseObjects.length === 0) return;

    // 只发送中文给 AI
    const cuvVerses = selectedVerseObjects.filter(v => v.version === 'CUV');
    if (cuvVerses.length === 0) return; // 容错

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
  };

  // 点击空白关闭菜单
  useEffect(() => {
    const handleClickOutside = () => setIsMenuVisible(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // 数据分组 (CUV + KJV)
  const verseMap = new Map<number, { CUV?: Verse, KJV?: Verse }>();
  verses.forEach(v => {
    if (!verseMap.has(v.verse)) verseMap.set(v.verse, {});
    const entry = verseMap.get(v.verse)!;
    if (v.version === 'CUV') entry.CUV = v;
    if (v.version === 'KJV') entry.KJV = v;
  });
  const renderList = Array.from(verseMap.keys()).sort((a, b) => a - b);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  return (
    // --- 根布局: Flex ---
    // 左栏 (flex-1) + 内容 (max-w-3xl) + 右栏 (flex-1)
    // 默认 items-stretch，保证左右侧边栏高度填满，即使内容很长
    <div 
        className="w-full min-h-screen flex flex-row relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
    >

      {/* --- 左侧点击区域 (上一章) --- */}
      {/* 1. hidden md:flex: 仅桌面端显示
         2. flex-1: 填满左侧空白
         3. self-stretch: 高度跟随父容器（即跟随内容高度），确保底部空白也能触发
         4. group: Hover 状态容器
         5. sticky top-[50vh]: 图标固定在视口垂直中心
      */}
      <div 
        className="hidden md:flex flex-1 self-stretch group items-start justify-center cursor-pointer hover:bg-slate-50/30 transition-colors"
        onClick={(e) => { e.stopPropagation(); handlePrevChapter(); }}
        title="上一章"
      >
        <div className="sticky top-[50vh] -translate-y-1/2 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
           <div className="bg-slate-100/80 p-3 rounded-full shadow-sm backdrop-blur-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 hover:scale-110 transition-all">
              <ChevronLeft className="w-8 h-8" />
           </div>
        </div>
      </div>

      {/* --- 中间核心内容区 --- */}
      <div className="w-full max-w-3xl px-4 py-8 md:px-8 pb-32 bg-white shadow-sm min-h-screen z-0">
        <h1 className="text-3xl font-serif font-bold text-center mb-8 text-slate-800">
          {verses[0]?.bookName || book} 第 {chapter} 章
        </h1>

        <div className="space-y-2">
          {renderList.map((verseNum) => {
            const entry = verseMap.get(verseNum)!;
            const cuvVerse = entry.CUV;
            const kjvVerse = entry.KJV;
            
            if (!cuvVerse) return null;
            const isSelected = selectedVerses.includes(verseNum);

            return (
              <div
                key={cuvVerse.id}
                onClick={(e) => handleVerseClick(cuvVerse, e)}
                className={cn(
                  "relative flex items-start px-2 py-1.5 rounded cursor-pointer transition-all duration-200 group/verse border border-transparent",
                  isSelected ? "bg-yellow-100 border-blue-200 shadow-sm" : "hover:bg-slate-50"
                )}
              >
                <span 
                   className={cn(
                     "font-bold mr-3 select-none shrink-0 mt-0.5", 
                     isSelected ? "text-blue-600" : "text-slate-400"
                   )}
                   style={{ fontSize: fontSize * 0.6 }} 
                >
                  {verseNum}
                </span>
                
                <div className="flex-1 min-w-0">
                  {/* 中文 */}
                  <div 
                      className={cn(
                        "font-serif transition-colors text-justify",
                        isSelected ? "text-slate-900 font-medium" : "text-slate-800"
                      )}
                      style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }} 
                  >
                      {cuvVerse.content}
                  </div>
                  {/* 英文 (KJV) */}
                  {showEnglish && kjvVerse && (
                     <div className="mt-1 text-slate-500 font-sans"
                          style={{ fontSize: `${fontSize * 0.85}px`, lineHeight: 1.4 }}>
                       {kjvVerse.content}
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 整章总结按钮 */}
        <div className="mt-16 text-center">
          <button 
            onClick={(e) => {
               e.stopPropagation();
               // 只传中文做总结
               const cuvVerses = verses.filter(v => v.version === 'CUV');
               if (cuvVerses.length > 0) {
                   const fullContext = cuvVerses.map(v => `[${v.chapter}:${v.verse}] ${v.content}`).join('\n');
                   triggerAI(
                      CHAPTER_SUMMARY_PROMPT, 
                      `【${cuvVerses[0].bookName} 第 ${cuvVerses[0].chapter} 章】全章`, 
                      fullContext, 
                      { bookName: cuvVerses[0].bookName, chapter: cuvVerses[0].chapter, verse: 0 }
                   );
               }
            }}
            className="shadow-md inline-flex items-center gap-2 px-6 py-3 bg-white border hover:bg-slate-50 text-slate-700 rounded-full transition-colors font-medium text-sm"
          >
            <BookOpenCheck className="w-5 h-5 text-blue-600" />
            生成第 {chapter} 章摘要
          </button>
        </div>
      </div>

      {/* --- 右侧点击区域 (下一章) --- */}
      <div 
        className="hidden md:flex flex-1 self-stretch group items-start justify-center cursor-pointer hover:bg-slate-50/30 transition-colors"
        onClick={(e) => { e.stopPropagation(); handleNextChapter(); }}
        title="下一章"
      >
        <div className="sticky top-[50vh] -translate-y-1/2 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
           <div className="bg-slate-100/80 p-3 rounded-full shadow-sm backdrop-blur-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 hover:scale-110 transition-all">
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
      />
    </div>
  );
}