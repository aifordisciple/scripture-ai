'use client'

import React, { useMemo } from 'react'
import { Target, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'

/** Progress milestone */
interface Milestone {
  target: number
  zhLabel: string
  enLabel: string
}

/** Default milestones for sermon writing */
const MILESTONES: Milestone[] = [
  { target: 300, zhLabel: '大纲完成', enLabel: 'Outline Done' },
  { target: 800, zhLabel: '初稿过半', enLabel: 'Draft Half' },
  { target: 1500, zhLabel: '初稿完成', enLabel: 'Draft Done' },
  { target: 2500, zhLabel: '润色完成', enLabel: 'Refined' },
  { target: 3500, zhLabel: '定稿', enLabel: 'Final' },
]

/**
 * WritingProgressPanel — 写作进度追踪与目标设定
 *
 * Features:
 * - Visual progress bar with milestone markers
 * - Estimated time to completion
 * - Current milestone indicator
 * - Word count target vs actual
 *
 * Inspired by: NaNoWriMo progress tracker, Sudowrite's
 * "Story Engine" progress visualization
 */
export function WritingProgressPanel() {
  const { locale, currentSermon } = useBibleStore()
  const isZh = locale !== 'en'

  const content = currentSermon?.content || ''
  const wordCount = content.length
  const style = currentSermon?.style || 'EXPOSITORY'

  // Default target based on sermon style
  const defaultTarget = style === 'EXPOSITORY' ? 2500
    : style === 'TOPICAL' ? 2000
    : style === 'NARRATIVE' ? 3000
    : 2000

  const target = defaultTarget
  const progress = Math.min(100, (wordCount / target) * 100)

  // Find current milestone
  const currentMilestone = useMemo(() => {
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (wordCount >= MILESTONES[i].target) return i
    }
    return -1
  }, [wordCount])

  // Estimate time remaining (average writing speed: ~300 chars/min for Chinese)
  const remainingChars = Math.max(0, target - wordCount)
  const estimatedMinutes = Math.ceil(remainingChars / 300)

  // Next milestone
  const nextMilestone = currentMilestone < MILESTONES.length - 1
    ? MILESTONES[currentMilestone + 1]
    : null

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <Target size={12} className="text-amber-500" />
        <span className="text-xs font-medium text-foreground">
          {isZh ? '写作进度' : 'Writing Progress'}
        </span>
      </div>

      <div className="px-3 py-2 space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              {isZh ? `${wordCount} / ${target} 字` : `${wordCount} / ${target} chars`}
            </span>
            <span className="text-[10px] font-medium text-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
            {/* Milestone markers */}
            {MILESTONES.map((milestone, i) => {
              const pct = (milestone.target / target) * 100
              if (pct > 100) return null
              const reached = wordCount >= milestone.target
              return (
                <div
                  key={i}
                  className="absolute top-0 h-full w-0.5"
                  style={{ left: `${pct}%` }}
                >
                  <div className={`w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-0.5 ${
                    reached ? 'bg-amber-600' : 'bg-muted-foreground/30'
                  }`} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Current milestone */}
        {currentMilestone >= 0 && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-amber-100/50 dark:bg-amber-900/20">
            <CheckCircle2 size={12} className="text-amber-600" />
            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
              {isZh ? MILESTONES[currentMilestone].zhLabel : MILESTONES[currentMilestone].enLabel}
            </span>
          </div>
        )}

        {/* Next milestone */}
        {nextMilestone && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">
              {isZh ? '下一目标' : 'Next'}: {isZh ? nextMilestone.zhLabel : nextMilestone.enLabel}
            </span>
            <span className="text-muted-foreground">
              {nextMilestone.target - wordCount} {isZh ? '字' : 'chars'}
            </span>
          </div>
        )}

        {/* Estimated time */}
        {remainingChars > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock size={10} />
            <span>
              {isZh ? `预计还需 ~${estimatedMinutes} 分钟` : `~${estimatedMinutes} min remaining`}
            </span>
          </div>
        )}

        {/* Milestone timeline */}
        <div>
          <div className="text-[10px] font-medium text-muted-foreground mb-1.5">
            {isZh ? '里程碑' : 'Milestones'}
          </div>
          <div className="space-y-1">
            {MILESTONES.map((milestone, i) => {
              const reached = wordCount >= milestone.target
              const isCurrent = i === currentMilestone + 1
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    reached ? 'bg-amber-500 text-white'
                      : isCurrent ? 'bg-amber-200 dark:bg-amber-800/50 text-amber-600 dark:text-amber-300'
                      : 'bg-muted/50 text-muted-foreground/50'
                  }`}>
                    {reached ? <CheckCircle2 size={10} /> : <span className="text-[8px]">{i + 1}</span>}
                  </div>
                  <span className={`text-[10px] ${reached ? 'text-foreground/80 line-through' : isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {isZh ? milestone.zhLabel : milestone.enLabel}
                  </span>
                  <span className="text-[9px] text-muted-foreground/60 ml-auto">
                    {milestone.target}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Style-based target info */}
        <div className="text-[9px] text-muted-foreground/60 text-center">
          {isZh ? `${style}风格 · 目标${target}字` : `${style} style · ${target} chars target`}
        </div>
      </div>
    </div>
  )
}