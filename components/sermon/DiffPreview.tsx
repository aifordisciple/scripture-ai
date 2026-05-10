'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Check, X, ChevronRight, Columns2, Eye } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

/** Diff mode for viewing changes */
type DiffMode = 'inline' | 'side-by-side' | 'changes-only'

/** A single diff segment */
interface DiffSegment {
  type: 'unchanged' | 'added' | 'removed'
  content: string
}

/** Props for the DiffPreview component */
interface DiffPreviewProps {
  /** Original text (before AI modification) */
  original: string
  /** Modified text (after AI modification) */
  modified: string
  /** Callback to accept the modification */
  onAccept: (text: string) => void
  /** Callback to reject the modification */
  onReject: () => void
  /** Callback to accept only specific segments */
  onPartialAccept?: (text: string) => void
  /** Whether the diff preview is visible */
  visible: boolean
}

/**
 * Compute word-level diff segments between original and modified text.
 * Uses a simple LCS-based approach for Chinese/mixed-language text.
 */
function computeDiff(original: string, modified: string): DiffSegment[] {
  // If texts are identical, return single unchanged segment
  if (original === modified) {
    return [{ type: 'unchanged', content: original }]
  }

  // If original is empty, everything is added
  if (!original) {
    return [{ type: 'added', content: modified }]
  }

  // If modified is empty, everything is removed
  if (!modified) {
    return [{ type: 'removed', content: original }]
  }

  // Split into sentences/lines for more meaningful diff
  const origLines = original.split(/\n/)
  const modLines = modified.split(/\n/)

  // Simple line-level diff using LCS
  const segments: DiffSegment[] = []

  // Find common prefix
  let prefixEnd = 0
  while (prefixEnd < origLines.length && prefixEnd < modLines.length && origLines[prefixEnd] === modLines[prefixEnd]) {
    prefixEnd++
  }

  // Find common suffix
  let suffixStartOrig = origLines.length
  let suffixStartMod = modLines.length
  while (suffixStartOrig > prefixEnd && suffixStartMod > prefixEnd && origLines[suffixStartOrig - 1] === modLines[suffixStartMod - 1]) {
    suffixStartOrig--
    suffixStartMod--
  }

  // Add unchanged prefix
  if (prefixEnd > 0) {
    segments.push({ type: 'unchanged', content: origLines.slice(0, prefixEnd).join('\n') })
  }

  // Add removed middle (original)
  const removedMiddle = origLines.slice(prefixEnd, suffixStartOrig)
  if (removedMiddle.length > 0) {
    segments.push({ type: 'removed', content: removedMiddle.join('\n') })
  }

  // Add added middle (modified)
  const addedMiddle = modLines.slice(prefixEnd, suffixStartMod)
  if (addedMiddle.length > 0) {
    segments.push({ type: 'added', content: addedMiddle.join('\n') })
  }

  // Add unchanged suffix
  if (suffixStartOrig < origLines.length) {
    segments.push({ type: 'unchanged', content: origLines.slice(suffixStartOrig).join('\n') })
  }

  return segments
}

/**
 * Diff preview component for AI modification results.
 * Shows changes between original and modified text with accept/reject options.
 */
