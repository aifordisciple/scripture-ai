'use client'

import React, { useMemo } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'

/** Style issue detected in a sentence */
interface StyleIssue {
  text: string
  type: 'passive' | 'long-sentence' | 'theological-term' | 'adverb-heavy'
  start: number
  end: number
}

/** Detect style issues in sermon content */
function detectStyleIssues(content: string, isZh: boolean): StyleIssue[] {
  if (!content || content.length < 50) return []

  const issues: StyleIssue[] = []

  // Split into sentences
  const sentenceEnders = isZh ? /[。！？；]/ : /[.!?\n]/
  const sentences = content.split(sentenceEnders).filter(s => s.trim().length > 5)

  let offset = 0
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    const startInContent = content.indexOf(trimmed, offset)
    if (startInContent === -1) continue
    offset = startInContent + trimmed.length

    // 1. Passive voice detection
    if (isZh) {
      // Chinese passive: 被...所, 为...所, 遭到, 受到
      const passiveMatch = trimmed.match(/被.{1,20}所|为.{1,20}所|遭到|受到|被/)
      if (passiveMatch) {
        const matchStart = trimmed.indexOf(passiveMatch[0])
        issues.push({
          text: passiveMatch[0],
          type: 'passive',
          start: startInContent + matchStart,
          end: startInContent + matchStart + passiveMatch[0].length,
        })
      }
    } else {
      // English passive: was/were/is/are + past participle
      const passiveMatch = trimmed.match(/\b(was|were|is|are|been|being)\s+\w+ed\b/i)
      if (passiveMatch) {
        const matchStart = trimmed.toLowerCase().indexOf(passiveMatch[0].toLowerCase())
        issues.push({
          text: passiveMatch[0],
          type: 'passive',
          start: startInContent + matchStart,
          end: startInContent + matchStart + passiveMatch[0].length,
        })
      }
    }

    // 2. Long sentence detection (> 80 chars for Chinese, > 120 for English)
    const threshold = isZh ? 80 : 120
    if (trimmed.length > threshold) {
      issues.push({
        text: trimmed.slice(0, 30) + '...',
        type: 'long-sentence',
        start: startInContent,
        end: startInContent + trimmed.length,
      })
    }

    // 3. Theological terms (highlight for precision check)
    if (isZh) {
      const theoTerms = trimmed.match(/称义|成圣|救赎|预知|预定|三位一体|道成肉身|原罪|恩典|因信称义/)
      if (theoTerms) {
        for (const term of theoTerms) {
          const termStart = trimmed.indexOf(term)
          if (termStart !== -1) {
            issues.push({
              text: term,
              type: 'theological-term',
              start: startInContent + termStart,
              end: startInContent + termStart + term.length,
            })
          }
        }
      }
    } else {
      const theoTerms = trimmed.match(/\b(justification|sanctification|redemption|foreknowledge|predestination|trinity|incarnation|original sin|grace|propitiation)\b/i)
      if (theoTerms) {
        for (const term of theoTerms) {
          const termStart = trimmed.toLowerCase().indexOf(term.toLowerCase())
          if (termStart !== -1) {
            issues.push({
              text: term,
              type: 'theological-term',
              start: startInContent + termStart,
              end: startInContent + termStart + term.length,
            })
          }
        }
      }
    }

    // 4. Adverb-heavy sentences (3+ adverbs)
    if (isZh) {
      const adverbs = trimmed.match(/地\b/g)
      if (adverbs && adverbs.length >= 3) {
        issues.push({
          text: trimmed.slice(0, 20) + '...',
          type: 'adverb-heavy',
          start: startInContent,
          end: startInContent + trimmed.length,
        })
      }
    } else {
      const adverbs = trimmed.match(/\b\w+ly\b/g)
      if (adverbs && adverbs.length >= 3) {
        issues.push({
          text: trimmed.slice(0, 20) + '...',
          type: 'adverb-heavy',
          start: startInContent,
          end: startInContent + trimmed.length,
        })
      }
    }
  }

  return issues.slice(0, 20) // Limit to 20 issues for performance
}

