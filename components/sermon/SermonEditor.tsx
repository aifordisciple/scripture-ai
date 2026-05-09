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
import { FlowSuggestions } from './FlowSuggestions'
import { FloatingToolbar } from './FloatingToolbar'
import { GhostTextToolbar } from './GhostTextToolbar'
import { useSermonKeyboardShortcuts } from './KeyboardShortcutsPanel'
import { AtCommandMenu } from './AtCommandMenu'
import { useAtCommand } from '@/hooks/use-at-command'
import type { GhostTextType } from '@/hooks/use-inline-ai'
import { SlashCommandMenu, type SlashCommand } from './SlashCommandMenu'
import { DiffPreview } from './DiffPreview'
import { FocusMode } from './FocusMode'
import { GhostTextOverlay } from './GhostTextOverlay'
import { updateSermonFlowStage } from '@/store/slices/sermonSlice'
import { analyzeTone } from '@/lib/sermon-flow'
import { useSlashCommands } from '@/hooks/use-slash-commands'
import { buildSermonContext, serializeContext } from '@/lib/sermon-context'

export function SermonEditor() {
  const { t } = useTranslation()
  const { isMd } = useBreakpoint()

  // Register global keyboard shortcuts
  useSermonKeyboardShortcuts()
  const {
    atCommandState,
    triggerAtCommand,
    updateFilter,
    selectCommand,
    closeAtCommand,
    setSelectedIndex: setAtSelectedIndex,
    consumeInjectedContext,
    resolveContexts,
    hasInjectedContext,
  } = useAtCommand()
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
  const [ghostTextType, setGhostTextType] = useState<GhostTextType>('continue')
  const [isFocusMode, setIsFocusMode] = useState(false)

  // Slash commands — pass onSelectCommand so keyboard selection works
  const {
    visible: slashVisible,
    filter: slashFilter,
    selectedIndex: slashSelectedIndex,
    setSelectedIndex: setSlashSelectedIndex,
    commands: slashCommands,
    handleKeyDown: handleSlashKeyDown,
    handleInput: handleSlashInput,
    selectCommand: selectSlashCommand,
    close: closeSlash,
    menuPosition: slashPosition,
    setMenuPosition: setSlashPosition,
  } = useSlashCommands({
    onSelectCommand: (cmd: SlashCommand) => {
      const action = cmd.action
      if (action === 'verse' || action === 'section' || action === 'template') {
        return
      }
      if (action === 'review') {
        useBibleStore.getState().setActiveSermonPanel('review')
        return
      }
      if (action === 'snippet') {
        useBibleStore.getState().setActiveSermonPanel('settings')
        return
      }
      handleAIAssist(action)
    },
  })

  // Register editor handle with context so SermonAIPanel/SermonVersePanel can insert content
  useEffect(() => {
    registerEditorHandle(editorRef.current)
  })

  // Listen for custom events from VditorEditor
  useEffect(() => {
    const handleAIContinue = () => {
      handleAIAssist('continue')
    }
    const handleToggleAIPanel = () => {
      const { activeSermonPanel, setActiveSermonPanel } = useBibleStore.getState()
      setActiveSermonPanel(activeSermonPanel === 'ai' ? 'list' : 'ai')
    }
    const handleInspiration = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.action) {
        handleAIAssist(detail.action)
      }
    }
    window.addEventListener('sermon:ai-continue', handleAIContinue)
    window.addEventListener('sermon:toggle-ai-panel', handleToggleAIPanel)
    window.addEventListener('sermon-inspiration', handleInspiration)
    return () => {
      window.removeEventListener('sermon:ai-continue', handleAIContinue)
      window.removeEventListener('sermon:toggle-ai-panel', handleToggleAIPanel)
      window.removeEventListener('sermon-inspiration', handleInspiration)
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
      // Update flow stage based on content
      const flowUpdate = updateSermonFlowStage(md, md.length)
      setSermonFlowStage(flowUpdate.sermonFlowStage!)
      setSermonAiSuggestions(flowUpdate.sermonAiSuggestions!)
      // Parse outline sections when content has headings
      if (md.includes('## ')) {
        parseOutlineToSections(md)
      }
      // [P2.3] Analyze tone metrics
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
    // Update flow stage
    const flowUpdate = updateSermonFlowStage(content, content.length)
    setSermonFlowStage(flowUpdate.sermonFlowStage!)
    setSermonAiSuggestions(flowUpdate.sermonAiSuggestions!)
    // Parse outline sections when content has headings
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
      // Consume any @-command injected context
      const injectedContexts = consumeInjectedContext()
      const resolvedContext = injectedContexts.length > 0
        ? await resolveContexts(injectedContexts)
        : undefined

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
          injectedContext: resolvedContext,
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
        // Determine version source based on action
        const versionSource = action === 'continue' ? 'ai-generated'
          : action === 'expand' ? 'ai-expanded'
          : action === 'shrink' ? 'ai-adjusted'
          : action.startsWith('add-') ? 'ai-generated'
          : 'ai-generated'

        // Insert-type actions append; replace-type actions set full content
        const isInsertAction = ['continue', 'add-example', 'add-application', 'add-transition', 'add-prayer'].includes(action)
        if (isInsertAction) {
          editorRef.current?.insertValue(result)
        } else {
          editorRef.current?.setValue(result)
        }

        // Create version snapshots for affected outline sections
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
  }, [markdownContent, currentSermon?.verseRefs, currentSermon?.style, consumeInjectedContext, resolveContexts])

  // Handle selection change from VditorEditor
  const handleSelectionChange = useCallback((selectedText: string, rect: DOMRect | null) => {
    if (selectedText && selectedText.length > 0 && rect) {
      // Convert absolute rect to relative position within the editor container
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

  // Handle cursor activity from VditorEditor (for slash commands)
  const handleCursorActivity = useCallback((textBeforeCursor: string, cursorOffset: number) => {
    // Get full text from editor and pass to slash command handler
    const fullText = editorRef.current?.getValue() || ''
    handleSlashInput(fullText, cursorOffset)

    // Update slash menu position based on cursor
    if (slashVisible) {
      const container = editorContainerRef.current
      if (container) {
        // Approximate position: use a fixed offset from top-left since we can't get exact cursor coords
        // from Vditor easily. The menu will appear near the top of the editor.
        const containerRect = container.getBoundingClientRect()
        // Try to get cursor coordinates from Vditor's CodeMirror
        const vd = editorRef.current?.getVditor()
        const cm = (vd as any)?.vditor?.sv?.codeMirror || (vd as any)?.vditor?.ir?.codeMirror
        if (cm) {
          try {
            const cursorCoords = cm.cursorCoords?.(cm.getCursor(), 'local')
            if (cursorCoords) {
              setSlashPosition({ x: cursorCoords.left, y: cursorCoords.top + 20 })
            }
          } catch {}
        }
      }
    }
  }, [handleSlashInput, slashVisible, setSlashPosition])

  // Handle floating toolbar action
  const handleFloatingAction = useCallback((action: string) => {
    if (!floatingToolbar.selectedText) return

    // Parse sub-actions like "expand-slight" → action="expand", degree="slight"
    let aiAction = action
    let expandDegree: 'slight' | 'moderate' | 'extensive' | undefined
    if (action.startsWith('expand-')) {
      aiAction = 'expand'
      expandDegree = action.replace('expand-', '') as 'slight' | 'moderate' | 'extensive'
    } else if (action.startsWith('shrink-')) {
      aiAction = 'shrink'
      expandDegree = action.replace('shrink-', '') as 'slight' | 'moderate' | 'extensive'
    }

    // Actions that modify selected text (show diff preview)
    const isModifyAction = ['polish', 'expand', 'shrink'].includes(aiAction)
    // Actions that insert new content (no diff needed)
    const isInsertAction = ['insert-verse', 'add-example', 'cross-ref'].includes(aiAction)

    // Build sermon context for full-text awareness
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
            // Show diff preview for modification actions
            setDiffPreview({
              visible: true,
              original: floatingToolbar.selectedText,
              modified: result,
            })
          } else {
            // Insert directly for additive actions
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

  // Handle slash command selection (from click events)
  const handleSlashSelect = useCallback((command: SlashCommand) => {
    closeSlash()
    const action = command.action
    if (action === 'verse' || action === 'section' || action === 'template') {
      return
    }
    if (action === 'review') {
      useBibleStore.getState().setActiveSermonPanel('review')
      return
    }
    handleAIAssist(action)
  }, [handleAIAssist, closeSlash])

  // Handle flow suggestion action
  const handleFlowAction = useCallback((action: string) => {
    handleAIAssist(action)
  }, [handleAIAssist])

  // Global keyboard handler for slash command and @-command navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (slashVisible) {
        const handled = handleSlashKeyDown(e)
        if (handled) return
      }
      // @-command menu keyboard navigation
      if (atCommandState.visible) {
        if (e.key === 'Escape') {
          e.preventDefault()
          closeAtCommand()
          return
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          // Calculate total items (commands + scripture results if visible)
          const totalItems = 4 // AT_COMMANDS.length
          const delta = e.key === 'ArrowDown' ? 1 : -1
          setAtSelectedIndex(Math.max(0, Math.min(totalItems - 1, atCommandState.selectedIndex + delta)))
          return
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          // Select current item — handled by AtCommandMenu click
          return
        }
      }
    }

    // @-command detection: listen for @ character input in editor
    const handleInputEvent = (e: InputEvent) => {
      if (e.data === '@' && !slashVisible) {
        // Get cursor position for menu placement
        const container = editorContainerRef.current
        if (container) {
          const vd = editorRef.current?.getVditor()
          const cm = (vd as any)?.vditor?.sv?.codeMirror || (vd as any)?.vditor?.ir?.codeMirror
          if (cm) {
            try {
              const cursorCoords = cm.cursorCoords?.(cm.getCursor(), 'local')
              if (cursorCoords) {
                triggerAtCommand({ x: cursorCoords.left, y: cursorCoords.top + 20 })
              }
            } catch {
              // Fallback position
              triggerAtCommand({ x: 20, y: 100 })
            }
          } else {
            triggerAtCommand({ x: 20, y: 100 })
          }
        }
      }
      // Update @-command filter as user types after @
      if (atCommandState.visible) {
        const fullText = editorRef.current?.getValue() || ''
        // Find the @ character and extract filter text after it
        const atIndex = fullText.lastIndexOf('@')
        if (atIndex !== -1) {
          const cursorPos = fullText.length // approximate
          const filterText = fullText.slice(atIndex + 1, cursorPos)
          updateFilter(filterText)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    // Listen for input events on the editor container
    const container = editorContainerRef.current
    if (container) {
      container.addEventListener('input', handleInputEvent as EventListener)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (container) {
        container.removeEventListener('input', handleInputEvent as EventListener)
      }
    }
  }, [slashVisible, handleSlashKeyDown, atCommandState.visible, atCommandState.selectedIndex, closeAtCommand, setAtSelectedIndex, triggerAtCommand, updateFilter])

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
      <FocusMode
        content={markdownContent}
        onContentChange={handleContentChange}
        onAIAssist={handleAIAssist}
        isGenerating={isGenerating}
        onExit={() => setIsFocusMode(false)}
      />
    )
  }

  return (
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
          // Use Vditor's built-in toolbar API for formatting
          const toolbarKeys: Record<string, string> = {
            bold: 'bold',
            italic: 'italic',
            h2: 'heading2',
            h3: 'heading3',
            list: 'list',
            quote: 'quote',
          }
          const key = toolbarKeys[type]
          if (key) {
            try {
              vd.toolbar?.handler?.(key)
            } catch {
              // Fallback: insert markdown syntax
              const syntax: Record<string, string> = {
                bold: '**text**',
                italic: '*text*',
                h2: '\n## ',
                h3: '\n### ',
                list: '\n- ',
                quote: '\n> ',
              }
              editorRef.current?.insertValue(syntax[type])
            }
          }
        }}
        onFocusMode={() => setIsFocusMode(true)}
        isFocusMode={isFocusMode}
      />

      {/* Flow Suggestions */}
      <FlowSuggestions onAction={handleFlowAction} />

      {/* Ghost Text Type Selector */}
      <GhostTextToolbar
        ghostTextType={ghostTextType}
        isGenerating={isGenerating}
        onTriggerType={(type) => {
          setGhostTextType(type)
          handleAIAssist(type === 'continue' ? 'continue' : type === 'illustration' ? 'add-example' : type === 'application' ? 'add-application' : type === 'transition' ? 'add-transition' : 'add-prayer')
        }}
      />

      <div ref={editorContainerRef} className="flex-1 min-h-0 relative">
        <VditorEditor
          ref={editorRef}
          content={markdownContent}
          onChange={handleContentChange}
          isDark={isDarkMode}
          onSave={handleSave}
          onSelectionChange={handleSelectionChange}
          onCursorActivity={handleCursorActivity}
        />

        {/* Ghost Text Overlay */}
        <GhostTextOverlay
          editorContainerRef={editorContainerRef}
          onAccept={() => {
            const { sermonGhostText } = useBibleStore.getState()
            if (sermonGhostText) {
              editorRef.current?.insertValue(sermonGhostText)
            }
            useBibleStore.getState().setSermonGhostText('')
            useBibleStore.getState().setSermonGhostTextVisible(false)
          }}
          onReject={() => {
            useBibleStore.getState().setSermonGhostText('')
            useBibleStore.getState().setSermonGhostTextVisible(false)
          }}
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
          onSelectedIndexChange={setSlashSelectedIndex}
        />

        {/* Diff Preview for AI modification actions */}
        <DiffPreview
          original={diffPreview.original}
          modified={diffPreview.modified}
          visible={diffPreview.visible}
          onAccept={(text) => {
            // Replace selected text with accepted modification
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
      </div>

      {/* Status Bar */}
      <div className={`border-t border-border dark:border-white/[0.06] flex items-center gap-4 text-[12px] text-muted-foreground dark:text-muted-foreground ${isMd ? 'px-5 py-1.5' : 'px-3 py-2 pb-safe'}`}
        style={{ fontFamily: "'SF Pro Text', system-ui, -apple-system, sans-serif", letterSpacing: '-0.12px' }}
      >
        <span>{charCount}{t('sermon.editorWords')}</span>
        <span>~{Math.max(1, Math.round(charCount / 300))}{t('sermon.editorMinutes')}</span>
        <span className="text-[10px] text-muted-foreground/60">⌘J {locale === 'en' ? 'AI' : 'AI续写'}</span>
        {hasInjectedContext && (
          <span className="text-[10px] text-primary/70">@ {locale === 'en' ? 'context ready' : '上下文已注入'}</span>
        )}
      </div>
    </div>
  )
}