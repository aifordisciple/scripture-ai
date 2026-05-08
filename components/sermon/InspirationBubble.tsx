'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Lightbulb, X, Sparkles, ArrowRight } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import type { SermonFlowStage } from '@/store/types'

/** Inspiration item */
interface InspirationItem {
  id: string;
  text: string;
  action?: string; // e.g. 'expand', 'continue', 'add-illustration'
  stage: SermonFlowStage;
}

/** Generate inspirations based on flow stage */
function generateInspirations(stage: SermonFlowStage, isZh: boolean): InspirationItem[] {
  const map: Record<SermonFlowStage, { zh: InspirationItem[]; en: InspirationItem[] }> = {
    'verse-study': {
      zh: [
        { id: 'vs-1', text: '探索这段经文的历史背景和文化语境', action: 'continue', stage: 'verse-study' },
        { id: 'vs-2', text: '找出经文中的关键词并分析其原文含义', action: 'continue', stage: 'verse-study' },
        { id: 'vs-3', text: '思考这段经文对当代信徒的应用意义', action: 'continue', stage: 'verse-study' },
      ],
      en: [
        { id: 'vs-1', text: 'Explore the historical and cultural context', action: 'continue', stage: 'verse-study' },
        { id: 'vs-2', text: 'Identify key words and their original meaning', action: 'continue', stage: 'verse-study' },
        { id: 'vs-3', text: 'Consider modern application for believers', action: 'continue', stage: 'verse-study' },
      ],
    },
    'outline': {
      zh: [
        { id: 'ol-1', text: '添加一个引人入胜的开场故事', action: 'continue', stage: 'outline' },
        { id: 'ol-2', text: '为每个论点增加一个生活应用', action: 'continue', stage: 'outline' },
        { id: 'ol-3', text: '设计一个呼应开头的结尾', action: 'continue', stage: 'outline' },
      ],
      en: [
        { id: 'ol-1', text: 'Add an engaging opening story', action: 'continue', stage: 'outline' },
        { id: 'ol-2', text: 'Add a life application for each point', action: 'continue', stage: 'outline' },
        { id: 'ol-3', text: 'Design a closing that echoes the opening', action: 'continue', stage: 'outline' },
      ],
    },
    'draft': {
      zh: [
        { id: 'dr-1', text: '扩展这个段落，增加圣经例证', action: 'expand', stage: 'draft' },
        { id: 'dr-2', text: '添加一个个人见证来增强说服力', action: 'continue', stage: 'draft' },
        { id: 'dr-3', text: '用比喻来解释这个抽象概念', action: 'continue', stage: 'draft' },
      ],
      en: [
        { id: 'dr-1', text: 'Expand this section with a biblical example', action: 'expand', stage: 'draft' },
        { id: 'dr-2', text: 'Add a personal testimony for impact', action: 'continue', stage: 'draft' },
        { id: 'dr-3', text: 'Use an analogy to explain this concept', action: 'continue', stage: 'draft' },
      ],
    },
    'refine': {
      zh: [
        { id: 'rf-1', text: '优化段落间的过渡，使逻辑更流畅', action: 'continue', stage: 'refine' },
        { id: 'rf-2', text: '增强结尾的呼吁力度', action: 'continue', stage: 'refine' },
        { id: 'rf-3', text: '检查是否有重复表达可以精简', action: 'shrink', stage: 'refine' },
      ],
      en: [
        { id: 'rf-1', text: 'Improve transitions between sections', action: 'continue', stage: 'refine' },
        { id: 'rf-2', text: 'Strengthen the closing call to action', action: 'continue', stage: 'refine' },
        { id: 'rf-3', text: 'Check for redundant expressions to trim', action: 'shrink', stage: 'refine' },
      ],
    },
    'review': {
      zh: [
        { id: 'rv-1', text: '生成讲章摘要用于公告', action: 'continue', stage: 'review' },
        { id: 'rv-2', text: '准备讨论问题用于小组分享', action: 'continue', stage: 'review' },
        { id: 'rv-3', text: '创建经文背诵卡', action: 'continue', stage: 'review' },
      ],
      en: [
        { id: 'rv-1', text: 'Generate a sermon summary for bulletin', action: 'continue', stage: 'review' },
        { id: 'rv-2', text: 'Prepare discussion questions for small group', action: 'continue', stage: 'review' },
        { id: 'rv-3', text: 'Create a scripture memory card', action: 'continue', stage: 'review' },
      ],
    },
  }
  return isZh ? map[stage].zh : map[stage].en
}

/**
 * InspirationBubble — 主动式灵感气泡
 *
 * Features:
 * - Contextual inspiration suggestions based on current flow stage
 * - Dismissable bubble with animation
 * - Click to trigger AI action
 * - Auto-refreshes when flow stage changes
 */
export function InspirationBubble() {
  const { locale } = useTranslation()
  const isZh = locale !== 'en'

  const { sermonFlowStage, sermonAiSuggestions } = useBibleStore()
  const [visible, setVisible] = useState(true)
  const [currentInspirations, setCurrentInspirations] = useState<InspirationItem[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  // Refresh inspirations when flow stage changes
  useEffect(() => {
    const items = generateInspirations(sermonFlowStage, isZh)
    setCurrentInspirations(items)
    setVisible(true)
    setDismissedIds(new Set())
  }, [sermonFlowStage, isZh])

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
  }, [])

  const handleAction = useCallback((item: InspirationItem) => {
    // Trigger the AI action via the sermon editor
    const event = new CustomEvent('sermon-inspiration', { detail: { action: item.action, text: item.text } })
    window.dispatchEvent(event)
    handleDismiss(item.id)
  }, [handleDismiss])

  const visibleInspirations = currentInspirations.filter(i => !dismissedIds.has(i.id))

  if (!visible || visibleInspirations.length === 0) return null

  return (
    <div className="px-3 py-2 space-y-1">
      <div className="flex items-center gap-1 mb-1">
        <Lightbulb size={10} className="text-amber-500" />
        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
          {isZh ? '灵感建议' : 'Inspiration'}
        </span>
        <button
          onClick={() => setVisible(false)}
          className="ml-auto text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <X size={10} />
        </button>
      </div>
      {visibleInspirations.slice(0, 2).map(item => (
        <button
          key={item.id}
          onClick={() => handleAction(item)}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors group"
        >
          <Sparkles size={10} className="text-amber-500 shrink-0" />
          <span className="text-[10px] text-amber-700 dark:text-amber-300 leading-tight flex-1">
            {item.text}
          </span>
          <ArrowRight size={10} className="text-amber-500/50 group-hover:text-amber-500 shrink-0 transition-colors" />
        </button>
      ))}
    </div>
  )
}
