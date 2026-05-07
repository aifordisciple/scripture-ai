'use client'

import React from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { FLOW_STAGES, getStageInfo } from '@/lib/sermon-flow'
import type { SermonFlowStage } from '@/store/types'
import { Check } from 'lucide-react'

/** Horizontal progress bar for sermon preparation stages */
export function FlowGuide() {
  const { sermonFlowStage } = useBibleStore()
  const { locale } = useTranslation()

  const currentIndex = FLOW_STAGES.findIndex(s => s.stage === sermonFlowStage)
  const stageInfo = getStageInfo(sermonFlowStage)

  const label = locale === 'en' ? stageInfo.labelEn : stageInfo.labelZh
  const description = locale === 'en' ? stageInfo.descriptionEn : stageInfo.descriptionZh

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/30 dark:bg-white/[0.02] border-b border-border dark:border-white/[0.06]"
      style={{ minHeight: 40 }}
    >
      {/* Progress nodes */}
      <div className="flex items-center gap-0 flex-shrink-0">
        {FLOW_STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const stageLabel = locale === 'en' ? stage.labelEn : stage.labelZh

          return (
            <React.Fragment key={stage.stage}>
              {/* Node */}
              <div className="flex items-center gap-1">
                <div
                  className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors
                    ${isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                        : 'bg-muted-foreground/20 text-muted-foreground'
                    }
                  `}
                  title={stageLabel}
                >
                  {isCompleted ? (
                    <Check size={10} strokeWidth={3} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < FLOW_STAGES.length - 1 && (
                <div
                  className={`w-4 h-[2px] flex-shrink-0 transition-colors ${
                    index < currentIndex
                      ? 'bg-primary'
                      : 'bg-muted-foreground/20'
                  }`}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Current stage label + description */}
      <div className="flex items-center gap-2 min-w-0 ml-1">
        <span className="text-xs font-medium text-primary whitespace-nowrap">{label}</span>
        <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">{description}</span>
      </div>
    </div>
  )
}
