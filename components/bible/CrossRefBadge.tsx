// components/bible/CrossRefBadge.tsx
"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export type ConnectionType = 'THEMATIC' | 'QUOTATION' | 'PARALLEL' | 'PROPHECY' | 'ILLUSTRATION';

interface CrossRefBadgeProps {
  type: ConnectionType;
  className?: string;
}

// Configuration for each connection type
const TYPE_CONFIG: Record<ConnectionType, { labelKey: string; colorClass: string }> = {
  QUOTATION: {
    labelKey: 'bible.typeQuotation',
    colorClass: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
  },
  PARALLEL: {
    labelKey: 'bible.typeParallel',
    colorClass: 'bg-primary/5 text-primary dark:bg-primary/10 dark:text-primary',
  },
  THEMATIC: {
    labelKey: 'bible.typeThematic',
    colorClass: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
  },
  PROPHECY: {
    labelKey: 'bible.typeProphecy',
    colorClass: 'bg-primary/5 text-primary dark:bg-primary/10 dark:text-primary',
  },
  ILLUSTRATION: {
    labelKey: 'bible.typeIllustration',
    colorClass: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
  },
};

export function CrossRefBadge({ type, className }: CrossRefBadgeProps) {
  const { t } = useTranslation();
  const config = TYPE_CONFIG[type];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        config.colorClass,
        className
      )}
    >
      {t(config.labelKey)}
    </span>
  );
}

/**
 * Get all connection types with their labels
 */
export function getConnectionTypes(): { type: ConnectionType; label: string }[] {
  const { t } = useTranslation();
  return Object.entries(TYPE_CONFIG).map(([type, config]) => ({
    type: type as ConnectionType,
    label: t(config.labelKey),
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
  const { t } = useTranslation();
  const filters: { type: ConnectionType | 'ALL'; labelKey: string }[] = [
    { type: 'ALL', labelKey: 'bible.filterAll' },
    { type: 'QUOTATION', labelKey: 'bible.typeQuotation' },
    { type: 'PARALLEL', labelKey: 'bible.typeParallel' },
    { type: 'THEMATIC', labelKey: 'bible.typeThematic' },
    { type: 'PROPHECY', labelKey: 'bible.typeProphecy' },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border-b border-border dark:border-border">
      {filters.map(({ type, labelKey }) => (
        <button
          key={type}
          onClick={() => onFilterChange(type)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
            activeFilter === type
              ? 'bg-primary text-white'
              : 'bg-secondary text-muted-foreground hover:bg-accent dark:bg-card dark:text-muted-foreground dark:hover:bg-border active:scale-95'
          )}
        >
          {t(labelKey)}
          {counts && counts[type] !== undefined && (
            <span className="ml-1 opacity-70">({counts[type]})</span>
          )}
        </button>
      ))}
    </div>
  );
}