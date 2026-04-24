// components/bible/FloatingMenu.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, Copy, X, PenLine, Share2, GitBranch, ChevronDown, ChevronUp, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBibleStore } from "@/store/useBibleStore";
import { useSession } from "next-auth/react";
import { THEOLOGICAL_PROMPTS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

interface FloatingMenuProps {
  visible: boolean;
  position: { top: number; left: number };
  onClose: () => void;
  onExplain: (customPrompt?: string) => void;
  selectedCount: number;
  currentBook: string;
  currentChapter: number;
  onCopy: () => void;
  onCrossRef?: () => void;
  onAtlas?: () => void;
  showAbove?: boolean; // 菜单显示在选中元素上方还是下方
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
  { id: 'detail', labelKey: 'floatingMenu.deepInterpret', prompt: THEOLOGICAL_PROMPTS[0].prompt },
  { id: 'original', labelKey: 'floatingMenu.originalMeaning', prompt: THEOLOGICAL_PROMPTS[2].prompt },
  { id: 'application', labelKey: 'floatingMenu.lifeApply', prompt: THEOLOGICAL_PROMPTS[3].prompt },
  { id: 'prayer', labelKey: 'floatingMenu.prayerRespond', prompt: THEOLOGICAL_PROMPTS[4].prompt },
];

export function FloatingMenu({ visible, position, onClose, onExplain, selectedCount, currentBook, currentChapter, onCopy, onCrossRef, onAtlas, showAbove = true }: FloatingMenuProps) {
  const { t } = useTranslation();
  const [render, setRender] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAiSubmenu, setShowAiSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { selectedVerses, addHighlightLocally, removeHighlightLocally, openNoteEditor, openShareModal, clearSelection, locale } = useBibleStore();
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

  // 阻止菜单内部的点击事件冒泡到 document
  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };

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

  // 处理 AI 模式选择 - 传递对应模式的 prompt
  const handleAiOption = (option: typeof AI_OPTIONS[0], e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setShowAiSubmenu(false);
    onClose();
    // 根据当前语言解析 prompt
    const prompt = typeof option.prompt === 'object' ? option.prompt[locale] : option.prompt;
    onExplain(prompt);
  };

  // 切换 AI 子菜单
  const handleToggleSubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setShowAiSubmenu(!showAiSubmenu);
  };

  // 主按钮点击
  const handleMainExplain = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    onClose();
    onExplain();
  };

  if (!render) return null;

  // 根据位置决定 transform
  const transformStyle = showAbove
    ? "translate(-50%, -100%) translateY(-12px)"
    : "translate(-50%, 12px)";

  // 箭头位置
  const arrowClass = showAbove
    ? "absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white dark:border-t-slate-900 drop-shadow-sm"
    : "absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white dark:border-b-slate-900 drop-shadow-sm";

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-50 flex flex-col gap-2 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl transition-all duration-200 ease-out origin-bottom border border-slate-100 dark:border-slate-800 w-[240px]",
        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
      )}
      style={{
        top: position.top,
        left: position.left,
        transform: transformStyle
      }}
      onClick={handleMenuClick}
      onMouseDown={handleMenuClick}
      onPointerDown={handleMenuClick}
    >
      {/* 1. 颜色选择区 */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-slate-400">{t('floatingMenu.mark')}</span>
        <div className="flex gap-2">
            {COLORS.map((c) => (
            <button
                key={c.id}
                onClick={(e) => { handleMenuClick(e); handleHighlight(c.id); }}
                className={cn(
                "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center",
                c.bg, c.border
                )}
                aria-label={c.id === 'none' ? t('floatingMenu.clearHighlight') : t('floatingMenu.highlightColor', { color: c.id })}
            >
                {c.icon && <X className="w-3 h-3 text-slate-500" />}
            </button>
            ))}
        </div>
      </div>

      {/* 2. AI 解读按钮 - 点击主按钮直接解读，下拉箭头展开更多选项 */}
      <div className="relative">
        <div className="flex gap-1">
          {/* 主按钮 - 点击直接解读 */}
          <button
            onClick={handleMainExplain}
            onMouseDown={handleMenuClick}
            onPointerDown={handleMenuClick}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-95 group"
            aria-label={t('floatingMenu.aiDeep')}
          >
            <Sparkles className="w-4 h-4 fill-current animate-pulse" />
            <span className="font-bold text-sm">{t('floatingMenu.aiDeep')}</span>
          </button>
          {/* 下拉箭头按钮 */}
          <button
            onClick={handleToggleSubmenu}
            onMouseDown={handleMenuClick}
            onPointerDown={handleMenuClick}
            className={cn(
              "px-2 py-2.5 rounded-xl shadow-md transition-all active:scale-95",
              "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
              "text-white",
              "border-l border-white/20"
            )}
            aria-label={t('floatingMenu.aiMore')}
            title={t('floatingMenu.aiMore')}
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
              onClick={handleMenuClick}
              onMouseDown={handleMenuClick}
            >
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
                {AI_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={(e) => handleAiOption(option, e)}
                    onMouseDown={handleMenuClick}
                    onPointerDown={handleMenuClick}
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
                    {t(option.labelKey)}
                  </button>
                ))}
                <button
                  onClick={(e) => handleAiOption(AI_OPTIONS[0], e)}
                  onMouseDown={handleMenuClick}
                  onPointerDown={handleMenuClick}
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
                  {t('floatingMenu.moreModes')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. 次要操作区 (笔记、分享、串珠、地图、主题、复制) - 6列 */}
      <div className="grid grid-cols-6 gap-1 pt-1 border-t dark:border-slate-800">
        <button
          onClick={(e) => { handleMenuClick(e); handleNote(); }}
          onMouseDown={handleMenuClick}
          onPointerDown={handleMenuClick}
          className="flex flex-col items-center py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          aria-label={t('floatingMenu.addNote')}
        >
          <PenLine className="w-4 h-4 text-slate-500 dark:text-slate-400 mb-1" />
          <span className="text-[10px] text-slate-500">{t('floatingMenu.note')}</span>
        </button>

        <button
          onClick={(e) => { handleMenuClick(e); handleShare(); }}
          onMouseDown={handleMenuClick}
          onPointerDown={handleMenuClick}
          className="flex flex-col items-center py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          aria-label={t('floatingMenu.shareVerse')}
        >
          <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-400 mb-1" />
          <span className="text-[10px] text-slate-500">{t('floatingMenu.share')}</span>
        </button>

        {onCrossRef && (
          <button
            onClick={(e) => { handleMenuClick(e); onCrossRef(); }}
            onMouseDown={handleMenuClick}
            onPointerDown={handleMenuClick}
            className="flex flex-col items-center py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            aria-label={t('floatingMenu.viewCrossRef')}
          >
            <GitBranch className="w-4 h-4 text-slate-500 dark:text-slate-400 mb-1" />
            <span className="text-[10px] text-slate-500">{t('floatingMenu.crossRef')}</span>
          </button>
        )}

        {onAtlas && (
          <button
            onClick={(e) => { handleMenuClick(e); onAtlas(); }}
            onMouseDown={handleMenuClick}
            onPointerDown={handleMenuClick}
            className="flex flex-col items-center py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            aria-label={t('floatingMenu.viewAtlas')}
          >
            <Map className="w-4 h-4 text-indigo-500 dark:text-indigo-400 mb-1" />
            <span className="text-[10px] text-slate-500">{t('floatingMenu.atlas')}</span>
          </button>
        )}

        <button
          onClick={(e) => { handleMenuClick(e); handleCopyClick(); }}
          onMouseDown={handleMenuClick}
          onPointerDown={handleMenuClick}
          className="flex flex-col items-center py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          aria-label={copied ? t('floatingMenu.copiedToClipboard') : t('floatingMenu.copyVerse')}
        >
          <Copy className={cn("w-4 h-4 mb-1", copied ? "text-green-600" : "text-slate-500 dark:text-slate-400")} />
          <span className={cn("text-[10px]", copied ? "text-green-600 font-bold" : "text-slate-500")}>
            {copied ? t('floatingMenu.copied') : t('floatingMenu.copy')}
          </span>
        </button>
      </div>

      {/* 小箭头 */}
      <div className={arrowClass} />
    </div>
  );
}