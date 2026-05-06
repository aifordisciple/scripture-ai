'use client'

import { createContext, useContext, useCallback, useRef } from 'react'
import type { VditorEditorHandle } from './VditorEditor'

interface SermonEditorContextValue {
  /** Register the VditorEditorHandle (called by SermonEditor on mount) */
  registerEditorHandle: (handle: VditorEditorHandle | null) => void
  /** Insert markdown content at cursor position in the editor */
  insertContent: (markdown: string) => void
  /** Whether the editor is in dark mode */
  isDark: boolean
}

const SermonEditorContext = createContext<SermonEditorContextValue>({
  registerEditorHandle: () => {},
  insertContent: () => {},
  isDark: false,
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

  return (
    <SermonEditorContext.Provider value={{ registerEditorHandle, insertContent, isDark }}>
      {children}
    </SermonEditorContext.Provider>
  )
}

export function useSermonEditor() {
  return useContext(SermonEditorContext)
}
