'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { SermonEditorHeader } from './SermonEditorHeader'
import CodeMirrorEditor from './CodeMirrorEditor'
import { isTiptapJson } from '@/lib/sermon-markdown'
import { tiptapToMarkdown } from '@/lib/tiptap-to-markdown'

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
      setCurrentSermon({ ...sermon, content })
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => autoSave(content), 1500)
  }, [setCurrentSermon, autoSave])

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
        />
      </div>

      {/* Status Bar */}
      <div className="border-t border-border px-4 py-1 flex items-center gap-4 text-[10px] text-muted-foreground">
        <span>{charCount}{t('sermon.editorWords')}</span>
        <span>~{Math.max(1, Math.round(charCount / 300))}{t('sermon.editorMinutes')}</span>
      </div>
    </div>
  )
}