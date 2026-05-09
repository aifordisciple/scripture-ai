'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Timer, Play, Pause, RotateCcw, BarChart3 } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'

/** Format seconds as MM:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * WritingSessionPanel — 写作会话追踪与统计
 *
 * Inspired by: Forest app's focus timer, Hemingway Editor's session stats
 *
 * Features:
 * - Session timer (start/pause/reset)
 * - Words written in this session
 * - Writing speed (chars/min)
 * - Session history (stored in localStorage)
 * - Best session stats
 */
export function WritingSessionPanel() {
  const { locale, currentSermon } = useBibleStore()
  const isZh = locale !== 'en'

  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [startWordCount, setStartWordCount] = useState(0)
  const [sessionHistory, setSessionHistory] = useState<Array<{
    date: string
    duration: number
    wordsWritten: number
  }>>([])

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentWordCount = currentSermon?.content?.length || 0

  // Load session history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sermon-session-history')
      if (stored) setSessionHistory(JSON.parse(stored))
    } catch {}
  }, [])

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning])

  const handleStart = useCallback(() => {
    setIsRunning(true)
    setStartWordCount(currentWordCount)
  }, [currentWordCount])

  const handlePause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const handleReset = useCallback(() => {
    setIsRunning(false)
    setElapsedSeconds(0)
    setStartWordCount(currentWordCount)
  }, [currentWordCount])

  const handleEndSession = useCallback(() => {
    setIsRunning(false)
    const wordsWritten = Math.max(0, currentWordCount - startWordCount)
    if (elapsedSeconds > 60 && wordsWritten > 0) {
      const entry = {
        date: new Date().toISOString(),
        duration: elapsedSeconds,
        wordsWritten,
      }
      const updated = [...sessionHistory, entry].slice(-20) // Keep last 20
      setSessionHistory(updated)
      try {
        localStorage.setItem('sermon-session-history', JSON.stringify(updated))
      } catch {}
    }
    setElapsedSeconds(0)
    setStartWordCount(currentWordCount)
  }, [currentWordCount, startWordCount, elapsedSeconds, sessionHistory])

  const wordsWritten = Math.max(0, currentWordCount - startWordCount)
  const speed = elapsedSeconds > 0 ? Math.round((wordsWritten / elapsedSeconds) * 60) : 0

  // Best session
  const bestSession = sessionHistory.reduce<{ duration: number; wordsWritten: number } | null>(
    (best, s) => (!best || s.wordsWritten > best.wordsWritten) ? s : best, null
  )

  // Total stats
  const totalWords = sessionHistory.reduce((sum, s) => sum + s.wordsWritten, 0)
  const totalMinutes = sessionHistory.reduce((sum, s) => sum + s.duration, 0) / 60

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <Timer size={12} className="text-cyan-500" />
        <span className="text-xs font-medium text-foreground">
          {isZh ? '写作会话' : 'Writing Session'}
        </span>
      </div>

      <div className="px-3 py-2 space-y-3">
        {/* Timer display */}
        <div className="text-center">
          <div className={`text-2xl font-mono font-bold ${isRunning ? 'text-cyan-600 dark:text-cyan-400' : 'text-foreground'}`}>
            {formatTime(elapsedSeconds)}
          </div>
          {isRunning && (
            <div className="text-[10px] text-cyan-500 animate-pulse mt-0.5">
              {isZh ? '写作中...' : 'Writing...'}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-cyan-500 text-white hover:bg-cyan-600 transition-colors"
            >
              <Play size={12} />
              {elapsedSeconds === 0 ? (isZh ? '开始' : 'Start') : (isZh ? '继续' : 'Resume')}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              <Pause size={12} />
              {isZh ? '暂停' : 'Pause'}
            </button>
          )}
          <button
            onClick={handleReset}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            title={isZh ? '重置' : 'Reset'}
          >
            <RotateCcw size={14} />
          </button>
          {elapsedSeconds > 60 && (
            <button
              onClick={handleEndSession}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-semibold bg-muted/40 text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              {isZh ? '结束会话' : 'End Session'}
            </button>
          )}
        </div>

        {/* Current session stats */}
        {elapsedSeconds > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/30 rounded p-2 text-center">
              <div className="text-[10px] text-muted-foreground">{isZh ? '本次写作' : 'Written'}</div>
              <div className="text-sm font-bold text-foreground">{wordsWritten}</div>
              <div className="text-[9px] text-muted-foreground">{isZh ? '字' : 'chars'}</div>
            </div>
            <div className="bg-muted/30 rounded p-2 text-center">
              <div className="text-[10px] text-muted-foreground">{isZh ? '写作速度' : 'Speed'}</div>
              <div className="text-sm font-bold text-foreground">{speed}</div>
              <div className="text-[9px] text-muted-foreground">{isZh ? '字/分' : 'chars/min'}</div>
            </div>
          </div>
        )}

        {/* Historical stats */}
        {sessionHistory.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <BarChart3 size={10} className="text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">
                {isZh ? '历史统计' : 'History'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-muted/20 rounded p-1.5">
                <div className="text-xs font-bold text-foreground">{sessionHistory.length}</div>
                <div className="text-[9px] text-muted-foreground">{isZh ? '会话' : 'Sessions'}</div>
              </div>
              <div className="bg-muted/20 rounded p-1.5">
                <div className="text-xs font-bold text-foreground">{totalWords}</div>
                <div className="text-[9px] text-muted-foreground">{isZh ? '总字数' : 'Total'}</div>
              </div>
              <div className="bg-muted/20 rounded p-1.5">
                <div className="text-xs font-bold text-foreground">{Math.round(totalMinutes)}</div>
                <div className="text-[9px] text-muted-foreground">{isZh ? '总分钟' : 'Min'}</div>
              </div>
            </div>
            {bestSession && (
              <div className="mt-1.5 text-[9px] text-muted-foreground text-center">
                {isZh
                  ? `最佳: ${bestSession.wordsWritten}字 / ${Math.round(bestSession.duration / 60)}分钟`
                  : `Best: ${bestSession.wordsWritten} chars / ${Math.round(bestSession.duration / 60)} min`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
