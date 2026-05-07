'use client'

import { useState, useCallback, useRef } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { stripThinkTags } from '@/lib/ai'

interface UseInlineAIOptions {
  /** Editor insert callback - accepts the ghost text to insert */
  onInsert?: (text: string) => void
}

interface UseInlineAIReturn {
  /** Current ghost text (inline AI completion preview) */
  ghostText: string
  /** Whether AI is currently generating a completion */
  isGenerating: boolean
  /** Trigger ghost text generation at the cursor position */
  triggerCompletion: (content: string, cursorPosition: number) => void
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
 */
export function useInlineAI(options: UseInlineAIOptions = {}): UseInlineAIReturn {
  const {
    sermonGhostText,
    setSermonGhostText,
    setSermonGhostTextVisible,
    currentSermon,
    locale,
  } = useBibleStore()

  const [isGenerating, setIsGenerating] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const onInsertRef = useRef(options.onInsert)
  onInsertRef.current = options.onInsert

  /** Trigger ghost text generation */
  const triggerCompletion = useCallback((content: string, cursorPosition: number) => {
    if (!content || content.trim().length < 5) return
    if (isGenerating) return

    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const contextBefore = content.slice(Math.max(0, cursorPosition - 500), cursorPosition)
    if (contextBefore.trim().length < 5) return

    setIsGenerating(true)
    setSermonGhostText('')
    setSermonGhostTextVisible(true)

    // Use the ai-action endpoint which handles prompt construction
    fetch('/api/sermon/ai-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        action: 'continue',
        selectedText: contextBefore,
        style: currentSermon?.style,
        locale,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`AI action failed: ${res.status}`)
        }
        const data = await res.json()
        const text = stripThinkTags(data.result || '')
        if (text) {
          setSermonGhostText(text.trim())
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
    locale,
    setSermonGhostText,
    setSermonGhostTextVisible,
  ])

  /** Accept ghost text: insert into editor */
  const acceptCompletion = useCallback(() => {
    if (!sermonGhostText) return
    onInsertRef.current?.(sermonGhostText)
    setSermonGhostText('')
    setSermonGhostTextVisible(false)
  }, [sermonGhostText, setSermonGhostText, setSermonGhostTextVisible])

  /** Reject ghost text: clear it */
  const rejectCompletion = useCallback(() => {
    // Abort any in-flight request
    abortRef.current?.abort()
    abortRef.current = null
    setSermonGhostText('')
    setSermonGhostTextVisible(false)
    setIsGenerating(false)
  }, [setSermonGhostText, setSermonGhostTextVisible])

  return {
    ghostText: sermonGhostText,
    isGenerating,
    triggerCompletion,
    acceptCompletion,
    rejectCompletion,
  }
}
