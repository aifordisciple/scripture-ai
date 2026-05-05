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
    <div className="w-12 bg-[#f5f5f7]/80 dark:bg-[#272729]/80 backdrop-blur-xl backdrop-saturate-[180%] flex flex-col items-center py-3 gap-1 border-r border-black/[0.04] dark:border-white/[0.06]">
      {PANEL_ICONS.map(({ type, icon: Icon, key }) => {
        const isActive = activeSermonPanel === type
        return (
          <button
            key={type}
            onClick={() => setActiveSermonPanel(isActive ? 'list' : type)}
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150',
              isActive
                ? 'bg-[#0066cc] text-white active:scale-95'
                : 'text-[#7a7a7a] dark:text-[#999] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
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