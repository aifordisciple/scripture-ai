'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { Paintbrush, ChevronDown, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'

/** A paragraph that could benefit from expansion */
interface ThinParagraph {
  index: number
  heading: string
  text: string
  charCount: number
  type: 'illustration' | 'application' | 'exposition' | 'transition'
  reasonZh: string
  reasonEn: string
}

/** Detect thin paragraphs that could benefit from "Describe" expansion */
function detectThinParagraphs(content: string, isZh: boolean): ThinParagraph[] {
  if (!content || content.length < 100) return []

  const results: ThinParagraph[] = []
  const lines = content.split('\n')
  let currentHeading = ''
  let paragraphIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const headingMatch = line.match(/^##\s+(.+)/)
    if (headingMatch) {
      currentHeading = headingMatch[1].trim()
      continue
    }

    // Skip empty lines and list items
    if (!line.trim() || line.match(/^[-*]\s+/) || line.match(/^>\s+/)) continue

    // Analyze substantial paragraphs (20+ chars)
    if (line.trim().length >= 20) {
      paragraphIndex++
      const text = line.trim()
      const charCount = text.length

      // Detect type based on content patterns
      const isIllustration = isZh
        ? text.match(/例证|故事|比如|想象|就像|有一位|曾经|比方说/)
        : text.match(/illustration|story|for example|imagine|like|there was|once|suppose/)
      const isApplication = isZh
        ? text.match(/应用|实践|行动|挑战|在生活中|每一天|我们应该/)
        : text.match(/apply|practice|action|challenge|in daily life|every day|we should/)
      const isTransition = isZh
        ? text.match(/接下来|让我们|那么|现在|不仅如此|另一方面/)
        : text.match(/next|let us|now|furthermore|more importantly|on the other hand/)

      let type: ThinParagraph['type'] = 'exposition'
      if (isIllustration) type = 'illustration'
      else if (isApplication) type = 'application'
      else if (isTransition) type = 'transition'

      // Check if paragraph is "thin" (could benefit from expansion)
      // 1. Short illustration paragraph (< 80 chars) - needs vivid detail
      if (type === 'illustration' && charCount < 80) {
        results.push({
          index: paragraphIndex,
          heading: currentHeading,
          text,
          charCount,
          type,
          reasonZh: '例证过于简略，缺少生动细节和画面感',
          reasonEn: 'Illustration is too brief, lacks vivid detail and imagery',
        })
      }

      // 2. Application paragraph without concrete steps (< 60 chars)
      if (type === 'application' && charCount < 60) {
        results.push({
          index: paragraphIndex,
          heading: currentHeading,
          text,
          charCount,
          type,
          reasonZh: '应用点过于抽象，缺少具体可执行的步骤',
          reasonEn: 'Application is too abstract, lacks concrete actionable steps',
        })
      }

      // 3. Exposition paragraph that's very short (< 40 chars) after a heading
      if (type === 'exposition' && charCount < 40 && charCount > 15) {
        // Check if this is right after a heading (first paragraph of a section)
        const prevLines = lines.slice(Math.max(0, i - 3), i)
        const nearHeading = prevLines.some(l => l.match(/^##\s+/))
        if (nearHeading) {
          results.push({
            index: paragraphIndex,
            heading: currentHeading,
            text,
            charCount,
            type,
            reasonZh: '段落开头过于简短，可以扩展引入和背景',
            reasonEn: 'Section opening is too brief, could expand with context and introduction',
          })
        }
      }

      // 4. Any paragraph that mentions "example" or "illustration" but doesn't follow through
      if (!isIllustration && !isApplication) {
        const mentionsExample = isZh
          ? text.match(/举例|例如|比如说|打个比方/)
          : text.match(/for example|for instance|such as|like when/)
        if (mentionsExample && charCount < 100) {
          results.push({
            index: paragraphIndex,
            heading: currentHeading,
            text,
            charCount,
            type: 'illustration',
            reasonZh: '提到举例但未展开，建议补充具体故事或场景',
            reasonEn: 'Mentions an example but doesn\'t elaborate, suggest adding a specific story or scenario',
          })
        }
      }
    }
  }

  return results.slice(0, 6) // Max 6 suggestions
}

const TYPE_CONFIG: Record<ThinParagraph['type'], { color: string; labelZh: string; labelEn: string }> = {
  illustration: { color: 'text-amber-500', labelZh: '例证', labelEn: 'Illustration' },
  application: { color: 'text-emerald-500', labelZh: '应用', labelEn: 'Application' },
  exposition: { color: 'text-blue-500', labelZh: '阐述', labelEn: 'Exposition' },
  transition: { color: 'text-purple-500', labelZh: '过渡', labelEn: 'Transition' },
}

/**
 * DescribePanel — "Describe"例证扩写面板
 *
 * Inspired by Sudowrite's "Describe" feature.
 * Detects thin/under-described paragraphs and offers
 * one-click AI expansion with vivid, concrete detail
 * while preserving the theological core.
 */
export function DescribePanel({ onExpand }: { onExpand?: (text: string, type: string) => void }) {
  const { locale, currentSermon } = useBibleStore()
  const isZh = locale !== 'en'
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [expandingId, setExpandingId] = useState<number | null>(null)

  const content = currentSermon?.content || ''
  const thinParagraphs = useMemo(() => detectThinParagraphs(content, isZh), [content, isZh])

  const handleExpand = useCallback(async (para: ThinParagraph) => {
    setExpandingId(para.index)
    try {
      const actionType = para.type === 'illustration' ? 'add-example'
        : para.type === 'application' ? 'add-application'
        : para.type === 'transition' ? 'add-transition'
        : 'expand'

      onExpand?.(para.text, actionType)
      setExpandedIds(prev => new Set([...prev, para.index]))
    } finally {
      setExpandingId(null)
    }
  }, [onExpand])

  if (!content || content.length < 100) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
          <Paintbrush size={12} className="text-amber-500" />
          <span className="text-xs font-medium text-foreground">
            {isZh ? '例证扩写' : 'Describe'}
          </span>
        </div>
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          {isZh ? '开始写作后，将检测可扩写的段落' : 'Thin paragraphs will be detected as you write'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <Paintbrush size={12} className="text-amber-500" />
        <span className="text-xs font-medium text-foreground">
          {isZh ? '例证扩写' : 'Describe'}
          {thinParagraphs.length > 0 && (
            <span className="ml-1.5 text-muted-foreground">
              ({thinParagraphs.length})
            </span>
          )}
        </span>
      </div>

      {thinParagraphs.length === 0 ? (
        <div className="px-4 py-4 text-center text-sm text-muted-foreground">
          <CheckMark />
          <div className="mt-1">
            {isZh ? '段落内容充实，无需扩写' : 'Paragraphs are well-developed'}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {thinParagraphs.map((para) => {
            const config = TYPE_CONFIG[para.type]
            const isExpanded = expandedIds.has(para.index)
            const isExpanding = expandingId === para.index

            return (
              <div
                key={para.index}
                className="border-b border-border/50 px-3 py-2 hover:bg-accent/20 transition-colors"
              >
                {/* Section heading */}
                {para.heading && (
                  <div className="text-[9px] text-muted-foreground/60 mb-0.5">
                    {para.heading}
                  </div>
                )}

                <div className="flex items-start gap-2">
                  {/* Type badge */}
                  <div className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium ${config.color} bg-muted/30`}>
                    {isZh ? config.labelZh : config.labelEn}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Preview text */}
                    <div className="text-[11px] text-foreground/80 line-clamp-2">
                      "{para.text.slice(0, 60)}{para.text.length > 60 ? '...' : ''}"
                    </div>

                    {/* Reason */}
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      {isZh ? para.reasonZh : para.reasonEn}
                    </div>

                    {/* Expand button */}
                    {!isExpanded ? (
                      <button
                        onClick={() => handleExpand(para)}
                        disabled={isExpanding}
                        className="mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                      >
                        {isExpanding ? (
                          <>
                            <Loader2 size={10} className="animate-spin" />
                            {isZh ? '扩写中...' : 'Expanding...'}
                          </>
                        ) : (
                          <>
                            <Sparkles size={10} />
                            {isZh ? '扩写' : 'Flesh Out'}
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="mt-1 inline-flex items-center gap-1 text-[9px] text-green-500">
                        <CheckMark />
                        {isZh ? '已扩写' : 'Expanded'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CheckMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="inline">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
