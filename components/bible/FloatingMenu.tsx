// components/bible/FloatingMenu.tsx
"use client";

import { useEffect, useState } from "react";
import { Sparkles, Copy, X, Highlighter, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBibleStore } from "@/store/useBibleStore";

interface FloatingMenuProps {
  visible: boolean;
  position: { top: number; left: number };
  onClose: () => void;
  onExplain: () => void;
  selectedCount: number;
  currentBook: string; // 传入当前书卷
  currentChapter: number; // 传入当前章
}

const COLORS = [
  { id: 'yellow', bg: 'bg-yellow-300', border: 'border-yellow-500' },
  { id: 'green', bg: 'bg-green-300', border: 'border-green-500' },
  { id: 'blue', bg: 'bg-blue-300', border: 'border-blue-500' },
  { id: 'red', bg: 'bg-red-300', border: 'border-red-500' },
  { id: 'none', bg: 'bg-slate-100', border: 'border-slate-300', icon: true } // 清除
];

export function FloatingMenu({ visible, position, onClose, onExplain, selectedCount, currentBook, currentChapter }: FloatingMenuProps) {
  const [render, setRender] = useState(false);
  const { selectedVerses, addHighlightLocally, removeHighlightLocally, openNoteEditor } = useBibleStore();

  useEffect(() => {
    if (visible) setRender(true);
    else {
      const timer = setTimeout(() => setRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // 处理高亮点击
  const handleHighlight = async (color: string) => {
    // 1. 乐观更新 Store
    selectedVerses.forEach(verse => {
      if (color === 'none') {
        removeHighlightLocally(currentBook, currentChapter, verse);
      } else {
        addHighlightLocally({ bookId: currentBook, chapter: currentChapter, verse, color });
      }
    });

    // 2. 发送 API 请求 (后台静默保存)
    await fetch('/api/highlight', {
      method: 'POST',
      body: JSON.stringify({
        bookId: currentBook,
        chapter: currentChapter,
        verses: selectedVerses,
        color: color === 'none' ? null : color
      })
    });
    
    // 不关闭菜单，允许连续操作，或者你可以选择关闭
    // onClose(); 
  };

  const handleCopy = () => {
    // 简单的复制逻辑，后续可扩展为带格式复制
    const text = `已复制 ${selectedCount} 节经文`; 
    alert(text); // 临时替代
    onClose();
  };

  const handleNote = () => {
    if (selectedVerses.length > 0) {
      // 打开笔记编辑器，默认关联第一节选中的经文
      openNoteEditor(currentBook, currentChapter, selectedVerses[0]);
      onClose();
    }
  };

  if (!render) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-1 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl transition-all duration-200 ease-out origin-bottom border dark:border-slate-700",
        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
      )}
      style={{
        top: position.top, 
        left: position.left,
        transform: "translate(-50%, -100%) translateY(-10px)" // 向上偏移显示在文字上方
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 第一行：颜色选择器 */}
      <div className="flex items-center gap-2 pb-2 border-b dark:border-slate-700 mb-1 px-1 justify-center">
        {COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => handleHighlight(c.id)}
            className={cn(
              "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center",
              c.bg, c.border
            )}
            title={c.id === 'none' ? "清除高亮" : "标记颜色"}
          >
            {c.icon && <X className="w-3 h-3 text-slate-500" />}
          </button>
        ))}
      </div>

      {/* 第二行：功能按钮 */}
      <div className="flex items-center gap-1">
        <div className="px-2 text-[10px] font-bold text-slate-400 border-r dark:border-slate-700 mr-1">
          {selectedCount} 节
        </div>
        
        <button onClick={onExplain} className="flex flex-col items-center p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group">
          <Sparkles className="w-4 h-4 text-purple-500 mb-0.5" />
          <span className="text-[10px] text-slate-600 dark:text-slate-300">AI解读</span>
        </button>

        <button onClick={handleNote} className="flex flex-col items-center p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group">
          <PenLine className="w-4 h-4 text-blue-500 mb-0.5" />
          <span className="text-[10px] text-slate-600 dark:text-slate-300">写笔记</span>
        </button>

        <button onClick={handleCopy} className="flex flex-col items-center p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group">
          <Copy className="w-4 h-4 text-green-500 mb-0.5" />
          <span className="text-[10px] text-slate-600 dark:text-slate-300">复制</span>
        </button>
      </div>

      {/* 底部小三角 */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white dark:border-t-slate-800" />
    </div>
  );
}