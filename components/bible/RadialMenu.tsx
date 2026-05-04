// components/bible/RadialMenu.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { QuickAction } from "@/store/types";
import { Puzzle, Scroll, Search, Lightbulb, Hand, GraduationCap, BookOpen, Sparkles, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { DualLangString } from "@/lib/constants";

interface RadialMenuProps {
  isOpen: boolean;
  actions: QuickAction[];
  onSelect: (action: QuickAction) => void;
  onClose: () => void;
  position: { bottom: number; right: number };
}

// 计算径向菜单项位置 (6个项目均匀分布在圆周上)
const getMenuPosition = (index: number, total: number, radius: number) => {
  // 从顶部开始，顺时针排列
  const startAngle = -Math.PI / 2; // 从顶部开始
  const angle = startAngle + (2 * Math.PI * index) / total;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
};

// 图标映射 (Lucide React 组件，跨平台一致)
const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  detail: Puzzle,
  context: Scroll,
  original: Search,
  application: Lightbulb,
  prayer: Hand,
  explain_to_kid: GraduationCap,
  tutor: GraduationCap,
  sermon: BookOpen,
  "study-guide": Scroll,
  // [P0优化] AI模式选项
  "ai-mode-general": Sparkles,
  "ai-mode-tutor": GraduationCap,
  "ai-mode-sermon": BookOpen,
  "ai-mode-study-guide": Scroll,
};

// 颜色映射
const ACTION_COLORS: Record<string, string> = {
  detail: "from-purple-500 to-violet-600",
  context: "from-amber-500 to-orange-600",
  original: "from-indigo-500 to-blue-600",
  application: "from-emerald-500 to-green-600",
  prayer: "from-rose-500 to-pink-600",
  explain_to_kid: "from-cyan-500 to-teal-600",
  tutor: "from-violet-500 to-purple-600",
  sermon: "from-orange-500 to-red-600",
  "study-guide": "from-teal-500 to-emerald-600",
  // [P0优化] AI模式选项颜色
  "ai-mode-general": "from-blue-500 to-indigo-600",
  "ai-mode-tutor": "from-violet-500 to-purple-600",
  "ai-mode-sermon": "from-orange-500 to-amber-600",
  "ai-mode-study-guide": "from-teal-500 to-cyan-600",
};

export function RadialMenu({ isOpen, actions, onSelect, onClose, position }: RadialMenuProps) {
  const { locale } = useTranslation();
  const radius = 80; // 径向菜单半径

  // 解析 label (支持 string 和 DualLangString)
  const resolveLabel = (label: string | DualLangString): string => {
    if (typeof label === 'string') return label;
    return label[locale as keyof DualLangString] || label.zh || label.en || '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[98] bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 径向菜单容器 */}
          <div
            className="fixed z-[99] pointer-events-none"
            style={{
              bottom: position.bottom,
              right: position.right,
              transform: "translate(50%, 50%)",
            }}
          >
            {/* 中心指示器 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl shadow-black/10 flex items-center justify-center"
            >
              <Sparkles className="w-7 h-7 text-white" />
            </motion.div>

            {/* 菜单项 */}
            {actions.map((action, index) => {
              const pos = getMenuPosition(index, actions.length, radius);
              const IconComponent = ACTION_ICONS[action.id] || Sparkles;
              const colorClass = ACTION_COLORS[action.id] || "from-slate-500 to-slate-600";

              return (
                <motion.button
                  key={action.id}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  animate={{
                    x: pos.x,
                    y: pos.y,
                    scale: 1,
                    opacity: 1,
                  }}
                  exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    delay: index * 0.03,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(action);
                    onClose();
                  }}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto",
                    "w-14 h-14 rounded-full",
                    "bg-gradient-to-br shadow-lg",
                    colorClass,
                    "flex flex-col items-center justify-center",
                    "text-white text-xs font-medium",
                    "hover:scale-110 active:scale-95",
                    "transition-transform duration-150",
                    "border-2 border-white/30"
                  )}
                  title={resolveLabel(action.label)}
                >
                  <IconComponent className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] leading-tight text-center px-1 line-clamp-1">
                    {resolveLabel(action.label)}
                  </span>
                </motion.button>
              );
            })}

            {/* 取消按钮 */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.1 }}
              onClick={onClose}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto",
                "w-10 h-10 rounded-full",
                "bg-slate-200 dark:bg-slate-700",
                "flex items-center justify-center",
                "text-slate-600 dark:text-slate-300",
                "hover:bg-slate-300 dark:hover:bg-slate-600",
                "transition-colors duration-150"
              )}
              style={{
                x: getMenuPosition(actions.length, actions.length + 1, radius).x,
                y: getMenuPosition(actions.length, actions.length + 1, radius).y,
              }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// 导出一个 hook 用于获取上下文感知的快捷动作
export function useContextAwareQuickActions(
  selectedVerses: number[],
  hasActivePlan: boolean,
  isAiGenerating: boolean,
  currentAiRequest: any
): QuickAction[] {
  const allActions = useBibleStore.getState().quickActions;

  // AI 已完成
  if (currentAiRequest?.status === 'completed') {
    return allActions.filter(a => ['detail', 'application', 'prayer'].includes(a.id)).slice(0, 4);
  }

  // 有选中经文
  if (selectedVerses.length > 0) {
    return allActions.filter(a => a.category === 'selected' || ['detail', 'original', 'application', 'prayer'].includes(a.id)).slice(0, 6);
  }

  // 有读经计划
  if (hasActivePlan) {
    return allActions.filter(a => ['detail', 'prayer', 'application'].includes(a.id)).slice(0, 4);
  }

  // 默认：阅读状态
  return allActions.slice(0, 6);
}

import { useBibleStore } from "@/store/useBibleStore";
