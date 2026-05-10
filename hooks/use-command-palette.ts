'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
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
  Clipboard,
  Heart,
  Hand,
  Library,
  Search,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Quote,
  Eye,
  Columns2,
  History,
  ChevronRight,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react'

/** Command category */
export type CommandCategory = 'ai' | 'insert' | 'format' | 'flow' | 'navigation'

/** Unified command definition */
export interface CommandItem {
  id: string
  labelZh: string
  labelEn: string
  descZh: string
  descEn: string
  icon: LucideIcon
  category: CommandCategory
  /** The action string passed to handleAIAssist or a special handler */
  action: string
  /** Keywords for fuzzy search (Chinese pinyin hints, aliases) */
  keywords: string[]
  /** Keyboard shortcut display text */
  shortcut?: string
}

/** All unified commands — merges slash commands, @-commands, format, flow, and navigation */
export const COMMAND_ITEMS: CommandItem[] = [
  // ── AI Operations ──────────────────────────────────
  {
    id: 'ai-continue', labelZh: '续写', labelEn: 'Continue',
    descZh: 'AI 继续撰写当前内容', descEn: 'AI continues writing current content',
    icon: ArrowRight, category: 'ai', action: 'continue',
    keywords: ['xuxie', 'continue', 'write', '写'],
    shortcut: '⌘J',
  },
  {
    id: 'ai-polish', labelZh: '润色', labelEn: 'Polish',
    descZh: '润色选中或当前段落', descEn: 'Polish selected or current paragraph',
    icon: Sparkles, category: 'ai', action: 'polish',
    keywords: ['runse', 'polish', 'refine', '润'],
  },
  {
    id: 'ai-expand', labelZh: '扩展', labelEn: 'Expand',
    descZh: '扩展选中文本，增加深度和细节', descEn: 'Expand selected text with more depth and detail',
    icon: Maximize2, category: 'ai', action: 'expand',
    keywords: ['kuozhan', 'expand', 'elaborate', '扩'],
  },
  {
    id: 'ai-shrink', labelZh: '精简', labelEn: 'Shrink',
    descZh: '精简选中文本，去除冗余表达', descEn: 'Condense selected text, removing redundancy',
    icon: Minimize2, category: 'ai', action: 'shrink',
    keywords: ['jingjian', 'shrink', 'condense', 'simplify', '精'],
  },
  {
    id: 'ai-illustrate', labelZh: '例证', labelEn: 'Illustration',
    descZh: '添加一个例证或故事', descEn: 'Add an illustration or story',
    icon: Lightbulb, category: 'ai', action: 'add-example',
    keywords: ['lizheng', 'illustration', 'example', 'story', '例'],
  },
  {
    id: 'ai-apply', labelZh: '应用', labelEn: 'Apply',
    descZh: '添加生活应用点', descEn: 'Add application points',
    icon: Heart, category: 'ai', action: 'add-application',
    keywords: ['yingyong', 'apply', 'application', '用'],
  },
  {
    id: 'ai-crossref', labelZh: '交叉引用', labelEn: 'Cross Reference',
    descZh: '查找交叉引用经文', descEn: 'Find cross-reference verses',
    icon: GitBranch, category: 'ai', action: 'crossref',
    keywords: ['jiaochayinyong', 'crossref', 'reference', '引'],
  },
  {
    id: 'ai-deepen', labelZh: '深化', labelEn: 'Deepen',
    descZh: '增加神学深度和圣经交叉引用', descEn: 'Add theological depth and cross-references',
    icon: ShieldCheck, category: 'ai', action: 'deepen',
    keywords: ['shenhua', 'deepen', 'theology', '深'],
  },
  {
    id: 'ai-simplify', labelZh: '通俗化', labelEn: 'Simplify',
    descZh: '使学术语言更通俗易懂', descEn: 'Make academic language more accessible',
    icon: Minimize2, category: 'ai', action: 'simplify',
    keywords: ['tongsuhua', 'simplify', 'accessible', '俗'],
  },
  {
    id: 'ai-rewrite', labelZh: '改写', labelEn: 'Rewrite',
    descZh: '以不同风格改写选中文本', descEn: 'Rewrite selected text in a different style',
    icon: Sparkles, category: 'ai', action: 'rewrite',
    keywords: ['gaixie', 'rewrite', 'rephrase', '改'],
  },
  {
    id: 'ai-pray', labelZh: '祷告', labelEn: 'Pray',
    descZh: '撰写结束祷告', descEn: 'Write a closing prayer',
    icon: Hand, category: 'ai', action: 'add-prayer',
    keywords: ['daogao', 'pray', 'prayer', '祷'],
  },
  {
    id: 'ai-transition', labelZh: '过渡', labelEn: 'Transition',
    descZh: '写一段过渡段落', descEn: 'Write a transition paragraph',
    icon: ArrowRight, category: 'ai', action: 'add-transition',
    keywords: ['guodu', 'transition', 'bridge', '过'],
  },
  {
    id: 'ai-review', labelZh: '审查', labelEn: 'Review',
    descZh: 'AI 审查讲章质量', descEn: 'AI review sermon quality',
    icon: ShieldCheck, category: 'ai', action: 'review',
    keywords: ['shencha', 'review', 'check', '审'],
  },

  // ── Insert ─────────────────────────────────────────
  {
    id: 'insert-verse', labelZh: '经文引用', labelEn: 'Insert Verse',
    descZh: '在光标处插入相关经文', descEn: 'Insert related verse at cursor',
    icon: BookOpen, category: 'insert', action: 'insert-verse',
    keywords: ['jingwen', 'verse', 'scripture', '经', '@scripture'],
  },
  {
    id: 'insert-section', labelZh: '段落标题', labelEn: 'Section Heading',
    descZh: '插入结构化段落标题', descEn: 'Insert structured section heading',
    icon: LayoutList, category: 'insert', action: 'section',
    keywords: ['duanluo', 'section', 'heading', '段'],
  },
  {
    id: 'insert-template', labelZh: '模板', labelEn: 'Template',
    descZh: '应用讲章模板结构', descEn: 'Apply sermon template structure',
    icon: FileText, category: 'insert', action: 'template',
    keywords: ['muban', 'template', 'structure', '模'],
  },
  {
    id: 'insert-snippet', labelZh: '片段', labelEn: 'Snippet',
    descZh: '插入快捷模板片段', descEn: 'Insert a quick template snippet',
    icon: Clipboard, category: 'insert', action: 'snippet',
    keywords: ['pianduan', 'snippet', 'fragment', '片'],
  },
  {
    id: 'insert-commentary', labelZh: '注释', labelEn: 'Commentary',
    descZh: '注入圣经注释到AI上下文', descEn: 'Inject Bible commentary into AI context',
    icon: Library, category: 'insert', action: 'inject-commentary',
    keywords: ['zhushi', 'commentary', 'note', '注', '@commentary'],
  },
  {
    id: 'insert-outline', labelZh: '大纲', labelEn: 'Outline',
    descZh: '注入当前讲章大纲到AI上下文', descEn: 'Inject current sermon outline into AI context',
    icon: Search, category: 'insert', action: 'inject-outline',
    keywords: ['dagang', 'outline', 'structure', '纲', '@outline'],
  },
  {
    id: 'insert-sermon', labelZh: '讲章引用', labelEn: 'Sermon Reference',
    descZh: '引用之前的讲章作为参考', descEn: 'Reference a previous sermon',
    icon: FileText, category: 'insert', action: 'inject-sermon',
    keywords: ['jiangzhang', 'sermon', 'reference', '章', '@sermon'],
  },

  // ── Format ─────────────────────────────────────────
  {
    id: 'fmt-bold', labelZh: '加粗', labelEn: 'Bold',
    descZh: '将选中文本加粗', descEn: 'Make selected text bold',
    icon: Bold, category: 'format', action: 'format-bold',
    keywords: ['jiacu', 'bold', 'strong', '粗'],
    shortcut: '⌘B',
  },
  {
    id: 'fmt-italic', labelZh: '斜体', labelEn: 'Italic',
    descZh: '将选中文本设为斜体', descEn: 'Make selected text italic',
    icon: Italic, category: 'format', action: 'format-italic',
    keywords: ['xieti', 'italic', 'em', '斜'],
    shortcut: '⌘I',
  },
  {
    id: 'fmt-h2', labelZh: '二级标题', labelEn: 'Heading 2',
    descZh: '插入二级标题', descEn: 'Insert heading level 2',
    icon: Heading2, category: 'format', action: 'format-h2',
    keywords: ['biaoti', 'heading', 'h2', '题'],
  },
  {
    id: 'fmt-h3', labelZh: '三级标题', labelEn: 'Heading 3',
    descZh: '插入三级标题', descEn: 'Insert heading level 3',
    icon: Heading3, category: 'format', action: 'format-h3',
    keywords: ['biaoti', 'heading', 'h3', '题'],
  },
  {
    id: 'fmt-list', labelZh: '列表', labelEn: 'List',
    descZh: '插入无序列表', descEn: 'Insert unordered list',
    icon: List, category: 'format', action: 'format-list',
    keywords: ['liebiao', 'list', 'bullet', '列'],
  },
  {
    id: 'fmt-quote', labelZh: '引用', labelEn: 'Quote',
    descZh: '插入引用块', descEn: 'Insert blockquote',
    icon: Quote, category: 'format', action: 'format-quote',
    keywords: ['yinyong', 'quote', 'blockquote', '引'],
  },

  // ── Flow ───────────────────────────────────────────
  {
    id: 'flow-next', labelZh: '下一阶段', labelEn: 'Next Stage',
    descZh: '推进到写作流程的下一阶段', descEn: 'Advance to the next writing stage',
    icon: ChevronRight, category: 'flow', action: 'flow-next',
    keywords: ['xiayijieduan', 'next', 'advance', '下'],
  },
  {
    id: 'flow-prev', labelZh: '上一阶段', labelEn: 'Previous Stage',
    descZh: '回退到写作流程的上一阶段', descEn: 'Go back to the previous writing stage',
    icon: ChevronLeft, category: 'flow', action: 'flow-prev',
    keywords: ['shangyijieduan', 'prev', 'back', '上'],
  },

  // ── Navigation ─────────────────────────────────────
  {
    id: 'nav-focus', labelZh: '专注模式', labelEn: 'Focus Mode',
    descZh: '进入无干扰写作模式', descEn: 'Enter distraction-free writing mode',
    icon: Eye, category: 'navigation', action: 'toggle-focus',
    keywords: ['zhuanzhu', 'focus', 'zen', 'distraction', '专'],
  },
  {
    id: 'nav-dualpane', labelZh: '双窗格', labelEn: 'Dual Pane',
    descZh: '切换经文与讲章并排显示', descEn: 'Toggle scripture and sermon side-by-side',
    icon: Columns2, category: 'navigation', action: 'toggle-dualpane',
    keywords: ['shuangchuangge', 'dual', 'split', '双'],
  },
  {
    id: 'nav-history', labelZh: '版本历史', labelEn: 'Version History',
    descZh: '查看和恢复之前的版本', descEn: 'View and restore previous versions',
    icon: History, category: 'navigation', action: 'toggle-history',
    keywords: ['banben', 'history', 'version', '版'],
  },
]

