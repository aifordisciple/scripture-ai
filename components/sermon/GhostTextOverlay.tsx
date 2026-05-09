'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useBibleStore } from '@/store/useBibleStore'

interface GhostTextOverlayProps {
  editorContainerRef: React.RefObject<HTMLDivElement | null>
  onAccept: () => void
  onReject: () => void
}

/**
 * GhostTextOverlay — 编辑器内Ghost Text渲染
 *
 * Renders AI suggestion text as translucent overlay after the cursor.
 * Inspired by: GitHub Copilot's ghost text, Cursor's inline suggestions
 *
 * Features:
 * - Translucent text rendered after cursor position
 * - Tab to accept, Escape to reject
 * - Fades in/out animation
 * - Auto-dismiss after 30s if not accepted
 */
export function GhostTextOverlay({ editorContainerRef, onAccept, onReject }: GhostTextOverlayProps) {
  const { sermonGhostText, sermonGhostTextVisible } = useBibleStore()
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Find cursor position in the editor
  useEffect(() => {
    if (!sermonGhostTextVisible || !sermonGhostText) {
      setIsVisible(false)
      setPosition(null)
      return
    }

    // Try to find cursor position from the editor DOM
    const container = editorContainerRef.current
    if (!container) return

    // Look for the cursor element in Vditor
    const cursorEl = container.querySelector('.vditor-ir__cursor') ||
      container.querySelector('.CodeMirror-cursor') ||
      container.querySelector('.ProseMirror-gapcursor')

    if (cursorEl) {
      const containerRect = container.getBoundingClientRect()
      const cursorRect = cursorEl.getBoundingClientRect()
      setPosition({
        top: cursorRect.bottom - containerRect.top,
        left: cursorRect.left - containerRect.left,
      })
      setIsVisible(true)
    } else {
      // Fallback: position at bottom of visible area
      setIsVisible(true)
      setPosition(null)
    }
  }, [sermonGhostTextVisible, sermonGhostText, editorContainerRef])

  // Auto-dismiss after 30s
  useEffect(() => {
    if (isVisible) {
      dismissTimerRef.current = setTimeout(() => {
        onReject()
      }, 30000)
    }
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [isVisible, onReject])

  // Keyboard handler for Tab/Escape
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && sermonGhostText) {
        e.preventDefault()
        e.stopPropagation()
        onAccept()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onReject()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isVisible, sermonGhostText, onAccept, onReject])

  if (!isVisible || !sermonGhostText) return null

  return (
    <>
      {/* Ghost text overlay */}
      <div
        className={`
          absolute z-30 pointer-events-none
          text-foreground/25 dark:text-foreground/20
          text-sm leading-[1.8] font-serif
          whitespace-pre-wrap max-w-[600px]
          animate-in fade-in-0 duration-200
        `}
        style={position ? {
          top: position.top,
          left: position.left,
        } : {
          bottom: '60px',
          left: '20%',
          right: '20%',
        }}
      >
        {sermonGhostText}
      </div>

      {/* Accept/Reject hint bar */}
      <div
        className={`
          absolute z-30 flex items-center gap-2
          px-2 py-1 rounded-md
          bg-muted/80 backdrop-blur-sm border border-border/50
          text-[10px] text-muted-foreground
          animate-in fade-in-0 slide-in-from-bottom-2 duration-200
        `}
        style={position ? {
          top: position.top + 4,
          left: position.left,
        } : {
          bottom: '40px',
          left: '20%',
        }}
      >
        <kbd className="px-1 py-0.5 rounded text-[9px] bg-muted/50 border border-border/50 font-mono">Tab</kbd>
        <span>接受</span>
        <kbd className="px-1 py-0.5 rounded text-[9px] bg-muted/50 border border-border/50 font-mono">Esc</kbd>
        <span>拒绝</span>
      </div>
    </>
  )
}
