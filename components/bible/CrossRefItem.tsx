// components/bible/CrossRefItem.tsx
"use client";

import { cn } from "@/lib/utils";
import { CrossRefBadge, ConnectionType } from "./CrossRefBadge";
import { ChevronRight } from "lucide-react";

export interface CrossReferenceItem {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  content: string;
  type: ConnectionType;
  strength: number;
  description?: string;
  source: 'precomputed' | 'vector';
}

interface CrossRefItemProps {
  item: CrossReferenceItem;
  onClick?: () => void;
}

/**
 * Strength indicator bar component
 */
function StrengthBar({ strength }: { strength: number }) {
  const percentage = Math.round(strength * 100);
  const barColor =
    percentage >= 80
      ? 'bg-green-500'
      : percentage >= 60
      ? 'bg-blue-500'
      : percentage >= 40
      ? 'bg-amber-500'
      : 'bg-slate-400';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-slate-400">{percentage}%</span>
    </div>
  );
}

export function CrossRefItem({ item, onClick }: CrossRefItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group p-3 rounded-xl transition-all cursor-pointer',
        'hover:bg-slate-50 dark:hover:bg-slate-800/50',
        'border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
      )}
    >
      {/* Header: Reference + Badge + Strength */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {/* Reference */}
          <span className="font-semibold text-foreground">
            {item.bookName} {item.chapter}:{item.verse}
          </span>
          {/* Type Badge */}
          <CrossRefBadge type={item.type} />
        </div>
        {/* Strength */}
        <StrengthBar strength={item.strength} />
      </div>

      {/* Content */}
      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
        {item.content}
      </p>

      {/* Description (if available) */}
      {item.description && (
        <p className="mt-1.5 text-xs text-primary/80 italic">
          💡 {item.description}
        </p>
      )}

      {/* Navigate hint */}
      <div className="flex items-center justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-primary flex items-center gap-1">
          点击跳转
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for cross-reference item
 */
export function CrossRefItemSkeleton() {
  return (
    <div className="p-3 rounded-xl animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
export function CrossRefEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <span className="text-2xl">🔍</span>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm">
        暂无相关经文
      </p>
      <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
        该经文可能暂未建立关联关系
      </p>
    </div>
  );
}