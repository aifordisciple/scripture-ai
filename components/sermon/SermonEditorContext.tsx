'use client'

import { createContext, useContext, useCallback, useRef } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import type { VditorEditorHandle } from './VditorEditor'

interface SermonEditorContextValue {
  registerEditorHandle: (handle: VditorEditorHandle | null) => void
  insertContent: (markdown: string) => void
  isDark: boolean
  getSelectedText: () => string
}

const SermonEditorContext = createContext<SermonEditorContextValue>({
  registerEditorHandle: () => {},
  insertContent: () => {},
  isDark: false,
  getSelectedText: () => '',
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

  return (
    <SermonEditorContext.Provider value={{
      registerEditorHandle,
      insertContent,
      isDark,
      getSelectedText,
    }}>
      {children}
    </SermonEditorContext.Provider>
  )
}

export function useSermonEditor() {
  return useContext(SermonEditorContext)
}