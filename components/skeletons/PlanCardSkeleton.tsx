// components/skeletons/PlanCardSkeleton.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * 读经计划卡片骨架屏
 */
export function PlanCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/50 bg-card overflow-hidden",
      className
    )}>
      {/* 顶部进度条 */}
      <div className="h-2 bg-muted">
        <Skeleton className="h-full w-1/3 rounded-none" />
      </div>

      <div className="p-4">
        {/* 计划名称 + 徽章 */}
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* 描述 */}
        <Skeleton className="h-4 w-full mb-2 rounded" />
        <Skeleton className="h-4 w-3/4 mb-4 rounded" />

        {/* 统计信息 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-8 rounded" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
        </div>

        {/* 今日进度 */}
        <div className="bg-secondary/50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * 多个计划卡片的骨架屏列表
 */
export function PlanCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PlanCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default PlanCardSkeleton;