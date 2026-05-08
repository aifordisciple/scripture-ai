'use client'

import React from 'react'
import { BarChart3, TrendingUp } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import type { ToneMetrics } from '@/store/types'

/** Metric bar with label and value */
function MetricBar({ label, value, color, isZh }: { label: string; value: number; color: string; isZh: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-14 text-right shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground w-7 text-right shrink-0">{value}</span>
    </div>
  )
}

/** Get tone label from value */
function toneCategoryLabel(metrics: ToneMetrics, isZh: boolean): string {
  if (metrics.formality > 70 && metrics.doctrinalDensity > 60) {
    return isZh ? '学术讲道' : 'Scholarly Sermon'
  }
  if (metrics.emotion > 70 && metrics.formality < 50) {
    return isZh ? '激情分享' : 'Passionate Sharing'
  }
  if (metrics.formality > 60 && metrics.emotion < 40) {
    return isZh ? '庄重讲道' : 'Formal Sermon'
  }
  if (metrics.emotion > 50 && metrics.engagement > 60) {
    return isZh ? '互动分享' : 'Engaging Talk'
  }
  return isZh ? '平衡讲道' : 'Balanced Sermon'
}

/**
 * ToneDashboard — 语调仪表盘
 *
 * Features:
 * - 5 metric bars: formality, emotion, doctrinal density, readability, engagement
 * - Overall tone category label
 * - Compact design for sidebar panel
 * - Color-coded metrics
 */
export function ToneDashboard() {
  const { locale } = useTranslation()
  const isZh = locale !== 'en'

  const { toneMetrics } = useBibleStore()

  const categoryLabel = toneCategoryLabel(toneMetrics, isZh)

  const metrics: { key: keyof ToneMetrics; label: string; color: string }[] = [
    { key: 'formality', label: isZh ? '正式度' : 'Formality', color: 'bg-blue-500' },
    { key: 'emotion', label: isZh ? '情感度' : 'Emotion', color: 'bg-rose-500' },
    { key: 'doctrinalDensity', label: isZh ? '教义密度' : 'Doctrine', color: 'bg-purple-500' },
    { key: 'readability', label: isZh ? '可读性' : 'Readability', color: 'bg-emerald-500' },
    { key: 'engagement', label: isZh ? '参与度' : 'Engagement', color: 'bg-amber-500' },
  ]

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <BarChart3 size={12} className="text-rose-500" />
          <span className="text-xs font-medium text-foreground">
            {isZh ? '语调分析' : 'Tone Analysis'}
          </span>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/40">
          <TrendingUp size={10} className="text-foreground/60" />
          <span className="text-[10px] font-medium text-foreground/70">{categoryLabel}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-3 py-2 space-y-1.5">
        {metrics.map(m => (
          <MetricBar
            key={m.key}
            label={m.label}
            value={toneMetrics[m.key] as number}
            color={m.color}
            isZh={isZh}
          />
        ))}
      </div>
    </div>
  )
}
