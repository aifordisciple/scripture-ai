'use client'

import { createContext, useContext, useCallback, useRef } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
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
    useBibleStore.getState().setSermonGhostText(text)
    useBibleStore.getState().setSermonGhostTextVisible(true)
  }, [])

  const acceptGhostText = useCallback(() => {
    const { sermonGhostText, setSermonGhostText, setSermonGhostTextVisible } = useBibleStore.getState()
    const handle = handleRef.current
    if (handle && sermonGhostText) {
      handle.insertValue(sermonGhostText)
    }
    setSermonGhostText('')
    setSermonGhostTextVisible(false)
  }, [])

  const rejectGhostText = useCallback(() => {
    const { setSermonGhostText, setSermonGhostTextVisible } = useBibleStore.getState()
    setSermonGhostText('')
    setSermonGhostTextVisible(false)
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