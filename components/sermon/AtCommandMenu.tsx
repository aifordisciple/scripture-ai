'use client'

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import {
  BookOpen,
  Library,
  FileText,
  Search,
  Loader2,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

/** @-command definition */
export interface AtCommand {
  key: string
  labelZh: string
  labelEn: string
  descZh: string
  descEn: string
  icon: React.ElementType
  /** The context type to inject */
  contextType: 'scripture' | 'commentary' | 'sermon' | 'outline'
}

/** All available @-commands */
export const AT_COMMANDS: AtCommand[] = [
  {
    key: 'scripture',
    labelZh: '经文',
    labelEn: 'Scripture',
    descZh: '注入经文到AI上下文 (如 @scripture:约翰3:16)',
    descEn: 'Inject scripture into AI context (e.g. @scripture:John 3:16)',
    icon: BookOpen,
    contextType: 'scripture',
  },
  {
    key: 'commentary',
    labelZh: '注释',
    labelEn: 'Commentary',
    descZh: '注入圣经注释到AI上下文',
    descEn: 'Inject Bible commentary into AI context',
    icon: Library,
    contextType: 'commentary',
  },
  {
    key: 'sermon',
    labelZh: '讲章',
    labelEn: 'Sermon',
    descZh: '引用之前的讲章作为参考',
    descEn: 'Reference a previous sermon',
    icon: FileText,
    contextType: 'sermon',
  },
  {
    key: 'outline',
    labelZh: '大纲',
    labelEn: 'Outline',
    descZh: '注入当前讲章大纲到AI上下文',
    descEn: 'Inject current sermon outline into AI context',
    icon: Search,
    contextType: 'outline',
  },
]

/** Scripture search result */
interface ScriptureResult {
  reference: string
  text: string
  book: string
  chapter: number
  verse: number
}

interface AtCommandMenuProps {
  visible: boolean
  position: { x: number; y: number }
  filter: string
  onSelect: (command: AtCommand, extraContext?: string) => void
  onClose: () => void
  selectedIndex?: number
  onSelectedIndexChange?: (index: number) => void
}

/**
 * AtCommandMenu — @-command context injection menu
 *
 * Inspired by Cursor's @code/@docs system.
 * Typing @ in the editor opens this menu to inject specific
 * reference material (scripture, commentary, previous sermons)
 * into the AI's context window.
 */
export function AtCommandMenu({
  visible,
  position,
  filter,
  onSelect,
  onClose,
  selectedIndex = 0,
  onSelectedIndexChange,
}: AtCommandMenuProps) {
  const { locale } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)
  const [scriptureResults, setScriptureResults] = useState<ScriptureResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const isZh = locale !== 'en'

  // Parse filter to detect @scripture:query pattern
  const parsedFilter = useMemo(() => {
    const colonIdx = filter.indexOf(':')
    if (colonIdx === -1) return { commandFilter: filter, query: '' }
    return {
      commandFilter: filter.slice(0, colonIdx),
      query: filter.slice(colonIdx + 1),
    }
  }, [filter])

  const filteredCommands = useMemo(() => {
    const cmdFilter = parsedFilter.commandFilter.toLowerCase()
    if (!cmdFilter) return AT_COMMANDS
    return AT_COMMANDS.filter((cmd) => {
      const label = locale === 'en' ? cmd.labelEn : cmd.labelZh
      return (
        cmd.key.toLowerCase().includes(cmdFilter) ||
        label.toLowerCase().includes(cmdFilter)
      )
    })
  }, [parsedFilter.commandFilter, locale])

  // Search scripture when query changes
  useEffect(() => {
    const query = parsedFilter.query
    if (!query || query.length < 2) {
      setScriptureResults([])
      return
    }

    // Only search for scripture command
    const cmdFilter = parsedFilter.commandFilter.toLowerCase()
    if (cmdFilter && !cmdFilter.includes('scripture') && !cmdFilter.includes('经文')) {
      setScriptureResults([])
      return
    }

    setIsSearching(true)
    setSearchQuery(query)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data?.verses)) {
            setScriptureResults(data.verses.map((v: { bookName?: string; book?: string; chapter?: number; verse?: number; text?: string; content?: string }) => ({
              reference: `${v.bookName || v.book} ${v.chapter}:${v.verse}`,
              text: v.text || v.content || '',
              book: v.bookName || v.book || '',
              chapter: v.chapter || 0,
              verse: v.verse || 0,
            })))
          }
        }
      } catch {
        setScriptureResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [parsedFilter.query, parsedFilter.commandFilter])

  // Clamp selected index
  useEffect(() => {
    const totalItems = filteredCommands.length + scriptureResults.length
    if (totalItems === 0) return
    const clamped = Math.min(selectedIndex, totalItems - 1)
    if (clamped !== selectedIndex) {
      onSelectedIndexChange?.(clamped)
    }
  }, [filteredCommands.length, scriptureResults.length, selectedIndex, onSelectedIndexChange])

  // Scroll selected item into view
  useEffect(() => {
    if (!menuRef.current || !visible) return
    const selectedEl = menuRef.current.querySelector('[data-selected="true"]')
    selectedEl?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex, visible])

  const handleScriptureSelect = useCallback((result: ScriptureResult) => {
    const scriptureCmd = AT_COMMANDS.find(c => c.contextType === 'scripture')!
    const extraContext = `[Scripture: ${result.reference}]\n${result.text}`
    onSelect(scriptureCmd, extraContext)
  }, [onSelect])

  if (!visible) return null

  const totalItems = filteredCommands.length + scriptureResults.length
  if (totalItems === 0 && !isSearching) return null

  return (
    <div
      ref={menuRef}
      className="
        absolute z-50 w-72 max-h-72 overflow-y-auto
        bg-popover border border-border rounded-lg
        shadow-lg shadow-black/10 dark:shadow-black/30
        py-1
        animate-in fade-in-0 zoom-in-95 duration-100
      "
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Header */}
      <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {isZh ? '上下文注入' : 'Context Injection'}
      </div>

      {/* Command list */}
      {filteredCommands.map((cmd, index) => {
        const Icon = cmd.icon
        const isSelected = index === selectedIndex
        const label = locale === 'en' ? cmd.labelEn : cmd.labelZh
        const desc = locale === 'en' ? cmd.descEn : cmd.descZh

        return (
          <button
            key={cmd.key}
            data-selected={isSelected}
            onClick={() => onSelect(cmd)}
            onMouseEnter={() => onSelectedIndexChange?.(index)}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2 text-left
              transition-colors duration-75
              ${isSelected
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground hover:bg-accent/50'
              }
            `}
          >
            <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center ${
              isSelected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">
                @{cmd.key}
                <span className="ml-1.5 text-muted-foreground font-normal">{label}</span>
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{desc}</div>
            </div>
          </button>
        )
      })}

      {/* Scripture search results */}
      {(scriptureResults.length > 0 || isSearching) && (
        <div className="border-t border-border/50 mt-1 pt-1">
          <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground">
            {isZh ? '经文搜索结果' : 'Scripture Results'}
            {isSearching && <Loader2 size={10} className="inline ml-1 animate-spin" />}
          </div>
          {scriptureResults.map((result, idx) => {
            const globalIdx = filteredCommands.length + idx
            const isSelected = globalIdx === selectedIndex
            return (
              <button
                key={result.reference}
                data-selected={isSelected}
                onClick={() => handleScriptureSelect(result)}
                onMouseEnter={() => onSelectedIndexChange?.(globalIdx)}
                className={`
                  w-full flex items-start gap-2 px-3 py-1.5 text-left
                  transition-colors duration-75
                  ${isSelected
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-accent/50'
                  }
                `}
              >
                <BookOpen size={12} className="mt-0.5 shrink-0 text-primary/60" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-primary/80 truncate">
                    {result.reference}
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-2">
                    {result.text.slice(0, 80)}{result.text.length > 80 ? '...' : ''}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Hint for scripture query */}
      {parsedFilter.query.length > 0 && scriptureResults.length === 0 && !isSearching && (
        <div className="px-3 py-2 text-[10px] text-muted-foreground border-t border-border/50">
          {isZh
            ? `搜索 "${parsedFilter.query}" 无结果，尝试输入书卷名如"约翰3:16"`
            : `No results for "${parsedFilter.query}". Try a reference like "John 3:16"`}
        </div>
      )}
    </div>
  )
}
