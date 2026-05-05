'use client'

import { useEffect } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { SermonSidebar } from './SermonSidebar'
import { SermonListPanel } from './SermonListPanel'
import { SermonEditor } from './SermonEditor'
import { SermonEmptyState } from './SermonEmptyState'
import { SermonAIPanel } from './SermonAIPanel'
import { SermonVersePanel } from './SermonVersePanel'
import { SermonTemplatePanel } from './SermonTemplatePanel'
import { SermonReviewPanel } from './SermonReviewPanel'
import { SermonSettingsPanel } from './SermonSettingsPanel'
import { SermonEditorProvider } from './SermonEditorContext'
import { SermonErrorBoundary } from './SermonErrorBoundary'

export function SermonTab() {
  const { t } = useTranslation()
  const {
    currentSermon,
    activeSermonPanel,
    sermonsLoading,
    setSermonsLoading,
    setSermons,
    setSermonFolders,
    sermons,
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

  return (
    <SermonEditorProvider isDark={isDarkMode}>
      <div
        className="flex h-full antialiased bg-[#f5f5f7] dark:bg-[#272729] text-[#1d1d1f] dark:text-white"
        style={{ fontFamily: "'SF Pro Display', 'SF Pro Text', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
      >
        {/* Icon Sidebar */}
        <SermonSidebar />

        {/* Panel Area */}
        <div className={cn(
          'border-r border-black/[0.04] dark:border-white/[0.06] transition-all duration-200 overflow-hidden',
          activeSermonPanel === 'list' ? 'w-[280px]' : 'w-[300px]'
        )}>
          {activeSermonPanel === 'list' && <SermonListPanel />}
          {activeSermonPanel === 'ai' && <SermonAIPanel />}
          {activeSermonPanel === 'verse' && <SermonVersePanel />}
          {activeSermonPanel === 'template' && <SermonTemplatePanel />}
          {activeSermonPanel === 'review' && <SermonReviewPanel />}
          {activeSermonPanel === 'settings' && <SermonSettingsPanel />}
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentSermon ? (
            <SermonErrorBoundary>
              <SermonEditor />
            </SermonErrorBoundary>
          ) : (
            <SermonEmptyState />
          )}
        </div>
      </div>
    </SermonEditorProvider>
  )
}