/** Category display labels */
export const CATEGORY_LABELS: Record<CommandCategory, { zh: string; en: string }> = {
  ai: { zh: 'AI 操作', en: 'AI Actions' },
  insert: { zh: '插入', en: 'Insert' },
  format: { zh: '格式', en: 'Format' },
  flow: { zh: '流程', en: 'Flow' },
  navigation: { zh: '导航', en: 'Navigation' },
}

/** Category sort order for display */
const CATEGORY_ORDER: CommandCategory[] = ['ai', 'insert', 'format', 'flow', 'navigation']

/** Fuzzy match score — higher is better match */
function fuzzyScore(item: CommandItem, query: string, locale: string): number {
  const q = query.toLowerCase()
  const label = (locale === 'en' ? item.labelEn : item.labelZh).toLowerCase()
  const desc = (locale === 'en' ? item.descEn : item.descZh).toLowerCase()
  const id = item.id.toLowerCase()

  // Exact id match
  if (id === q) return 100
  // Label starts with query
  if (label.startsWith(q)) return 90
  // Label contains query
  if (label.includes(q)) return 80
  // Keyword exact match
  if (item.keywords.some(k => k.toLowerCase() === q)) return 70
  // Keyword starts with query
  if (item.keywords.some(k => k.toLowerCase().startsWith(q))) return 60
  // Keyword contains query
  if (item.keywords.some(k => k.toLowerCase().includes(q))) return 50
  // Description contains query
  if (desc.includes(q)) return 40
  // ID contains query
  if (id.includes(q)) return 30

  // Character-by-character fuzzy match
  let qi = 0
  let score = 0
  const target = label + ' ' + id
  for (let i = 0; i < target.length && qi < q.length; i++) {
    if (target[i] === q[qi]) {
      score += 10
      qi++
    }
  }
  if (qi === q.length) return score

  return 0
}

