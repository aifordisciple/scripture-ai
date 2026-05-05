// components/bible/MagicBall.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, useAnimation, PanInfo, TapInfo, AnimatePresence } from "framer-motion";
import { useBibleStore } from "@/store/useBibleStore";
import {
  Sparkles, Maximize, Minimize, PanelLeft, Bot, X, Move, MousePointerClick,
  ListOrdered, Loader2, BookOpen, AlertCircle, BookOpenCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RadialMenu } from "./RadialMenu";
import { QuickAction } from "@/store/types";
import { useTranslation } from "@/lib/i18n";

interface MagicBallProps {
  /** 打开书卷选择器的回调 */
  onOpenBookPicker?: () => void;
  /** 书卷选择器是否打开（用于上滑时判断是打开还是关闭） */
  isBookPickerOpen?: boolean;
  /** 关闭书卷选择器的回调 */
  onCloseBookPicker?: () => void;
}

export function MagicBall({ onOpenBookPicker, isBookPickerOpen, onCloseBookPicker }: MagicBallProps) {
  const { t, locale } = useTranslation();
  const controls = useAnimation();
  const [showHint, setShowHint] = useState<string | null>(null);

  // 从 store 获取位置（支持持久化）
  const {
    magicBallPosition,
    setMagicBallPosition,
  } = useBibleStore();

  // 使用 store 中的位置作为初始值
  const [position, setPosition] = useState(magicBallPosition);

  // 状态：是否处于"自由移动模式"
  const [isRepositioning, setIsRepositioning] = useState(false);

  // 状态：AI 已完成但用户尚未点击查看
  const [isAiFinishedButUnseen, setIsAiFinishedButUnseen] = useState(false);

  // 队列面板展开状态
  const [isQueuePanelOpen, setIsQueuePanelOpen] = useState(false);

  // 径向菜单展开状态
  const [isRadialMenuOpen, setIsRadialMenuOpen] = useState(false);

  // 上下文感知的快捷动作
  const [contextActions, setContextActions] = useState<QuickAction[]>([]);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const prevAiGenRef = useRef(false);

  const {
    isAiGenerating,
    setAiOpen,
    isAiOpen,
    toggleSidebar,
    isSidebarOpen,
    // 队列相关
    currentAiRequest,
    aiQueue,
    cancelAIRequest,
    // 快捷动作相关
    quickActions,
    activeQuickAction,
    setActiveQuickAction,
    enqueueAI,
    // 引导相关
    hasCompletedOnboarding,
    // 选中的经文
    selectedVerses,
    // 读经计划
    activePlans,
  } = useBibleStore();

  // 计算队列状态
  const hasQueueContent = currentAiRequest || aiQueue.length > 0;
  const queueCount = aiQueue.length;
  const isProcessing = currentAiRequest?.status === 'processing';

  // [P0优化] AI模式快捷动作
  const aiModeActions: QuickAction[] = [
    { id: 'ai-mode-general', label: `✨ ${t('ai.general')}`, prompt: '', mode: 'general', priority: 100, category: 'ai-mode' },
    { id: 'ai-mode-tutor', label: `👨‍🏫 ${t('ai.tutor')}`, prompt: '', mode: 'tutor', priority: 101, category: 'ai-mode' },
    { id: 'ai-mode-sermon', label: `📋 ${t('ai.sermon')}`, prompt: '', mode: 'sermon', priority: 102, category: 'ai-mode' },
    { id: 'ai-mode-study-guide', label: `📖 ${t('ai.studyGuide')}`, prompt: '', mode: 'study-guide', priority: 103, category: 'ai-mode' },
  ];

  // 更新上下文感知的快捷动作
  useEffect(() => {
    // 获取前4个快捷动作
    const regularActions = quickActions.slice(0, 4);
    // 添加AI模式切换选项（只显示前2个，避免菜单过长）
    const actions = [...regularActions, ...aiModeActions.slice(0, 2)];
    setContextActions(actions);
  }, [quickActions, selectedVerses, activePlans, currentAiRequest]);

  // 同步位置到 store（延迟保存，避免频繁写入）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (position.bottom !== magicBallPosition.bottom || position.right !== magicBallPosition.right) {
        setMagicBallPosition(position);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [position, setMagicBallPosition, magicBallPosition]);

  // 获取经文引用简短显示
  const getShortRef = (ref: { bookName: string; chapter: number; verse: number }) => {
    if (ref.verse > 0) {
      return `${ref.bookName} ${ref.chapter}:${ref.verse}`;
    }
    return `${ref.bookName} ${ref.chapter}${locale === 'en' ? '' : '章'}`;
  };

  // 截取提示词
  const truncatePrompt = (prompt: string, maxLen: number = 20) => {
    if (prompt.length <= maxLen) return prompt;
    return prompt.slice(0, maxLen) + '...';
  };

  // 处理快捷动作选择
  const handleQuickActionSelect = useCallback((action: QuickAction) => {
    setActiveQuickAction(action);

    // [P0优化] 如果是AI模式切换动作，只切换模式
    if (action.category === 'ai-mode' && action.mode) {
      const state = useBibleStore.getState();
      state.setAiMode(action.mode);

      // 触觉反馈
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      return;
    }

    // 获取当前阅读上下文
    const state = useBibleStore.getState();
    const tabs = state.tabs;
    const activeTab = tabs.find(t => t.id === state.activeTabId);

    if (!activeTab || activeTab.type !== 'read') return;

    const bookId = activeTab.book || 'Gen';
    const chapter = parseInt(activeTab.chapter || '1');

    // 构建 AI 请求
    const ref = {
      bookName: bookId, // 简化处理，实际应该从 Bible 数据获取
      chapter,
      verse: selectedVerses[0] || 1
    };

    // 如果有选中经文，使用选中的内容
    if (selectedVerses.length > 0) {
      // 这里需要从 Reader 获取经文内容，暂时使用简化逻辑
      enqueueAI(
        action.prompt,
        `用户选中的经文: ${selectedVerses.join(', ')}节`,
        `书卷: ${bookId}, 章节: ${chapter}`,
        ref
      );
    } else {
      // 使用当前章节作为上下文
      enqueueAI(
        action.prompt,
        `章节内容`,
        `书卷: ${bookId}, 章节: ${chapter}`,
        { ...ref, verse: 0 }
      );
    }

    // 设置 AI 模式（如果快捷动作指定了模式）
    if (action.mode) {
      state.setAiMode(action.mode);
    }

    // 打开 AI 侧边栏
    setAiOpen(true);

    // 触觉反馈
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
  }, [selectedVerses, enqueueAI, setAiOpen, setActiveQuickAction]);

  // --- Apple HIG: No decorative idle animations ---
  // Always stop and reset position - no breathing/bobbing
  useEffect(() => {
    controls.stop();
    controls.set({ y: 0 });
  }, [isAiGenerating, isRepositioning, isAiFinishedButUnseen, isAiOpen, isQueuePanelOpen, isRadialMenuOpen, controls]);

  // --- 监听 AI 状态变化 ---
  useEffect(() => {
    // 1. AI 生成完成的瞬间
    if (prevAiGenRef.current && !isAiGenerating) {
      // 只有当侧边栏没打开时，才进入"待查看"模式
      if (!isAiOpen) {
        setIsAiFinishedButUnseen(true);
        // Apple HIG: subtle press feedback only
        controls.start({
          scale: [1, 0.95, 1],
          transition: { duration: 0.3 }
        });
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([50, 100, 50]);
        }
      }
    }

    // 2. 如果 AI 界面被打开了，重置"待查看"状态
    if (isAiOpen) {
      setIsAiFinishedButUnseen(false);
    }

    prevAiGenRef.current = isAiGenerating;
  }, [isAiGenerating, isAiOpen, controls]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.log(e));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // --- 交互逻辑 ---

  const handlePointerDown = () => {
    isDraggingRef.current = false;

    // 长按触发位置调整模式
    longPressTimer.current = setTimeout(() => {
      if (!isDraggingRef.current) {
        setIsRepositioning(true);
        setIsQueuePanelOpen(false);
        setIsRadialMenuOpen(false);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(100);
        controls.start({ scale: 1.1, y: 0 });
      }
    }, 600);
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // 关闭径向菜单
    setIsRadialMenuOpen(false);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTap = (event: MouseEvent, info: TapInfo) => {
    // [修复] 如果发生了拖动，不处理点击
    if (isDraggingRef.current) return;

    // 如果径向菜单打开，不做处理
    if (isRadialMenuOpen) return;

    // [修复] 有队列内容时（正在生成、有待查看解读、或有排队项目），点击弹出队列面板
    if (isAiGenerating || isAiFinishedButUnseen || hasQueueContent) {
      setIsQueuePanelOpen(!isQueuePanelOpen);
      controls.start({ scale: [1, 0.9, 1], transition: { duration: 0.2 } });
    }
    // 普通点击（无解读进行中且无队列内容）不做操作，避免误触
  };

  const handleDrag = (event: any, info: PanInfo) => {
    if (isRepositioning) return;

    // 关闭径向菜单
    if (isRadialMenuOpen) {
      setIsRadialMenuOpen(false);
    }

    const { x, y } = info.offset;
    const threshold = 40;

    // 显示手势提示
    if (x < -threshold) setShowHint("ai-toggle");
    else if (x > threshold) setShowHint(null);
    else if (y < -threshold) setShowHint("menu-toggle");
    else if (y > threshold) setShowHint(document.fullscreenElement ? "exit-fullscreen" : "fullscreen");
    else setShowHint(null);
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    // 关闭径向菜单
    setIsRadialMenuOpen(false);

    // --- 模式 A: 位置修改完成 ---
    if (isRepositioning) {
      const newRight = position.right - info.offset.x;
      const newBottom = position.bottom - info.offset.y;
      const safeRight = Math.max(10, Math.min(window.innerWidth - 60, newRight));
      const safeBottom = Math.max(10, Math.min(window.innerHeight - 60, newBottom));

      controls.set({ x: 0, y: 0, scale: 1 });
      setTimeout(() => {
        setPosition({ right: safeRight, bottom: safeBottom });
        setIsRepositioning(false);
      }, 0);
      return;
    }

    // --- 模式 B: 功能触发 ---
    const threshold = 80;
    const { x, y } = info.offset;
    const isHorizontal = Math.abs(x) > Math.abs(y);
    const isVertical = Math.abs(y) > Math.abs(x);

    // [修改] 左滑：只切换 AI 界面，不触发任何其他操作（如队列面板）
    if (isHorizontal && x < -threshold) {
      setAiOpen(!isAiOpen);
      setIsQueuePanelOpen(false);
      // [新增] 清除手势提示，确保不会误触发其他 UI
      setShowHint(null);
    }
    else if (isVertical && y < -threshold) {
      // 上滑：切换经文选择器（移动端）或切换目录（桌面端）
      if (onOpenBookPicker || onCloseBookPicker) {
        // 如果 BookPicker 已打开，则关闭；否则打开
        if (isBookPickerOpen && onCloseBookPicker) {
          onCloseBookPicker();
        } else if (onOpenBookPicker) {
          onOpenBookPicker();
        }
      } else {
        toggleSidebar();
      }
      setIsQueuePanelOpen(false);
    }
    else if (isVertical && y > threshold) {
      // 下滑：切换全屏
      toggleFullscreen();
      setIsQueuePanelOpen(false);
    }
    // [新增] 小幅度拖动（不满足任何方向阈值）：不做任何操作
    // 这样可以避免误触发点击事件

    setShowHint(null);
    controls.start({
      x: 0, y: 0, scale: 1,
      transition: { type: "spring", stiffness: 500, damping: 25 }
    });

    // [修复] 延迟重置拖动标志，确保 onTap 不会在拖动结束后被误触发
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  // 关闭队列面板
  const closeQueuePanel = () => setIsQueuePanelOpen(false);

  return (
    <>
      {/* 径向菜单 */}
      <RadialMenu
        isOpen={isRadialMenuOpen}
        actions={contextActions}
        onSelect={handleQuickActionSelect}
        onClose={() => setIsRadialMenuOpen(false)}
        position={position}
      />

      {/* 队列详情面板 */}
      <AnimatePresence>
        {isQueuePanelOpen && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "fixed z-[99] w-72 rounded-lg overflow-hidden",
              "glass-panel",
              "border border-border dark:border-border"
            )}
            style={{
              bottom: position.bottom + 65,
              right: position.right - 16
            }}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-3 bg-secondary dark:bg-card border-b border-border dark:border-border">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-foreground/80">
                <ListOrdered className="w-4 h-4 text-primary" />
                {t('ai.queueTitle')}
              </div>
              <button
                onClick={closeQueuePanel}
                className="text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 已完成的解读（待查看） */}
            {isAiFinishedButUnseen && !currentAiRequest && (
              <div className="px-4 py-3 border-b border-border dark:border-border bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <BookOpenCheck className="w-3.5 h-3.5" />
                    {t('ai.interpretationDone')}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setAiOpen(true);
                    setIsAiFinishedButUnseen(false);
                    setIsQueuePanelOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-apple-focus text-white text-sm font-semibold transition-all"
                >
                  {t('ai.clickToView')}
                </button>
              </div>
            )}

            {/* 当前处理中 */}
            {currentAiRequest && currentAiRequest.status === 'processing' && (
              <div className="px-4 py-3 border-b border-border dark:border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t('ai.processing')}
                  </span>
                  <button
                    onClick={() => {
                      cancelAIRequest(currentAiRequest.id);
                      if (!isAiOpen) setAiOpen(true);
                    }}
                    className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-semibold"
                  >
                    {t('ai.cancel')}
                  </button>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground dark:text-foreground/80 truncate">
                      {getShortRef(currentAiRequest.ref)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {truncatePrompt(currentAiRequest.prompt, 30)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 等待队列 */}
            {aiQueue.length > 0 && (
              <div className="max-h-48 overflow-y-auto">
                <div className="px-4 py-2 text-xs text-muted-foreground font-semibold bg-secondary/50 dark:bg-card/50">
                  {t('ai.waiting')} ({aiQueue.length})
                </div>
                {aiQueue.map((item, index) => (
                  <div
                    key={item.id}
                    className="px-4 py-2.5 flex items-center justify-between hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground font-mono w-4 shrink-0">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground dark:text-foreground/80 truncate">
                          {getShortRef(item.ref)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {truncatePrompt(item.prompt, 25)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelAIRequest(item.id)}
                      className="ml-2 text-muted-foreground hover:text-destructive dark:hover:text-destructive transition-colors shrink-0"
                      title={t('ai.removeFromQueue')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 错误状态 */}
            {currentAiRequest?.status === 'error' && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t('ai.processFailed')}: {currentAiRequest.error || t('ai.unknownError')}</span>
                </div>
              </div>
            )}

            {/* 底部：打开侧边栏 */}
            <button
              onClick={() => {
                setAiOpen(true);
                setIsQueuePanelOpen(false);
              }}
              className="w-full px-4 py-2.5 text-center text-xs font-semibold text-primary bg-secondary dark:bg-card hover:bg-primary/5 transition-colors border-t border-border dark:border-border"
            >
              {t('ai.openAISidebar')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 背景提示层 */}
      <div
        className="fixed z-[100] pointer-events-none flex items-center justify-center w-12 h-12"
        style={{ bottom: position.bottom, right: position.right }}
      >
        {/* 1. AI 完成后的点击提醒 */}
        <div className={cn(
          "absolute right-[60px] whitespace-nowrap transition-all duration-500 ease-out",
          isAiFinishedButUnseen
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-10 opacity-0 scale-50 pointer-events-none"
        )}>
          <div className="bg-primary text-white px-4 py-2 rounded-full flex items-center gap-2 font-semibold text-sm">
            <MousePointerClick className="w-4 h-4" /> {t('ai.clickToView')}
          </div>
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-primary"></div>
        </div>

        {/* 2. 队列徽章提示 */}
        {hasQueueContent && !isAiFinishedButUnseen && (
          <div className={cn(
            "absolute right-[56px] transition-all duration-300",
            isQueuePanelOpen ? "opacity-0 scale-50" : "opacity-100 scale-100"
          )}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-destructive text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
            >
              {isProcessing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ListOrdered className="w-3 h-3" />
              )}
              <span>{queueCount + (currentAiRequest ? 1 : 0)}</span>
            </motion.div>
          </div>
        )}

        {/* 3. 手势提示图标 */}
        {!isAiFinishedButUnseen && !hasQueueContent && (
          <>
            <div className={cn("absolute transition-all duration-300 ease-out", showHint === "ai-toggle" ? "-translate-x-28 opacity-100 scale-100" : "translate-x-0 opacity-0 scale-50")}>
              {isAiOpen ? (
                <div className="bg-foreground/80 text-white px-3 py-2 rounded-full flex items-center gap-2 font-bold text-xs"><X className="w-4 h-4" /> {t('ai.closeAssistant')}</div>
              ) : (
                <div className="bg-primary text-white px-3 py-2 rounded-full flex items-center gap-2 font-bold text-xs"><Bot className="w-4 h-4" /> {t('ai.openInterpretation')}</div>
              )}
            </div>
            <div className={cn("absolute transition-all duration-300 ease-out", showHint === "menu-toggle" ? "-translate-y-24 opacity-100 scale-100" : "translate-y-0 opacity-0 scale-50")}>
              <div className="bg-primary/90 text-white p-2.5 rounded-full">
                {onOpenBookPicker ? <BookOpenCheck className="w-5 h-5" /> : (isSidebarOpen ? <X className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />)}
              </div>
            </div>
            <div className={cn("absolute transition-all duration-300 ease-out", (showHint === "fullscreen" || showHint === "exit-fullscreen") ? "translate-y-24 opacity-100 scale-100" : "translate-y-0 opacity-0 scale-50")}>
              <div className="bg-foreground/80 text-white p-2.5 rounded-full">{showHint === "exit-fullscreen" ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</div>
            </div>
          </>
        )}
      </div>

      <motion.div
        drag
        dragElastic={isRepositioning ? 0 : 0.2}
        dragMomentum={false}
        onPointerDown={handlePointerDown}
        onDragStart={handleDragStart}
        onPointerUp={handlePointerUp}
        onTap={handleTap}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        data-magic-ball="true"
        className={cn(
          "fixed z-[100] touch-none",
          isRepositioning ? "cursor-move" : "cursor-grab"
        )}
        style={{ width: 44, height: 44, bottom: position.bottom, right: position.right }}
      >
        <div
          data-magic-ball="true"
          className={cn(
            "relative w-full h-full rounded-full transition-all duration-300",
            // Apple icon-circular: translucent chip background
            "bg-[var(--apple-chip-translucent)]/64 dark:bg-white/10",
            // State rings (Apple-style subtle indicators)
            isRepositioning ? "ring-4 ring-primary/30 scale-110" :
            (isAiFinishedButUnseen ? "ring-2 ring-primary/40" :
            (isQueuePanelOpen ? "ring-2 ring-primary/40" :
            (isAiGenerating ? "ring-2 ring-primary/20 animate-pulse" :
            (hasQueueContent ? "ring-2 ring-primary/20" :
            (isAiOpen ? "ring-2 ring-primary/15" : "")))))
          )}
        >
          {/* Core icon - Apple ink color */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            {isRepositioning ? (
              <Move className="w-5 h-5 text-foreground" />
            ) : isAiFinishedButUnseen ? (
              <MousePointerClick className="w-6 h-6 text-foreground" />
            ) : isQueuePanelOpen ? (
              <ListOrdered className="w-5 h-5 text-foreground" />
            ) : hasQueueContent && !isAiOpen ? (
              <ListOrdered className="w-5 h-5 text-foreground" />
            ) : isAiOpen ? (
              <Sparkles className="w-5 h-5 text-foreground" />
            ) : isAiGenerating ? (
              <Sparkles className="w-5 h-5 text-foreground animate-pulse" />
            ) : (
              <Sparkles className="w-5 h-5 text-foreground" />
            )}
          </div>

          {/* Queue count badge */}
          {hasQueueContent && !isQueuePanelOpen && !isAiFinishedButUnseen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 z-20 bg-destructive text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
            >
              {queueCount + (currentAiRequest ? 1 : 0)}
            </motion.div>
          )}
        </div>
      </motion.div>

    </>
  );
}