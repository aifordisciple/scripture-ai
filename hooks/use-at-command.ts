'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { AT_COMMANDS, type AtCommand } from '@/components/sermon/AtCommandMenu'

interface AtCommandState {
  visible: boolean
  position: { x: number; y: number }
  filter: string
  selectedIndex: number
  /** The accumulated context from @-commands for the next AI action */
  injectedContext: string[]
}

const INITIAL_STATE: AtCommandState = {
  visible: false,
  position: { x: 0, y: 0 },
  filter: '',
  selectedIndex: 0,
  injectedContext: [],
}

/**
 * useAtCommand — Hook for @-command context injection
 *
 * Detects @-key input in the editor, manages the AtCommandMenu state,
 * and accumulates injected context for the next AI action.
 *
 * Inspired by Cursor's @code/@docs system.
 */
export function useAtCommand() {
  const [state, setState] = useState<AtCommandState>(INITIAL_STATE)
  const atTriggerRef = useRef<number | null>(null) // position of the @ character

  /** Called when @ is typed in the editor */
  const triggerAtCommand = useCallback((position: { x: number; y: number }) => {
    atTriggerRef.current = Date.now()
    setState(prev => ({
      ...prev,
      visible: true,
      position,
      filter: '',
      selectedIndex: 0,
    }))
  }, [])

  /** Update filter text as user types after @ */
  const updateFilter = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      filter: text,
    }))
  }, [])

  /** Select a command from the menu */
  const selectCommand = useCallback((command: AtCommand, extraContext?: string) => {
    let contextStr = ''

    if (command.contextType === 'scripture' && extraContext) {
      contextStr = extraContext
    } else if (command.contextType === 'outline') {
      // Will be resolved at action time via store
      contextStr = '__OUTLINE_CONTEXT__'
    } else if (command.contextType === 'commentary') {
      contextStr = '__COMMENTARY_CONTEXT__'
    } else if (command.contextType === 'sermon') {
      contextStr = '__SERMON_CONTEXT__'
    }

    setState(prev => ({
      ...prev,
      visible: false,
      filter: '',
      selectedIndex: 0,
      injectedContext: contextStr
        ? [...prev.injectedContext, contextStr]
        : prev.injectedContext,
    }))
  }, [])

  /** Close the menu without selecting */
  const closeAtCommand = useCallback(() => {
    setState(prev => ({
      ...prev,
      visible: false,
      filter: '',
      selectedIndex: 0,
    }))
  }, [])

  /** Change selected index (for keyboard navigation) */
  const setSelectedIndex = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      selectedIndex: index,
    }))
  }, [])

  /** Consume and clear the injected context (called when AI action is triggered) */
  const consumeInjectedContext = useCallback((): string[] => {
    const context = state.injectedContext
    setState(prev => ({
      ...prev,
      injectedContext: [],
    }))
    return context
  }, [state.injectedContext])

  /** Resolve placeholder contexts with actual data */
  const resolveContexts = useCallback(async (contexts: string[]): Promise<string> => {
    const resolved: string[] = []

    for (const ctx of contexts) {
      if (ctx === '__OUTLINE_CONTEXT__') {
        try {
          const { useBibleStore } = await import('@/store/useBibleStore')
          const { outlineSections } = useBibleStore.getState()
          if (outlineSections.length > 0) {
            const outline = outlineSections
              .map((s, i) => `${i + 1}. ${s.title}${s.locked ? ' [已锁定]' : ''}`)
              .join('\n')
            resolved.push(`[Current Sermon Outline]\n${outline}`)
          }
        } catch { /* ignore */ }
      } else if (ctx === '__COMMENTARY_CONTEXT__') {
        resolved.push('[Commentary context: Use relevant Bible commentaries for this passage]')
      } else if (ctx === '__SERMON_CONTEXT__') {
        try {
          const { useBibleStore } = await import('@/store/useBibleStore')
          const { sermons, currentSermon } = useBibleStore.getState()
          const recentSermons = sermons
            .filter(s => s.id !== currentSermon?.id)
            .slice(0, 3)
          if (recentSermons.length > 0) {
            const refs = recentSermons
              .map(s => `- "${s.title}" (${s.style}, ${s.wordCount}字)`)
              .join('\n')
            resolved.push(`[Previous Sermons for Reference]\n${refs}`)
          }
        } catch { /* ignore */ }
      } else {
        // Direct context (e.g., scripture text)
        resolved.push(ctx)
      }
    }

    return resolved.join('\n\n')
  }, [])

  /** Check if there's pending injected context */
  const hasInjectedContext = state.injectedContext.length > 0

  return {
    atCommandState: state,
    triggerAtCommand,
    updateFilter,
    selectCommand,
    closeAtCommand,
    setSelectedIndex,
    consumeInjectedContext,
    resolveContexts,
    hasInjectedContext,
  }
}
