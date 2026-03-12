// components/bible/FloatingMenu.tsx
"use client";

import { useEffect, useState } from "react";
import { Sparkles, Copy, X, PenLine, Share2, GitBranch, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBibleStore } from "@/store/useBibleStore";
import { useSession } from "next-auth/react";
import { THEOLOGICAL_PROMPTS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingMenuProps {
  visible: boolean;
  position: { top: number; left: number };
  onClose: () => void;
  onExplain: () => void;
  selectedCount: number;
  currentBook: string;
  currentChapter: number;
  onCopy: () => void;
  onCrossRef?: () => void;
}

const COLORS = [
  { id: 'yellow', bg: 'bg-yellow-300', border: 'border-yellow-500' },
  { id: 'green', bg: 'bg-green-300', border: 'border-green-500' },
  { id: 'blue', bg: 'bg-blue-300', border: 'border-blue-500' },
  { id: 'red', bg: 'bg-red-300', border: 'border-red-500' },
  { id: 'none', bg: 'bg-slate-100', border: 'border-slate-300', icon: true }
];

// AI 快捷选项
const AI_OPTIONS = [
  { id: 'detail', label: '深度解读', prompt: THEOLOGICAL_PROMPTS[0].prompt },
  { id: 'original', label: '原文词义', prompt: THEOLOGICAL_PROMPTS[2].prompt },
  { id: 'application', label: '生活应用', prompt: THEOLOGICAL_PROMPTS[3].prompt },
  { id: 'prayer', label: '祷告回应', prompt: THEOLOGICAL_PROMPTS[4].prompt },
];

export function FloatingMenu({ visible, position, onClose, onExplain, selectedCount, currentBook, currentChapter, onCopy, onCrossRef }: FloatingMenuProps) {
  const [render, setRender] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAiSubmenu, setShowAiSubmenu] = useState(false);
  const { selectedVerses, addHighlightLocally, removeHighlightLocally, openNoteEditor, openShareModal, clearSelection } = useBibleStore();
  const { data: session } = useSession();

  useEffect(() => {
    if (visible) {
        setRender(true);
        setCopied(false);
        setShowAiSubmenu(false);
    } else {
      const timer = setTimeout(() => setRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleHighlight = async (color: string) => {
    selectedVerses.forEach(verse => {
      if (color === 'none') {
        removeHighlightLocally(currentBook, currentChapter, verse);
      } else {
        addHighlightLocally({ bookId: currentBook, chapter: currentChapter, verse, color });
      }
    });

    if (session?.user) {
        const promises = selectedVerses.map(verse =>
            fetch('/api/highlight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId: currentBook,
                    chapter: currentChapter,
                    verse: verse,
                    color: color === 'none' ? null : color,
                    action: color === 'none' ? 'remove' : 'add'
                })
            })
        );
        Promise.all(promises).catch(err => console.error("Sync highlight failed", err));
    }

    clearSelection();
    onClose();
  };

  const handleCopyClick = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => {
        clearSelection();
        onClose();
    }, 800);
  };

  const handleNote = () => {
    if (selectedVerses.length > 0) {
      openNoteEditor(currentBook, currentChapter, selectedVerses[0]);
      onClose();
    }
  };

  const handleShare = () => {
    if (selectedVerses.length > 0) {
      openShareModal(currentBook, currentChapter, selectedVerses);
      onClose();
    }
  };

  // 处理 AI 模式选择 - 直接调用 onExplain 并关闭菜单
  const handleAiOption = (option: typeof AI_OPTIONS[0]) => {
    setShowAiSubmenu(false);
    onClose();
    // 调用默认的解读逻辑
    onExplain();
  };

  if (!render) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-2 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl transition-all duration-200 ease-out origin-bottom border border-slate-100 dark:border-slate-800 w-[240px]",
        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
      )}
      style={{
        top: position.top,
        left: position.left,
        transform: "translate(-50%, -100%) translateY(-12px)"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. 颜色选择区 */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-slate-400">标记</span>
        <div className="flex gap-2">
            {COLORS.map((c) => (
            <button
                key={c.id}
                onClick={() => handleHighlight(c.id)}
                className={cn(
                "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center",
                c.bg, c.border
                )}
            >
                {c.icon && <X className="w-3 h-3 text-slate-500" />}
            </button>
            ))}
        </div>
      </div>

      {/* 2. [修改] AI 解读按钮 - 点击主按钮直接解读，下拉箭头展开更多选项 */}
      <div className="relative">
        <div className="flex gap-1">
          {/* 主按钮 - 点击直接解读 */}
          <button
            onClick={() => {
              onClose();
              onExplain();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-95 group"
          >
            <Sparkles className="w-4 h-4 fill-current animate-pulse" />
            <span className="font-bold text-sm">AI 深度解读</span>
          </button>
          {/* 下拉箭头按钮 */}
          <button
            onClick={() => setShowAiSubmenu(!showAiSubmenu)}
            className={cn(
              "px-2 py-2.5 rounded-xl shadow-md transition-all active:scale-95",
              "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
              "text-white",
              "border-l border-white/20"
            )}
            title="更多 AI 模式"
          >
            {showAiSubmenu ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* AI 子菜单 */}
        <AnimatePresence>
          {showAiSubmenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden mt-1"
            >
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
                {AI_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAiOption(option)}
                    className={cn(
                      "flex items-center justify-center gap-1 py-2 px-2 rounded-lg",
                      "text-xs font-medium",
                      "bg-white dark:bg-slate-700",
                      "hover:bg-blue-50 dark:hover:bg-blue-900/30",
                      "text-slate-700 dark:text-slate-200",
                      "hover:text-blue-600 dark:hover:text-blue-400",
                      "transition-colors duration-150",
                      "border border-slate-200 dark:border-slate-600"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowAiSubmenu(false);
                    onClose();
                    onExplain();
                  }}
                  className={cn(
                    "col-span-2 flex items-center justify-center gap-1 py-2 px-2 rounded-lg",
                    "text-xs font-medium",
                    "bg-gradient-to-r from-blue-500 to-indigo-500",
                    "text-white",
                    "hover:from-blue-600 hover:to-indigo-600",
                    "transition-colors duration-150"
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  更多模式...
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2.5 [新增] 经文串珠按钮 */}
      {onCrossRef && (
        <button
          onClick={onCrossRef}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-md transition-all active:scale-95 group"
        >
          <GitBranch className="w-4 h-4" />
          <span className="font-bold text-sm">经文串珠</span>
        </button>
      )}

      {/* 3. 次要操作区 (笔记、分享、复制) */}
      <div className="grid grid-cols-3 gap-1 pt-1 border-t dark:border-slate-800">
        <button onClick={handleNote} className="flex flex-col items-center py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <PenLine className="w-4 h-4 text-slate-500 dark:text-slate-400 mb-1" />
          <span className="text-[10px] text-slate-500">笔记</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-400 mb-1" />
          <span className="text-[10px] text-slate-500">分享</span>
        </button>

        <button onClick={handleCopyClick} className="flex flex-col items-center py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Copy className={cn("w-4 h-4 mb-1", copied ? "text-green-600" : "text-slate-500 dark:text-slate-400")} />
          <span className={cn("text-[10px]", copied ? "text-green-600 font-bold" : "text-slate-500")}>
            {copied ? "已复制" : "复制"}
          </span>
        </button>
      </div>

      {/* 小箭头 */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white dark:border-t-slate-900 drop-shadow-sm" />
    </div>
  );
}