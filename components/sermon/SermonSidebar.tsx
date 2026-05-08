'use client'

import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Bot,
  BookMarked,
  LayoutTemplate,
  ListChecks,
  CheckCircle2,
  Settings,
} from 'lucide-react'
import type { SermonPanelType } from '@/store/types'

const PANEL_ICONS: { type: SermonPanelType; icon: typeof BookOpen; key: string }[] = [
  { type: 'list', icon: BookOpen, key: 'panelList' },
  { type: 'ai', icon: Bot, key: 'panelAi' },
  { type: 'verse', icon: BookMarked, key: 'panelVerse' },
  { type: 'template', icon: LayoutTemplate, key: 'panelTemplate' },
  { type: 'outline', icon: ListChecks, key: 'panelOutline' },
  { type: 'review', icon: CheckCircle2, key: 'panelReview' },
  { type: 'settings', icon: Settings, key: 'panelSettings' },
]

export function SermonSidebar() {
  const { t } = useTranslation()
  const { activeSermonPanel, setActiveSermonPanel } = useBibleStore()

  return (
    <div className="w-12 bg-secondary/80 dark:bg-card/80 backdrop-blur-xl flex flex-col items-center py-3 gap-1 border-r border-black/[0.04] dark:border-white/[0.06]">
      {PANEL_ICONS.map(({ type, icon: Icon, key }) => {
        const isActive = activeSermonPanel === type
        return (
          <button
            key={type}
            onClick={() => setActiveSermonPanel(isActive ? 'list' : type)}
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150',
              isActive
                ? 'bg-primary text-white active:scale-95'
                : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            )}
            title={t(`sermon.${key}`)}
          >
            <Icon className="w-[18px] h-[18px]" />
          </button>
        )
      })}
    </div>
  )
}