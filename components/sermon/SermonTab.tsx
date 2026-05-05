'use client'

import { useEffect } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useBreakpoint } from '@/hooks/use-media-query'
import { SermonSidebar } from './SermonSidebar'
import { SermonListPanel } from './SermonListPanel'
import { SermonEditor } from './SermonEditor'
import { SermonEmptyState } from './SermonEmptyState'
import { SermonAIPanel } from './SermonAIPanel'
import { SermonVersePanel } from './SermonVersePanel'
import { SermonTemplatePanel } from './SermonTemplatePanel'
import { SermonReviewPanel } from './SermonReviewPanel'
import { SermonSettingsPanel } from './SermonSettingsPanel'
import { SermonMobileBottomBar } from './SermonMobileBottomBar'
import { SermonEditorProvider } from './SermonEditorContext'
import { SermonErrorBoundary } from './SermonErrorBoundary'

export function SermonTab() {
  const { t } = useTranslation()
  const { isMd } = useBreakpoint()
  const {
    currentSermon,
    activeSermonPanel,
    sermonMobileView,
    setSermonMobileView,
    sermonsLoading,
    setSermonsLoading,
    setSermons,
    setSermonFolders,
    isDarkMode,
  } = useBibleStore()

  // Load sermons and folders on mount
  useEffect(() => {
    const loadData = async () => {
      setSermonsLoading(true)
      try {
        const [sermonsRes, foldersRes] = await Promise.all([
          fetch('/api/sermon'),
          fetch('/api/sermon/folder'),
        ])
        const sermonsData = await sermonsRes.json()
        const foldersData = await foldersRes.json()
        setSermons(sermonsData.data || [])
        setSermonFolders(foldersData.data || [])
      } catch (error) {
        console.error('[SermonTab] Failed to load sermons:', error)
      } finally {
        setSermonsLoading(false)
      }
    }
    loadData()
  }, [setSermons, setSermonFolders, setSermonsLoading])

  // Mobile: auto-switch to editor when a sermon is selected
  useEffect(() => {
    if (!isMd && currentSermon) {
      setSermonMobileView('editor')
    }
  }, [currentSermon?.id, isMd, setSermonMobileView])

  // Mobile: reset to list when no sermon
  useEffect(() => {
    if (!isMd && !currentSermon) {
      setSermonMobileView('list')
    }
  }, [currentSermon, isMd, setSermonMobileView])

  const panelContent = () => {
    switch (activeSermonPanel) {
      case 'list': return <SermonListPanel />
      case 'ai': return <SermonAIPanel />
      case 'verse': return <SermonVersePanel />
      case 'template': return <SermonTemplatePanel />
      case 'review': return <SermonReviewPanel />
      case 'settings': return <SermonSettingsPanel />
      default: return <SermonListPanel />
    }
  }

  return (
    <SermonEditorProvider isDark={isDarkMode}>
      <div
        className="flex h-full antialiased bg-secondary dark:bg-card text-foreground dark:text-foreground"
        style={{ fontFamily: "'SF Pro Display', 'SF Pro Text', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
      >
        {isMd ? (
          /* ── Desktop: 3-column layout ── */
          <>
            <SermonSidebar />
            <div className={cn(
              'border-r border-black/[0.04] dark:border-white/[0.06] transition-all duration-200 overflow-hidden',
              activeSermonPanel === 'list' ? 'w-[280px]' : 'w-[300px]'
            )}>
              {panelContent()}
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              {currentSermon ? (
                <SermonErrorBoundary><SermonEditor /></SermonErrorBoundary>
              ) : (
                <SermonEmptyState />
              )}
            </div>
          </>
        ) : (
          /* ── Mobile: single-column view ── */
          <>
            <div className="flex-1 flex flex-col min-h-0 pb-20">
              {sermonMobileView === 'list' ? (
                panelContent()
              ) : (
                currentSermon ? (
                  <SermonErrorBoundary><SermonEditor /></SermonErrorBoundary>
                ) : (
                  <SermonEmptyState />
                )
              )}
            </div>
            <SermonMobileBottomBar />
          </>
        )}
      </div>
    </SermonEditorProvider>
  )
}