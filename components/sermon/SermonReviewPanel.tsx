'use client'

import { useState } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { useEffect, useRef } from 'react'
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
  const color = score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400 w-5 text-right">{score}</span>
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

  const handleGenerateReview = async () => {
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
  }

  const toggleSub = (key: string) => {
    setExpandedSub(expandedSub === key ? null : key)
  }

  if (!currentSermon) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-xs text-slate-400">{t('sermon.reviewNoSermon')}</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('sermon.reviewPanelTitle')}</span>
        </div>
      </div>

      {/* Generate Button */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={handleGenerateReview}
          disabled={sermonReviewLoading}
          className="w-full py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
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
          <div className="text-center py-8 text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>{t('sermon.reviewNoSermon')}</p>
          </div>
        )}

        {sermonReviewData && (
          <>
            {/* Overall Score */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-center">
              <p className="text-[10px] text-slate-400 mb-1">{t('sermon.reviewOverallScore')}</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sermonReviewData.overallScore.toFixed(1)}</p>
              <p className="text-[10px] text-slate-400 mt-1">/ 10</p>
            </div>

            {/* Dimension Scores */}
            {sermonReviewData.items.map((item) => (
              <div key={item.key} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                    {dimensionIcons[item.key] || <Star className="w-3 h-3" />}
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex-1">{item.label}</span>
                </div>
                <ScoreBar score={item.score} />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{item.suggestion}</p>
              </div>
            ))}

            {/* Sub-content sections */}
            {[
              { key: 'summary', label: t('sermon.reviewSummary'), content: sermonReviewData.summary },
              { key: 'discussion', label: t('sermon.reviewDiscussion'), content: sermonReviewData.discussionQuestions },
              { key: 'prayer', label: t('sermon.reviewPrayer'), content: sermonReviewData.prayerPoints },
            ].map(({ key, label, content }) => content && (
              <div key={key} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <button
                  onClick={() => toggleSub(key)}
                  className="w-full px-2.5 py-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                >
                  {expandedSub === key ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {label}
                </button>
                {expandedSub === key && (
                  <div className="px-2.5 pb-2.5 text-[10px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap border-t border-slate-100 dark:border-slate-700 pt-2">
                    {content}
                  </div>
                )}
              </div>
            ))}

            {/* Estimated Minutes */}
            {sermonReviewData.estimatedMinutes > 0 && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-center">
                <p className="text-[10px] text-slate-400">{t('sermon.reviewTiming')}</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">~{sermonReviewData.estimatedMinutes}<span className="text-[10px] font-normal text-slate-400 ml-1">min</span></p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
