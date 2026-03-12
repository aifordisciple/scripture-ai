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

interface MagicBallProps {
  /** 打开书卷选择器的回调 */
  onOpenBookPicker?: () => void;
  /** 是否隐藏（当全屏对话框打开时） */
  hidden?: boolean;
}

export function MagicBall({ onOpenBookPicker, hidden }: MagicBallProps) {
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
  const radialMenuTimer = useRef<NodeJS.Timeout | null>(null);
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

  // 更新上下文感知的快捷动作
  useEffect(() => {
    const actions = quickActions.slice(0, 6);
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
    return `${ref.bookName} ${ref.chapter}章`;
  };

  // 截取提示词
  const truncatePrompt = (prompt: string, maxLen: number = 20) => {
    if (prompt.length <= maxLen) return prompt;
    return prompt.slice(0, maxLen) + '...';
  };

  // 处理快捷动作选择
  const handleQuickActionSelect = useCallback((action: QuickAction) => {
    setActiveQuickAction(action);

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

    // 中等时长触发径向菜单 (0.4s)
    radialMenuTimer.current = setTimeout(() => {
      if (!isDraggingRef.current && !isRepositioning) {
        setIsRadialMenuOpen(true);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 30]);
        controls.start({ scale: 1.05 });
      }
    }, 400);
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (radialMenuTimer.current) {
      clearTimeout(radialMenuTimer.current);
      radialMenuTimer.current = null;
    }
    // 关闭径向菜单
    setIsRadialMenuOpen(false);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (radialMenuTimer.current) {
      clearTimeout(radialMenuTimer.current);
      radialMenuTimer.current = null;
    }
  };

  const handleTap = (event: MouseEvent, info: TapInfo) => {
    // 如果径向菜单打开，不做处理
    if (isRadialMenuOpen) return;

    // 特殊状态点击：查看结果
    if (isAiFinishedButUnseen) {
      setAiOpen(true);
      setIsAiFinishedButUnseen(false);
      controls.start({ scale: [1, 0.9, 1], transition: { duration: 0.2 } });
    }
    // 有队列内容时：不再弹出队列面板，直接打开 AI 侧边栏
    // else if (hasQueueContent) {
    //   setIsQueuePanelOpen(!isQueuePanelOpen);
    //   controls.start({ scale: [1, 0.9, 1], transition: { duration: 0.2 } });
    // }
    // 无队列时普通点击：不做操作（防止误触）
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

    if (isHorizontal && x < -threshold) {
      // 左滑：切换 AI
      setAiOpen(!isAiOpen);
      setIsQueuePanelOpen(false);
    }
    else if (isVertical && y < -threshold) {
      // 上滑：打开经文选择器（移动端）或切换目录（桌面端）
      if (onOpenBookPicker) {
        onOpenBookPicker();
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

    setShowHint(null);
    controls.start({
      x: 0, y: 0, scale: 1,
      transition: { type: "spring", stiffness: 500, damping: 25 }
    });
  };

  // 关闭队列面板
  const closeQueuePanel = () => setIsQueuePanelOpen(false);

  // 当 BookPicker 等全屏对话框打开时隐藏
  if (hidden) return null;

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
              "fixed z-[99] w-72 rounded-2xl shadow-2xl overflow-hidden",
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
                AI 解读队列
              </div>
              <button
                onClick={closeQueuePanel}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 当前处理中 */}
            {currentAiRequest && (
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    正在处理
                  </span>
                  <button
                    onClick={() => {
                      cancelAIRequest(currentAiRequest.id);
                      if (!isAiOpen) setAiOpen(true);
                    }}
                    className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium"
                  >
                    取消
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
                  等待中 ({aiQueue.length})
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
                      title="从队列移除"
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
                  <span>处理失败: {currentAiRequest.error || '未知错误'}</span>
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
              打开 AI 侧边栏
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold text-sm animate-pulse-subtle">
            <MousePointerClick className="w-4 h-4" /> 点击查看解读
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
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1"
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
                <div className="bg-slate-500 text-white px-3 py-2 rounded-full shadow-xl flex items-center gap-2 font-bold text-xs backdrop-blur-md border border-white/20"><X className="w-4 h-4" /> 关闭助手</div>
              ) : (
                <div className="bg-blue-600 text-white px-3 py-2 rounded-full shadow-xl flex items-center gap-2 font-bold text-xs backdrop-blur-md border border-white/20"><Bot className="w-4 h-4" /> 开启解读</div>
              )}
            </div>
            <div className={cn("absolute transition-all duration-300 ease-out", showHint === "menu-toggle" ? "-translate-y-24 opacity-100 scale-100" : "translate-y-0 opacity-0 scale-50")}>
              <div className="bg-primary/90 text-white p-2.5 rounded-full shadow-xl backdrop-blur-md border border-white/20">
                {onOpenBookPicker ? <BookOpenCheck className="w-5 h-5" /> : (isSidebarOpen ? <X className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />)}
              </div>
            </div>
            <div className={cn("absolute transition-all duration-300 ease-out", (showHint === "fullscreen" || showHint === "exit-fullscreen") ? "translate-y-24 opacity-100 scale-100" : "translate-y-0 opacity-0 scale-50")}>
              <div className="bg-slate-700/80 text-white p-2.5 rounded-full shadow-xl backdrop-blur-md border border-white/20">{showHint === "exit-fullscreen" ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</div>
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
        className={cn(
          "fixed z-[100] touch-none bg-transparent",
          isRepositioning ? "cursor-move" : "cursor-grab"
        )}
        style={{ width: 52, height: 52, bottom: position.bottom, right: position.right }}
      >
        <div
          className={cn(
            "relative w-full h-full rounded-full overflow-hidden transition-all duration-500",
            // 背景色：保持蓝色调，不仅限于暗色，而是通透感
            "bg-gradient-to-br from-white/60 via-blue-50/50 to-blue-200/40",
            "dark:from-slate-800/80 dark:via-slate-900/80 dark:to-black/80",
            "backdrop-blur-xl border border-white/40 dark:border-white/10",
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
        >
          {/* 内部水波纹层 */}
          <div className={cn(
            "absolute inset-0 z-0 flex items-end justify-center pointer-events-none opacity-80 transition-all duration-500",
            (isAiFinishedButUnseen || isQueuePanelOpen) ? "mix-blend-color-burn" : "mix-blend-multiply dark:mix-blend-overlay"
          )}>
            <div className={cn(
              "w-[200%] h-[200%] rounded-[38%] absolute left-[-50%]",
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
            )} />
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
              <Sparkles className="w-5 h-5 text-blue-600/90 dark:text-blue-200/90 drop-shadow-sm" />
            )}
          </div>

          {/* 队列数字徽章（内嵌） */}
          {hasQueueContent && !isQueuePanelOpen && !isAiFinishedButUnseen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 z-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
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

        .ease-out-back { transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </>
  );
}