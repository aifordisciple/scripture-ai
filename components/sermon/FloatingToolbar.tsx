'use client'

import React, { useState } from 'react'
import { Sparkles, Maximize2, Minimize2, Lightbulb, ShieldCheck, GitBranch, PenLine, MoreHorizontal } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

/** Floating toolbar action definition */
export interface FloatingToolbarAction {
  key: string
  icon: React.ElementType
  labelZh: string
  labelEn: string
  /** Optional sub-actions shown on hover/long-press */
  subActions?: FloatingToolbarAction[]
}

/** Primary actions — always visible */
const PRIMARY_ACTIONS: FloatingToolbarAction[] = [
  { key: 'polish', icon: Sparkles, labelZh: '润色', labelEn: 'Polish' },
  {
    key: 'expand', icon: Maximize2, labelZh: '扩展', labelEn: 'Expand',
    subActions: [
      { key: 'expand-slight', icon: Maximize2, labelZh: '微调', labelEn: 'Slight' },
      { key: 'expand-moderate', icon: Maximize2, labelZh: '适中', labelEn: 'Moderate' },
      { key: 'expand-extensive', icon: Maximize2, labelZh: '大幅', labelEn: 'Extensive' },
    ],
  },
  {
    key: 'shrink', icon: Minimize2, labelZh: '精简', labelEn: 'Shrink',
    subActions: [
      { key: 'shrink-slight', icon: Minimize2, labelZh: '微调', labelEn: 'Slight' },
      { key: 'shrink-moderate', icon: Minimize2, labelZh: '适中', labelEn: 'Moderate' },
      { key: 'shrink-extensive', icon: Minimize2, labelZh: '大幅', labelEn: 'Extensive' },
    ],
  },
  { key: 'add-example', icon: Lightbulb, labelZh: '例证', labelEn: 'Example' },
]

/** Secondary actions — shown when "..." is clicked */
const SECONDARY_ACTIONS: FloatingToolbarAction[] = [
  { key: 'deepen', icon: ShieldCheck, labelZh: '深化', labelEn: 'Deepen' },
  { key: 'simplify', icon: Minimize2, labelZh: '通俗化', labelEn: 'Simplify' },
  { key: 'rewrite', icon: PenLine, labelZh: '改写', labelEn: 'Rewrite' },
  { key: 'crossref', icon: GitBranch, labelZh: '串珠', labelEn: 'Cross Ref' },
]

interface FloatingToolbarProps {
  /** Position relative to the editor container */
  position: { x: number; y: number }
  /** Callback when an action button is clicked */
  onAction: (action: string) => void
  /** Whether the toolbar is visible */
  visible: boolean
}

/**
 * FloatingToolbar — Enhanced floating toolbar for selected text AI actions
 *
 * Primary actions (polish, expand, shrink, verse, example) always visible.
 * Secondary actions (deepen, simplify, rewrite, crossref) behind "..." menu.
 * This is now the PRIMARY AI interface for text selection.
 */
export function FloatingToolbar({ position, onAction, visible }: FloatingToolbarProps) {
  const { locale } = useTranslation()
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)
  const [showMore, setShowMore] = useState(false)

  if (!visible) return null

  const allActions = showMore
    ? [...PRIMARY_ACTIONS, ...SECONDARY_ACTIONS]
    : PRIMARY_ACTIONS

  return (
    <div
      className="
        absolute z-50 flex items-center gap-0.5
        bg-popover border border-border rounded-lg
        shadow-lg shadow-black/10 dark:shadow-black/30
        py-1 px-1
        animate-in fade-in-0 zoom-in-95 duration-100
      "
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%) translateY(-8px)',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {allActions.map((action) => {
        const Icon = action.icon
        const label = locale === 'en' ? action.labelEn : action.labelZh
        const hasSubActions = action.subActions && action.subActions.length > 0
        const isHovered = hoveredAction === action.key

        return (
          <div key={action.key} className="relative">
            <button
              onClick={() => {
                if (hasSubActions) return // Don't trigger on hover-only actions
                onAction(action.key)
              }}
              onMouseEnter={() => setHoveredAction(action.key)}
              onMouseLeave={() => setHoveredAction(null)}
              title={label}
              className="
                flex items-center gap-1 px-2 py-1.5 rounded-md
                text-[11px] font-medium text-muted-foreground
                hover:text-foreground hover:bg-accent
                transition-colors duration-100
                whitespace-nowrap
              "
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
              {hasSubActions && <span className="text-[9px] opacity-50">▾</span>}
            </button>

            {/* Sub-actions popup */}
            {hasSubActions && isHovered && (
              <div
                className="
                  absolute top-full left-0 mt-1
                  flex flex-col gap-0.5
                  bg-popover border border-border rounded-lg
                  shadow-lg shadow-black/10 dark:shadow-black/30
                  py-1 px-1
                  animate-in fade-in-0 zoom-in-95 duration-75
                "
                onMouseEnter={() => setHoveredAction(action.key)}
                onMouseLeave={() => setHoveredAction(null)}
              >
                {action.subActions!.map((sub) => {
                  const SubIcon = sub.icon
                  const subLabel = locale === 'en' ? sub.labelEn : sub.labelZh
                  return (
                    <button
                      key={sub.key}
                      onClick={() => onAction(sub.key)}
                      className="
                        flex items-center gap-1.5 px-2 py-1 rounded-md
                        text-[11px] font-medium text-muted-foreground
                        hover:text-foreground hover:bg-accent
                        transition-colors duration-75
                        whitespace-nowrap
                      "
                    >
                      <SubIcon size={11} />
                      <span>{subLabel}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* More actions toggle */}
      <button
        onClick={() => setShowMore(prev => !prev)}
        onMouseEnter={() => setHoveredAction('more')}
        onMouseLeave={() => setHoveredAction(null)}
        title={locale === 'en' ? 'More actions' : '更多操作'}
        className={`
          flex items-center justify-center w-7 h-7 rounded-md
          text-muted-foreground hover:text-foreground hover:bg-accent
          transition-colors duration-100
          ${showMore ? 'bg-accent text-foreground' : ''}
        `}
      >
        <MoreHorizontal size={13} />
      </button>
    </div>
  )
}
