'use client'

import React, { useState } from 'react'
import { Sparkles, Maximize2, Minimize2, BookOpen, Lightbulb } from 'lucide-react'
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

/** Default actions for the floating toolbar */
export const FLOATING_TOOLBAR_ACTIONS: FloatingToolbarAction[] = [
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
  { key: 'insert-verse', icon: BookOpen, labelZh: '插入经文', labelEn: 'Insert Verse' },
  { key: 'add-example', icon: Lightbulb, labelZh: '添加例证', labelEn: 'Add Example' },
]

interface FloatingToolbarProps {
  /** Position relative to the editor container */
  position: { x: number; y: number }
  /** Callback when an action button is clicked */
  onAction: (action: string) => void
  /** Whether the toolbar is visible */
  visible: boolean
}

/** Floating toolbar that appears above selected text in the editor */
export function FloatingToolbar({ position, onAction, visible }: FloatingToolbarProps) {
  const { locale } = useTranslation()
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  if (!visible) return null

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
      {FLOATING_TOOLBAR_ACTIONS.map((action) => {
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
    </div>
  )
}
