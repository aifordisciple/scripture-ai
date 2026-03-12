// components/skeletons/GroupCardSkeleton.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * 小组卡片骨架屏
 */
export function GroupCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/50 bg-card overflow-hidden",
      className
    )}>
      <div className="p-4">
        {/* 小组名称 + 头像组 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-24 rounded mb-1" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
          <div className="flex -space-x-2">
            <Skeleton className="h-8 w-8 rounded-full border-2 border-background" />
            <Skeleton className="h-8 w-8 rounded-full border-2 border-background" />
            <Skeleton className="h-8 w-8 rounded-full border-2 border-background" />
          </div>
        </div>

        {/* 当前读经进度 */}
        <div className="bg-secondary/50 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-8 rounded" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          <Skeleton className="flex-1 h-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * 小组卡片列表骨架屏
 */
export function GroupCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <GroupCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default GroupCardSkeleton;