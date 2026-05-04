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
    <div className="w-10 bg-primary flex flex-col items-center py-3 gap-1 border-r border-primary-foreground/20">
      {PANEL_ICONS.map(({ type, icon: Icon, key }) => {
        const isActive = activeSermonPanel === type
        return (
          <button
            key={type}
            onClick={() => setActiveSermonPanel(isActive ? 'list' : type)}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isActive
                ? 'bg-primary-foreground text-primary'
                : 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary/80'
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
