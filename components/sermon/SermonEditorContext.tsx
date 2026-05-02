'use client'

import { createContext, useContext } from 'react'
import type { Editor } from '@tiptap/react'

const SermonEditorContext = createContext<Editor | null>(null)

export function SermonEditorProvider({ editor, children }: { editor: Editor | null; children: React.ReactNode }) {
  return (
    <SermonEditorContext.Provider value={editor}>
      {children}
    </SermonEditorContext.Provider>
  )
}

export function useSermonEditor() {
  return useContext(SermonEditorContext)
}
