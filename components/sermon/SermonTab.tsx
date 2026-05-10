'use client'

import { useState, useCallback } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { useBreakpoint } from '@/hooks/use-media-query'
import { SermonSidebar } from './SermonSidebar'
import { SermonEditor } from './SermonEditor'
import { SermonSettingsPanel } from './SermonSettingsPanel'
import { OutlinePanel } from './OutlinePanel'
import { SermonVersePanel } from './SermonVersePanel'
import { SermonReviewPanel } from './SermonReviewPanel'
import { SermonDualPane } from './SermonDualPane'
import { Button } from '@/components/ui/button'
import { PanelLeftOpen, PanelLeftClose, Bot, Settings, List, BookOpen, PenLine, ShieldCheck } from 'lucide-react'

/**
 * SermonTab — Main sermon writing layout
 *
 * Refactored: Removed fixed right AI panel column.
 * Editor now takes full width. AI interaction via:
 * - Cmd+K: Command Palette (inline AI actions)
 * - Cmd+J: AI Drawer (chat)
 * - Floating toolbar on selection
 * - Ghost text auto-trigger
 */
export function SermonTab() {
  const { t } = useTranslation()
  const { isMd } = useBreakpoint()
  const {
    activeSermonPanel,
    setActiveSermonPanel,
    currentSermon,
    sermonDualPane,
  } = useBibleStore()

  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  if (!currentSermon) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <PenLine className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm font-medium">{t('sermon.selectOrCreate')}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{t('sermon.selectOrCreateDesc')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex min-h-0 h-full">
      {/* Left Sidebar — sermon list, folders */}
      {sidebarOpen && (
        <div className={`${isMd ? 'w-[240px]' : 'w-[200px]'} border-r border-border dark:border-white/[0.06] flex-shrink-0 overflow-hidden`}>
          <SermonSidebar />
        </div>
      )}

      {/* Main Editor Area — full width */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Toolbar with sidebar toggle and quick panel buttons */}
        <div className="flex items-center gap-1 px-2 py-1 border-b border-border dark:border-white/[0.06] bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-7 w-7 p-0"
          >
            {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
          </Button>

          <div className="flex-1" />

          {/* Quick panel access buttons */}
          <div className="flex items-center gap-0.5">
            <Button
              variant={activeSermonPanel === 'outline' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSermonPanel(activeSermonPanel === 'outline' ? 'list' : 'outline')}
              className="h-7 px-2 text-[10px] gap-1"
            >
              <List className="w-3 h-3" />
              {isMd && (t('sermon.outline') || '大纲')}
            </Button>
            <Button
              variant={activeSermonPanel === 'verse' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSermonPanel(activeSermonPanel === 'verse' ? 'list' : 'verse')}
              className="h-7 px-2 text-[10px] gap-1"
            >
              <BookOpen className="w-3 h-3" />
              {isMd && (t('sermon.verse') || '经文')}
            </Button>
            <Button
              variant={activeSermonPanel === 'review' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSermonPanel(activeSermonPanel === 'review' ? 'list' : 'review')}
              className="h-7 px-2 text-[10px] gap-1"
            >
              <ShieldCheck className="w-3 h-3" />
              {isMd && (t('sermon.review') || '审查')}
            </Button>
            <Button
              variant={activeSermonPanel === 'settings' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSermonPanel(activeSermonPanel === 'settings' ? 'list' : 'settings')}
              className="h-7 px-2 text-[10px] gap-1"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Content area — either dual pane or single editor */}
        <div className="flex-1 min-h-0 flex">
          {sermonDualPane ? (
            <SermonDualPane />
          ) : (
            <SermonEditor />
          )}

          {/* Side panels — outline, verse, review, settings */}
          {activeSermonPanel === 'outline' && (
            <div className="w-[280px] border-l border-border dark:border-white/[0.06] flex-shrink-0 overflow-y-auto">
              <OutlinePanel />
            </div>
          )}
          {activeSermonPanel === 'verse' && (
            <div className="w-[280px] border-l border-border dark:border-white/[0.06] flex-shrink-0 overflow-y-auto">
              <SermonVersePanel />
            </div>
          )}
          {activeSermonPanel === 'review' && (
            <div className="w-[320px] border-l border-border dark:border-white/[0.06] flex-shrink-0 overflow-y-auto">
              <SermonReviewPanel />
            </div>
          )}
          {activeSermonPanel === 'settings' && (
            <div className="w-[300px] border-l border-border dark:border-white/[0.06] flex-shrink-0 overflow-y-auto">
              <SermonSettingsPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
