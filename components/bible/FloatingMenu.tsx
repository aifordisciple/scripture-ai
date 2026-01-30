// components/bible/FloatingMenu.tsx
"use client";

import { useEffect, useState } from "react";
import { Sparkles, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingMenuProps {
  visible: boolean;
  position: { top: number; left: number };
  onClose: () => void;
  onExplain: () => void;
  selectedCount: number;
}

export function FloatingMenu({ visible, position, onClose, onExplain, selectedCount }: FloatingMenuProps) {
  const [render, setRender] = useState(false);

  useEffect(() => {
    if (visible) setRender(true);
    else {
      const timer = setTimeout(() => setRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!render) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex items-center gap-1 p-1 bg-slate-900 text-white rounded-lg shadow-xl transition-all duration-200 ease-out origin-bottom",
        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
      )}
      style={{
        top: position.top, 
        left: position.left,
        transform: "translateX(-50%)" 
      }}
      // 关键：阻止菜单自身的点击事件冒泡，防止误触关闭
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 text-xs font-bold border-r border-white/20 text-slate-300">
        已选 {selectedCount} 节
      </div>
      <button
        onClick={onExplain}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors text-xs font-medium"
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        AI 解读
      </button>
      <button
        onClick={onClose}
        className="p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-400 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900" />
    </div>
  );
}