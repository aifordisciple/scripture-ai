'use client'

import { useEffect, Component } from 'react'
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

// Error boundary to catch and log the actual component causing React error #130
class SermonErrorBoundary extends Component<
  { children: React.ReactNode; name: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[SermonErrorBoundary:${this.props.name}]`, error.message, info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-xs text-red-600 bg-red-50 rounded">
          <p className="font-bold">Error in {this.props.name}</p>
          <p>{this.state.error?.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}

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
      } catch (error) {
        console.error('[SermonTab] Failed to load sermons:', error)
      } finally {
        setSermonsLoading(false)
      }
    }
    loadData()
  }, [setSermons, setSermonFolders, setSermonsLoading])

  return (
    <SermonEditorProvider>
      <div className="flex h-full bg-white dark:bg-slate-950">
        {/* Icon Sidebar */}
        <SermonErrorBoundary name="SermonSidebar">
          <SermonSidebar />
        </SermonErrorBoundary>

        {/* Panel Area */}
        <div className={cn(
          'border-r border-slate-200 dark:border-slate-800 transition-all duration-200 overflow-hidden',
          activeSermonPanel === 'list' ? 'w-[280px]' : 'w-[300px]'
        )}>
          {activeSermonPanel === 'list' && (
            <SermonErrorBoundary name="SermonListPanel">
              <SermonListPanel />
            </SermonErrorBoundary>
          )}
          {activeSermonPanel === 'ai' && (
            <SermonErrorBoundary name="SermonAIPanel">
              <SermonAIPanel />
            </SermonErrorBoundary>
          )}
          {activeSermonPanel === 'verse' && (
            <SermonErrorBoundary name="SermonVersePanel">
              <SermonVersePanel />
            </SermonErrorBoundary>
          )}
          {activeSermonPanel === 'template' && (
            <SermonErrorBoundary name="SermonTemplatePanel">
              <SermonTemplatePanel />
            </SermonErrorBoundary>
          )}
          {activeSermonPanel === 'review' && (
            <SermonErrorBoundary name="SermonReviewPanel">
              <SermonReviewPanel />
            </SermonErrorBoundary>
          )}
          {activeSermonPanel === 'settings' && (
            <SermonErrorBoundary name="SermonSettingsPanel">
              <SermonSettingsPanel />
            </SermonErrorBoundary>
          )}
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentSermon ? (
            <SermonErrorBoundary name="SermonEditor">
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