export function DiffPreview({ original, modified, onAccept, onReject, onPartialAccept, visible }: DiffPreviewProps) {
  const { locale } = useTranslation()
  const [diffMode, setDiffMode] = useState<DiffMode>('inline')
  const [selectedSegments, setSelectedSegments] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const segments = computeDiff(original, modified)

  // Reset selection when diff changes
  useEffect(() => {
    // Default: select all added segments
    const defaultSelected = new Set<number>()
    segments.forEach((seg, idx) => {
      if (seg.type === 'added' || seg.type === 'unchanged') {
        defaultSelected.add(idx)
      }
    })
    setSelectedSegments(defaultSelected)
  }, [original, modified])

  // Keyboard shortcuts
  useEffect(() => {
    if (!visible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        onAccept(modified)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onReject()
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        // Partial accept: build text from selected segments
        handlePartialAccept()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible, modified, onAccept, onReject])

  const handlePartialAccept = useCallback(() => {
    const acceptedParts = segments
      .filter((_, idx) => selectedSegments.has(idx))
      .map(seg => seg.content)
      .join('\n')
    onPartialAccept?.(acceptedParts)
  }, [segments, selectedSegments, onPartialAccept])

  const toggleSegment = useCallback((idx: number) => {
    setSelectedSegments(prev => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }, [])

  if (!visible) return null

  const isZh = locale !== 'en'

  return (
    <div
      ref={containerRef}
      className="
        absolute z-40 w-[90%] max-w-[600px]
        bg-popover border border-border rounded-lg
        shadow-lg shadow-black/10 dark:shadow-black/30
        animate-in fade-in-0 zoom-in-95 duration-150
        left-[5%] top-[20%]
      "
    >
      {/* Header with mode switcher and actions */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-foreground">
            {isZh ? 'AI 修改建议' : 'AI Suggestion'}
          </span>
          <div className="flex items-center gap-0.5 ml-2">
            <button
              onClick={() => setDiffMode('inline')}
              className={`px-1.5 py-0.5 rounded text-[10px] ${diffMode === 'inline' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
              title={isZh ? '内联视图' : 'Inline view'}
            >
              <Eye size={11} />
            </button>
            <button
              onClick={() => setDiffMode('side-by-side')}
              className={`px-1.5 py-0.5 rounded text-[10px] ${diffMode === 'side-by-side' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
              title={isZh ? '并排对比' : 'Side by side'}
            >
              <Columns2 size={11} />
            </button>
            <button
              onClick={() => setDiffMode('changes-only')}
              className={`px-1.5 py-0.5 rounded text-[10px] ${diffMode === 'changes-only' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
              title={isZh ? '仅显示变更' : 'Changes only'}
            >
              <ChevronRight size={11} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAccept(modified)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title={isZh ? '接受全部 (Tab)' : 'Accept all (Tab)'}
          >
            <Check size={12} />
            <span>{isZh ? '接受' : 'Accept'}</span>
          </button>
          <button
            onClick={() => onReject()}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title={isZh ? '拒绝 (Esc)' : 'Reject (Esc)'}
          >
            <X size={12} />
            <span>{isZh ? '拒绝' : 'Reject'}</span>
          </button>
        </div>
      </div>

      {/* Diff content */}
      <div className="px-3 py-2 max-h-[300px] overflow-y-auto text-[13px] leading-relaxed" style={{ fontFamily: "'SF Pro Text', system-ui, sans-serif" }}>
        {diffMode === 'inline' && (
          /* Inline diff: removed text with strikethrough, added text highlighted */
          <div>
            {segments.map((seg, idx) => (
              <span
                key={idx}
                onClick={() => seg.type !== 'unchanged' && toggleSegment(idx)}
                className={`
                  ${seg.type === 'removed' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 line-through decoration-red-400 cursor-pointer' : ''}
                  ${seg.type === 'added' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-pointer' : ''}
                  ${seg.type === 'unchanged' ? 'text-foreground' : ''}
                  ${!selectedSegments.has(idx) && seg.type !== 'unchanged' ? 'opacity-40' : ''}
                  ${selectedSegments.has(idx) && seg.type !== 'unchanged' ? 'ring-1 ring-primary/30' : ''}
                `}
              >
                {seg.content}
                {seg.type !== 'unchanged' && '\n'}
              </span>
            ))}
          </div>
        )}

        {diffMode === 'side-by-side' && (
          /* Side by side: original on left, modified on right */
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-border rounded p-2 bg-muted/30">
              <div className="text-[10px] font-medium text-muted-foreground mb-1">{isZh ? '原文' : 'Original'}</div>
              <div className="whitespace-pre-wrap text-foreground">{original}</div>
            </div>
            <div className="border border-border rounded p-2 bg-muted/30">
              <div className="text-[10px] font-medium text-muted-foreground mb-1">{isZh ? '修改后' : 'Modified'}</div>
              <div className="whitespace-pre-wrap text-foreground">{modified}</div>
            </div>
          </div>
        )}

        {diffMode === 'changes-only' && (
          /* Changes only: only show removed and added segments */
          <div>
            {segments.filter(seg => seg.type !== 'unchanged').map((seg, idx) => (
              <div
                key={idx}
                onClick={() => toggleSegment(segments.indexOf(seg))}
                className={`
                  mb-1 px-2 py-1 rounded cursor-pointer
                  ${seg.type === 'removed' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : ''}
                  ${seg.type === 'added' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : ''}
                  ${!selectedSegments.has(segments.indexOf(seg)) ? 'opacity-40' : ''}
                `}
              >
                <span className="text-[10px] font-medium mr-1">
                  {seg.type === 'removed' ? (isZh ? '删除' : 'Removed') : (isZh ? '新增' : 'Added')}
                </span>
                {seg.content}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with partial accept hint */}
      <div className="px-3 py-1.5 border-t border-border text-[10px] text-muted-foreground">
        <span>{isZh ? 'Tab 接受全部 · Esc 拒绝 · Shift+Tab 部分接受 · 点击段落选择/取消' : 'Tab accept all · Esc reject · Shift+Tab partial accept · Click segments to toggle'}</span>
      </div>
    </div>
  )
}