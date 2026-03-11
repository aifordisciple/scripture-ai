// components/bible/MagicBall.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation, PanInfo, TapInfo } from "framer-motion";
import { useBibleStore } from "@/store/useBibleStore";
import { Sparkles, Maximize, Minimize, PanelLeft, Bot, X, Move, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

export function MagicBall() {
  const controls = useAnimation();
  const [showHint, setShowHint] = useState<string | null>(null);
  
  // 默认位置
  const [position, setPosition] = useState({ bottom: 150, right: 30 });

  // 状态：是否处于“自由移动模式”
  const [isRepositioning, setIsRepositioning] = useState(false);

  // 状态：AI 已完成但用户尚未点击查看
  const [isAiFinishedButUnseen, setIsAiFinishedButUnseen] = useState(false);
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false); 
  const prevAiGenRef = useRef(false);

  const { 
    isAiGenerating, 
    setAiOpen, 
    isAiOpen, 
    toggleSidebar, 
    isSidebarOpen
  } = useBibleStore();

  // --- 待机呼吸动画 ---
  // 当 AI 打开时，停止上下浮动呼吸，保持静止（满水状态已经很显眼了）
  useEffect(() => {
    if (!isAiGenerating && !isRepositioning && !isAiFinishedButUnseen && !isAiOpen) {
        controls.start({
            y: [0, -6, 0],
            transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        });
    } else {
        controls.stop();
        controls.set({ y: 0 });
    }
  }, [isAiGenerating, isRepositioning, isAiFinishedButUnseen, isAiOpen, controls]);

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

    // 2. 如果 AI 界面被打开了，重置“待查看”状态
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
    longPressTimer.current = setTimeout(() => {
        if (!isDraggingRef.current) { 
            setIsRepositioning(true);
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
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
  };

  const handleTap = (event: MouseEvent, info: TapInfo) => {
    // 特殊状态点击：查看结果
    if (isAiFinishedButUnseen) {
        setAiOpen(true); 
        setIsAiFinishedButUnseen(false);
        controls.start({ scale: [1, 0.9, 1], transition: { duration: 0.2 } });
    } 
    // 普通状态点击：现在不做操作，因为左滑是打开，防止误触
    // 如果您希望点击也能打开/关闭，可以取消注释下面这行：
    // else { setAiOpen(!isAiOpen); }
  };

  const handleDrag = (event: any, info: PanInfo) => {
    if (isRepositioning) return; 

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
    } 
    else if (isVertical && y < -threshold) {
        // 上滑：切换目录
        toggleSidebar();
    } 
    else if (isVertical && y > threshold) {
        // 下滑：切换全屏
        toggleFullscreen();
    }

    setShowHint(null);
    controls.start({ 
        x: 0, y: 0, scale: 1, 
        transition: { type: "spring", stiffness: 500, damping: 25 } 
    });
  };

  return (
    <>
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

        {/* 2. 手势提示图标 */}
        {!isAiFinishedButUnseen && (
            <>
                <div className={cn("absolute transition-all duration-300 ease-out", showHint === "ai-toggle" ? "-translate-x-28 opacity-100 scale-100" : "translate-x-0 opacity-0 scale-50")}>
                    {isAiOpen ? (
                        <div className="bg-slate-500 text-white px-3 py-2 rounded-full shadow-xl flex items-center gap-2 font-bold text-xs backdrop-blur-md border border-white/20"><X className="w-4 h-4" /> 关闭助手</div>
                    ) : (
                        <div className="bg-blue-600 text-white px-3 py-2 rounded-full shadow-xl flex items-center gap-2 font-bold text-xs backdrop-blur-md border border-white/20"><Bot className="w-4 h-4" /> 开启解读</div>
                    )}
                </div>
                <div className={cn("absolute transition-all duration-300 ease-out", showHint === "menu-toggle" ? "-translate-y-24 opacity-100 scale-100" : "translate-y-0 opacity-0 scale-50")}>
                    <div className="bg-slate-700/80 text-white p-2.5 rounded-full shadow-xl backdrop-blur-md border border-white/20">{isSidebarOpen ? <X className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}</div>
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
                (isAiGenerating ? "ring-2 ring-blue-400/30" : 
                (isAiOpen ? "ring-2 ring-blue-400/20 scale-105" : "hover:scale-105"))) 
            )}
        >
          {/* 内部水波纹层 */}
          <div className={cn(
              "absolute inset-0 z-0 flex items-end justify-center pointer-events-none opacity-80 transition-all duration-500",
              (isAiFinishedButUnseen || isAiOpen) ? "mix-blend-color-burn" : "mix-blend-multiply dark:mix-blend-overlay"
            )}>
             <div className={cn(
                 "w-[200%] h-[200%] rounded-[38%] absolute left-[-50%]",
                 (isAiFinishedButUnseen) ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 animate-gradient-spin" : 
                 "bg-gradient-to-t from-blue-500 to-cyan-300",
                 
                 // [状态逻辑] 
                 // Generating: 波浪起伏
                 // Finished: 底部微波
                 // Open: 满水状态 (-10%)
                 // Default: 隐藏 (-160%)
                 isAiGenerating ? "animate-wave-rise" : 
                 (isAiFinishedButUnseen ? "bottom-[-5%]" : 
                 (isAiOpen ? "bottom-[-10%] rotate-[120deg]" : "bottom-[-160%]")) + " transition-all duration-1000 ease-out"
             )} />
          </div>

          {/* 核心图标 */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            {isRepositioning ? (
                <Move className="w-5 h-5 text-blue-600 dark:text-white/90 animate-pulse" />
            ) : isAiFinishedButUnseen ? (
                <MousePointerClick className="w-6 h-6 text-white drop-shadow-md animate-bounce-subtle" />
            ) : isAiOpen ? (
                // [修改] 打开状态显示白色的 Sparkles (满水状态)
                <Sparkles className="w-5 h-5 text-white drop-shadow-md" />
            ) : isAiGenerating ? (
                <Sparkles className="w-5 h-5 text-white animate-pulse drop-shadow-md" />
            ) : (
                <Sparkles className="w-5 h-5 text-blue-600/90 dark:text-blue-200/90 drop-shadow-sm" />
            )}
          </div>
          
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