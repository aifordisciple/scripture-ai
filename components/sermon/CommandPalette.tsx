'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Search, Command } from 'lucide-react'
import {
  useCommandPalette,
  COMMAND_ITEMS,
  CATEGORY_LABELS,
  type CommandItem,
  type CommandCategory,
} from '@/hooks/use-command-palette'
import { useBibleStore } from '@/store/useBibleStore'

interface CommandPaletteProps {
  /** Called when a command is executed */
  onCommand: (command: CommandItem) => void
  /** Pre-filter category when opened via / or @ */
  initialCategory?: CommandCategory
}

/** Category sort order for grouped display */
const CATEGORY_ORDER: CommandCategory[] = ['ai', 'insert', 'format', 'flow', 'navigation']

/**
 * CommandPalette — Unified command palette replacing SlashCommandMenu + AtCommandMenu
 *
 * Triggered by Cmd+K (all commands), / (AI+flow), or @ (insert).
 * Features fuzzy search, keyboard navigation, MRU ordering, and grouped display.
 */
export default function CommandPalette({ onCommand, initialCategory }: CommandPaletteProps) {
  const {
    visible, query, setQuery, filteredCommands,
    selectedIndex, open, close, handleKeyDown, execute,
  } = useCommandPalette({ onCommand, initialCategory })

  const { locale } = useBibleStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [visible])

  // Global Cmd+K shortcut
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (visible) close()
        else open()
      }
    }
    // Listen for / and @ trigger events from VditorEditor
    function handleOpenCommandPalette(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail?.category) {
        open(detail.category as CommandCategory)
      } else {
        open()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    window.addEventListener('sermon:open-command-palette', handleOpenCommandPalette)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
      window.removeEventListener('sermon:open-command-palette', handleOpenCommandPalette)
    }
  }, [visible, open, close])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const selected = listRef.current.querySelector('[data-selected="true"]')
    selected?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Handle keyboard events on the palette
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const handled = handleKeyDown(e.nativeEvent)
    if (handled) e.preventDefault()
  }, [handleKeyDown])

  if (!visible) return null

  // Group filtered commands by category
  const grouped = CATEGORY_ORDER
    .map(cat => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      commands: filteredCommands.filter(c => c.category === cat),
    }))
    .filter(g => g.commands.length > 0)

  // Compute flat index offset for each group
  let runningIndex = 0
  const groupOffsets: Record<string, number> = {}
  for (const g of grouped) {
    groupOffsets[g.category] = runningIndex
    runningIndex += g.commands.length
  }

  const isZh = locale === 'zh' || !locale

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={close}
      />

      {/* Palette */}
      <div
        className="relative w-[560px] max-h-[420px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={onKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Command className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={isZh ? '输入命令或搜索…' : 'Type a command or search…'}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-1.5">
          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              {isZh ? '未找到匹配的命令' : 'No matching commands'}
            </div>
          )}

          {grouped.map(group => {
            const offset = groupOffsets[group.category]
            return (
              <div key={group.category}>
                {/* Category header */}
                <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {isZh ? group.label.zh : group.label.en}
                </div>

                {/* Commands in this category */}
                {group.commands.map((cmd, i) => {
                  const globalIndex = offset + i
                  const isSelected = globalIndex === selectedIndex
                  const Icon = cmd.icon

                  return (
                    <button
                      key={cmd.id}
                      data-selected={isSelected}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => execute(cmd)}
                      onMouseEnter={() => {
                        // Update selected index on hover for keyboard continuity
                      }}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {isZh ? cmd.labelZh : cmd.labelEn}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">
                          {isZh ? cmd.descZh : cmd.descEn}
                        </div>
                      </div>
                      {cmd.shortcut && (
                        <kbd className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded shrink-0">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
          <div className="flex items-center gap-3">
            <span>↑↓ {isZh ? '导航' : 'navigate'}</span>
            <span>↵ {isZh ? '执行' : 'select'}</span>
            <span>ESC {isZh ? '关闭' : 'close'}</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">⌘K</kbd>
            <span>{isZh ? '随时打开' : 'open anytime'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
