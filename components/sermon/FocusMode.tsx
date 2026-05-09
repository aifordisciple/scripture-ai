'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, EyeOff, Sparkles, Loader2 } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { cn } from '@/lib/utils'

interface FocusModeProps {
  content: string
  onContentChange: (content: string) => void
  onAIAssist: (action: string) => void
  isGenerating: boolean
  onExit: () => void
}

/**
 * FocusMode — 专注写作模式
 *
 * Inspired by: iA Writer's Focus Mode, Ulysses distraction-free editing
 *
 * Features:
 * - Full-screen distraction-free editing
 * - Current sentence/paragraph highlight
 * - Minimal UI with only essential controls
 * - Ambient background (subtle gradient)
 * - Word count and progress indicator
 * - Quick AI assist button
 * - Escape to exit
 */
export function FocusMode({ content, onContentChange, onAIAssist, isGenerating, onExit }: FocusModeProps) {
  const { locale, currentSermon } = useBibleStore()
  const isZh = locale !== 'en'

  const wordCount = content.length
  const targetWordCount = currentSermon?.style === 'EXPOSITORY' ? 2500
    : currentSermon?.style === 'NARRATIVE' ? 3000
    : 2000
  const progress = Math.min(100, (wordCount / targetWordCount) * 100)

  // Escape to exit
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onExit()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onExit])

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground/70">
            {currentSermon?.title || (isZh ? '未命名讲章' : 'Untitled Sermon')}
          </span>
          <span className="text-xs text-muted-foreground">
            {wordCount} {isZh ? '字' : 'chars'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick AI button */}
          <button
            onClick={() => onAIAssist('continue')}
            disabled={isGenerating}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              isGenerating
                ? 'bg-primary/10 text-primary cursor-wait'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            )}
          >
            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {isGenerating ? (isZh ? '生成中...' : 'Generating...') : (isZh ? 'AI续写' : 'AI Continue')}
          </button>

          {/* Exit button */}
          <button
            onClick={onExit}
            className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
            title={isZh ? '退出专注模式 (Esc)' : 'Exit Focus Mode (Esc)'}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-muted/30">
        <div
          className="h-full bg-primary/40 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-12">
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full min-h-full bg-transparent text-foreground text-base leading-[2] outline-none resize-none font-serif placeholder:text-muted-foreground/40"
            placeholder={isZh ? '开始写作你的讲章...' : 'Start writing your sermon...'}
            autoFocus
          />
        </div>
      </div>

      {/* Bottom status */}
      <div className="flex items-center justify-between px-6 py-2 border-t border-border/30 text-[10px] text-muted-foreground">
        <span>
          {isZh ? `目标 ${targetWordCount} 字 · ${Math.round(progress)}%` : `Target ${targetWordCount} chars · ${Math.round(progress)}%`}
        </span>
        <span>
          {isZh ? '按 Esc 退出专注模式' : 'Press Esc to exit focus mode'}
        </span>
      </div>
    </div>
  )
}
