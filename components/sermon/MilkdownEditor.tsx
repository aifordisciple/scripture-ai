'use client'

import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react'
import { Editor, EditorStatus } from '@milkdown/kit/core'
import { Milkdown, MilkdownProvider, useEditor, useInstance } from '@milkdown/react'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'
import { history } from '@milkdown/kit/plugin/history'
import { clipboard } from '@milkdown/kit/plugin/clipboard'
import { trailing } from '@milkdown/kit/plugin/trailing'
import { indent } from '@milkdown/kit/plugin/indent'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { commandsCtx, editorViewCtx, defaultValueCtx } from '@milkdown/core'
import { keymap } from '@milkdown/prose/keymap'
import { verseBlockSchema, verseBlockView, insertVerseBlockCommand } from './extensions/verseBlock'
import { sectionBlockSchema, sectionBlockView, insertSectionBlockCommand } from './extensions/sectionBlock'
import { sermonEditorCSS } from './extensions/milkdownTheme'
import EditorToolbar from './EditorToolbar'
import { useSermonEditor } from './SermonEditorContext'

interface MilkdownEditorProps {
  content: string
  onChange: (content: string) => void
  isDark: boolean
  onSave: () => void
  fontSize: number
  lineHeight: number
}

// Inner component that uses the Milkdown hooks inside the provider
function MilkdownInner({
  content,
  onChange,
  isDark,
  onSave,
  fontSize,
  lineHeight,
}: MilkdownEditorProps) {
  const { registerEditorView, registerEditor } = useSermonEditor()
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  const contentRef = useRef(content)
  contentRef.current = content

  // Track whether a content sync is in progress to prevent onChange loop
  const syncingRef = useRef(false)

  // Generate theme CSS
  const themeCSS = useMemo(() => sermonEditorCSS(isDark, fontSize, lineHeight), [isDark, fontSize, lineHeight])

  const { loading, get: getEditor } = useEditor((root) => {
    const editor = Editor.make()
      .config((ctx) => {
        // Set default value
        ctx.set(defaultValueCtx as any, contentRef.current || '')

        // Configure listener for onChange
        ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown && !syncingRef.current) {
            onChangeRef.current(markdown)
          }
        })

        // Add Cmd+S save shortcut via ProseMirror keymap
        ctx.update('prosePlugins' as any, (ps: any[]) => [
          ...ps,
          keymap({
            'Mod-s': () => {
              onSaveRef.current()
              return true
            },
          }),
        ])
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(clipboard)
      .use(trailing)
      .use(indent)
      .use(listener)
      .use(verseBlockSchema)
      .use(sectionBlockSchema)
      .use(insertVerseBlockCommand)
      .use(insertSectionBlockCommand)
      .use(verseBlockView)
      .use(sectionBlockView)
    return editor
  }, [])

  // Get editor instance and register it
  const [instanceLoading, getInstance] = useInstance()

  useEffect(() => {
    if (!instanceLoading) {
      const editor = getInstance()
      if (editor && editor.status === EditorStatus.Created) {
        registerEditor(editor)
        editor.action((ctx) => {
          const view = ctx.get('editorView' as any)
          registerEditorView(view as any)
        })
      }
    }
  }, [instanceLoading, getInstance, registerEditor, registerEditorView])

  // Sync content when switching sermons (external content change)
  useEffect(() => {
    const editor = getEditor()
    if (!editor || editor.status !== EditorStatus.Created) return

    editor.action((ctx) => {
      const view = ctx.get('editorView' as any) as any
      if (!view) return
      const serializer = ctx.get('serializer' as any) as any
      const currentMarkdown: string = serializer(view.state.doc)
      if (currentMarkdown !== contentRef.current) {
        const parser = ctx.get('parser' as any) as any
        const doc = parser(contentRef.current || '')
        if (doc) {
          syncingRef.current = true
          try {
            const state = view.state.create({ doc })
            view.updateState(state)
          } finally {
            // Reset syncing flag after a tick to let listener callbacks drain
            setTimeout(() => {
              syncingRef.current = false
            }, 50)
          }
        }
      }
    })
  }, [content, getEditor])

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      <EditorToolbar isDark={isDark} />
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      <div className="flex-1 milkdown" style={{ minHeight: 0, overflow: 'auto' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            加载编辑器...
          </div>
        ) : (
          <Milkdown />
        )}
      </div>
    </div>
  )
}

export default function MilkdownEditor(props: MilkdownEditorProps) {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      // Capture unhandled errors from Milkdown/ProseMirror
      const msg = e.message || ''
      if (msg.includes('milkdown') || msg.includes('prosemirror') || msg.includes('Milkdown') || msg.includes('ProseMirror')) {
        console.error('[MilkdownEditor] Unhandled error:', e.error)
        setError(msg)
      }
    }
    const rejectionHandler = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message || String(e.reason)
      console.error('[MilkdownEditor] Unhandled rejection:', e.reason)
      setError(msg)
    }
    window.addEventListener('error', handler)
    window.addEventListener('unhandledrejection', rejectionHandler)
    return () => {
      window.removeEventListener('error', handler)
      window.removeEventListener('unhandledrejection', rejectionHandler)
    }
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 gap-2">
        <p className="text-red-500 text-sm">编辑器加载失败</p>
        <p className="text-xs text-muted-foreground max-w-md break-all">{error}</p>
        <button
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => { setError(null); window.location.reload() }}
        >
          刷新重试
        </button>
      </div>
    )
  }

  return (
    <MilkdownProvider>
      <MilkdownInner {...props} />
    </MilkdownProvider>
  )
}