const ISSUE_COLORS: Record<StyleIssue['type'], { bg: string; text: string; labelZh: string; labelEn: string }> = {
  passive: { bg: 'bg-blue-200/40 dark:bg-blue-800/30', text: 'text-blue-600 dark:text-blue-400', labelZh: '被动语态', labelEn: 'Passive' },
  'long-sentence': { bg: 'bg-orange-200/40 dark:bg-orange-800/30', text: 'text-orange-600 dark:text-orange-400', labelZh: '长句', labelEn: 'Long' },
  'theological-term': { bg: 'bg-green-200/40 dark:bg-green-800/30', text: 'text-green-600 dark:text-green-400', labelZh: '神学术语', labelEn: 'Theological' },
  'adverb-heavy': { bg: 'bg-purple-200/40 dark:bg-purple-800/30', text: 'text-purple-600 dark:text-purple-400', labelZh: '副词过多', labelEn: 'Adverb-heavy' },
}

/**
 * StyleHighlightPanel — 句子级风格标注面板
 *
 * Inspired by iA Writer's Syntax Highlight feature.
 * Provides ambient, non-intrusive visual feedback on:
 * - Passive voice constructions (blue)
 * - Overly long sentences (orange)
 * - Theological terms needing precision (green)
 * - Adverb-heavy sentences (purple)
 */
export function StyleHighlightPanel() {
  const { locale, currentSermon } = useBibleStore()
  const isZh = locale !== 'en'

  const content = currentSermon?.content || ''
  const issues = useMemo(() => detectStyleIssues(content, isZh), [content, isZh])

  const passiveCount = issues.filter(i => i.type === 'passive').length
  const longCount = issues.filter(i => i.type === 'long-sentence').length
  const theoCount = issues.filter(i => i.type === 'theological-term').length
  const adverbCount = issues.filter(i => i.type === 'adverb-heavy').length

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <Eye size={12} className="text-blue-500" />
        <span className="text-xs font-medium text-foreground">
          {isZh ? '风格标注' : 'Style Check'}
        </span>
      </div>

      {issues.length === 0 ? (
        <div className="px-4 py-4 text-center text-sm text-muted-foreground">
          {content.length < 50
            ? (isZh ? '开始写作后，将实时标注风格' : 'Style issues appear as you write')
            : (isZh ? '未检测到风格问题' : 'No style issues detected')
          }
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="px-3 py-2 border-b border-border/50">
            <div className="flex flex-wrap gap-2 text-[10px]">
              {passiveCount > 0 && (
                <span className={`flex items-center gap-1 ${ISSUE_COLORS.passive.text}`}>
                  <span className={`w-2 h-2 rounded-sm ${ISSUE_COLORS.passive.bg}`} />
                  {ISSUE_COLORS.passive[isZh ? 'labelZh' : 'labelEn']} ({passiveCount})
                </span>
              )}
              {longCount > 0 && (
                <span className={`flex items-center gap-1 ${ISSUE_COLORS['long-sentence'].text}`}>
                  <span className={`w-2 h-2 rounded-sm ${ISSUE_COLORS['long-sentence'].bg}`} />
                  {ISSUE_COLORS['long-sentence'][isZh ? 'labelZh' : 'labelEn']} ({longCount})
                </span>
              )}
              {theoCount > 0 && (
                <span className={`flex items-center gap-1 ${ISSUE_COLORS['theological-term'].text}`}>
                  <span className={`w-2 h-2 rounded-sm ${ISSUE_COLORS['theological-term'].bg}`} />
                  {ISSUE_COLORS['theological-term'][isZh ? 'labelZh' : 'labelEn']} ({theoCount})
                </span>
              )}
              {adverbCount > 0 && (
                <span className={`flex items-center gap-1 ${ISSUE_COLORS['adverb-heavy'].text}`}>
                  <span className={`w-2 h-2 rounded-sm ${ISSUE_COLORS['adverb-heavy'].bg}`} />
                  {ISSUE_COLORS['adverb-heavy'][isZh ? 'labelZh' : 'labelEn']} ({adverbCount})
                </span>
              )}
            </div>
          </div>

          {/* Issue list */}
          <div className="flex-1 overflow-y-auto max-h-40">
            {issues.slice(0, 8).map((issue, idx) => {
              const config = ISSUE_COLORS[issue.type]
              return (
                <div key={idx} className="flex items-center gap-1.5 px-3 py-1 border-b border-border/30">
                  <span className={`w-2 h-2 rounded-sm shrink-0 ${config.bg}`} />
                  <span className="text-[10px] text-foreground/70 truncate">
                    {issue.text}
                  </span>
                  <span className={`text-[9px] shrink-0 ${config.text}`}>
                    {config[isZh ? 'labelZh' : 'labelEn']}
                  </span>
                </div>
              )
            })}
            {issues.length > 8 && (
              <div className="px-3 py-1 text-[9px] text-muted-foreground text-center">
                +{issues.length - 8} {isZh ? '更多' : 'more'}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
