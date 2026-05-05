// components/bible/CrossRefItem.tsx
"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
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
      : 'bg-accent';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-accent dark:bg-accent rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{percentage}%</span>
    </div>
  );
}

export function CrossRefItem({ item, onClick }: CrossRefItemProps) {
  const { t } = useTranslation();
  return (
    <div
      onClick={onClick}
      className={cn(
        'group p-3 rounded-xl transition-all cursor-pointer',
        'hover:bg-accent/50 dark:hover:bg-accent/50',
        'border border-transparent hover:border-border dark:hover:border-border'
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
      <p className="text-sm text-muted-foreground dark:text-muted-foreground line-clamp-2 leading-relaxed">
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
          {t('bible.clickToNavigate')}
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
          <div className="h-4 w-24 bg-accent dark:bg-accent rounded" />
          <div className="h-4 w-12 bg-accent dark:bg-accent rounded-full" />
        </div>
        <div className="h-3 w-20 bg-accent dark:bg-accent rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-accent dark:bg-accent rounded" />
        <div className="h-3 w-3/4 bg-accent dark:bg-accent rounded" />
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
export function CrossRefEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-accent dark:bg-accent flex items-center justify-center mb-4">
        <span className="text-2xl">🔍</span>
      </div>
      <p className="text-muted-foreground dark:text-muted-foreground text-sm">
        {t('bible.noRelatedVerses')}
      </p>
      <p className="text-muted-foreground dark:text-muted-foreground text-xs mt-1">
        {t('bible.noRelatedVersesHint')}
      </p>
    </div>
  );
}