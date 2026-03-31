'use client'

import { memo, useMemo } from 'react'
import dynamic from 'next/dynamic'

// 动态导入组件
const Reader = dynamic(() => import('@/components/bible/Reader').then(mod => ({ default: mod.Reader })), { ssr: false })
const SearchResults = dynamic(() => import('@/components/bible/SearchResults').then(mod => ({ default: mod.SearchResults })), { ssr: false })
const DashboardTab = dynamic(() => import('@/components/bible/DashboardTab').then(mod => ({ default: mod.default })), { ssr: false })
const HighlightsTab = dynamic(() => import('@/components/bible/HighlightsTab').then(mod => ({ default: mod.default })), { ssr: false })
const NotesTab = dynamic(() => import('@/components/bible/NotesTab').then(mod => ({ default: mod.default })), { ssr: false })
const PlanTab = dynamic(() => import('@/components/bible/PlanTab').then(mod => ({ default: mod.default })), { ssr: false })
const CrossRefTab = dynamic(() => import('@/components/bible/CrossRefTab').then(mod => ({ default: mod.CrossRefTab })), { ssr: false })
const GroupTab = dynamic(() => import('@/components/bible/GroupTab').then(mod => ({ default: mod.default })), { ssr: false })
const AtlasPanel = dynamic(() => import('@/components/atlas/AtlasPanel').then(mod => ({ default: mod.default })), { ssr: false })
const InsightsTab = dynamic(() => import('@/components/bible/InsightsTab').then(mod => ({ default: mod.InsightsTab })), { ssr: false })
// [P1增强] 书签Tab
const BookmarksTab = dynamic(() => import('@/components/bible/BookmarksTab').then(mod => ({ default: mod.BookmarksTab })), { ssr: false })

export interface Tab {
  id: string
  type: 'read' | 'search' | 'dashboard' | 'highlights' | 'notes' | 'cross-ref' | 'group' | 'atlas' | 'insights' | 'plan' | 'bookmarks'
  book?: string
  chapter?: number | string
  query?: string
  searchMode?: 'exact' | 'ai' | 'fuzzy'
  results?: any
  crossRefSource?: any
}

export interface TabContentRendererProps {
  tabs: Tab[]
  activeTabId: string
  chapterSpeechText?: string
  updateActiveTab?: (data: Partial<Tab>) => void
}

// 单个 Tab 内容组件
const TabContent = memo(function TabContent({
  tab,
  isActive,
  updateActiveTab,
}: {
  tab: Tab
  isActive: boolean
  updateActiveTab?: (data: Partial<Tab>) => void
}) {
  // 使用 visibility 而不是条件渲染，保持组件状态
  return (
    <div
      style={{ visibility: isActive ? 'visible' : 'hidden' }}
      className={isActive ? 'h-full' : 'absolute inset-0 pointer-events-none'}
      aria-hidden={!isActive}
    >
      {tab.type === 'read' && (
        <Reader
          key={tab.id}
          initialBook={tab.book || 'Gen'}
          initialChapter={String(tab.chapter || '1')}
        />
      )}

      {tab.type === 'search' && (
        <SearchResults
          key={tab.id}
          query={tab.query || ''}
          mode={tab.searchMode || 'exact'}
          cachedResults={tab.results}
          onUpdateResults={(data: any) => updateActiveTab?.({ results: data })}
        />
      )}

      {tab.type === 'dashboard' && <DashboardTab key={tab.id} />}

      {tab.type === 'highlights' && <HighlightsTab key={tab.id} />}

      {tab.type === 'notes' && <NotesTab key={tab.id} />}

      {tab.type === 'cross-ref' && tab.crossRefSource && (
        <CrossRefTab key={tab.id} sourceVerse={tab.crossRefSource} />
      )}

      {tab.type === 'group' && <GroupTab key={tab.id} />}

      {tab.type === 'atlas' && (
        <div key={tab.id} className="h-full">
          <AtlasPanel />
        </div>
      )}

      {tab.type === 'insights' && <InsightsTab key={tab.id} />}

      {tab.type === 'plan' && <PlanTab key={tab.id} />}

      {/* [P1增强] 书签Tab */}
      {tab.type === 'bookmarks' && <BookmarksTab key={tab.id} />}
    </div>
  )
})

// 主渲染器组件
export const TabContentRenderer = memo(function TabContentRenderer({
  tabs,
  activeTabId,
  updateActiveTab,
}: TabContentRendererProps) {
  // 缓存当前活跃的 tab
  const activeTab = useMemo(
    () => tabs.find(tab => tab.id === activeTabId),
    [tabs, activeTabId]
  )

  return (
    <div className="relative h-full">
      {tabs.map(tab => (
        <TabContent
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          updateActiveTab={updateActiveTab}
        />
      ))}
    </div>
  )
})

TabContentRenderer.displayName = 'TabContentRenderer'