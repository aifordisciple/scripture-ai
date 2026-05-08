'use client'

import { useState, useCallback, useRef } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { stripThinkTags } from '@/lib/ai'
import { buildSermonContext, serializeContext } from '@/lib/sermon-context'

interface UseInlineAIOptions {
  /** Editor insert callback - accepts the ghost text to insert */
  onInsert?: (text: string) => void
  /** Delay in ms before auto-triggering completion after cursor stops (default 1500) */
  autoTriggerDelay?: number
}

interface UseInlineAIReturn {
  /** Current ghost text (inline AI completion preview) */
  ghostText: string
  /** Whether AI is currently generating a completion */
  isGenerating: boolean
  /** Trigger ghost text generation at the cursor position */
  triggerCompletion: (content: string, cursorPosition: number) => void
  /** Schedule auto-trigger after cursor stops moving */
  scheduleAutoTrigger: (content: string, cursorPosition: number) => void
  /** Cancel any pending auto-trigger */
  cancelAutoTrigger: () => void
  /** Accept the current ghost text (insert into editor) */
  acceptCompletion: () => void
  /** Reject the current ghost text (clear it) */
  rejectCompletion: () => void
}

/**
 * Hook for managing inline AI completion (ghost text) in the sermon editor.
 *
 * Ghost text appears as a translucent preview after the cursor. The user can
 * accept (Tab) or reject (Escape) the suggestion.
 *
 * P0 enhancements:
 * - Full sermon context injection (outline, adjacent sections, flow stage)
 * - Auto-trigger after cursor stops (1.5s default)
 * - Streaming response handling
 */
export function useInlineAI(options: UseInlineAIOptions = {}): UseInlineAIReturn {
  const {
    sermonGhostText,
    setSermonGhostText,
    setSermonGhostTextVisible,
    currentSermon,
    locale,
  } = useBibleStore()

  const autoTriggerDelay = options.autoTriggerDelay ?? 1500

  const [isGenerating, setIsGenerating] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const autoTriggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onInsertRef = useRef(options.onInsert)
  onInsertRef.current = options.onInsert

  /** Cancel any pending auto-trigger timer */
  const cancelAutoTrigger = useCallback(() => {
    if (autoTriggerTimerRef.current) {
      clearTimeout(autoTriggerTimerRef.current)
      autoTriggerTimerRef.current = null
    }
  }, [])

  /** Trigger ghost text generation */
  const triggerCompletion = useCallback((content: string, cursorPosition: number) => {
    if (!content || content.trim().length < 5) return
    if (isGenerating) return

    // Cancel any pending auto-trigger
    cancelAutoTrigger()

    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Take more context: 800 chars before cursor for better context awareness
    const contextBefore = content.slice(Math.max(0, cursorPosition - 800), cursorPosition)
    if (contextBefore.trim().length < 5) return

    // Build full sermon context for AI awareness (outline, adjacent sections, etc.)
    const sermonCtx = buildSermonContext(content, cursorPosition, {
      title: currentSermon?.title,
      verseRefs: currentSermon?.verseRefs,
      style: currentSermon?.style,
      flowStage: useBibleStore.getState().sermonFlowStage,
    })
    const sermonContextStr = serializeContext(sermonCtx)

    setIsGenerating(true)
    setSermonGhostText('')
    setSermonGhostTextVisible(true)

    // Use the ai-action endpoint with streaming
    fetch('/api/sermon/ai-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        action: 'continue',
        selectedText: contextBefore,
        style: currentSermon?.style,
        locale,
        sermonContext: sermonContextStr,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`AI action failed: ${res.status}`)
        }
        // Handle streaming response
        const reader = res.body?.getReader()
        if (!reader) {
          // Fallback: try JSON response
          const text = await res.text()
          const result = stripThinkTags(text)
          if (result) {
            setSermonGhostText(result.trim())
          }
          return
        }
        const decoder = new TextDecoder()
        let accumulated = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          // Update ghost text progressively for faster perceived response
          const clean = stripThinkTags(accumulated)
          if (clean) {
            setSermonGhostText(clean.trim())
          }
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        // Silently fail for ghost text - it's a non-critical feature
        setSermonGhostText('')
        setSermonGhostTextVisible(false)
      })
      .finally(() => {
        setIsGenerating(false)
        abortRef.current = null
      })
  }, [
    isGenerating,
    currentSermon?.style,
    currentSermon?.title,
    currentSermon?.verseRefs,
    locale,
    setSermonGhostText,
    setSermonGhostTextVisible,
    cancelAutoTrigger,
  ])

  /** Schedule auto-trigger after cursor stops moving */
  const scheduleAutoTrigger = useCallback((content: string, cursorPosition: number) => {
    cancelAutoTrigger()
    autoTriggerTimerRef.current = setTimeout(() => {
      triggerCompletion(content, cursorPosition)
    }, autoTriggerDelay)
  }, [triggerCompletion, cancelAutoTrigger, autoTriggerDelay])

  /** Accept ghost text: insert into editor */
  const acceptCompletion = useCallback(() => {
    if (!sermonGhostText) return
    onInsertRef.current?.(sermonGhostText)
    setSermonGhostText('')
    setSermonGhostTextVisible(false)
  }, [sermonGhostText, setSermonGhostText, setSermonGhostTextVisible])

  /** Reject ghost text: clear it */
  const rejectCompletion = useCallback(() => {
    // Cancel any pending auto-trigger
    cancelAutoTrigger()
    // Abort any in-flight request
    abortRef.current?.abort()
    abortRef.current = null
    setSermonGhostText('')
    setSermonGhostTextVisible(false)
    setIsGenerating(false)
  }, [setSermonGhostText, setSermonGhostTextVisible, cancelAutoTrigger])

  return {
    ghostText: sermonGhostText,
    isGenerating,
    triggerCompletion,
    scheduleAutoTrigger,
    cancelAutoTrigger,
    acceptCompletion,
    rejectCompletion,
  }
}