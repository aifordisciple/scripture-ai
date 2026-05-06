'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { useBreakpoint } from '@/hooks/use-media-query'
import VditorEditor, { type VditorEditorHandle } from './VditorEditor'
import EditorToolbar from './EditorToolbar'
import { SermonEditorHeader } from './SermonEditorHeader'
import { useSermonEditor } from './SermonEditorContext'

export function SermonEditor() {
  const { t } = useTranslation()
  const { isMd } = useBreakpoint()
  const {
    currentSermon,
    setCurrentSermon,
    setIsSermonSaving,
    setSermons,
    sermons,
    isDarkMode,
    sermonAutoSave,
  } = useBibleStore()
  const { registerEditorHandle } = useSermonEditor()

  const editorRef = useRef<VditorEditorHandle>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)
  const sermonsRef = useRef(sermons)
  sermonsRef.current = sermons
  const currentSermonRef = useRef(currentSermon)
  currentSermonRef.current = currentSermon
  const isEditorSourceRef = useRef(false)

  const [markdownContent, setMarkdownContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Register editor handle with context so SermonAIPanel/SermonVersePanel can insert content
  useEffect(() => {
    registerEditorHandle(editorRef.current)
  })

  // Sync content when switching sermons or when content changes externally
  useEffect(() => {
    if (currentSermon) {
      if (isEditorSourceRef.current) {
        isEditorSourceRef.current = false
        return
      }
      const md = currentSermon.content || ''
      if (md !== markdownContent) {
        setMarkdownContent(md)
      }
    } else {
      setMarkdownContent('')
    }
  }, [currentSermon?.id, currentSermon?.content])

  // Auto-save
  const autoSave = useCallback(async (content: string) => {
    if (savingRef.current) return
    const sermon = currentSermonRef.current
    if (!sermon) return
    savingRef.current = true
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
      savingRef.current = false
      setIsSermonSaving(false)
    }
  }, [setIsSermonSaving, setSermons])

  // Handle content change from Vditor
  const handleContentChange = useCallback((content: string) => {
    setMarkdownContent(content)
    isEditorSourceRef.current = true
    const sermon = currentSermonRef.current
    if (sermon && sermon.content !== content) {
      const updated = { ...sermon, content }
      setCurrentSermon(updated)
      setSermons(sermonsRef.current.map(s => s.id === sermon.id ? updated : s))
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (sermonAutoSave) {
      saveTimerRef.current = setTimeout(() => autoSave(content), 1500)
    }
  }, [setCurrentSermon, setSermons, autoSave, sermonAutoSave])

  // Manual save handler for Cmd+S
  const handleSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    autoSave(markdownContent)
  }, [autoSave, markdownContent])

  // AI assist
  const handleAIAssist = useCallback(async (action: string) => {
    const md = editorRef.current?.getValue() || markdownContent
    if (!md && action !== 'generate') return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/chat/sermon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, content: md, title: currentSermon?.title }),
      })
      const data = await res.json()
      if (data.content) {
        if (action === 'continue') {
          editorRef.current?.insertValue(data.content)
        } else {
          editorRef.current?.setValue(data.content)
        }
      }
    } catch (err) {
      console.error('[SermonEditor] AI assist failed:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [markdownContent, currentSermon?.title])

  // Verse picker trigger
  const handleOpenVersePicker = useCallback(() => {
    const btn = document.querySelector('[data-verse-picker-trigger]') as HTMLButtonElement
    btn?.click()
  }, [])

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
      {/* Header with title editing and status */}
      <SermonEditorHeader />

      <EditorToolbar
        editorRef={editorRef}
        onOpenVersePicker={handleOpenVersePicker}
        onAIAssist={handleAIAssist}
        isGenerating={isGenerating}
        onInsertVerse={(verseMarkdown: string) => editorRef.current?.insertValue(verseMarkdown)}
      />
      <div className="flex-1 min-h-0">
        <VditorEditor
          ref={editorRef}
          content={markdownContent}
          onChange={handleContentChange}
          isDark={isDarkMode}
          onSave={handleSave}
        />
      </div>

      {/* Status Bar */}
      <div className={`border-t border-border dark:border-white/[0.06] flex items-center gap-4 text-[12px] text-muted-foreground dark:text-muted-foreground ${isMd ? 'px-5 py-1.5' : 'px-3 py-2 pb-safe'}`}
        style={{ fontFamily: "'SF Pro Text', system-ui, -apple-system, sans-serif", letterSpacing: '-0.12px' }}
      >
        <span>{charCount}{t('sermon.editorWords')}</span>
        <span>~{Math.max(1, Math.round(charCount / 300))}{t('sermon.editorMinutes')}</span>
      </div>
    </div>
  )
}
