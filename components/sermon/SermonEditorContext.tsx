'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface SermonEditorContextValue {
  content: string
  setContent: (content: string) => void
  insertContent: (markdown: string) => void
  isDark: boolean
}

const SermonEditorContext = createContext<SermonEditorContextValue>({
  content: '',
  setContent: () => {},
  insertContent: () => {},
  isDark: false,
})

export function SermonEditorProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState('')
  const [isDark, setIsDark] = useState(false)

  const insertContent = useCallback((markdown: string) => {
    setContent(prev => prev ? `${prev}\n\n${markdown}` : markdown)
  }, [])

  return (
    <SermonEditorContext.Provider value={{ content, setContent, insertContent, isDark }}>
      {children}
    </SermonEditorContext.Provider>
  )
}

export function useSermonEditor() {
  return useContext(SermonEditorContext)
}
