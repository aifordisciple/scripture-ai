'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { useBreakpoint } from '@/hooks/use-media-query'
import VditorEditor, { type VditorEditorHandle } from './VditorEditor'
import { EditorToolbar } from './EditorToolbar'
import { SermonEditorHeader } from './SermonEditorHeader'
import { useSermonEditor } from './SermonEditorContext'
import { FlowGuide } from './FlowGuide'
import { FloatingToolbar } from './FloatingToolbar'
import { useSermonKeyboardShortcuts } from './KeyboardShortcutsPanel'
import { DiffPreview } from './DiffPreview'
import { FocusMode } from './FocusMode'
import CommandPalette from './CommandPalette'
import { AIDrawer } from './AIDrawer'
import { InlineWeakMarker } from './InlineWeakMarker'
import { type CommandItem } from '@/hooks/use-command-palette'
import { updateSermonFlowStage } from '@/store/slices/sermonSlice'
import { analyzeTone } from '@/lib/sermon-flow'
import { buildSermonContext, serializeContext } from '@/lib/sermon-context'
export function SermonEditor() {
  const { t } = useTranslation()
  const { isMd } = useBreakpoint()

  // Register global keyboard shortcuts
  useSermonKeyboardShortcuts()

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
    parseOutlineToSections,
    setToneMetrics,
    locale,
    sermonDualPane,
  } = useBibleStore()
  const { registerEditorHandle } = useSermonEditor()

  const editorRef = useRef<VditorEditorHandle>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
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
  const [diffPreview, setDiffPreview] = useState<{ visible: boolean; original: string; modified: string }>({
    visible: false, original: '', modified: '',
  })
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false)
  // Register editor handle with context so other panels can insert content
  useEffect(() => {
    registerEditorHandle(editorRef.current)
  })

  // Listen for custom events from VditorEditor
  useEffect(() => {
    const handleAIContinue = () => {
      handleAIAssist('continue')
    }
    const handleToggleAIPanel = () => {
      setIsAIDrawerOpen(prev => !prev)
    }
    const handleInspiration = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.action) {
        handleAIAssist(detail.action)
      }
    }
    const handleInsertContent = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.content) {
        editorRef.current?.insertValue(detail.content)
      }
    }
    window.addEventListener('sermon:ai-continue', handleAIContinue)
    window.addEventListener('sermon:toggle-ai-panel', handleToggleAIPanel)
    window.addEventListener('sermon-inspiration', handleInspiration)
    window.addEventListener('sermon:insert-content', handleInsertContent)

    // Cmd+J shortcut to toggle AI drawer
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        setIsAIDrawerOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      window.removeEventListener('sermon:ai-continue', handleAIContinue)
      window.removeEventListener('sermon:toggle-ai-panel', handleToggleAIPanel)
      window.removeEventListener('sermon-inspiration', handleInspiration)
      window.removeEventListener('sermon:insert-content', handleInsertContent)
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [])

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
      const flowUpdate = updateSermonFlowStage(md, md.length)
      setSermonFlowStage(flowUpdate.sermonFlowStage!)
      setSermonAiSuggestions(flowUpdate.sermonAiSuggestions!)
      if (md.includes('## ')) {
        parseOutlineToSections(md)
      }
      const tone = analyzeTone(md)
      setToneMetrics({ ...tone, timestamp: Date.now() })
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
    const flowUpdate = updateSermonFlowStage(content, content.length)
    setSermonFlowStage(flowUpdate.sermonFlowStage!)
    setSermonAiSuggestions(flowUpdate.sermonAiSuggestions!)
    if (content.includes('## ')) {
      parseOutlineToSections(content)
    }
  }, [setCurrentSermon, setSermons, autoSave, sermonAutoSave, setSermonFlowStage, setSermonAiSuggestions, parseOutlineToSections])

  // Manual save handler for Cmd+S
  const handleSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    autoSave(markdownContent)
  }, [autoSave, markdownContent])

  // AI assist — streaming inline completion
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
          selectedText: md.slice(-500),
          verseRefs: currentSermon?.verseRefs,
          style: currentSermon?.style,
          locale: useBibleStore.getState().locale,
          voiceProfile: useBibleStore.getState().voiceProfile,
        }),
      })
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
        const versionSource = action === 'continue' ? 'ai-generated'
          : action === 'expand' ? 'ai-expanded'
          : action === 'shrink' ? 'ai-adjusted'
          : action.startsWith('add-') ? 'ai-generated'
          : 'ai-generated'

        const isInsertAction = ['continue', 'add-example', 'add-application', 'add-transition', 'add-prayer'].includes(action)
        if (isInsertAction) {
          editorRef.current?.insertValue(result)
        } else {
          editorRef.current?.setValue(result)
        }

        const { outlineSections, addSectionVersion } = useBibleStore.getState()
        if (outlineSections.length > 0 && result.includes('## ')) {
          const fullContent = editorRef.current?.getValue() || result
          const lines = fullContent.split('\n')
          let currentSectionId: string | null = null
          let currentSectionContent: string[] = []
          const flushSection = () => {
            if (currentSectionId && currentSectionContent.length > 0) {
              const content = currentSectionContent.join('\n').trim()
              if (content) {
                addSectionVersion(currentSectionId, content, versionSource)
              }
            }
            currentSectionContent = []
          }
          for (const line of lines) {
            const match = line.match(/^##\s+(.+)/)
            if (match) {
              flushSection()
              const title = match[1].trim()
              const section = outlineSections.find(s => s.title === title)
              currentSectionId = section?.id || null
            } else if (currentSectionId) {
              currentSectionContent.push(line)
            }
          }
          flushSection()
        }
      }
    } catch (err) {
      console.error('[SermonEditor] AI assist failed:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [markdownContent, currentSermon?.verseRefs, currentSermon?.style])

  // Handle selection change from VditorEditor
  const handleSelectionChange = useCallback((selectedText: string, rect: DOMRect | null) => {
    if (selectedText && selectedText.length > 0 && rect) {
      const container = editorContainerRef.current
      if (container) {
        const containerRect = container.getBoundingClientRect()
        const x = rect.left - containerRect.left + rect.width / 2
        const y = rect.top - containerRect.top
        setFloatingToolbar({ visible: true, x, y, selectedText })
      }
    } else {
      setFloatingToolbar(prev => ({ ...prev, visible: false }))
    }
  }, [])


  // Handle floating toolbar action
  const handleFloatingAction = useCallback((action: string) => {
    if (!floatingToolbar.selectedText) return

    let aiAction = action
    let expandDegree: 'slight' | 'moderate' | 'extensive' | undefined
    if (action.startsWith('expand-')) {
      aiAction = 'expand'
      expandDegree = action.replace('expand-', '') as 'slight' | 'moderate' | 'extensive'
    } else if (action.startsWith('shrink-')) {
      aiAction = 'shrink'
      expandDegree = action.replace('shrink-', '') as 'slight' | 'moderate' | 'extensive'
    }

    const isModifyAction = ['polish', 'expand', 'shrink', 'deepen', 'simplify', 'rewrite'].includes(aiAction)

    const fullContent = editorRef.current?.getValue() || markdownContent
    const sermonCtx = buildSermonContext(fullContent, fullContent.length, {
      title: currentSermon?.title,
      verseRefs: currentSermon?.verseRefs,
      style: currentSermon?.style,
      flowStage: useBibleStore.getState().sermonFlowStage,
    })
    const sermonContextStr = serializeContext(sermonCtx)

    setIsGenerating(true)
    fetch('/api/sermon/ai-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: aiAction,
        selectedText: floatingToolbar.selectedText,
        verseRefs: currentSermon?.verseRefs,
        style: currentSermon?.style,
        locale: useBibleStore.getState().locale,
        sermonContext: sermonContextStr,
        expandDegree,
      }),
    })
      .then(res => res.text())
      .then(result => {
        if (result) {
          if (isModifyAction) {
            setDiffPreview({
              visible: true,
              original: floatingToolbar.selectedText,
              modified: result,
            })
          } else {
            editorRef.current?.insertValue(result)
          }
        }
      })
      .catch(err => console.error('[SermonEditor] Floating action failed:', err))
      .finally(() => {
        setIsGenerating(false)
        setFloatingToolbar(prev => ({ ...prev, visible: false }))
      })
  }, [floatingToolbar.selectedText, currentSermon, markdownContent])

  // Handle command palette command execution
  const handleCommandPaletteCommand = useCallback((command: CommandItem) => {
    const { action } = command

    // Format actions
    if (action.startsWith('format-')) {
      const vd = editorRef.current?.getVditor()
      if (!vd) return
      const formatType = action.replace('format-', '')
      const toolbarKeys: Record<string, string> = {
        bold: 'bold', italic: 'italic', h2: 'heading2', h3: 'heading3', list: 'list', quote: 'quote',
      }
      const key = toolbarKeys[formatType]
      if (key) {
        try { vd.toolbar?.handler?.(key) } catch {
          const syntax: Record<string, string> = {
            bold: '**text**', italic: '*text*', h2: '\n## ', h3: '\n### ', list: '\n- ', quote: '\n> ',
          }
          editorRef.current?.insertValue(syntax[formatType])
        }
      }
      return
    }

    // Navigation actions
    if (action === 'toggle-focus') {
      setIsFocusMode(prev => !prev)
      return
    }
    if (action === 'toggle-dualpane') {
      useBibleStore.getState().setSermonDualPane(!sermonDualPane)
      return
    }
    if (action === 'toggle-history') {
      useBibleStore.getState().setActiveSermonPanel('settings')
      return
    }

    // Flow actions
    if (action === 'flow-next') {
      const { sermonFlowStage } = useBibleStore.getState()
      const stages = ['verse-study', 'outline', 'draft', 'refine', 'review']
      const currentIdx = stages.indexOf(sermonFlowStage)
      if (currentIdx < stages.length - 1) {
        useBibleStore.getState().setSermonFlowStage(stages[currentIdx + 1] as typeof sermonFlowStage)
      }
      return
    }
    if (action === 'flow-prev') {
      const { sermonFlowStage } = useBibleStore.getState()
      const stages = ['verse-study', 'outline', 'draft', 'refine', 'review']
      const currentIdx = stages.indexOf(sermonFlowStage)
      if (currentIdx > 0) {
        useBibleStore.getState().setSermonFlowStage(stages[currentIdx - 1] as typeof sermonFlowStage)
      }
      return
    }

    // Panel actions
    if (action === 'review') {
      useBibleStore.getState().setActiveSermonPanel('review')
      return
    }
    if (action === 'snippet') {
      useBibleStore.getState().setActiveSermonPanel('settings')
      return
    }
    if (action === 'insert-verse') {
      useBibleStore.getState().setActiveSermonPanel('verse')
      return
    }
    if (action === 'section' || action === 'template') {
      useBibleStore.getState().setActiveSermonPanel('template')
      return
    }

    // Context injection actions (former @-commands)
    if (action.startsWith('inject-')) {
      // These are handled by the sermon context system — just trigger a relevant AI action
      const injectType = action.replace('inject-', '')
      if (injectType === 'commentary') {
        handleAIAssist('deepen')
      } else if (injectType === 'outline') {
        useBibleStore.getState().setActiveSermonPanel('outline')
      } else if (injectType === 'sermon') {
        useBibleStore.getState().setActiveSermonPanel('list')
      }
      return
    }

    // AI actions
    handleAIAssist(action)
  }, [sermonDualPane, handleAIAssist])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  if (!currentSermon) return null

  const charCount = markdownContent.length

  // Focus mode overlay
  if (isFocusMode) {
    return (
      <>
        <FocusMode
          content={markdownContent}
          onContentChange={handleContentChange}
          onAIAssist={handleAIAssist}
          isGenerating={isGenerating}
          onExit={() => setIsFocusMode(false)}
        />
        <CommandPalette onCommand={handleCommandPaletteCommand} />
      </>
    )
  }

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Flow Guide progress bar */}
        <FlowGuide />

        {/* Header with title editing and status */}
        <SermonEditorHeader />

        <EditorToolbar
          isGenerating={isGenerating}
          onAIAssist={handleAIAssist}
          onFormat={(type: 'bold' | 'italic' | 'h2' | 'h3' | 'list' | 'quote') => {
            const vd = editorRef.current?.getVditor()
            if (!vd) return
            const toolbarKeys: Record<string, string> = {
              bold: 'bold', italic: 'italic', h2: 'heading2', h3: 'heading3', list: 'list', quote: 'quote',
            }
            const key = toolbarKeys[type]
            if (key) {
              try { (vd as any).toolbar?.handler?.(key) } catch {
                const syntax: Record<string, string> = {
                  bold: '**text**', italic: '*text*', h2: '\n## ', h3: '\n### ', list: '\n- ', quote: '\n> ',
                }
                editorRef.current?.insertValue(syntax[type])
              }
            }
          }}
          onFocusMode={() => setIsFocusMode(true)}
          isFocusMode={isFocusMode}
          onInsertVerse={(markdown) => editorRef.current?.insertValue(markdown)}
        />

        <div ref={editorContainerRef} className="flex-1 min-h-0 relative">
          <VditorEditor
            ref={editorRef}
            content={markdownContent}
            onChange={handleContentChange}
            isDark={isDarkMode}
            onSave={handleSave}
            onSelectionChange={handleSelectionChange}
          />

          {/* Floating Toolbar for selected text */}
          <FloatingToolbar
            position={{ x: floatingToolbar.x, y: floatingToolbar.y }}
            onAction={handleFloatingAction}
            visible={floatingToolbar.visible}
          />

          {/* Diff Preview for AI modification actions */}
          <DiffPreview
            original={diffPreview.original}
            modified={diffPreview.modified}
            visible={diffPreview.visible}
            onAccept={(text) => {
              editorRef.current?.insertValue(text)
              setDiffPreview({ visible: false, original: '', modified: '' })
            }}
            onReject={() => {
              setDiffPreview({ visible: false, original: '', modified: '' })
            }}
            onPartialAccept={(text) => {
              editorRef.current?.insertValue(text)
              setDiffPreview({ visible: false, original: '', modified: '' })
            }}
          />

          {/* Inline weak paragraph markers — expand chips for thin paragraphs */}
          <InlineWeakMarker
            editorContainerRef={editorContainerRef}
            content={markdownContent}
            onExpand={(text, action) => handleAIAssist(action)}
          />
        </div>

        {/* Status Bar */}
        <div className={`border-t border-border dark:border-white/[0.06] flex items-center gap-4 text-[12px] text-muted-foreground dark:text-muted-foreground ${isMd ? 'px-5 py-1.5' : 'px-3 py-2 pb-safe'}`}
          style={{ fontFamily: "'SF Pro Text', system-ui, -apple-system, sans-serif", letterSpacing: '-0.12px' }}
        >
          <span>{charCount}{t('sermon.editorWords')}</span>
          <span>~{Math.max(1, Math.round(charCount / 300))}{t('sermon.editorMinutes')}</span>
          <span className="text-[10px] text-muted-foreground/60">⌘K {locale === 'en' ? 'Commands' : '命令'}</span>
          <span className="text-[10px] text-muted-foreground/60">⌘J {locale === 'en' ? 'AI' : 'AI续写'}</span>
        </div>
      </div>

      {/* Command Palette — global overlay, triggered by Cmd+K */}
      <CommandPalette onCommand={handleCommandPaletteCommand} />

      {/* AI Chat Drawer — triggered by Cmd+J or AI button */}
      <AIDrawer open={isAIDrawerOpen} onClose={() => setIsAIDrawerOpen(false)} />
    </>
  )
}