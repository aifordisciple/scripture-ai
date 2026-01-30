// components/bible/Reader.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { cn } from "@/lib/utils";
import { Loader2, BookOpenCheck } from "lucide-react";
import { FloatingMenu } from "./FloatingMenu";
import { CHAPTER_SUMMARY_PROMPT } from "@/lib/constants";

interface Verse {
  id: number;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  content: string;
}

export function Reader() {
  const searchParams = useSearchParams();
  const book = searchParams.get("book") || "Gen";
  const chapter = searchParams.get("chapter") || "1";

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 浮动菜单状态 ---
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // Store
  const { fontSize, selectedVerses, toggleVerseSelection, clearSelection, triggerAI } = useBibleStore();

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

  // --- 处理点击选中 ---
  const handleVerseClick = (v: Verse, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation(); 

    toggleVerseSelection(v.verse);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({
      top: rect.top - 10,
      left: rect.left + rect.width / 2
    });

    setIsMenuVisible(true);
  };

  // --- 核心：处理“AI 解读”动作 (区分选中内容和上下文) ---
  const handleAIExplain = () => {
    if (selectedVerses.length === 0) return;

    // 1. 获取所有选中的经文对象
    const selectedVerseObjects = verses.filter(v => selectedVerses.includes(v.verse));
    if (selectedVerseObjects.length === 0) return;

    // 2. 拼接【选中的经文】 (主角)
    const combinedContent = selectedVerseObjects
      .map(v => `[${v.chapter}:${v.verse}] ${v.content}`)
      .join("\n");

    // 3. 生成【上下文经文】 (配角)
    const minVerseIdx = verses.findIndex(v => v.verse === Math.min(...selectedVerses));
    const maxVerseIdx = verses.findIndex(v => v.verse === Math.max(...selectedVerses));
    
    // 取前后各 5 节
    const start = Math.max(0, minVerseIdx - 5);
    const end = Math.min(verses.length, maxVerseIdx + 6);
    
    // 这里的 Context 不需要标记 Target，只需要提供纯净的背景文本
    const contextContent = verses.slice(start, end).map(v => {
        return `[${v.chapter}:${v.verse}] ${v.content}`;
    }).join("\n");

    // 4. 构造引用信息
    const firstV = selectedVerseObjects[0];
    
    // 5. 触发 AI
    triggerAI(
      "解读选中的这段经文的核心要义，不超过300字。", 
      combinedContent, // 参数 content: 这是用户选中的重点
      contextContent,  // 参数 context: 这是周围的背景参考
      { 
        bookName: firstV.bookName, 
        chapter: firstV.chapter, 
        verse: firstV.verse 
      }
    );

    setIsMenuVisible(false);
  };

  // 点击空白处关闭菜单
  useEffect(() => {
    const handleClickOutside = () => setIsMenuVisible(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 relative min-h-screen">
      <h1 className="text-3xl font-serif font-bold text-center mb-8 text-slate-800">
        {verses[0]?.bookName || book} 第 {chapter} 章
      </h1>

      <div className="space-y-2 pb-32">
        {verses.map((v) => {
          const isSelected = selectedVerses.includes(v.verse);
          return (
            <div
              key={v.id}
              onClick={(e) => handleVerseClick(v, e)}
              className={cn(
                "relative px-2 py-1 rounded cursor-pointer transition-all duration-200 group border border-transparent",
                isSelected ? "bg-yellow-100 border-blue-200 shadow-sm" : "hover:bg-slate-50"
              )}
            >
              <span 
                 className={cn("text-xs font-bold mr-2 select-none align-text-top", isSelected ? "text-blue-600" : "text-slate-400")}
                 style={{ fontSize: fontSize * 0.6 }} 
              >
                {v.verse}
              </span>
              <span
                className={cn(
                  "leading-loose font-serif transition-colors",
                  isSelected ? "text-slate-900 font-medium" : "text-slate-800"
                )}
                style={{ fontSize: `${fontSize}px` }} 
              >
                {v.content}
              </span>
            </div>
          );
        })}
      </div>

      {/* 整章总结按钮 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:mt-12 md:mb-8 md:text-center z-30">
        <button 
          onClick={(e) => {
             e.stopPropagation();
             if (verses.length > 0) {
                 const fullContext = verses.map(v => `[${v.chapter}:${v.verse}] ${v.content}`).join('\n');
                 triggerAI(
                    CHAPTER_SUMMARY_PROMPT, 
                    `【${verses[0].bookName} 第 ${verses[0].chapter} 章】全章`, 
                    fullContext, // 全章内容既是 content 也是 context
                    { bookName: verses[0].bookName, chapter: verses[0].chapter, verse: 0 }
                 );
             }
          }}
          className="shadow-lg inline-flex items-center gap-2 px-6 py-3 bg-white border hover:bg-slate-50 text-slate-700 rounded-full transition-colors font-medium text-sm"
        >
          <BookOpenCheck className="w-5 h-5 text-blue-600" />
          生成第 {chapter} 章摘要
        </button>
      </div>

      <FloatingMenu 
        visible={isMenuVisible && selectedVerses.length > 0} 
        position={menuPosition}
        selectedCount={selectedVerses.length}
        onClose={() => {
            setIsMenuVisible(false);
            clearSelection();
        }}
        onExplain={handleAIExplain}
      />
    </div>
  );
}