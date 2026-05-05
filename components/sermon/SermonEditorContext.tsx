'use client'

import { createContext, useContext, useCallback, useRef } from 'react'
import type { EditorView as ProseEditorView } from '@milkdown/prose/view'
import type { Editor } from '@milkdown/kit/core'

interface SermonEditorContextValue {
  /** Get the current ProseMirror EditorView instance */
  getEditorView: () => ProseEditorView | null
  /** Register the EditorView (called by MilkdownEditor on mount) */
  registerEditorView: (view: ProseEditorView | null) => void
  /** Get the Milkdown Editor instance */
  getEditor: () => Editor | null
  /** Register the Milkdown Editor instance */
  registerEditor: (editor: Editor | null) => void
  /** Insert markdown content at cursor position in the editor */
  insertContent: (markdown: string) => void
  /** Whether the editor is in dark mode */
  isDark: boolean
}

const SermonEditorContext = createContext<SermonEditorContextValue>({
  getEditorView: () => null,
  registerEditorView: () => {},
  getEditor: () => null,
  registerEditor: () => {},
  insertContent: () => {},
  isDark: false,
})

export function SermonEditorProvider({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  const editorViewRef = useRef<ProseEditorView | null>(null)
  const editorRef = useRef<Editor | null>(null)

  const registerEditorView = useCallback((view: ProseEditorView | null) => {
    editorViewRef.current = view
  }, [])

  const getEditorView = useCallback(() => {
    return editorViewRef.current
  }, [])

  const registerEditor = useCallback((editor: Editor | null) => {
    editorRef.current = editor
  }, [])

  const getEditor = useCallback(() => {
    return editorRef.current
  }, [])

  const insertContent = useCallback((markdown: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.action((ctx) => {
      const view = ctx.get('editorView' as any) as ProseEditorView
      if (!view) return
      // Insert text at cursor position using ProseMirror transaction
      const { from } = view.state.selection
      const tr = view.state.tr.insertText(markdown + '\n')
      view.dispatch(tr)
      view.focus()
    })
  }, [])

  return (
    <SermonEditorContext.Provider value={{ getEditorView, registerEditorView, getEditor, registerEditor, insertContent, isDark }}>
      {children}
    </SermonEditorContext.Provider>
  )
}

export function useSermonEditor() {
  return useContext(SermonEditorContext)
}