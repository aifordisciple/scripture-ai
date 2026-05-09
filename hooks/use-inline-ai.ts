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
  /** Type of the current ghost text suggestion */
  ghostTextType: GhostTextType
  /** Trigger ghost text generation at the cursor position */
  triggerCompletion: (content: string, cursorPosition: number) => void
  /** Trigger a specific type of ghost text */
  triggerTypedCompletion: (content: string, cursorPosition: number, type: GhostTextType) => void
  /** Schedule auto-trigger after cursor stops moving */
  scheduleAutoTrigger: (content: string, cursorPosition: number) => void
  /** Cancel any pending auto-trigger */
  cancelAutoTrigger: () => void
  /** Accept the current ghost text (insert into editor) */
  acceptCompletion: () => void
  /** Reject the current ghost text (clear it) */
  rejectCompletion: () => void
}

/** Ghost text suggestion types */
export type GhostTextType = 'continue' | 'illustration' | 'application' | 'transition' | 'prayer'

/** Maps GhostTextType to the AI action endpoint parameter */
const GHOST_TYPE_TO_ACTION: Record<GhostTextType, string> = {
  continue: 'continue',
  illustration: 'add-example',
  application: 'add-application',
  transition: 'add-transition',
  prayer: 'add-prayer',
}

/** Maps GhostTextType to a context hint injected into the prompt */
const GHOST_TYPE_HINT: Record<GhostTextType, string> = {
  continue: '',
  illustration: 'Add a vivid illustration or real-life story that connects to the preceding content.',
  application: 'Add practical application points — how the reader/listener can apply this truth in daily life.',
  transition: 'Write a smooth transition paragraph that bridges from the preceding content to the next section.',
  prayer: 'Write a closing prayer that reflects the themes of the preceding content.',
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
  const [ghostTextType, setGhostTextType] = useState<GhostTextType>('continue')
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
    triggerTypedCompletion(content, cursorPosition, 'continue')
  }, []) // stub — real implementation is triggerTypedCompletion

  /** Trigger a specific type of ghost text */
  const triggerTypedCompletion = useCallback((content: string, cursorPosition: number, type: GhostTextType) => {
    if (!content || content.trim().length < 5) return
    if (isGenerating) return

    // Cancel any pending auto-trigger
    cancelAutoTrigger()

    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setGhostTextType(type)

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

    const action = GHOST_TYPE_TO_ACTION[type]
    const typeHint = GHOST_TYPE_HINT[type]

    // Use the ai-action endpoint with streaming
    fetch('/api/sermon/ai-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        action,
        selectedText: contextBefore,
        style: currentSermon?.style,
        locale,
        sermonContext: sermonContextStr,
        typeHint,
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
      triggerTypedCompletion(content, cursorPosition, 'continue')
    }, autoTriggerDelay)
  }, [triggerTypedCompletion, cancelAutoTrigger, autoTriggerDelay])

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
    ghostTextType,
    isGenerating,
    triggerCompletion,
    triggerTypedCompletion,
    scheduleAutoTrigger,
    cancelAutoTrigger,
    acceptCompletion,
    rejectCompletion,
  }
}