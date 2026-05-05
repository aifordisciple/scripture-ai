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
    colorClass: 'bg-[#0066cc]/10 text-[#0066cc] dark:bg-[#0066cc]/20 dark:text-[#2997ff]',
  },
  PARALLEL: {
    labelKey: 'bible.typeParallel',
    colorClass: 'bg-[#0066cc]/5 text-[#0066cc] dark:bg-[#0066cc]/10 dark:text-[#2997ff]',
  },
  THEMATIC: {
    labelKey: 'bible.typeThematic',
    colorClass: 'bg-[#0066cc]/10 text-[#0066cc] dark:bg-[#0066cc]/20 dark:text-[#2997ff]',
  },
  PROPHECY: {
    labelKey: 'bible.typeProphecy',
    colorClass: 'bg-[#0066cc]/5 text-[#0066cc] dark:bg-[#0066cc]/10 dark:text-[#2997ff]',
  },
  ILLUSTRATION: {
    labelKey: 'bible.typeIllustration',
    colorClass: 'bg-[#0066cc]/10 text-[#0066cc] dark:bg-[#0066cc]/20 dark:text-[#2997ff]',
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
    <div className="flex flex-wrap gap-1.5 p-2 border-b border-[#e0e0e0] dark:border-[#3a3a3c]">
      {filters.map(({ type, labelKey }) => (
        <button
          key={type}
          onClick={() => onFilterChange(type)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            activeFilter === type
              ? 'bg-[#0066cc] text-white'
              : 'bg-[#f5f5f7] text-[#7a7a7a] hover:bg-[#e0e0e0] dark:bg-[#2a2a2c] dark:text-[#7a7a7a] dark:hover:bg-[#3a3a3c] active:scale-95'
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