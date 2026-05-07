'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

interface VditorEditorProps {
  content: string
  onChange: (content: string) => void
  isDark: boolean
  onSave?: () => void
  onSelectionChange?: (selectedText: string, rect: DOMRect | null) => void
  onCursorActivity?: (text: string, cursorOffset: number) => void
}

export interface VditorEditorHandle {
  getValue: () => string
  setValue: (content: string) => void
  insertValue: (value: string) => void
  getVditor: () => Vditor | null
  getSelectedText: () => string
  focus: () => void
}

const VditorEditor = forwardRef<VditorEditorHandle, VditorEditorProps>(
  ({ content, onChange, isDark, onSave, onSelectionChange, onCursorActivity }, ref) => {
    const vditorRef = useRef<Vditor | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const onChangeRef = useRef(onChange)
    const onSaveRef = useRef(onSave)
    const onSelectionChangeRef = useRef(onSelectionChange)
    const onCursorActivityRef = useRef(onCursorActivity)
    const contentRef = useRef(content)
    const isSettingContentRef = useRef(false)

    onChangeRef.current = onChange
    onSaveRef.current = onSave
    onSelectionChangeRef.current = onSelectionChange
    onCursorActivityRef.current = onCursorActivity
    contentRef.current = content

    useImperativeHandle(ref, () => ({
      getValue: () => vditorRef.current?.getValue() || '',
      setValue: (newContent: string) => {
        isSettingContentRef.current = true
        vditorRef.current?.setValue(newContent)
        contentRef.current = newContent
        setTimeout(() => { isSettingContentRef.current = false }, 100)
      },
      insertValue: (value: string) => {
        vditorRef.current?.insertValue(value)
      },
      getVditor: () => vditorRef.current,
      getSelectedText: () => {
        const vd = vditorRef.current
        if (!vd) return ''
        try {
          return document.getSelection()?.toString() || ''
        } catch {
          return ''
        }
      },
      focus: () => {
        vditorRef.current?.focus()
      },
    }))

    useEffect(() => {
      if (!containerRef.current) return
      if (vditorRef.current) return

      const vd = new Vditor(containerRef.current, {
        height: '100%',
        mode: 'ir',
        theme: isDark ? 'dark' : 'classic',
        icon: 'ant',
        placeholder: '开始撰写讲章...',
        value: content,
        cache: { enable: false },
        toolbar: [],
        counter: { enable: false },
        preview: { mode: 'editor' },
        input: (value) => {
          if (isSettingContentRef.current) return
          contentRef.current = value
          onChangeRef.current(value)
        },
        after: () => {
          vditorRef.current = vd
        },
      })

      return () => {
        vd.destroy()
        vditorRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Selection change detection
    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const handleSelectionChange = () => {
        const selection = document.getSelection()
        const text = selection?.toString() || ''
        let rect: DOMRect | null = null
        if (text && selection && selection.rangeCount > 0) {
          rect = selection.getRangeAt(0).getBoundingClientRect()
        }
        onSelectionChangeRef.current?.(text, rect)
      }

      const handleMouseUp = () => {
        // Small delay to let the selection settle
        setTimeout(handleSelectionChange, 10)
      }

      const handleKeyUp = (e: KeyboardEvent) => {
        // Check for shift+arrow keys or other selection keys
        if (e.shiftKey || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          handleSelectionChange()
        }
      }

      document.addEventListener('selectionchange', handleSelectionChange)
      container.addEventListener('mouseup', handleMouseUp)
      container.addEventListener('keyup', handleKeyUp as EventListener)

      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange)
        container.removeEventListener('mouseup', handleMouseUp)
        container.removeEventListener('keyup', handleKeyUp as EventListener)
      }
    }, [])

    // Cursor activity detection for slash commands
    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const handleInput = () => {
        const vd = vditorRef.current
        if (!vd) return
        try {
          const fullText = vd.getValue()
          // Get cursor position from the editor's CodeMirror instance
          const cm = (vd as any).vditor?.sv?.codeMirror || (vd as any).vditor?.ir?.codeMirror
          if (cm && onCursorActivityRef.current) {
            const cursor = cm.getCursor()
            // Calculate approximate offset by counting chars up to cursor line
            const lines = fullText.split('\n')
            let offset = 0
            for (let i = 0; i < cursor.line && i < lines.length; i++) {
              offset += lines[i].length + 1
            }
            offset += cursor.ch
            // Get text around cursor (last 50 chars before cursor)
            const textBeforeCursor = fullText.slice(Math.max(0, offset - 50), offset)
            onCursorActivityRef.current(textBeforeCursor, offset)
          }
        } catch {}
      }

      container.addEventListener('input', handleInput as EventListener)
      return () => container.removeEventListener('input', handleInput as EventListener)
    }, [])

    // Sync theme
    useEffect(() => {
      if (!vditorRef.current) return
      try {
        const theme = isDark ? 'dark' : 'classic'
        vditorRef.current.setTheme(theme)
      } catch {}
    }, [isDark])

    // Sync content from outside
    useEffect(() => {
      if (!vditorRef.current) return
      const current = vditorRef.current.getValue()
      if (content !== current && !isSettingContentRef.current) {
        isSettingContentRef.current = true
        vditorRef.current.setValue(content || '')
        setTimeout(() => { isSettingContentRef.current = false }, 100)
      }
    }, [content])

    // Global keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Cmd+S / Ctrl+S — save
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault()
          onSaveRef.current?.()
        }
        // Cmd+J / Ctrl+J — trigger AI continue
        if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
          e.preventDefault()
          // Dispatch custom event that SermonEditor listens to
          window.dispatchEvent(new CustomEvent('sermon:ai-continue'))
        }
        // Cmd+Shift+J — toggle AI panel
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'J') {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('sermon:toggle-ai-panel'))
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
      <div className="vditor-container h-full w-full [&_.vditor]:border-0 [&_.vditor]:h-full [&_.vditor-toolbar]:hidden [&_.vditor-reset]:font-serif [&_.vditor-reset]:text-base [&_.vditor-reset]:p-4 [&_.vditor-reset]:leading-relaxed" ref={containerRef} />
    )
  }
)

VditorEditor.displayName = 'VditorEditor'
export default VditorEditor
