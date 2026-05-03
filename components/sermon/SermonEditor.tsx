'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { SermonEditorHeader } from './SermonEditorHeader'
import CodeMirrorEditor from './CodeMirrorEditor'
import { isTiptapJson } from '@/lib/sermon-markdown'
import { tiptapToMarkdown } from '@/lib/tiptap-to-markdown'
import { DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT } from './extensions/theme'

/** Convert content to Markdown: if it's Tiptap JSON, convert; otherwise return as-is */
function ensureMarkdown(raw: string): string {
  if (!raw || raw.trim() === '' || raw.trim() === '{}') return ''
  if (isTiptapJson(raw)) return tiptapToMarkdown(raw)
  return raw
}

export function SermonEditor() {
  const { t } = useTranslation()
  const {
    currentSermon,
    setCurrentSermon,
    setIsSermonSaving,
    setSermons,
    sermons,
    isDarkMode,
  } = useBibleStore()

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sermonsRef = useRef(sermons)
  sermonsRef.current = sermons
  const currentSermonRef = useRef(currentSermon)
  currentSermonRef.current = currentSermon

  const [markdownContent, setMarkdownContent] = useState('')
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [lineHeight, setLineHeight] = useState(DEFAULT_LINE_HEIGHT)

  // Sync content when switching sermons
  useEffect(() => {
    if (currentSermon) {
      const md = ensureMarkdown(currentSermon.content)
      setMarkdownContent(md)
    } else {
      setMarkdownContent('')
    }
  }, [currentSermon?.id])

  // Auto-save - uses refs to avoid stale closure
  const autoSave = useCallback(async (content: string) => {
    const sermon = currentSermonRef.current
    if (!sermon) return
    const wordCount = content.length

    setIsSermonSaving(true)
    try {
      const res = await fetch('/api/sermon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sermon.id,
          content,
          wordCount,
          title: sermon.title,
          tags: sermon.tags,
          style: sermon.style,
          status: sermon.status,
        }),
      })
      const data = await res.json()
      const currentSermons = sermonsRef.current
      setSermons(currentSermons.map(s => s.id === sermon.id ? { ...s, wordCount, updatedAt: data.data?.updatedAt } : s))
    } catch (error) {
      console.error('[SermonEditor] Auto-save failed:', error)
    } finally {
      setIsSermonSaving(false)
    }
  }, [setIsSermonSaving, setSermons])

  // Handle content change from CodeMirror
  const handleContentChange = useCallback((content: string) => {
    setMarkdownContent(content)
    const sermon = currentSermonRef.current
    if (sermon && sermon.content !== content) {
      const updated = { ...sermon, content }
      setCurrentSermon(updated)
      // Sync content to sermons list so switching sermons doesn't lose edits
      setSermons(sermonsRef.current.map(s => s.id === sermon.id ? updated : s))
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => autoSave(content), 1500)
  }, [setCurrentSermon, setSermons, autoSave])

  // Manual save handler for Cmd+S
  const handleSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    autoSave(markdownContent)
  }, [autoSave, markdownContent])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  if (!currentSermon) return null

  const charCount = markdownContent.length

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <SermonEditorHeader />

      {/* CodeMirror Editor */}
      <div className="flex-1 min-h-0">
        <CodeMirrorEditor
          content={markdownContent}
          onChange={handleContentChange}
          isDark={isDarkMode}
          onSave={handleSave}
          fontSize={fontSize}
          lineHeight={lineHeight}
        />
      </div>

      {/* Status Bar */}
      <div className="border-t border-border px-4 py-1 flex items-center gap-4 text-[10px] text-muted-foreground">
        <span>{charCount}{t('sermon.editorWords')}</span>
        <span>~{Math.max(1, Math.round(charCount / 300))}{t('sermon.editorMinutes')}</span>
        <div className="flex-1" />
        <button
          onClick={() => setFontSize(s => Math.max(12, s - 1))}
          className="px-1 hover:text-foreground transition-colors"
          title="减小字号"
        >A-</button>
        <span className="text-[10px]">{fontSize}px</span>
        <button
          onClick={() => setFontSize(s => Math.min(24, s + 1))}
          className="px-1 hover:text-foreground transition-colors"
          title="增大字号"
        >A+</button>
        <span className="mx-1 text-border">|</span>
        <button
          onClick={() => setLineHeight(h => Math.round(Math.max(1.2, h - 0.2) * 10) / 10)}
          className="px-1 hover:text-foreground transition-colors"
          title="减小行距"
        >≡-</button>
        <span className="text-[10px]">{lineHeight.toFixed(1)}</span>
        <button
          onClick={() => setLineHeight(h => Math.round(Math.min(3.5, h + 0.2) * 10) / 10)}
          className="px-1 hover:text-foreground transition-colors"
          title="增大行距"
        >≡+</button>
      </div>
    </div>
  )
}