interface UseCommandPaletteOptions {
  /** Callback when a command is executed */
  onCommand: (command: CommandItem) => void
  /** Pre-filter category when opened (e.g., 'ai' for / trigger, 'insert' for @ trigger) */
  initialCategory?: CommandCategory
}

interface UseCommandPaletteReturn {
  /** Whether the palette is visible */
  visible: boolean
  /** Current search query */
  query: string
  /** Set the search query */
  setQuery: (q: string) => void
  /** Filtered and sorted commands */
  filteredCommands: CommandItem[]
  /** Currently selected index */
  selectedIndex: number
  /** Open the palette */
  open: (category?: CommandCategory) => void
  /** Close the palette */
  close: () => void
  /** Handle keyboard navigation */
  handleKeyDown: (e: KeyboardEvent) => boolean
  /** Execute the currently selected command */
  executeSelected: () => void
  /** Execute a specific command */
  execute: (command: CommandItem) => void
  /** Recent commands (for MRU ordering) */
  recentCommands: CommandItem[]
}

/** Max recent commands to track */
const MAX_RECENT = 8
const RECENT_STORAGE_KEY = 'sermon-command-palette-recent'

/**
 * useCommandPalette — Unified command palette state management
 *
 * Merges slash commands, @-commands, format commands, flow, and navigation
 * into a single searchable palette triggered by Cmd+K, /, or @.
 */
