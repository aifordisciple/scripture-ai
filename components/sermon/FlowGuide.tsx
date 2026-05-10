'use client'

import { useBibleStore } from '@/store/useBibleStore'
import {
  BookOpen,
  Target,
  LayoutList,
  PenLine,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'

/** Flow stage definitions — keys must match sermonFlowStage values */
const STAGES = [
  { key: 'verse-study', icon: BookOpen, labelZh: '经文研读', labelEn: 'Scripture' },
  { key: 'outline', icon: LayoutList, labelZh: '大纲', labelEn: 'Outline' },
  { key: 'draft', icon: PenLine, labelZh: '写作', labelEn: 'Draft' },
  { key: 'refine', icon: Sparkles, labelZh: '润色', labelEn: 'Refine' },
  { key: 'review', icon: CheckCircle2, labelZh: '审查', labelEn: 'Review' },
]

/**
 * FlowGuide — Minimalist breadcrumb-style flow progress indicator
 *
 * Replaces the full-width progress bar with a compact breadcrumb
 * showing the current writing stage. Clicking a completed stage
 * navigates back to it.
 *
 * Inspired by: Notion's breadcrumb navigation, Linear's status pills
 */
export function FlowGuide() {
  const { sermonFlowStage, setSermonFlowStage, locale } = useBibleStore()
  const currentIdx = STAGES.findIndex(s => s.key === sermonFlowStage)

  return (
    <div className="flex items-center gap-0 px-4 py-1.5 border-b border-border dark:border-white/[0.06] bg-muted/20">
      {STAGES.map((stage, idx) => {
        const Icon = stage.icon
        const isCompleted = idx < currentIdx
        const isCurrent = idx === currentIdx
        const isFuture = idx > currentIdx
        const label = locale === 'en' ? stage.labelEn : stage.labelZh

        return (
          <div key={stage.key} className="flex items-center">
            {/* Stage pill */}
            <button
              onClick={() => {
                // Allow clicking completed or current stages
                if (isCompleted || isCurrent) {
                  setSermonFlowStage(stage.key)
                }
              }}
              disabled={isFuture}
              className={`
                flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                transition-all duration-150
                ${isCurrent
                  ? 'bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary'
                  : isCompleted
                  ? 'bg-primary/5 text-primary/60 dark:bg-primary/10 dark:text-primary/50 hover:bg-primary/10 hover:text-primary/80 cursor-pointer'
                  : 'text-muted-foreground/40 cursor-default'
                }
              `}
            >
              <Icon size={10} className={isCurrent ? 'text-primary' : ''} />
              <span>{label}</span>
            </button>

            {/* Chevron separator */}
            {idx < STAGES.length - 1 && (
              <ChevronRight
                size={10}
                className={`mx-0.5 ${idx < currentIdx ? 'text-primary/30' : 'text-muted-foreground/20'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
