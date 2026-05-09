'use client'

import React, { useState, useCallback } from 'react'
import { Users, Church, GraduationCap, BookOpen, MessageCircle } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { cn } from '@/lib/utils'

/** Audience type for sermon delivery context */
export type AudienceType = 'youth' | 'sunday' | 'seminary' | 'smallgroup'

interface AudienceConfig {
  key: AudienceType
  labelZh: string
  labelEn: string
  descZh: string
  descEn: string
  icon: React.ElementType
  toneZh: string
  toneEn: string
  formality: number // 1-5
  storyWeight: number // 1-5
  academicDepth: number // 1-5
}

const AUDIENCE_CONFIGS: AudienceConfig[] = [
  {
    key: 'youth',
    labelZh: '青年团契',
    labelEn: 'Youth',
    descZh: '轻松活泼，故事驱动，贴近生活',
    descEn: 'Casual, story-driven, relatable',
    icon: Users,
    toneZh: '轻松、故事多、贴近青年生活',
    toneEn: 'Casual, story-rich, youth-relatable',
    formality: 1,
    storyWeight: 5,
    academicDepth: 1,
  },
  {
    key: 'sunday',
    labelZh: '主日崇拜',
    labelEn: 'Sunday Service',
    descZh: '庄重但易懂，兼顾深度与广度',
    descEn: 'Reverent but accessible, balanced depth',
    icon: Church,
    toneZh: '庄重但易懂，兼顾深度与广度',
    toneEn: 'Reverent but accessible, balanced depth',
    formality: 3,
    storyWeight: 3,
    academicDepth: 2,
  },
  {
    key: 'seminary',
    labelZh: '神学院',
    labelEn: 'Seminary',
    descZh: '精确学术，注重原文与神学框架',
    descEn: 'Precise, academic, original language focus',
    icon: GraduationCap,
    toneZh: '精确学术，注重原文与神学框架',
    toneEn: 'Precise, academic, original language focus',
    formality: 5,
    storyWeight: 1,
    academicDepth: 5,
  },
  {
    key: 'smallgroup',
    labelZh: '小组查经',
    labelEn: 'Small Group',
    descZh: '对话讨论式，互动引导',
    descEn: 'Conversational, discussion-oriented',
    icon: MessageCircle,
    toneZh: '对话讨论式，互动引导，开放性问题',
    toneEn: 'Conversational, discussion-oriented, open questions',
    formality: 2,
    storyWeight: 4,
    academicDepth: 2,
  },
]

/**
 * AudienceTonePanel — 受众感知语调面板
 *
 * Allows fine-grained control over AI output tone based on
 * the target audience. More specific than the global voiceProfile,
 * this controls the formality, story weight, and academic depth
 * of AI-generated content.
 *
 * Inspired by Jasper's Tone of Voice settings and
 * Sudowrite's audience-aware generation.
 */
export function AudienceTonePanel() {
  const { locale, sermonAudience, setSermonAudience } = useBibleStore()
  const isZh = locale !== 'en'

  const currentConfig = AUDIENCE_CONFIGS.find(c => c.key === sermonAudience) || AUDIENCE_CONFIGS[1]

  const handleSelect = useCallback((key: AudienceType) => {
    setSermonAudience(key)
  }, [setSermonAudience])

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <Users size={12} className="text-primary" />
        <span className="text-xs font-medium text-foreground">
          {isZh ? '受众语调' : 'Audience Tone'}
        </span>
      </div>

      <div className="px-3 py-2 space-y-2">
        {/* Audience type selector */}
        <div className="grid grid-cols-2 gap-1.5">
          {AUDIENCE_CONFIGS.map((config) => {
            const Icon = config.icon
            const isSelected = sermonAudience === config.key
            return (
              <button
                key={config.key}
                onClick={() => handleSelect(config.key)}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon size={12} />
                {isZh ? config.labelZh : config.labelEn}
              </button>
            )
          })}
        </div>

        {/* Current audience description */}
        <div className="text-[10px] text-muted-foreground leading-relaxed">
          {isZh ? currentConfig.descZh : currentConfig.descEn}
        </div>

        {/* Tone sliders visualization */}
        <div className="space-y-1.5">
          {/* Formality */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-10 shrink-0">
              {isZh ? '正式度' : 'Formal'}
            </span>
            <div className="flex-1 flex gap-0.5">
              {[1, 2, 3, 4, 5].map(level => (
                <div
                  key={level}
                  className={cn(
                    'h-1.5 flex-1 rounded-sm',
                    level <= currentConfig.formality
                      ? 'bg-primary/60'
                      : 'bg-muted/30'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Story weight */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-10 shrink-0">
              {isZh ? '故事性' : 'Story'}
            </span>
            <div className="flex-1 flex gap-0.5">
              {[1, 2, 3, 4, 5].map(level => (
                <div
                  key={level}
                  className={cn(
                    'h-1.5 flex-1 rounded-sm',
                    level <= currentConfig.storyWeight
                      ? 'bg-amber-500/60'
                      : 'bg-muted/30'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Academic depth */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-10 shrink-0">
              {isZh ? '学术性' : 'Academic'}
            </span>
            <div className="flex-1 flex gap-0.5">
              {[1, 2, 3, 4, 5].map(level => (
                <div
                  key={level}
                  className={cn(
                    'h-1.5 flex-1 rounded-sm',
                    level <= currentConfig.academicDepth
                      ? 'bg-blue-500/60'
                      : 'bg-muted/30'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
