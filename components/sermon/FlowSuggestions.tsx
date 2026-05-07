'use client'

import React, { useCallback } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { BookOpen, PenLine, ArrowRight, Sparkles, GitBranch } from 'lucide-react'
import type { SermonAiSuggestion } from '@/store/types'

/** Map action keys to Lucide icon components */
const ACTION_ICONS: Record<string, React.ElementType> = {
  'continue': ArrowRight,
  'insert-verse': BookOpen,
  'add-example': Sparkles,
  'polish': PenLine,
  'crossref': GitBranch,
  'review': PenLine,
}

interface FlowSuggestionsProps {
  onAction?: (action: string) => void
}

/** Compact suggestion chips for the current sermon flow stage */
export function FlowSuggestions({ onAction }: FlowSuggestionsProps) {
  const { sermonAiSuggestions, locale } = useBibleStore()

  if (sermonAiSuggestions.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 overflow-x-auto scrollbar-none">
      {sermonAiSuggestions.map((suggestion) => (
        <SuggestionChip
          key={suggestion.id}
          suggestion={suggestion}
          locale={locale}
          onClick={() => onAction?.(suggestion.action)}
        />
      ))}
    </div>
  )
}

interface SuggestionChipProps {
  suggestion: SermonAiSuggestion
  locale: string
  onClick: () => void
}

function SuggestionChip({ suggestion, locale, onClick }: SuggestionChipProps) {
  const IconComponent = (suggestion.icon && ACTION_ICONS[suggestion.icon])
    || ACTION_ICONS[suggestion.action]
    || Sparkles

  const label = locale === 'en' ? suggestion.labelEn : suggestion.labelZh

  return (
    <button
      onClick={onClick}
      className="
        inline-flex items-center gap-1 px-2.5 py-1 rounded-full
        text-[11px] font-medium whitespace-nowrap
        bg-primary/8 text-primary
        hover:bg-primary/15 active:scale-95
        transition-all duration-150
        border border-primary/10
      "
    >
      <IconComponent size={12} />
      <span>{label}</span>
    </button>
  )
}
