'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { CheckCircle2, Loader2, Star, FileText, MessageCircle, HandHeart, ChevronDown, ChevronRight } from 'lucide-react'
import type { SermonReviewData } from '@/store/types'

const dimensionIcons: Record<string, React.ReactNode> = {
  exegesis: <FileText className="w-3 h-3" />,
  logic: <MessageCircle className="w-3 h-3" />,
  gospel: <Star className="w-3 h-3" />,
  application: <HandHeart className="w-3 h-3" />,
  timing: <CheckCircle2 className="w-3 h-3" />,
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score * 10))
  const color = score >= 9 ? 'bg-green-500' : score >= 7 ? 'bg-teal-500' : score >= 4 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono font-medium text-muted-foreground w-5 text-right">{score}</span>
    </div>
  )
}

export function SermonReviewPanel() {
  const { t } = useTranslation()
  const { currentSermon, apiConfig, locale, sermonReviewData, setSermonReviewData, sermonReviewLoading, setSermonReviewLoading } = useBibleStore()
  const [expandedSub, setExpandedSub] = useState<string | null>(null)
  const prevSermonIdRef = useRef(currentSermon?.id)

  // Clear review data when switching sermons
  useEffect(() => {
    if (currentSermon?.id !== prevSermonIdRef.current) {
      prevSermonIdRef.current = currentSermon?.id
      setSermonReviewData(null)
    }
  }, [currentSermon?.id, setSermonReviewData])

  const handleGenerateReview = useCallback(async () => {
    if (!currentSermon || sermonReviewLoading) return
    setSermonReviewLoading(true)
    setSermonReviewData(null)
    try {
      const res = await fetch(`/api/sermon/${currentSermon.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiConfig, locale }),
      })
      const data = await res.json()
      if (data.data) {
        setSermonReviewData(data.data as SermonReviewData)
      }
    } catch (error) {
      console.error('[SermonReview] Failed to generate review:', error)
    } finally {
      setSermonReviewLoading(false)
    }
  }, [currentSermon, sermonReviewLoading, apiConfig, locale, setSermonReviewLoading, setSermonReviewData])

  const toggleSub = useCallback((key: string) => {
    setExpandedSub(prev => prev === key ? null : key)
  }, [])

  if (!currentSermon) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">{t('sermon.reviewNoSermon')}</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-secondary">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground/90">{t('sermon.reviewPanelTitle')}</span>
        </div>
      </div>

      {/* Generate Button */}
      <div className="px-3 py-2 border-b border-border">
        <button
          onClick={handleGenerateReview}
          disabled={sermonReviewLoading}
          className="w-full py-2 rounded-lg text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
        >
          {sermonReviewLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t('sermon.reviewGenerating')}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('sermon.reviewGenerate')}
            </>
          )}
        </button>
      </div>

      {/* Review Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {!sermonReviewData && !sermonReviewLoading && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>{t('sermon.reviewNoSermon')}</p>
          </div>
        )}

        {sermonReviewData && (
          <>
            {/* Overall Score */}
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{t('sermon.reviewOverallScore')}</p>
              <p className="text-2xl font-semibold text-primary">{sermonReviewData.overallScore.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">/ 10</p>
            </div>

            {/* Dimension Scores */}
            {sermonReviewData.items.map((item) => (
              <div key={item.key} className="rounded-lg border border-border bg-card p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    {dimensionIcons[item.key] || <Star className="w-3 h-3" />}
                  </div>
                  <span className="text-[11px] font-medium text-foreground/90 flex-1">{item.label}</span>
                </div>
                <ScoreBar score={item.score} />
                <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{item.suggestion}</p>
              </div>
            ))}

            {/* Sub-content sections */}
            {[
              { key: 'summary', label: t('sermon.reviewSummary'), content: sermonReviewData.summary },
              { key: 'discussion', label: t('sermon.reviewDiscussion'), content: sermonReviewData.discussionQuestions },
              { key: 'prayer', label: t('sermon.reviewPrayer'), content: sermonReviewData.prayerPoints },
            ].map(({ key, label, content }) => content && (
              <div key={key} className="rounded-lg border border-border bg-card">
                <button
                  onClick={() => toggleSub(key)}
                  className="w-full px-2.5 py-2 flex items-center gap-1.5 text-[11px] font-medium text-foreground/90"
                >
                  {expandedSub === key ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {label}
                </button>
                {expandedSub === key && (
                  <div className="px-2.5 pb-2.5 text-[10px] leading-relaxed text-muted-foreground whitespace-pre-wrap border-t border-border pt-2">
                    {content}
                  </div>
                )}
              </div>
            ))}

            {/* Estimated Minutes */}
            {sermonReviewData.estimatedMinutes > 0 && (
              <div className="rounded-lg border border-border bg-card p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">{t('sermon.reviewTiming')}</p>
                <p className="text-lg font-semibold text-foreground/90">~{sermonReviewData.estimatedMinutes}<span className="text-[10px] font-normal text-muted-foreground ml-1">min</span></p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}