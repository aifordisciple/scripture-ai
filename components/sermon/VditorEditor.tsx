'use client'

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { createVditorOptions } from '@/lib/sermon-vditor'

interface VditorEditorProps {
  content: string
  onChange: (content: string) => void
  isDark: boolean
  onSave: () => void
}

export interface VditorEditorHandle {
  getVditor: () => Vditor | null
  insertValue: (value: string) => void
  setValue: (markdown: string) => void
  getValue: () => string
}

const VditorEditor = forwardRef<VditorEditorHandle, VditorEditorProps>(
  function VditorEditor({ content, onChange, isDark, onSave }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const vditorRef = useRef<Vditor | null>(null)
    const isUserInputRef = useRef(false)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    const onSaveRef = useRef(onSave)
    onSaveRef.current = onSave
    const isDarkRef = useRef(isDark)
    isDarkRef.current = isDark

    // Initialize vditor
    useEffect(() => {
      if (!containerRef.current) return
      // Prevent double initialization in React strict mode
      if (vditorRef.current) return

      const vditor = new Vditor(containerRef.current, createVditorOptions({
        isDark: isDarkRef.current,
        initialValue: content,
        onAfterInit() {
          // Editor is ready
        },
        onInput(value: string) {
          isUserInputRef.current = true
          onChangeRef.current(value)
          // Reset flag after a tick to allow external sync
          setTimeout(() => {
            isUserInputRef.current = false
          }, 50)
        },
        onSave() {
          onSaveRef.current()
        },
      }))

      vditorRef.current = vditor

      return () => {
        vditor.destroy()
        vditorRef.current = null
      }
    }, []) // Only run once on mount

    // Sync content from external source (e.g., switching sermons)
    useEffect(() => {
      const vditor = vditorRef.current
      if (!vditor) return
      // Skip sync if the change came from user input
      if (isUserInputRef.current) return

      const currentContent = vditor.getValue()
      if (currentContent !== content) {
        vditor.setValue(content)
      }
    }, [content])

    // Sync dark mode
    useEffect(() => {
      const vditor = vditorRef.current
      if (!vditor) return

      const theme = isDark ? 'dark' : 'classic'
      const contentTheme = isDark ? 'dark' : 'light'
      const codeTheme = isDark ? 'dracula' : 'github'
      vditor.setTheme(theme, contentTheme, codeTheme)
    }, [isDark])

    // Expose handle methods
    useImperativeHandle(ref, () => ({
      getVditor: () => vditorRef.current,
      insertValue: (value: string) => {
        const vditor = vditorRef.current
        if (!vditor) return
        vditor.insertValue(value)
        vditor.focus()
      },
      setValue: (markdown: string) => {
        const vditor = vditorRef.current
        if (!vditor) return
        vditor.setValue(markdown)
      },
      getValue: () => {
        const vditor = vditorRef.current
        if (!vditor) return ''
        return vditor.getValue()
      },
    }), [])

    return (
      <div ref={containerRef} className="vditor-container" style={{ height: '100%' }} />
    )
  }
)

VditorEditor.displayName = 'VditorEditor'

export default VditorEditor