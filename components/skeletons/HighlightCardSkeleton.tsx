// components/skeletons/HighlightCardSkeleton.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * 高亮卡片骨架屏
 */
export function HighlightCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-xl border border-border/50 bg-card p-3",
      className
    )}>
      {/* 标题行：经文引用 + 颜色标签 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <Skeleton className="h-4 w-4 rounded" />
      </div>

      {/* 经文内容 */}
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
      </div>

      {/* 底部时间 */}
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    </div>
  );
}

/**
 * 高亮卡片列表骨架屏
 */
export function HighlightCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <HighlightCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default HighlightCardSkeleton;