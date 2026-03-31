'use client'

import { memo, useMemo } from 'react'
import { Clock, Search, BookOpen, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchSuggestionsProps {
  query: string
  recentSearches?: string[]
  verseSuggestions?: string[]
  topicSuggestions?: string[]
  onSelect: (suggestion: string) => void
  onHistorySelect: (query: string) => void
}

const MAX_SUGGESTIONS = 5
const MAX_HISTORY = 5

// 单个建议项组件
const SuggestionItem = memo(function SuggestionItem({
  icon: Icon,
  text,
  onClick,
  highlight,
}: {
  icon: React.ElementType
  text: string
  onClick: () => void
  highlight?: string
}) {
  // 高亮匹配文本
  const displayText = useMemo(() => {
    if (!highlight) return text

    const lowerText = text.toLowerCase()
    const lowerHighlight = highlight.toLowerCase()
    const index = lowerText.indexOf(lowerHighlight)

    if (index === -1) return text

    return (
      <>
        {text.slice(0, index)}
        <span className="font-bold text-primary">{text.slice(index, index + highlight.length)}</span>
        {text.slice(index + highlight.length)}
      </>
    )
  }, [text, highlight])

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
    >
      <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
      <span className="truncate">{displayText}</span>
    </button>
  )
})

// 最近搜索历史
function SearchHistory({
  searches,
  onSelect,
}: {
  searches: string[]
  onSelect: (query: string) => void
}) {
  if (searches.length === 0) return null

  const limitedSearches = searches.slice(0, MAX_HISTORY)

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
        <Clock className="w-3.5 h-3.5" />
        最近搜索
      </div>
      {limitedSearches.map((search, index) => (
        <SuggestionItem
          key={`history-${index}`}
          icon={Clock}
          text={search}
          onClick={() => onSelect(search)}
        />
      ))}
    </div>
  )
}

// 经文建议
function VerseSuggestions({
  suggestions,
  query,
  onSelect,
}: {
  suggestions: string[]
  query: string
  onSelect: (suggestion: string) => void
}) {
  if (suggestions.length === 0) return null

  const limitedSuggestions = suggestions.slice(0, MAX_SUGGESTIONS)

  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
        <BookOpen className="w-3.5 h-3.5" />
        经文
      </div>
      {limitedSuggestions.map((suggestion, index) => (
        <SuggestionItem
          key={`verse-${index}`}
          icon={BookOpen}
          text={suggestion}
          onClick={() => onSelect(suggestion)}
          highlight={query}
        />
      ))}
    </div>
  )
}

// 主题建议
function TopicSuggestions({
  suggestions,
  query,
  onSelect,
}: {
  suggestions: string[]
  query: string
  onSelect: (suggestion: string) => void
}) {
  if (suggestions.length === 0) return null

  const limitedSuggestions = suggestions.slice(0, MAX_SUGGESTIONS)

  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
        <Tag className="w-3.5 h-3.5" />
        主题
      </div>
      {limitedSuggestions.map((suggestion, index) => (
        <SuggestionItem
          key={`topic-${index}`}
          icon={Tag}
          text={suggestion}
          onClick={() => onSelect(suggestion)}
          highlight={query}
        />
      ))}
    </div>
  )
}

// 空状态
function EmptyState() {
  return (
    <div className="py-6 text-center text-sm text-slate-400">
      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p>输入关键词搜索经文</p>
    </div>
  )
}

// 主组件
export const SearchSuggestions = memo(function SearchSuggestions({
  query,
  recentSearches = [],
  verseSuggestions = [],
  topicSuggestions = [],
  onSelect,
  onHistorySelect,
}: SearchSuggestionsProps) {
  const hasQuery = query.trim().length > 0
  const hasHistory = recentSearches.length > 0
  const hasVerseSuggestions = verseSuggestions.length > 0
  const hasTopicSuggestions = topicSuggestions.length > 0

  // 无搜索内容时显示历史
  if (!hasQuery) {
    if (hasHistory) {
      return (
        <div className="py-1">
          <SearchHistory searches={recentSearches} onSelect={onHistorySelect} />
        </div>
      )
    }
    return <EmptyState />
  }

  // 有搜索内容但没有建议
  if (!hasVerseSuggestions && !hasTopicSuggestions) {
    return (
      <div className="py-4 text-center text-sm text-slate-400">
        <p>未找到相关结果</p>
        <p className="text-xs mt-1">尝试其他关键词或使用AI搜索</p>
      </div>
    )
  }

  // 显示建议
  return (
    <div className="py-1">
      {hasVerseSuggestions && (
        <VerseSuggestions
          suggestions={verseSuggestions}
          query={query}
          onSelect={onSelect}
        />
      )}
      {hasTopicSuggestions && (
        <TopicSuggestions
          suggestions={topicSuggestions}
          query={query}
          onSelect={onSelect}
        />
      )}
    </div>
  )
})

SearchSuggestions.displayName = 'SearchSuggestions'