'use client'

import React, { useEffect, useRef, useMemo } from 'react'
import {
  BookOpen,
  LayoutList,
  ArrowRight,
  Sparkles,
  Lightbulb,
  GitBranch,
  FileText,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

/** Slash command definition */
export interface SlashCommand {
  key: string
  labelZh: string
  labelEn: string
  descZh: string
  descEn: string
  icon: React.ElementType
  action: string
}

/** All available slash commands */
export const SLASH_COMMANDS: SlashCommand[] = [
  {
    key: 'verse',
    labelZh: '经文引用',
    labelEn: 'Insert Verse',
    descZh: '在光标处插入相关经文',
    descEn: 'Insert related verse at cursor',
    icon: BookOpen,
    action: 'insert-verse',
  },
  {
    key: 'section',
    labelZh: '段落标题',
    labelEn: 'Section Heading',
    descZh: '插入结构化段落标题',
    descEn: 'Insert structured section heading',
    icon: LayoutList,
    action: 'section',
  },
  {
    key: 'continue',
    labelZh: '续写',
    labelEn: 'Continue',
    descZh: 'AI 继续撰写当前内容',
    descEn: 'AI continues writing current content',
    icon: ArrowRight,
    action: 'continue',
  },
  {
    key: 'expand',
    labelZh: '扩展',
    labelEn: 'Expand',
    descZh: '扩展选中文本，增加深度和细节',
    descEn: 'Expand selected text with more depth and detail',
    icon: Maximize2,
    action: 'expand',
  },
  {
    key: 'shrink',
    labelZh: '精简',
    labelEn: 'Shrink',
    descZh: '精简选中文本，去除冗余表达',
    descEn: 'Condense selected text, removing redundancy',
    icon: Minimize2,
    action: 'shrink',
  },
  {
    key: 'polish',
    labelZh: '润色',
    labelEn: 'Polish',
    descZh: '润色选中或当前段落',
    descEn: 'Polish selected or current paragraph',
    icon: Sparkles,
    action: 'polish',
  },
  {
    key: 'example',
    labelZh: '例证',
    labelEn: 'Illustration',
    descZh: '添加一个例证或故事',
    descEn: 'Add an illustration or story',
    icon: Lightbulb,
    action: 'add-example',
  },
  {
    key: 'crossref',
    labelZh: '交叉引用',
    labelEn: 'Cross Reference',
    descZh: '查找交叉引用经文',
    descEn: 'Find cross-reference verses',
    icon: GitBranch,
    action: 'crossref',
  },
  {
    key: 'template',
    labelZh: '模板',
    labelEn: 'Template',
    descZh: '应用讲章模板结构',
    descEn: 'Apply sermon template structure',
    icon: FileText,
    action: 'template',
  },
  {
    key: 'review',
    labelZh: '审查',
    labelEn: 'Review',
    descZh: 'AI 审查讲章质量',
    descEn: 'AI review sermon quality',
    icon: ShieldCheck,
    action: 'review',
  },
]

interface SlashCommandMenuProps {
  /** Whether the menu is visible */
  visible: boolean
  /** Position relative to the editor container */
  position: { x: number; y: number }
  /** Current filter text (typed after /) */
  filter: string
  /** Callback when a command is selected */
  onSelect: (command: SlashCommand) => void
  /** Callback to close the menu */
  onClose: () => void
  /** Currently selected index (controlled by parent hook) */
  selectedIndex?: number
  /** Callback to update selected index */
  onSelectedIndexChange?: (index: number) => void
}

/** Dropdown menu triggered by typing "/" in the editor */
export function SlashCommandMenu({
  visible,
  position,
  filter,
  onSelect,
  onClose,
  selectedIndex = 0,
  onSelectedIndexChange,
}: SlashCommandMenuProps) {
  const { locale } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)

  const filteredCommands = useMemo(() => {
    if (!filter) return SLASH_COMMANDS
    const lowerFilter = filter.toLowerCase()
    return SLASH_COMMANDS.filter((cmd) => {
      const label = locale === 'en' ? cmd.labelEn : cmd.labelZh
      const desc = locale === 'en' ? cmd.descEn : cmd.descZh
      return (
        cmd.key.toLowerCase().includes(lowerFilter) ||
        label.toLowerCase().includes(lowerFilter) ||
        desc.toLowerCase().includes(lowerFilter)
      )
    })
  }, [filter, locale])

  // Clamp selected index when filtered list changes
  useEffect(() => {
    if (filteredCommands.length === 0) return
    const clamped = Math.min(selectedIndex, filteredCommands.length - 1)
    if (clamped !== selectedIndex) {
      onSelectedIndexChange?.(clamped)
    }
  }, [filteredCommands.length, selectedIndex, onSelectedIndexChange])

  // Scroll selected item into view
  useEffect(() => {
    if (!menuRef.current || !visible) return
    const selectedEl = menuRef.current.querySelector('[data-selected="true"]')
    selectedEl?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex, visible])

  // Close if no matches
  if (!visible || filteredCommands.length === 0) return null

  return (
    <div
      ref={menuRef}
      className="
        absolute z-50 w-64 max-h-64 overflow-y-auto
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
        {locale === 'en' ? 'Commands' : '命令'}
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
                /{cmd.key}
                <span className="ml-1.5 text-muted-foreground font-normal">{label}</span>
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{desc}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
