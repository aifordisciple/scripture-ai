'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { Keyboard, X } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'

/** Keyboard shortcut definition */
interface ShortcutDef {
  /** Key combination (display) */
  keys: string
  /** Action identifier */
  action: string
  zhLabel: string
  enLabel: string
  /** Category for grouping */
  category: 'editor' | 'ai' | 'navigation'
}

/** All sermon keyboard shortcuts */
const SHORTCUTS: ShortcutDef[] = [
  // Editor
  { keys: '⌘S', action: 'save', zhLabel: '保存', enLabel: 'Save', category: 'editor' },
  { keys: '⌘J', action: 'ai-continue', zhLabel: 'AI续写', enLabel: 'AI Continue', category: 'ai' },
  { keys: '⌘⇧J', action: 'ai-panel', zhLabel: 'AI面板', enLabel: 'AI Panel', category: 'ai' },
  { keys: '⌘⇧R', action: 'review', zhLabel: '审查', enLabel: 'Review', category: 'ai' },
  { keys: '⌘⇧E', action: 'export', zhLabel: '导出', enLabel: 'Export', category: 'navigation' },
  { keys: '⌘/', action: 'slash', zhLabel: '命令菜单', enLabel: 'Command Menu', category: 'editor' },
  { keys: '⌘⇧S', action: 'snippet', zhLabel: '片段面板', enLabel: 'Snippets', category: 'navigation' },
  { keys: 'Tab', action: 'accept-ghost', zhLabel: '接受建议', enLabel: 'Accept Ghost', category: 'editor' },
  { keys: 'Esc', action: 'reject-ghost', zhLabel: '拒绝建议', enLabel: 'Reject Ghost', category: 'editor' },
]

const CATEGORY_LABELS = {
  editor: { zh: '编辑', en: 'Editor' },
  ai: { zh: 'AI', en: 'AI' },
  navigation: { zh: '导航', en: 'Navigation' },
}

/**
 * KeyboardShortcutsPanel — 键盘快捷键面板
 *
 * Displays all available keyboard shortcuts for the sermon editor.
 * Also registers global keyboard handlers for common actions.
 */
export function KeyboardShortcutsPanel() {
  const { locale } = useBibleStore()
  const isZh = locale !== 'en'

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <Keyboard size={12} className="text-orange-500" />
        <span className="text-xs font-medium text-foreground">
          {isZh ? '快捷键' : 'Shortcuts'}
        </span>
      </div>

      {/* Shortcut list grouped by category */}
      <div className="flex-1 overflow-y-auto">
        {(['editor', 'ai', 'navigation'] as const).map(category => {
          const catShortcuts = SHORTCUTS.filter(s => s.category === category)
          if (catShortcuts.length === 0) return null
          return (
            <div key={category}>
              <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/20">
                {CATEGORY_LABELS[category][isZh ? 'zh' : 'en']}
              </div>
              {catShortcuts.map(shortcut => (
                <div
                  key={shortcut.action}
                  className="flex items-center justify-between px-3 py-1.5 border-b border-border/30"
                >
                  <span className="text-[11px] text-foreground/80">
                    {isZh ? shortcut.zhLabel : shortcut.enLabel}
                  </span>
                  <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-muted/50 text-muted-foreground border border-border/50">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Hook that registers global keyboard shortcuts for the sermon editor.
 *
 * Handles:
 * - ⌘J: AI continue
 * - ⌘⇧J: Toggle AI panel
 * - ⌘⇧R: Open review
 * - ⌘⇧E: Export
 * - ⌘⇧S: Open snippets/settings
 */
export function useSermonKeyboardShortcuts() {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // ⌘J — AI continue
    if (e.key === 'j' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('sermon:ai-continue'))
      return
    }

    // ⌘⇧J — Toggle AI panel
    if (e.key === 'J' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('sermon:toggle-ai-panel'))
      return
    }

    // ⌘⇧R — Open review
    if (e.key === 'R' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
      e.preventDefault()
      useBibleStore.getState().setActiveSermonPanel('review')
      return
    }

    // ⌘⇧E — Export (open settings with export)
    if (e.key === 'E' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
      e.preventDefault()
      useBibleStore.getState().setActiveSermonPanel('settings')
      return
    }

    // ⌘⇧S — Open snippets/settings
    if (e.key === 'S' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
      e.preventDefault()
      useBibleStore.getState().setActiveSermonPanel('settings')
      return
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}