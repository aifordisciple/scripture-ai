'use client'

import { useEffect } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
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
import { cn } from '@/lib/utils'

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
      } catch {
        // Silent
      } finally {
        setSermonsLoading(false)
      }
    }
    loadData()
  }, [setSermons, setSermonFolders, setSermonsLoading])

  const showPanel = activeSermonPanel !== 'list' || true // Always show panel area

  return (
    <div className="flex h-full bg-white dark:bg-slate-950">
      {/* Icon Sidebar */}
      <SermonSidebar />

      {/* Panel Area */}
      <div className={cn(
        'border-r border-slate-200 dark:border-slate-800 transition-all duration-200 overflow-hidden',
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
        <SermonEditorProvider editor={null}>
          {currentSermon ? <SermonEditor /> : <SermonEmptyState />}
        </SermonEditorProvider>
      </div>
    </div>
  )
}
