'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

interface VditorEditorProps {
  content: string
  onChange: (content: string) => void
  isDark: boolean
  onSave?: () => void
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
  ({ content, onChange, isDark, onSave }, ref) => {
    const vditorRef = useRef<Vditor | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const onChangeRef = useRef(onChange)
    const onSaveRef = useRef(onSave)
    const contentRef = useRef(content)
    const isSettingContentRef = useRef(false)

    onChangeRef.current = onChange
    onSaveRef.current = onSave
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
