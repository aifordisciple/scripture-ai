'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { useBreakpoint } from '@/hooks/use-media-query'
import VditorEditor, { type VditorEditorHandle } from './VditorEditor'
import EditorToolbar from './EditorToolbar'
import { SermonEditorHeader } from './SermonEditorHeader'
import { useSermonEditor } from './SermonEditorContext'
import { FlowGuide } from './FlowGuide'
import { FlowSuggestions } from './FlowSuggestions'
import { FloatingToolbar } from './FloatingToolbar'
import { SlashCommandMenu, type SlashCommand } from './SlashCommandMenu'
import { updateSermonFlowStage } from '@/store/slices/sermonSlice'
import { useSlashCommands } from '@/hooks/use-slash-commands'

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
    setSermonFlowStage,
    setSermonAiSuggestions,
    locale,
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
  const [floatingToolbar, setFloatingToolbar] = useState<{ visible: boolean; x: number; y: number; selectedText: string }>({
    visible: false, x: 0, y: 0, selectedText: '',
  })

  // Slash commands
  const {
    visible: slashVisible,
    filter: slashFilter,
    selectedIndex: slashSelectedIndex,
    commands: slashCommands,
    handleKeyDown: handleSlashKeyDown,
    handleInput: handleSlashInput,
    selectCommand: selectSlashCommand,
    close: closeSlash,
    menuPosition: slashPosition,
  } = useSlashCommands()

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
      // Update flow stage based on content
      const flowUpdate = updateSermonFlowStage(md, md.length)
      setSermonFlowStage(flowUpdate.sermonFlowStage!)
      setSermonAiSuggestions(flowUpdate.sermonAiSuggestions!)
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
    // Update flow stage
    const flowUpdate = updateSermonFlowStage(content, content.length)
    setSermonFlowStage(flowUpdate.sermonFlowStage!)
    setSermonAiSuggestions(flowUpdate.sermonAiSuggestions!)
  }, [setCurrentSermon, setSermons, autoSave, sermonAutoSave, setSermonFlowStage, setSermonAiSuggestions])

  // Manual save handler for Cmd+S
  const handleSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    autoSave(markdownContent)
  }, [autoSave, markdownContent])

  // AI assist — now uses streaming inline completion
  const handleAIAssist = useCallback(async (action: string) => {
    const md = editorRef.current?.getValue() || markdownContent
    if (!md && action !== 'generate') return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/sermon/ai-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          selectedText: md.slice(-500), // Send last 500 chars as context
          verseRefs: currentSermon?.verseRefs,
          style: currentSermon?.style,
          locale: useBibleStore.getState().locale,
        }),
      })
      // Read the streaming response
      const reader = res.body?.getReader()
      if (!reader) return
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
      }
      if (result) {
        if (action === 'continue') {
          editorRef.current?.insertValue(result)
        } else {
          editorRef.current?.setValue(result)
        }
      }
    } catch (err) {
      console.error('[SermonEditor] AI assist failed:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [markdownContent, currentSermon?.title])

  // Handle floating toolbar action
  const handleFloatingAction = useCallback((action: string) => {
    if (!floatingToolbar.selectedText) return
    setIsGenerating(true)
    fetch('/api/sermon/ai-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        selectedText: floatingToolbar.selectedText,
        verseRefs: currentSermon?.verseRefs,
        style: currentSermon?.style,
        locale: useBibleStore.getState().locale,
      }),
    })
      .then(res => res.text())
      .then(result => {
        if (result) {
          editorRef.current?.insertValue(result)
        }
      })
      .catch(err => console.error('[SermonEditor] Floating action failed:', err))
      .finally(() => {
        setIsGenerating(false)
        setFloatingToolbar(prev => ({ ...prev, visible: false }))
      })
  }, [floatingToolbar.selectedText, currentSermon])

  // Handle slash command selection
  const handleSlashSelect = useCallback((command: SlashCommand) => {
    closeSlash()
    const action = command.action
    if (action === 'verse' || action === 'section' || action === 'template') {
      // These are handled by the toolbar — switch to the appropriate panel
      return
    }
    if (action === 'review') {
      useBibleStore.getState().setActiveSermonPanel('review')
      return
    }
    // AI actions
    handleAIAssist(action)
  }, [handleAIAssist, closeSlash])

  // Handle flow suggestion action
  const handleFlowAction = useCallback((action: string) => {
    handleAIAssist(action)
  }, [handleAIAssist])

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
      {/* Flow Guide progress bar */}
      <FlowGuide />

      {/* Header with title editing and status */}
      <SermonEditorHeader />

      <EditorToolbar
        editorRef={editorRef}
        onAIAssist={handleAIAssist}
        isGenerating={isGenerating}
      />

      {/* Flow Suggestions */}
      <FlowSuggestions onAction={handleFlowAction} />

      <div className="flex-1 min-h-0 relative">
        <VditorEditor
          ref={editorRef}
          content={markdownContent}
          onChange={handleContentChange}
          isDark={isDarkMode}
          onSave={handleSave}
        />

        {/* Floating Toolbar for selected text */}
        <FloatingToolbar
          position={{ x: floatingToolbar.x, y: floatingToolbar.y }}
          onAction={handleFloatingAction}
          visible={floatingToolbar.visible}
        />

        {/* Slash Command Menu */}
        <SlashCommandMenu
          visible={slashVisible}
          position={slashPosition}
          filter={slashFilter}
          onSelect={handleSlashSelect}
          onClose={closeSlash}
          selectedIndex={slashSelectedIndex}
          onSelectedIndexChange={() => {}}
        />
      </div>

      {/* Status Bar */}
      <div className={`border-t border-border dark:border-white/[0.06] flex items-center gap-4 text-[12px] text-muted-foreground dark:text-muted-foreground ${isMd ? 'px-5 py-1.5' : 'px-3 py-2 pb-safe'}`}
        style={{ fontFamily: "'SF Pro Text', system-ui, -apple-system, sans-serif", letterSpacing: '-0.12px' }}
      >
        <span>{charCount}{t('sermon.editorWords')}</span>
        <span>~{Math.max(1, Math.round(charCount / 300))}{t('sermon.editorMinutes')}</span>
        <span className="text-[10px] text-muted-foreground/60">⌘J {locale === 'en' ? 'AI' : 'AI续写'}</span>
      </div>
    </div>
  )
}
