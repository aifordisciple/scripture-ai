'use client'

import { createContext, useContext, useState } from 'react'
import type { Editor } from '@tiptap/react'

const SermonEditorContext = createContext<{
  editor: Editor | null
  setEditor: (editor: Editor | null) => void
}>({ editor: null, setEditor: () => {} })

export function SermonEditorProvider({ children }: { children: React.ReactNode }) {
  const [editor, setEditor] = useState<Editor | null>(null)
  return (
    <SermonEditorContext.Provider value={{ editor, setEditor }}>
      {children}
    </SermonEditorContext.Provider>
  )
}

export function useSermonEditor() {
  return useContext(SermonEditorContext).editor
}

export function useSetSermonEditor() {
  return useContext(SermonEditorContext).setEditor
}