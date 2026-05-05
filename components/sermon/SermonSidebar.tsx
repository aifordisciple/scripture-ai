'use client'

import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Bot,
  BookMarked,
  LayoutTemplate,
  CheckCircle2,
  Settings,
} from 'lucide-react'
import type { SermonPanelType } from '@/store/types'

const PANEL_ICONS: { type: SermonPanelType; icon: typeof BookOpen; key: string }[] = [
  { type: 'list', icon: BookOpen, key: 'panelList' },
  { type: 'ai', icon: Bot, key: 'panelAi' },
  { type: 'verse', icon: BookMarked, key: 'panelVerse' },
  { type: 'template', icon: LayoutTemplate, key: 'panelTemplate' },
  { type: 'review', icon: CheckCircle2, key: 'panelReview' },
  { type: 'settings', icon: Settings, key: 'panelSettings' },
]

export function SermonSidebar() {
  const { t } = useTranslation()
  const { activeSermonPanel, setActiveSermonPanel } = useBibleStore()

  return (
    <div className="w-10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl flex flex-col items-center py-3 gap-1 border-r border-slate-200/60 dark:border-slate-800/60">
      {PANEL_ICONS.map(({ type, icon: Icon, key }) => {
        const isActive = activeSermonPanel === type
        return (
          <button
            key={type}
            onClick={() => setActiveSermonPanel(isActive ? 'list' : type)}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isActive
                ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/40'
            )}
            title={t(`sermon.${key}`)}
          >
            <Icon className="w-4 h-4" />
          </button>
        )
      })}
    </div>
  )
}
