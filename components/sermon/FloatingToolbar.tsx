'use client'

import React from 'react'
import { Sparkles, Maximize2, Minimize2, BookOpen, Lightbulb } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

/** Floating toolbar action definition */
export interface FloatingToolbarAction {
  key: string
  icon: React.ElementType
  labelZh: string
  labelEn: string
}

/** Default actions for the floating toolbar */
export const FLOATING_TOOLBAR_ACTIONS: FloatingToolbarAction[] = [
  { key: 'polish', icon: Sparkles, labelZh: '润色', labelEn: 'Polish' },
  { key: 'expand', icon: Maximize2, labelZh: '扩写', labelEn: 'Expand' },
  { key: 'shorten', icon: Minimize2, labelZh: '缩写', labelEn: 'Shorten' },
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

        return (
          <button
            key={action.key}
            onClick={() => onAction(action.key)}
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
          </button>
        )
      })}
    </div>
  )
}
