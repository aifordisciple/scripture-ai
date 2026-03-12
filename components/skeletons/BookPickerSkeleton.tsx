// components/skeletons/BookPickerSkeleton.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * BookPicker 底部弹出选择器的骨架屏
 * 模拟：旧约/新约切换 + 书卷网格 + 章节网格
 */
export function BookPickerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card rounded-t-3xl p-4 pb-safe", className)}>
      {/* 旧约/新约 Tab 骨架 */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>

      {/* 书卷网格骨架 (5列) */}
      <div className="mb-4">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 15 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-10 rounded-xl"
            />
          ))}
        </div>
      </div>

      {/* 章节网格骨架 (8列) */}
      <div className="grid grid-cols-8 gap-1.5">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton
            key={i}
            className="aspect-square rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}

export default BookPickerSkeleton;