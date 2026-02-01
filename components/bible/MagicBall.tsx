// components/bible/MagicBall.tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { useBibleStore } from "@/store/useBibleStore";
import { Sparkles, Maximize, PanelLeft, Bot, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MagicBall() {
  const controls = useAnimation();
  const [showHint, setShowHint] = useState<string | null>(null);
  
  const { 
    isAiGenerating, 
    setAiOpen, 
    isAiOpen,
    toggleSidebar, 
    isSidebarOpen
  } = useBibleStore();

  // 处理全屏逻辑
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.log(e));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // 拖拽结束处理
  const handleDragEnd = async (event: any, info: PanInfo) => {
    const threshold = 60; // 触发阈值
    const { x, y } = info.offset;

    // 恢复位置
    controls.start({ x: 0, y: 0, scale: 1 });
    setShowHint(null);

    // 1. 向左拉 -> 打开 AI
    if (x < -threshold && Math.abs(y) < threshold) {
      setAiOpen(true);
    }
    // 2. 向右拉 -> 关闭 AI
    else if (x > threshold && Math.abs(y) < threshold) {
      setAiOpen(false);
    }
    // 3. 向上拉 -> 打开目录 (Sidebar)
    else if (y < -threshold && Math.abs(x) < threshold) {
      if (!isSidebarOpen) toggleSidebar(true);
    }
    // 4. 向下拉 -> 全屏
    else if (y > threshold && Math.abs(x) < threshold) {
      toggleFullscreen();
    }
  };

  // 拖拽中，显示提示图标
  const handleDrag = (event: any, info: PanInfo) => {
    const { x, y } = info.offset;
    const threshold = 30;
    
    if (x < -threshold) setShowHint("ai-open");
    else if (x > threshold) setShowHint("ai-close");
    else if (y < -threshold) setShowHint("menu");
    else if (y > threshold) setShowHint("fullscreen");
    else setShowHint(null);
  };

  return (
    <>
      {/* 拖拽时的背景提示图标 */}
      <div className="fixed bottom-8 right-8 z-40 pointer-events-none">
        <div className={cn("absolute transition-all duration-300 transform", showHint === "ai-open" ? "-translate-x-24 opacity-100 scale-110" : "translate-x-0 opacity-0")}>
            <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg"><Bot className="w-5 h-5" /></div>
        </div>
        <div className={cn("absolute transition-all duration-300 transform", showHint === "ai-close" ? "translate-x-12 opacity-100 scale-110" : "translate-x-0 opacity-0")}>
            <div className="bg-slate-500 text-white p-2 rounded-full shadow-lg"><X className="w-5 h-5" /></div>
        </div>
        <div className={cn("absolute transition-all duration-300 transform", showHint === "menu" ? "-translate-y-24 opacity-100 scale-110" : "translate-y-0 opacity-0")}>
            <div className="bg-slate-700 text-white p-2 rounded-full shadow-lg"><PanelLeft className="w-5 h-5" /></div>
        </div>
        <div className={cn("absolute transition-all duration-300 transform", showHint === "fullscreen" ? "translate-y-16 opacity-100 scale-110" : "translate-y-0 opacity-0")}>
            <div className="bg-slate-700 text-white p-2 rounded-full shadow-lg"><Maximize className="w-5 h-5" /></div>
        </div>
      </div>

      {/* 功能球主体 */}
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // 限制拖拽范围，松手自动回弹
        dragElastic={0.2} // 弹性阻尼
        onDragEnd={handleDragEnd}
        onDrag={handleDrag}
        animate={controls}
        whileTap={{ cursor: "grabbing", scale: 1.1 }}
        className="fixed bottom-8 right-8 w-14 h-14 z-50 cursor-grab touch-none"
      >
        <div className="relative w-full h-full rounded-full shadow-xl overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700 ring-2 ring-transparent hover:ring-blue-400/30 transition-all">
          
          {/* 注水动画层 */}
          <div className="absolute inset-0 z-0 flex items-end justify-center">
             {/* 如果正在生成，显示波浪动画 */}
             <div className={cn(
                 "w-[200%] h-[200%] bg-blue-500/80 rounded-[40%] absolute bottom-[-150%] left-[-50%]",
                 isAiGenerating ? "animate-wave-rise" : (isAiOpen ? "bottom-[-10%]" : "bottom-[-150%] transition-all duration-500")
             )} />
          </div>

          {/* 核心图标 */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            {isAiGenerating ? (
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
            ) : isAiOpen ? (
                <Bot className="w-6 h-6 text-white" />
            ) : (
                <Sparkles className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            )}
          </div>
        </div>
      </motion.div>

      {/* 添加波浪动画的关键帧样式 */}
      <style jsx global>{`
        @keyframes wave-rise {
          0% { transform: rotate(0deg); bottom: -150%; }
          100% { transform: rotate(360deg); bottom: -10%; }
        }
        .animate-wave-rise {
          animation: wave-rise 3s ease-in-out infinite alternate; 
          /* 这里的 infinite 是简化的，实际上我们希望它填满后保持 */
          animation-iteration-count: 1;
          animation-fill-mode: forwards;
        }
      `}</style>
    </>
  );
}