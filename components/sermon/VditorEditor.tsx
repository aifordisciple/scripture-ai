'use client'

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useState } from 'react'
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
    const isReadyRef = useRef(false)
    const isUserInputRef = useRef(false)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    const onSaveRef = useRef(onSave)
    onSaveRef.current = onSave
    const isDarkRef = useRef(isDark)
    isDarkRef.current = isDark

    // Track pending operations that should run after init
    const pendingOpsRef = useRef<(() => void)[]>([])

    // Initialize vditor — only on client, only once
    useEffect(() => {
      if (!containerRef.current) return
      if (vditorRef.current) return

      const vditor = new Vditor(containerRef.current, createVditorOptions({
        isDark: isDarkRef.current,
        initialValue: content,
        onAfterInit() {
          isReadyRef.current = true
          // Execute any pending operations
          const ops = pendingOpsRef.current
          pendingOpsRef.current = []
          ops.forEach(op => op())
        },
        onInput(value: string) {
          isUserInputRef.current = true
          onChangeRef.current(value)
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
        try {
          vditor.destroy()
        } catch {
          // ignore destroy errors
        }
        vditorRef.current = null
        isReadyRef.current = false
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Only run once on mount

    // Helper: run operation after vditor is ready
    const whenReady = useCallback((op: () => void) => {
      if (isReadyRef.current && vditorRef.current) {
        op()
      } else {
        pendingOpsRef.current.push(op)
      }
    }, [])

    // Sync content from external source (e.g., switching sermons)
    useEffect(() => {
      whenReady(() => {
        const vditor = vditorRef.current
        if (!vditor) return
        if (isUserInputRef.current) return

        const currentContent = vditor.getValue()
        if (currentContent !== content) {
          vditor.setValue(content)
        }
      })
    }, [content, whenReady])

    // Sync dark mode
    useEffect(() => {
      whenReady(() => {
        const vditor = vditorRef.current
        if (!vditor) return

        const theme = isDark ? 'dark' : 'classic'
        const contentTheme = isDark ? 'dark' : 'light'
        const codeTheme = isDark ? 'dracula' : 'github'
        vditor.setTheme(theme, contentTheme, codeTheme)
      })
    }, [isDark, whenReady])

    // Expose handle methods
    useImperativeHandle(ref, () => ({
      getVditor: () => vditorRef.current,
      insertValue: (value: string) => {
        whenReady(() => {
          const vditor = vditorRef.current
          if (!vditor) return
          vditor.insertValue(value)
          vditor.focus()
        })
      },
      setValue: (markdown: string) => {
        whenReady(() => {
          const vditor = vditorRef.current
          if (!vditor) return
          vditor.setValue(markdown)
        })
      },
      getValue: () => {
        const vditor = vditorRef.current
        if (!vditor || !isReadyRef.current) return ''
        return vditor.getValue()
      },
    }), [whenReady])

    return (
      <div ref={containerRef} className="vditor-container" style={{ height: '100%' }} />
    )
  }
)

VditorEditor.displayName = 'VditorEditor'

export default VditorEditor
