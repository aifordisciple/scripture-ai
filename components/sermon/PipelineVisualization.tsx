'use client'

import React, { useMemo } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import type { SermonFlowStage } from '@/store/types'
import {
  BookOpen,
  ListChecks,
  PenLine,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Circle,
} from 'lucide-react'

/** Stage icon mapping */
function StageIcon({ stage }: { stage: SermonFlowStage }) {
  switch (stage) {
    case 'verse-study': return <BookOpen size={14} />
    case 'outline': return <ListChecks size={14} />
    case 'draft': return <PenLine size={14} />
    case 'refine': return <Sparkles size={14} />
    case 'review': return <CheckCircle2 size={14} />
    default: return <Circle size={14} />
  }
}

/** Stage label (i18n) */
function stageLabel(stage: SermonFlowStage, isZh: boolean): string {
  const map: Record<SermonFlowStage, { zh: string; en: string }> = {
    'verse-study': { zh: '经文研读', en: 'Verse Study' },
    'outline': { zh: '大纲构建', en: 'Outline' },
    'draft': { zh: '草稿撰写', en: 'Draft' },
    'refine': { zh: '润色精修', en: 'Refine' },
    'review': { zh: '审查完成', en: 'Review' },
  }
  return isZh ? map[stage].zh : map[stage].en
}

/** Stage description (i18n) */
function stageDescription(stage: SermonFlowStage, isZh: boolean): string {
  const map: Record<SermonFlowStage, { zh: string; en: string }> = {
    'verse-study': { zh: '深入研读经文，理解原文含义与背景', en: 'Study the verse, understand original meaning and context' },
    'outline': { zh: '构建讲章大纲，规划段落与论点', en: 'Build sermon outline, plan sections and arguments' },
    'draft': { zh: '撰写讲章草稿，填充各段落内容', en: 'Write draft, fill in section content' },
    'refine': { zh: '润色表达，调整语气与逻辑', en: 'Refine expression, adjust tone and logic' },
    'review': { zh: 'AI审查讲章质量，生成附属内容', en: 'AI review quality, generate supplementary content' },
  }
  return isZh ? map[stage].zh : map[stage].en
}

interface PipelineVisualizationProps {
  /** Called when user clicks on a stage to navigate/trigger it */
  onStageClick?: (stage: SermonFlowStage) => void
}

/**
 * PipelineVisualization — 讲章管线可视化组件
 *
 * Features:
 * - Visual pipeline showing all 5 stages
 * - Current stage highlighted with progress indicator
 * - Completed stages shown with checkmark
 * - Future stages shown as pending
 * - Click to navigate to a specific stage
 * - Compact design suitable for sidebar panel
 */
export function PipelineVisualization({ onStageClick }: PipelineVisualizationProps) {
  const { locale } = useTranslation()
  const isZh = locale !== 'en'

  const { sermonFlowStage } = useBibleStore()

  const stages = useMemo(() => {
    const stageOrder: SermonFlowStage[] = ['verse-study', 'outline', 'draft', 'refine', 'review']
    const currentIdx = stageOrder.indexOf(sermonFlowStage)

    return stageOrder.map((stage, idx) => ({
      id: stage,
      label: stageLabel(stage, isZh),
      description: stageDescription(stage, isZh),
      state: idx < currentIdx ? 'completed' : idx === currentIdx ? 'current' : 'pending',
      progress: idx < currentIdx ? 100 : idx === currentIdx ? 50 : 0,
    }))
  }, [sermonFlowStage, isZh])

  const overallProgress = useMemo(() => {
    const stageOrder: SermonFlowStage[] = ['verse-study', 'outline', 'draft', 'refine', 'review']
    const currentIdx = stageOrder.indexOf(sermonFlowStage)
    return Math.round((currentIdx / (stageOrder.length - 1)) * 100)
  }, [sermonFlowStage])

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-foreground">
          {isZh ? '讲章管线' : 'Sermon Pipeline'}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {overallProgress}% {isZh ? '完成' : 'done'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-3 py-1.5">
        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stage list */}
      <div className="flex-1 overflow-y-auto px-3 py-1">
        {stages.map((stage, idx) => (
          <div
            key={stage.id}
            className="flex items-start gap-2 mb-2 cursor-pointer group"
            onClick={() => onStageClick?.(stage.id as SermonFlowStage)}
          >
            {/* Connector line */}
            <div className="flex flex-col items-center shrink-0 w-5">
              {/* Stage indicator */}
              <div className={`
                w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-200
                ${stage.state === 'completed'
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : stage.state === 'current'
                    ? 'border-blue-500 bg-blue-500/20 text-blue-500 group-hover:bg-blue-500/30'
                    : 'border-muted-foreground/30 bg-transparent text-muted-foreground/40 group-hover:border-muted-foreground/50'
                }
              `}>
                {stage.state === 'completed' ? (
                  <CheckCircle2 size={10} />
                ) : stage.state === 'current' ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <StageIcon stage={stage.id as SermonFlowStage} />
                )}
              </div>
              {/* Vertical connector */}
              {idx < stages.length - 1 && (
                <div className={`
                  w-0.5 h-4 mt-0.5 rounded-full
                  ${stage.state === 'completed' ? 'bg-emerald-500' : 'bg-muted-foreground/20'}
                `} />
              )}
            </div>

            {/* Stage content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className={`
                text-xs font-medium transition-colors
                ${stage.state === 'completed' ? 'text-emerald-600 dark:text-emerald-400'
                  : stage.state === 'current' ? 'text-blue-600 dark:text-blue-400'
                  : 'text-muted-foreground group-hover:text-foreground'
                }
              `}>
                {stage.label}
              </div>
              <div className={`
                text-[10px] leading-tight mt-0.5 transition-colors
                ${stage.state === 'current' ? 'text-foreground/70' : 'text-muted-foreground/60'}
              `}>
                {stage.description}
              </div>
            </div>

            {/* Action arrow for current/pending stages */}
            {stage.state !== 'completed' && (
              <ChevronRight
                size={12}
                className={`
                  mt-1.5 shrink-0 transition-colors
                  ${stage.state === 'current'
                    ? 'text-blue-500'
                    : 'text-muted-foreground/30 group-hover:text-muted-foreground/60'
                  }
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}