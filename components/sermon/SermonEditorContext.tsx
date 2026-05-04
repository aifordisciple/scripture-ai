'use client'

import { createContext, useContext, useCallback, useRef } from 'react'
import type { EditorView } from '@codemirror/view'

interface SermonEditorContextValue {
  /** Get the current EditorView instance */
  getEditorView: () => EditorView | null
  /** Register the EditorView (called by CodeMirrorEditor on mount) */
  registerEditorView: (view: EditorView | null) => void
  /** Insert markdown content at cursor position in the editor */
  insertContent: (markdown: string) => void
  /** Whether the editor is in dark mode */
  isDark: boolean
}

const SermonEditorContext = createContext<SermonEditorContextValue>({
  getEditorView: () => null,
  registerEditorView: () => {},
  insertContent: () => {},
  isDark: false,
})

export function SermonEditorProvider({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  const editorViewRef = useRef<EditorView | null>(null)

  const registerEditorView = useCallback((view: EditorView | null) => {
    editorViewRef.current = view
  }, [])

  const getEditorView = useCallback(() => {
    return editorViewRef.current
  }, [])

  const insertContent = useCallback((markdown: string) => {
    const view = editorViewRef.current
    if (!view) return

    const { from } = view.state.selection.main
    const line = view.state.doc.lineAt(from)
    const insertPos = line.to
    const prefix = line.text.trim() === '' ? '' : '\n'

    view.dispatch({
      changes: { from: insertPos, insert: `${prefix}${markdown}\n` },
      selection: { anchor: insertPos + prefix.length + markdown.length + 1 },
    })
    view.focus()
  }, [])

  return (
    <SermonEditorContext.Provider value={{ getEditorView, registerEditorView, insertContent, isDark }}>
      {children}
    </SermonEditorContext.Provider>
  )
}

export function useSermonEditor() {
  return useContext(SermonEditorContext)
}