export function useCommandPalette(options: UseCommandPaletteOptions): UseCommandPaletteReturn {
  const { onCommand } = options
  const { locale } = useBibleStore()

  const [visible, setVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [preCategory, setPreCategory] = useState<CommandCategory | undefined>(options.initialCategory)
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || '[]')
    } catch { return [] }
  })

  // Filter and sort commands
  const filteredCommands = useMemo(() => {
    let items = COMMAND_ITEMS

    // Pre-filter by category if set (e.g., / shows all, @ shows insert)
    if (preCategory) {
      items = items.filter(c => c.category === preCategory)
    }

    if (!query) {
      // No query: sort by category order, then MRU within each category
      const recentSet = new Set(recentIds)
      return [...items].sort((a, b) => {
        const catA = CATEGORY_ORDER.indexOf(a.category)
        const catB = CATEGORY_ORDER.indexOf(b.category)
        if (catA !== catB) return catA - catB
        const aRecent = recentSet.has(a.id) ? 0 : 1
        const bRecent = recentSet.has(b.id) ? 0 : 1
        return aRecent - bRecent
      })
    }

    // With query: fuzzy search and sort by score
    const scored = items
      .map(item => ({ item, score: fuzzyScore(item, query, locale) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)

    return scored.map(({ item }) => item)
  }, [query, preCategory, recentIds, locale])

  // Recent commands as full objects
  const recentCommands = useMemo(() => {
    return recentIds
      .map(id => COMMAND_ITEMS.find(c => c.id === id))
      .filter((c): c is CommandItem => c !== undefined)
      .slice(0, MAX_RECENT)
  }, [recentIds])

  // Clamp selected index when filtered list changes
  const clampedIndex = Math.min(selectedIndex, Math.max(0, filteredCommands.length - 1))

  const open = useCallback((category?: CommandCategory) => {
    setPreCategory(category)
    setQuery('')
    setSelectedIndex(0)
    setVisible(true)
  }, [])

  const close = useCallback(() => {
    setVisible(false)
    setQuery('')
    setSelectedIndex(0)
    setPreCategory(undefined)
  }, [])

  const addToRecent = useCallback((id: string) => {
    setRecentIds(prev => {
      const next = [id, ...prev.filter(r => r !== id)].slice(0, MAX_RECENT)
      try { localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const execute = useCallback((command: CommandItem) => {
    addToRecent(command.id)
    onCommand(command)
    close()
  }, [onCommand, close, addToRecent])

  const executeSelected = useCallback(() => {
    const cmd = filteredCommands[clampedIndex]
    if (cmd) execute(cmd)
  }, [filteredCommands, clampedIndex, execute])

  const handleKeyDown = useCallback((e: KeyboardEvent): boolean => {
    if (!visible) return false

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
        return true
      }
      case 'ArrowUp': {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        return true
      }
      case 'Enter': {
        e.preventDefault()
        executeSelected()
        return true
      }
      case 'Escape': {
        e.preventDefault()
        close()
        return true
      }
      case 'Tab': {
        // Tab accepts the selected command
        e.preventDefault()
        executeSelected()
        return true
      }
      default:
        return false
    }
  }, [visible, filteredCommands.length, executeSelected, close])

  return {
    visible,
    query,
    setQuery,
    filteredCommands,
    selectedIndex: clampedIndex,
    open,
    close,
    handleKeyDown,
    executeSelected,
    execute,
    recentCommands,
  }
}
