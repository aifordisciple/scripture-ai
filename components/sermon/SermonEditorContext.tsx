'use client'

import { createContext, useContext, useCallback, useRef } from 'react'
import type { VditorEditorHandle } from './VditorEditor'

interface SermonEditorContextValue {
  registerEditorHandle: (handle: VditorEditorHandle | null) => void
  insertContent: (markdown: string) => void
  isDark: boolean
  getSelectedText: () => string
  showGhostText: (text: string) => void
  acceptGhostText: () => void
  rejectGhostText: () => void
}

const SermonEditorContext = createContext<SermonEditorContextValue>({
  registerEditorHandle: () => {},
  insertContent: () => {},
  isDark: false,
  getSelectedText: () => '',
  showGhostText: () => {},
  acceptGhostText: () => {},
  rejectGhostText: () => {},
})

export function SermonEditorProvider({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  const handleRef = useRef<VditorEditorHandle | null>(null)

  const registerEditorHandle = useCallback((handle: VditorEditorHandle | null) => {
    handleRef.current = handle
  }, [])

  const insertContent = useCallback((markdown: string) => {
    const handle = handleRef.current
    if (!handle) return
    handle.insertValue(markdown + '\n')
  }, [])

  const getSelectedText = useCallback(() => {
    const handle = handleRef.current
    if (!handle) return ''
    return handle.getSelectedText()
  }, [])

  const showGhostText = useCallback((text: string) => {
    // Ghost text is managed via store — SermonEditor reads it
    // This is a placeholder for future DOM-level ghost text injection
  }, [])

  const acceptGhostText = useCallback(() => {
    const handle = handleRef.current
    if (!handle) return
    // Insert the ghost text into the editor
    // Ghost text state is managed by the store
  }, [])

  const rejectGhostText = useCallback(() => {
    // Clear ghost text from the store
  }, [])

  return (
    <SermonEditorContext.Provider value={{
      registerEditorHandle,
      insertContent,
      isDark,
      getSelectedText,
      showGhostText,
      acceptGhostText,
      rejectGhostText,
    }}>
      {children}
    </SermonEditorContext.Provider>
  )
}

export function useSermonEditor() {
  return useContext(SermonEditorContext)
}