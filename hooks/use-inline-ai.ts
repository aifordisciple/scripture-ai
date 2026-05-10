'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { stripThinkTags } from '@/lib/ai'
import { buildSermonContext, serializeContext } from '@/lib/sermon-context'
import { detectGhostTextType, analyzeGhostTextContext, type GhostTextType } from '@/lib/ghost-text-detector'

interface UseInlineAIOptions {
  /** Editor insert callback - accepts the ghost text to insert */
  onInsert?: (text: string) => void
  /** Delay in ms before auto-triggering completion after cursor stops (default 1500) */
  autoTriggerDelay?: number
  /** Cooldown in ms after a rejection before auto-triggering again (default 30000) */
  rejectionCooldown?: number
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
 * - Context-aware type detection (auto-detect what kind of suggestion to show)
 * - Rejection cooldown (30s after reject, don't auto-trigger again)
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
  const rejectionCooldown = options.rejectionCooldown ?? 30000

  const [isGenerating, setIsGenerating] = useState(false)
  const [ghostTextType, setGhostTextType] = useState<GhostTextType>('continue')
  const abortRef = useRef<AbortController | null>(null)
  const autoTriggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onInsertRef = useRef(options.onInsert)
  onInsertRef.current = options.onInsert
  const lastRejectionTimeRef = useRef<number>(0)

  // Use refs for values needed inside callbacks to avoid stale closures
  const isGeneratingRef = useRef(false)
  const currentSermonRef = useRef(currentSermon)
  currentSermonRef.current = currentSermon
  const localeRef = useRef(locale)
  localeRef.current = locale

  // Sync isGenerating state to ref
  useEffect(() => {
    isGeneratingRef.current = isGenerating
  }, [isGenerating])

  /** Cancel any pending auto-trigger timer */
  const cancelAutoTrigger = useCallback(() => {
    if (autoTriggerTimerRef.current) {
      clearTimeout(autoTriggerTimerRef.current)
      autoTriggerTimerRef.current = null
    }
  }, [])

  /** Trigger a specific type of ghost text — core implementation, no circular deps */
  const triggerTypedCompletion = useCallback((content: string, cursorPosition: number, type: GhostTextType) => {
    if (!content || content.trim().length < 50) return
    if (isGeneratingRef.current) return

    // Don't auto-trigger if within rejection cooldown
    const timeSinceRejection = Date.now() - lastRejectionTimeRef.current
    if (timeSinceRejection < rejectionCooldown) return

    // Cancel any pending auto-trigger
    cancelAutoTrigger()

    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setGhostTextType(type)

    // Take more context: 800 chars before cursor for better context awareness
    const contextBefore = content.slice(Math.max(0, cursorPosition - 800), cursorPosition)
    if (contextBefore.trim().length < 50) return

    // Build full sermon context for AI awareness
    const sermon = currentSermonRef.current
    const sermonCtx = buildSermonContext(content, cursorPosition, {
      title: sermon?.title,
      verseRefs: sermon?.verseRefs,
      style: sermon?.style,
      flowStage: useBibleStore.getState().sermonFlowStage,
    })
    const sermonContextStr = serializeContext(sermonCtx)

    setIsGenerating(true)
    setSermonGhostText('')
    setSermonGhostTextVisible(true)

    const action = GHOST_TYPE_TO_ACTION[type]
    const typeHint = GHOST_TYPE_HINT[type]

    fetch('/api/sermon/ai-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        action,
        selectedText: contextBefore,
        style: sermon?.style,
        locale: localeRef.current,
        sermonContext: sermonContextStr,
        typeHint,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`AI action failed: ${res.status}`)
        }
        const reader = res.body?.getReader()
        if (!reader) {
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
          const clean = stripThinkTags(accumulated)
          if (clean) {
            setSermonGhostText(clean.trim())
          }
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setSermonGhostText('')
        setSermonGhostTextVisible(false)
      })
      .finally(() => {
        setIsGenerating(false)
        abortRef.current = null
      })
  }, [rejectionCooldown, cancelAutoTrigger, setSermonGhostText, setSermonGhostTextVisible])

  // Use a ref for triggerTypedCompletion so scheduleAutoTrigger doesn't create circular deps
  const triggerTypedCompletionRef = useRef(triggerTypedCompletion)
  triggerTypedCompletionRef.current = triggerTypedCompletion

  /** Trigger ghost text generation with auto-detected type */
  const triggerCompletion = useCallback((content: string, cursorPosition: number) => {
    const ctx = analyzeGhostTextContext(
      content,
      cursorPosition,
      useBibleStore.getState().sermonFlowStage,
    )
    const detectedType = detectGhostTextType(ctx)
    triggerTypedCompletionRef.current(content, cursorPosition, detectedType)
  }, [])

  /** Schedule auto-trigger after cursor stops moving */
  const scheduleAutoTrigger = useCallback((content: string, cursorPosition: number) => {
    cancelAutoTrigger()

    // Don't schedule if within rejection cooldown
    const timeSinceRejection = Date.now() - lastRejectionTimeRef.current
    if (timeSinceRejection < rejectionCooldown) return

    // Don't schedule if already generating
    if (isGeneratingRef.current) return

    autoTriggerTimerRef.current = setTimeout(() => {
      triggerCompletion(content, cursorPosition)
    }, autoTriggerDelay)
  }, [triggerCompletion, cancelAutoTrigger, autoTriggerDelay, rejectionCooldown])

  /** Accept ghost text: insert into editor */
  const acceptCompletion = useCallback(() => {
    if (!sermonGhostText) return
    onInsertRef.current?.(sermonGhostText)
    setSermonGhostText('')
    setSermonGhostTextVisible(false)
  }, [sermonGhostText, setSermonGhostText, setSermonGhostTextVisible])

  /** Reject ghost text: clear it and record rejection time for cooldown */
  const rejectCompletion = useCallback(() => {
    cancelAutoTrigger()
    abortRef.current?.abort()
    abortRef.current = null
    lastRejectionTimeRef.current = Date.now()
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

// Re-export GhostTextType for backward compatibility
export type { GhostTextType }
