'use client'

import React from 'react'
import { Sparkles, BookOpen, Heart, ArrowRight, Hand } from 'lucide-react'
import type { GhostTextType } from '@/hooks/use-inline-ai'
import { useBibleStore } from '@/store/useBibleStore'

interface GhostTextToolbarProps {
  ghostTextType: GhostTextType
  isGenerating: boolean
  onTriggerType: (type: GhostTextType) => void
}

const GHOST_TYPE_OPTIONS: {
  type: GhostTextType
  icon: typeof Sparkles
  zhLabel: string
  enLabel: string
  zhTooltip: string
  enTooltip: string
}[] = [
  { type: 'continue', icon: Sparkles, zhLabel: '续写', enLabel: 'Continue', zhTooltip: 'AI自动续写内容', enTooltip: 'AI auto-continue' },
  { type: 'illustration', icon: BookOpen, zhLabel: '例证', enLabel: 'Illustrate', zhTooltip: '插入生动例证或故事', enTooltip: 'Insert vivid illustration' },
  { type: 'application', icon: Heart, zhLabel: '应用', enLabel: 'Apply', zhTooltip: '添加生活应用点', enTooltip: 'Add application points' },
  { type: 'transition', icon: ArrowRight, zhLabel: '过渡', enLabel: 'Bridge', zhTooltip: '写一段过渡段落', enTooltip: 'Write a transition' },
  { type: 'prayer', icon: Hand, zhLabel: '祷告', enLabel: 'Pray', zhTooltip: '撰写结束祷告', enTooltip: 'Write a closing prayer' },
]

export function GhostTextToolbar({ ghostTextType, isGenerating, onTriggerType }: GhostTextToolbarProps) {
  const { locale } = useBibleStore()
  const isZh = locale !== 'en'

  return (
    <div className="flex items-center gap-0.5 px-1 py-0.5 bg-muted/30 border-b border-border/50">
      {GHOST_TYPE_OPTIONS.map(({ type, icon: Icon, zhLabel, enLabel, zhTooltip, enTooltip }) => {
        const isActive = ghostTextType === type
        return (
          <button
            key={type}
            onClick={() => onTriggerType(type)}
            disabled={isGenerating}
            title={isZh ? zhTooltip : enTooltip}
            className={`
              flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors
              ${isActive
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }
              ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Icon size={11} />
            <span>{isZh ? zhLabel : enLabel}</span>
          </button>
        )
      })}
    </div>
  )
}
