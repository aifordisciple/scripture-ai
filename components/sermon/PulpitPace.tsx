'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Gauge, Zap, Coffee, Sparkles } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'

/** Target word counts by sermon style */
const STYLE_TARGETS: Record<string, number> = {
  EXPOSITORY: 2500,
  TOPICAL: 2000,
  NARRATIVE: 3000,
  FREE: 2000,
}

/** Average speaking pace: ~150 Chinese chars/min or ~130 English words/min */
const SPEAKING_PACE_ZH = 150
const SPEAKING_PACE_EN = 130

/**
 * PulpitPace — 写作动量仪表盘
 *
 * A lightweight momentum indicator for sermon writing.
 * Shows: current progress vs target, estimated sermon duration,
 * writing momentum score, and a "stuck? get inspired" quick action.
 *
 * Inspired by Lex's writing analytics and Forest's focus visualization.
 */
export function PulpitPace() {
  const { locale, currentSermon } = useBibleStore()
  const isZh = locale !== 'en'

  const [momentum, setMomentum] = useState(0) // 0-100
  const [recentSpeed, setRecentSpeed] = useState(0) // chars per minute
  const [isStuck, setIsStuck] = useState(false)
  const [showInspire, setShowInspire] = useState(false)

  const historyRef = useRef<Array<{ time: number; charCount: number }>>([])

  const charCount = currentSermon?.content?.length || 0
  const target = STYLE_TARGETS[currentSermon?.style || 'FREE']
  const progress = Math.min(100, Math.round((charCount / target) * 100))

  // Estimated sermon duration (minutes)
  const estimatedMinutes = isZh
    ? Math.round(charCount / SPEAKING_PACE_ZH)
    : Math.round(charCount / SPEAKING_PACE_EN)

  // Track momentum by recording char count snapshots
  useEffect(() => {
    const now = Date.now()
    historyRef.current.push({ time: now, charCount })

    // Keep only last 5 minutes of history
    const fiveMinAgo = now - 5 * 60 * 1000
    historyRef.current = historyRef.current.filter(h => h.time > fiveMinAgo)

    // Calculate recent writing speed
    if (historyRef.current.length >= 2) {
      const oldest = historyRef.current[0]
      const elapsed = (now - oldest.time) / 60000 // minutes
      if (elapsed > 0.5) { // At least 30 seconds of data
        const charsWritten = charCount - oldest.charCount
        const speed = Math.round(charsWritten / elapsed)
        setRecentSpeed(speed)

        // Momentum score: based on speed relative to "good" pace
        // Good pace: ~200 chars/min for Chinese, ~100 words/min for English
        const goodPace = isZh ? 200 : 100
        const rawMomentum = Math.min(100, Math.round((speed / goodPace) * 100))
        setMomentum(rawMomentum)

        // Detect "stuck" state: no writing in last 2 minutes
        const twoMinAgo = now - 2 * 60 * 1000
        const recentActivity = historyRef.current.filter(h => h.time > twoMinAgo)
        const hasRecentChange = recentActivity.length >= 2 &&
          recentActivity[recentActivity.length - 1].charCount !== recentActivity[0].charCount
        setIsStuck(!hasRecentChange && charCount > 100)
      }
    }

    // Clean up old entries periodically
    const timer = setInterval(() => {
      const now = Date.now()
      const fiveMinAgo = now - 5 * 60 * 1000
      historyRef.current = historyRef.current.filter(h => h.time > fiveMinAgo)
    }, 30000)

    return () => clearInterval(timer)
  }, [charCount, isZh])

  // Momentum color and label
  const momentumConfig = useMemo(() => {
    if (momentum >= 70) return { color: 'text-emerald-500', bg: 'bg-emerald-500', label: isZh ? '流畅' : 'Flowing' }
    if (momentum >= 40) return { color: 'text-amber-500', bg: 'bg-amber-500', label: isZh ? '平稳' : 'Steady' }
    if (momentum >= 10) return { color: 'text-orange-500', bg: 'bg-orange-500', label: isZh ? '缓慢' : 'Slow' }
    return { color: 'text-muted-foreground', bg: 'bg-muted-foreground', label: isZh ? '静止' : 'Idle' }
  }, [momentum, isZh])

  const handleGetInspired = () => {
    window.dispatchEvent(new CustomEvent('sermon-inspiration', {
      detail: { action: 'continue' }
    }))
    setShowInspire(false)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <Gauge size={12} className="text-primary" />
        <span className="text-xs font-medium text-foreground">
          {isZh ? '讲台节奏' : 'Pulpit Pace'}
        </span>
      </div>

      <div className="px-3 py-2 space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-muted-foreground">
              {charCount} / {target} {isZh ? '字' : 'chars'}
            </span>
            <span className="text-foreground/70">{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${momentumConfig.bg}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Estimated sermon duration */}
          <div className="bg-muted/20 rounded p-1.5 text-center">
            <div className="text-[10px] text-muted-foreground">{isZh ? '预估时长' : 'Duration'}</div>
            <div className="text-xs font-bold text-foreground">{estimatedMinutes}</div>
            <div className="text-[9px] text-muted-foreground">{isZh ? '分钟' : 'min'}</div>
          </div>

          {/* Writing speed */}
          <div className="bg-muted/20 rounded p-1.5 text-center">
            <div className="text-[10px] text-muted-foreground">{isZh ? '速度' : 'Speed'}</div>
            <div className="text-xs font-bold text-foreground">{recentSpeed}</div>
            <div className="text-[9px] text-muted-foreground">{isZh ? '字/分' : 'c/m'}</div>
          </div>

          {/* Momentum */}
          <div className="bg-muted/20 rounded p-1.5 text-center">
            <div className="text-[10px] text-muted-foreground">{isZh ? '节奏' : 'Pace'}</div>
            <div className={`text-xs font-bold ${momentumConfig.color}`}>{momentumConfig.label}</div>
            <div className="text-[9px] text-muted-foreground">{momentum}%</div>
          </div>
        </div>

        {/* Stuck indicator */}
        {isStuck && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
            <Coffee size={12} className="text-amber-500 shrink-0" />
            <span className="text-[10px] text-amber-600 dark:text-amber-400 flex-1">
              {isZh ? '写作暂停中...' : 'Writing paused...'}
            </span>
            <button
              onClick={handleGetInspired}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Sparkles size={9} />
              {isZh ? '灵感' : 'Inspire'}
            </button>
          </div>
        )}

        {/* Milestone markers */}
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <Zap size={9} className="text-primary/50" />
          <span>
            {progress < 30
              ? (isZh ? '继续写作，建立思路' : 'Keep writing, build momentum')
              : progress < 70
                ? (isZh ? '节奏良好，保持心流' : 'Good pace, stay in flow')
                : (isZh ? '即将完成，冲刺收尾' : 'Almost there, finish strong')
            }
          </span>
        </div>
      </div>
    </div>
  )
}
