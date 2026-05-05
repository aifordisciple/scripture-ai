// components/bible/BookPicker/ChapterGrid.tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChapterGridProps } from "./types";
import { motion } from "framer-motion";

// 动画总时长上限 300ms，避免 Psalms 150章需 1.5s
const MAX_ANIMATION_DURATION = 0.3;

/**
 * 章节网格组件
 * 8 列紧凑布局，支持快速选择
 */
export function ChapterGrid({ chapters, selectedChapter, onSelect }: ChapterGridProps) {
  // 生成章节数组
  const chapterList = useMemo(() => {
    return Array.from({ length: chapters }, (_, i) => i + 1);
  }, [chapters]);

  return (
    <div className="grid grid-cols-8 gap-1.5">
      {chapterList.map((chapter, index) => {
        const isSelected = selectedChapter === chapter;

        return (
          <motion.button
            key={chapter}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (index / chapters) * MAX_ANIMATION_DURATION, duration: 0.1 }}
            onClick={() => onSelect(chapter)}
            className={cn(
              "aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150",
              "border border-transparent",
              isSelected
                ? "bg-primary text-primary-foreground border-primary/20"
                : "bg-secondary/40 text-foreground hover:bg-secondary hover:border-border"
            )}
          >
            {chapter}
          </motion.button>
        );
      })}
    </div>
  );
}

export default ChapterGrid;