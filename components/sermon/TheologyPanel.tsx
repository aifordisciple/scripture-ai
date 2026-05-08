'use client'

import React, { useMemo } from 'react'
import { BookOpen, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import type { TheologyResource, TheologyTradition } from '@/store/types'

/** Tradition label (i18n) */
function traditionLabel(tradition: TheologyTradition, isZh: boolean): string {
  const map: Record<TheologyTradition, { zh: string; en: string }> = {
    'reformed': { zh: '改革宗', en: 'Reformed' },
    'arminian': { zh: '阿米念', en: 'Arminian' },
    'catholic': { zh: '天主教', en: 'Catholic' },
    'orthodox': { zh: '东正教', en: 'Orthodox' },
    'pentecostal': { zh: '灵恩派', en: 'Pentecostal' },
    'baptist': { zh: '浸信会', en: 'Baptist' },
    'interdenominational': { zh: '跨教派', en: 'Interdenominational' },
  }
  return isZh ? map[tradition].zh : map[tradition].en
}

/** Tradition color */
function traditionColor(tradition: TheologyTradition): string {
  const map: Record<TheologyTradition, string> = {
    'reformed': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    'arminian': { zh: '', en: '' } as never || 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    'catholic': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    'orthodox': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'pentecostal': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    'baptist': 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
    'interdenominational': 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
  }
  return map[tradition]
}

/**
 * TheologyPanel — 神学知识注入面板
 *
 * Features:
 * - Displays theology resources matched to current sermon's verse references
 * - Shows tradition tags, key insights, and related verses
 * - Expandable resource cards
 * - Resources are injected into AI prompts automatically
 */
export function TheologyPanel() {
  const { locale } = useTranslation()
  const isZh = locale !== 'en'

  const { theologyResources } = useBibleStore()

  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  if (theologyResources.length === 0) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
          <BookOpen size={12} className="text-purple-500" />
          <span className="text-xs font-medium text-foreground">
            {isZh ? '神学资源' : 'Theology Resources'}
          </span>
        </div>
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          {isZh ? '输入经文引用后，将自动匹配神学资源' : 'Theology resources will be matched when verse refs are entered'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <BookOpen size={12} className="text-purple-500" />
        <span className="text-xs font-medium text-foreground">
          {isZh ? '神学资源' : 'Theology Resources'}
          <span className="ml-1.5 text-muted-foreground">
            ({theologyResources.length})
          </span>
        </span>
      </div>

      {/* Resource list */}
      <div className="flex-1 overflow-y-auto">
        {theologyResources.map(resource => {
          const isExpanded = expandedId === resource.id
          return (
            <div
              key={resource.id}
              className="border-b border-border/50 hover:bg-accent/20 transition-colors"
            >
              <div
                className="flex items-start gap-2 px-3 py-2 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : resource.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground truncate">
                      {resource.title}
                    </span>
                    <span className={`px-1 py-0 rounded text-[9px] font-medium ${traditionColor(resource.tradition)}`}>
                      {traditionLabel(resource.tradition, isZh)}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                    {resource.summary}
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={12} className="shrink-0 mt-0.5" /> : <ChevronDown size={12} className="shrink-0 mt-0.5" />}
              </div>

              {isExpanded && (
                <div className="px-3 pb-2 pl-5">
                  {/* Key insights */}
                  {resource.keyInsights.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[10px] font-medium text-foreground/70 mb-0.5">
                        {isZh ? '核心洞见' : 'Key Insights'}
                      </div>
                      {resource.keyInsights.map((insight, i) => (
                        <div key={i} className="text-[10px] text-muted-foreground pl-2 leading-tight">
                          • {insight}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Related verses */}
                  {resource.relatedVerses.length > 0 && (
                    <div>
                      <div className="text-[10px] font-medium text-foreground/70 mb-0.5">
                        {isZh ? '相关经文' : 'Related Verses'}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {resource.relatedVerses.map((verse, i) => (
                          <span key={i} className="px-1 py-0 rounded text-[9px] bg-muted/40 text-muted-foreground">
                            {verse}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
