// components/bible/CrossRefBadge.tsx
"use client";

import { cn } from "@/lib/utils";

export type ConnectionType = 'THEMATIC' | 'QUOTATION' | 'PARALLEL' | 'PROPHECY' | 'ILLUSTRATION';

interface CrossRefBadgeProps {
  type: ConnectionType;
  className?: string;
}

// Configuration for each connection type
const TYPE_CONFIG: Record<ConnectionType, { label: string; colorClass: string }> = {
  QUOTATION: {
    label: '引用',
    colorClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  PARALLEL: {
    label: '平行',
    colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  THEMATIC: {
    label: '主题',
    colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  PROPHECY: {
    label: '预言',
    colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  },
  ILLUSTRATION: {
    label: '例证',
    colorClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  },
};

export function CrossRefBadge({ type, className }: CrossRefBadgeProps) {
  const config = TYPE_CONFIG[type];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        config.colorClass,
        className
      )}
    >
      {config.label}
    </span>
  );
}

/**
 * Get all connection types with their labels
 */
export function getConnectionTypes(): { type: ConnectionType; label: string }[] {
  return Object.entries(TYPE_CONFIG).map(([type, config]) => ({
    type: type as ConnectionType,
    label: config.label,
  }));
}

/**
 * Filter tab component for cross-reference types
 */
interface CrossRefFilterTabsProps {
  activeFilter: ConnectionType | 'ALL';
  onFilterChange: (filter: ConnectionType | 'ALL') => void;
  counts?: Record<ConnectionType | 'ALL', number>;
}

export function CrossRefFilterTabs({
  activeFilter,
  onFilterChange,
  counts,
}: CrossRefFilterTabsProps) {
  const filters: { type: ConnectionType | 'ALL'; label: string }[] = [
    { type: 'ALL', label: '全部' },
    { type: 'QUOTATION', label: '引用' },
    { type: 'PARALLEL', label: '平行' },
    { type: 'THEMATIC', label: '主题' },
    { type: 'PROPHECY', label: '预言' },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border-b border-slate-200 dark:border-slate-700">
      {filters.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => onFilterChange(type)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            activeFilter === type
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
          )}
        >
          {label}
          {counts && counts[type] !== undefined && (
            <span className="ml-1 opacity-70">({counts[type]})</span>
          )}
        </button>
      ))}
    </div>
  );
}