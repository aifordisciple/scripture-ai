'use client'

import React, { useMemo } from 'react'
import { AlertTriangle, Info, Lightbulb, CheckCircle2, X } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'

/** Issue severity */
type Severity = 'critical' | 'warning' | 'suggestion' | 'good'

/** Detected issue */
interface DetectedIssue {
  id: string
  severity: Severity
  zhTitle: string
  enTitle: string
  zhDescription: string
  enDescription: string
  /** Suggested fix action */
  action?: string
}

/** Analyze sermon content for common issues */
function detectIssues(content: string, wordCount: number, isZh: boolean): DetectedIssue[] {
  if (!content || content.trim().length < 20) return []

  const issues: DetectedIssue[] = []
  const lines = content.split('\n')
  const headings = lines.filter(l => l.match(/^##\s+/))
  const paragraphs = lines.filter(l => l.trim() && !l.match(/^#{1,6}\s+/) && !l.match(/^[-*]\s+/))

  // 1. Check overall length
  if (wordCount < 500) {
    issues.push({
      id: 'length-short',
      severity: 'warning',
      zhTitle: '篇幅偏短',
      enTitle: 'Too Short',
      zhDescription: `当前${wordCount}字，建议讲章至少800-1500字以保证内容充实。`,
      enDescription: `Currently ${wordCount} chars, sermons should be at least 800-1500 chars for substance.`,
      action: 'continue',
    })
  } else if (wordCount > 5000) {
    issues.push({
      id: 'length-long',
      severity: 'suggestion',
      zhTitle: '篇幅偏长',
      enTitle: 'Too Long',
      zhDescription: `当前${wordCount}字，可能超出一般讲道时长。考虑精简或分段。`,
      enDescription: `Currently ${wordCount} chars, may exceed typical sermon duration. Consider condensing.`,
      action: 'shrink',
    })
  }

  // 2. Check structure - missing headings
  if (headings.length < 2 && wordCount > 300) {
    issues.push({
      id: 'structure-headings',
      severity: 'warning',
      zhTitle: '缺少段落标题',
      enTitle: 'Missing Section Headings',
      zhDescription: '讲章缺少结构化标题(##)，建议添加2-3个段落标题使结构清晰。',
      enDescription: 'Sermon lacks section headings (##), add 2-3 headings for clear structure.',
      action: 'section',
    })
  }

  // 3. Check for transitions between sections
  if (headings.length >= 2) {
    const headingIndices = lines.map((l, i) => l.match(/^##\s+/) ? i : -1).filter(i => i >= 0)
    for (let i = 0; i < headingIndices.length - 1; i++) {
      const betweenLines = lines.slice(headingIndices[i] + 1, headingIndices[i + 1])
      const betweenText = betweenLines.join('\n')
      // Check if there's a transition phrase
      const hasTransition = isZh
        ? betweenText.match(/接下来|让我们|那么|现在|不仅如此|更重要的是|另一方面/)
        : betweenText.match(/next|let us|now|furthermore|more importantly|on the other hand|moving to/)
      if (!hasTransition && betweenText.length > 100) {
        issues.push({
          id: `transition-${i}`,
          severity: 'suggestion',
          zhTitle: '缺少过渡',
          enTitle: 'Missing Transition',
          zhDescription: `第${i + 1}段到第${i + 2}段之间缺少过渡语句，建议添加过渡段落。`,
          enDescription: `No transition between section ${i + 1} and ${i + 2}. Add a bridging paragraph.`,
          action: 'add-transition',
        })
        break // Only report first missing transition
      }
    }
  }

  // 4. Check for application points
  const hasApplication = isZh
    ? content.match(/应用|实践|行动|挑战|让我们|在生活中|每一天/)
    : content.match(/apply|practice|action|challenge|let us|in daily life|every day/)
  if (!hasApplication && wordCount > 500) {
    issues.push({
      id: 'application-missing',
      severity: 'warning',
      zhTitle: '缺少应用',
      enTitle: 'Missing Application',
      zhDescription: '讲章缺少生活应用点，建议添加2-3个具体可执行的应用。',
      enDescription: 'Sermon lacks application points. Add 2-3 specific actionable applications.',
      action: 'add-application',
    })
  }

  // 5. Check for illustrations/examples
  const hasIllustration = isZh
    ? content.match(/例证|故事|比如|想象|就像|有一位|曾经/)
    : content.match(/illustration|story|for example|imagine|like|there was|once/)
  if (!hasIllustration && wordCount > 500) {
    issues.push({
      id: 'illustration-missing',
      severity: 'suggestion',
      zhTitle: '缺少例证',
      enTitle: 'Missing Illustration',
      zhDescription: '讲章缺少生动例证，建议添加1-2个贴近生活的故事或类比。',
      enDescription: 'Sermon lacks vivid illustrations. Add 1-2 relatable stories or analogies.',
      action: 'add-example',
    })
  }

  // 6. Check for prayer
  const hasPrayer = isZh
    ? content.match(/祷告|祈祷|阿们|奉耶稣|求你/)
    : content.match(/pray|prayer|amen|in Jesus|we ask/)
  if (!hasPrayer && wordCount > 800) {
    issues.push({
      id: 'prayer-missing',
      severity: 'suggestion',
      zhTitle: '缺少祷告',
      enTitle: 'Missing Prayer',
      zhDescription: '讲章缺少结束祷告，建议添加回应主题的祷告段落。',
      enDescription: 'Sermon lacks a closing prayer. Add a prayer responding to the theme.',
      action: 'add-prayer',
    })
  }

  // 7. Check for repetitive phrases
  const phrases = isZh
    ? ['我们看到', '让我们', '这告诉我们', '非常重要']
    : ['we see', 'let us', 'this tells us', 'very important']
  for (const phrase of phrases) {
    const count = (content.match(new RegExp(phrase, 'g')) || []).length
    if (count >= 3) {
      issues.push({
        id: `repeat-${phrase}`,
        severity: 'warning',
        zhTitle: '表达重复',
        enTitle: 'Repetitive Expression',
        zhDescription: `"${phrase}"出现${count}次，建议多样化表达方式。`,
        enDescription: `"${phrase}" appears ${count} times. Vary your expressions.`,
        action: 'polish',
      })
    }
  }

  // 8. Good practices detected
  if (headings.length >= 3 && hasApplication && hasIllustration) {
    issues.push({
      id: 'structure-good',
      severity: 'good',
      zhTitle: '结构完整',
      enTitle: 'Complete Structure',
      zhDescription: '讲章结构良好：有标题分段、应用点和例证。',
      enDescription: 'Good sermon structure: section headings, application points, and illustrations.',
    })
  }

  return issues
}

const SEVERITY_CONFIG: Record<Severity, { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  critical: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  suggestion: { icon: Lightbulb, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  good: { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
}

/**
 * SmartReviewPanel — 智能检测与建议面板
 *
 * Real-time analysis of sermon content detecting:
 * - Structure issues (missing headings, transitions)
 * - Content gaps (no application, illustration, prayer)
 * - Repetitive expressions
 * - Length concerns
 * - Good practices detected
 *
 * Unlike the full AI review, this provides instant feedback
 * based on text analysis, without requiring an API call.
 */
export function SmartReviewPanel({ onAction }: { onAction?: (action: string) => void }) {
  const { locale } = useBibleStore()
  const isZh = locale !== 'en'
  const { currentSermon } = useBibleStore()

  const content = currentSermon?.content || ''
  const wordCount = content.length

  const issues = useMemo(() => detectIssues(content, wordCount, isZh), [content, wordCount, isZh])

  const criticals = issues.filter(i => i.severity === 'critical')
  const warnings = issues.filter(i => i.severity === 'warning')
  const suggestions = issues.filter(i => i.severity === 'suggestion')
  const goods = issues.filter(i => i.severity === 'good')

  if (!content || content.trim().length < 20) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
          <Info size={12} className="text-blue-500" />
          <span className="text-xs font-medium text-foreground">
            {isZh ? '智能检测' : 'Smart Review'}
          </span>
        </div>
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          {isZh ? '开始写作后，将自动检测问题' : 'Issues will be detected as you write'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <Info size={12} className="text-blue-500" />
        <span className="text-xs font-medium text-foreground">
          {isZh ? '智能检测' : 'Smart Review'}
          <span className="ml-1.5 text-muted-foreground">
            ({issues.length})
          </span>
        </span>
      </div>

      {/* Summary */}
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex gap-2 text-[10px]">
          {criticals.length > 0 && (
            <span className="text-red-500">{criticals.length} {isZh ? '严重' : 'critical'}</span>
          )}
          {warnings.length > 0 && (
            <span className="text-yellow-500">{warnings.length} {isZh ? '警告' : 'warning'}</span>
          )}
          {suggestions.length > 0 && (
            <span className="text-blue-500">{suggestions.length} {isZh ? '建议' : 'suggestion'}</span>
          )}
          {goods.length > 0 && (
            <span className="text-green-500">{goods.length} {isZh ? '良好' : 'good'}</span>
          )}
        </div>
      </div>

      {/* Issue list */}
      <div className="flex-1 overflow-y-auto">
        {issues.map(issue => {
          const config = SEVERITY_CONFIG[issue.severity]
          const Icon = config.icon
          const title = isZh ? issue.zhTitle : issue.enTitle
          const desc = isZh ? issue.zhDescription : issue.enDescription

          return (
            <div
              key={issue.id}
              className="border-b border-border/50 hover:bg-accent/20 transition-colors px-3 py-2"
            >
              <div className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${config.bgColor}`}>
                  <Icon size={12} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-foreground">
                    {title}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {desc}
                  </div>
                  {issue.action && onAction && (
                    <button
                      onClick={() => onAction(issue.action!)}
                      className="mt-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      {isZh ? '修复' : 'Fix'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}