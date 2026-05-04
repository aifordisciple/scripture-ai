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

  // --- 待机呼吸动画 ---
  useEffect(() => {
    if (!isAiGenerating && !isRepositioning && !isAiFinishedButUnseen && !isAiOpen && !isQueuePanelOpen && !isRadialMenuOpen) {
      controls.start({
        y: [0, -6, 0],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
      });
    } else {
      controls.stop();
      controls.set({ y: 0 });
    }
  }, [isAiGenerating, isRepositioning, isAiFinishedButUnseen, isAiOpen, isQueuePanelOpen, isRadialMenuOpen, controls]);

  // --- 监听 AI 状态变化 ---
  useEffect(() => {
    // 1. AI 生成完成的瞬间
    if (prevAiGenRef.current && !isAiGenerating) {
      // 只有当侧边栏没打开时，才进入"待查看"模式
      if (!isAiOpen) {
        setIsAiFinishedButUnseen(true);
        // 快乐抖动
        controls.start({
          y: [0, -15, 0, -5, 0],
          scale: [1, 1.1, 1],
          transition: { duration: 0.6, ease: "easeInOut", times: [0, 0.2, 0.6, 0.8, 1] }
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
              "fixed z-[99] w-72 rounded-2xl shadow-2xl shadow-black/15 overflow-hidden",
              "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            )}
            style={{
              bottom: position.bottom + 65,
              right: position.right - 16
            }}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <ListOrdered className="w-4 h-4 text-blue-500" />
                {t('ai.queueTitle')}
              </div>
              <button
                onClick={closeQueuePanel}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 已完成的解读（待查看） */}
            {isAiFinishedButUnseen && !currentAiRequest && (
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
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
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-sm font-medium shadow-sm transition-all hover:shadow-md"
                >
                  {t('ai.clickToView')}
                </button>
              </div>
            )}

            {/* 当前处理中 */}
            {currentAiRequest && currentAiRequest.status === 'processing' && (
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t('ai.processing')}
                  </span>
                  <button
                    onClick={() => {
                      cancelAIRequest(currentAiRequest.id);
                      if (!isAiOpen) setAiOpen(true);
                    }}
                    className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium"
                  >
                    {t('ai.cancel')}
                  </button>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {getShortRef(currentAiRequest.ref)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {truncatePrompt(currentAiRequest.prompt, 30)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 等待队列 */}
            {aiQueue.length > 0 && (
              <div className="max-h-48 overflow-y-auto">
                <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-800/50">
                  {t('ai.waiting')} ({aiQueue.length})
                </div>
                {aiQueue.map((item, index) => (
                  <div
                    key={item.id}
                    className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-xs text-slate-400 font-mono w-4 shrink-0">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-700 dark:text-slate-200 truncate">
                          {getShortRef(item.ref)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {truncatePrompt(item.prompt, 25)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelAIRequest(item.id)}
                      className="ml-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
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
              className="w-full px-4 py-2.5 text-center text-xs font-medium text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-t border-slate-200 dark:border-slate-700"
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
          "absolute right-[60px] whitespace-nowrap transition-all duration-500 ease-out-back",
          isAiFinishedButUnseen
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-10 opacity-0 scale-50 pointer-events-none"
        )}>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg shadow-black/10 flex items-center gap-2 font-bold text-sm animate-pulse-subtle">
            <MousePointerClick className="w-4 h-4" /> {t('ai.clickToView')}
          </div>
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-purple-600"></div>
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
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg shadow-black/10 flex items-center gap-1"
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
                <div className="bg-slate-500 text-white px-3 py-2 rounded-full shadow-xl shadow-black/10 flex items-center gap-2 font-bold text-xs backdrop-blur-md border border-white/20"><X className="w-4 h-4" /> {t('ai.closeAssistant')}</div>
              ) : (
                <div className="bg-blue-600 text-white px-3 py-2 rounded-full shadow-xl shadow-black/10 flex items-center gap-2 font-bold text-xs backdrop-blur-md border border-white/20"><Bot className="w-4 h-4" /> {t('ai.openInterpretation')}</div>
              )}
            </div>
            <div className={cn("absolute transition-all duration-300 ease-out", showHint === "menu-toggle" ? "-translate-y-24 opacity-100 scale-100" : "translate-y-0 opacity-0 scale-50")}>
              <div className="bg-primary/90 text-white p-2.5 rounded-full shadow-xl shadow-black/10 backdrop-blur-md border border-white/20">
                {onOpenBookPicker ? <BookOpenCheck className="w-5 h-5" /> : (isSidebarOpen ? <X className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />)}
              </div>
            </div>
            <div className={cn("absolute transition-all duration-300 ease-out", (showHint === "fullscreen" || showHint === "exit-fullscreen") ? "translate-y-24 opacity-100 scale-100" : "translate-y-0 opacity-0 scale-50")}>
              <div className="bg-slate-700/80 text-white p-2.5 rounded-full shadow-xl shadow-black/10 backdrop-blur-md border border-white/20">{showHint === "exit-fullscreen" ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</div>
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
        style={{ width: 52, height: 52, bottom: position.bottom, right: position.right }}
      >
        <div
          data-magic-ball="true"
          className={cn(
            "relative w-full h-full overflow-hidden transition-all duration-500",
            // 强制圆形 - iOS Safari 兼容
            "rounded-full",
            // 背景色：保持蓝色调，不仅限于暗色，而是通透感
            "bg-gradient-to-br from-white/60 via-blue-50/50 to-blue-200/40",
            "dark:from-slate-800/80 dark:via-slate-900/80 dark:to-black/80",
            // backdrop-blur 兼容性处理
            "backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)]",
            "border border-white/40 dark:border-white/10",
            "shadow-[inset_0_4px_8px_rgba(255,255,255,0.9),_inset_0_-6px_6px_rgba(0,0,0,0.1),_0_8px_24px_rgba(0,0,0,0.2)]",
            "dark:shadow-[inset_0_2px_6px_rgba(255,255,255,0.15),_inset_0_-6px_10px_rgba(0,0,0,0.5),_0_10px_30px_rgba(0,0,0,0.5)]",
            // 状态 Ring
            isRepositioning ? "ring-4 ring-blue-400/30 scale-110" :
            (isAiFinishedButUnseen ? "scale-105 ring-2 ring-purple-400/50 animate-pulse-subtle" :
            (isQueuePanelOpen ? "ring-2 ring-purple-400/50 scale-105" :
            (isAiGenerating ? "ring-2 ring-blue-400/30" :
            (hasQueueContent ? "ring-2 ring-purple-400/30 scale-105" :
            (isAiOpen ? "ring-2 ring-blue-400/20 scale-105" : "hover:scale-105")))))
          )}
          style={{
            // iOS Safari 圆形强制修复
            WebkitMaskImage: '-webkit-radial-gradient(circle, white 100%, black 100%)',
            maskImage: 'radial-gradient(circle, white 100%, black 100%)',
            borderRadius: '50%',
            // iOS Safari 硬件加速
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)',
            // iOS Safari 强制裁剪溢出内容
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* 内部水波纹层 - iOS Safari 需要额外处理 */}
          <div
            data-magic-ball="true"
            className={cn(
              "absolute inset-0 z-0 flex items-end justify-center pointer-events-none opacity-80 transition-all duration-500",
              (isAiFinishedButUnseen || isQueuePanelOpen) ? "mix-blend-color-burn" : "mix-blend-multiply dark:mix-blend-overlay"
            )}
            style={{
              // iOS Safari 圆形强制裁剪
              WebkitMaskImage: '-webkit-radial-gradient(circle, white 100%, black 100%)',
              maskImage: 'radial-gradient(circle, white 100%, black 100%)',
              borderRadius: '50%',
              overflow: 'hidden',
            }}
          >
            <div
              className={cn(
                "w-[200%] h-[200%] absolute left-[-50%]",
                (isAiFinishedButUnseen || isQueuePanelOpen) ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 animate-gradient-spin" :
                "bg-gradient-to-t from-blue-500 to-cyan-300",

                // [状态逻辑]
                // Generating: 波浪起伏
                // Finished: 底部微波
                // QueueOpen: 满水状态
                // Open: 满水状态 (-10%)
                // Default: 隐藏 (-160%)
                isAiGenerating ? "animate-wave-rise" :
                ((isAiFinishedButUnseen || isQueuePanelOpen) ? "bottom-[-5%]" :
                (isAiOpen ? "bottom-[-10%] rotate-[120deg]" : "bottom-[-160%]")) + " transition-all duration-1000 ease-out"
              )}
              style={{
                // iOS Safari 圆形近似 - 使用 50% 而非 38%
                borderRadius: '50%',
                WebkitTransform: 'translateZ(0)',
                transform: 'translateZ(0)',
              }}
            />
          </div>

          {/* 核心图标 */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            {isRepositioning ? (
              <Move className="w-5 h-5 text-blue-600 dark:text-white/90 animate-pulse" />
            ) : isAiFinishedButUnseen ? (
              <MousePointerClick className="w-6 h-6 text-white drop-shadow-md animate-bounce-subtle" />
            ) : isQueuePanelOpen ? (
              <ListOrdered className="w-5 h-5 text-white drop-shadow-md" />
            ) : hasQueueContent && !isAiOpen ? (
              <ListOrdered className="w-5 h-5 text-white drop-shadow-md animate-pulse" />
            ) : isAiOpen ? (
              <Sparkles className="w-5 h-5 text-white drop-shadow-md" />
            ) : isAiGenerating ? (
              <Sparkles className="w-5 h-5 text-white animate-pulse drop-shadow-md" />
            ) : (
              <Sparkles
                className="w-5 h-5 drop-shadow-sm animate-sparkle-glow dark:text-amber-400 text-blue-500"
              />
            )}
          </div>

          {/* 队列数字徽章（内嵌） */}
          {hasQueueContent && !isQueuePanelOpen && !isAiFinishedButUnseen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 z-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-black/10"
            >
              {queueCount + (currentAiRequest ? 1 : 0)}
            </motion.div>
          )}

          {/* 顶部高光反射 */}
          <div className="absolute top-[10%] left-[20%] w-[30%] h-[15%] bg-gradient-to-b from-white to-transparent opacity-90 rounded-full rotate-[-15deg] blur-[0.5px]" />
        </div>
      </motion.div>

      {/* 动画定义 */}
      <style jsx global>{`
        @keyframes wave-rise {
          0% { transform: rotate(0deg); bottom: -160%; }
          100% { transform: rotate(360deg); bottom: -5%; }
        }
        .animate-wave-rise {
          animation: wave-rise 3s ease-in-out infinite alternate;
          animation-fill-mode: forwards;
        }
        @keyframes gradient-spin {
          0% { transform: rotate(0deg); filter: hue-rotate(0deg); }
          100% { transform: rotate(360deg); filter: hue-rotate(360deg); }
        }
        .animate-gradient-spin {
          animation: gradient-spin 8s linear infinite;
          bottom: -5% !important;
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(0.98); }
        }
        .animate-pulse-subtle { animation: pulse-subtle 2s ease-in-out infinite; }

        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 1.5s ease-in-out infinite; }

        /* 星星闪烁发光动画 - 使用当前元素颜色 */
        @keyframes sparkle-glow {
          0%, 100% {
            opacity: 0.6;
            filter: drop-shadow(0 0 4px currentColor) drop-shadow(0 0 8px currentColor);
            transform: scale(1);
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 10px currentColor) drop-shadow(0 0 20px currentColor);
            transform: scale(1.1);
          }
        }
        .animate-sparkle-glow {
          animation: sparkle-glow 2s ease-in-out infinite;
        }

        .ease-out-back { transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </>
  );
}