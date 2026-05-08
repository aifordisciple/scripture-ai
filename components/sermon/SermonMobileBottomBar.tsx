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
  PenLine,
} from 'lucide-react'
import type { SermonPanelType } from '@/store/types'

type MobileTabType = SermonPanelType | 'editor'

const MOBILE_TAB_ICONS: { type: MobileTabType; icon: typeof BookOpen; key: string }[] = [
  { type: 'list', icon: BookOpen, key: 'panelList' },
  { type: 'editor', icon: PenLine, key: 'mobileTabEditor' },
  { type: 'ai', icon: Bot, key: 'panelAi' },
  { type: 'verse', icon: BookMarked, key: 'panelVerse' },
  { type: 'template', icon: LayoutTemplate, key: 'panelTemplate' },
  { type: 'outline', icon: ListChecks, key: 'panelOutline' },
  { type: 'review', icon: CheckCircle2, key: 'panelReview' },
  { type: 'settings', icon: Settings, key: 'panelSettings' },
]

export function SermonMobileBottomBar() {
  const { t } = useTranslation()
  const {
    activeSermonPanel, setActiveSermonPanel,
    sermonMobileView, setSermonMobileView,
    currentSermon,
  } = useBibleStore()

  const handleTabPress = (type: MobileTabType) => {
    if (type === 'editor') {
      setSermonMobileView('editor')
    } else {
      setActiveSermonPanel(type)
      setSermonMobileView('list')
    }
  }

  const isActive = (type: MobileTabType) => {
    if (type === 'editor') return sermonMobileView === 'editor' && !!currentSermon
    return sermonMobileView === 'list' && activeSermonPanel === type
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 glass-panel border-t border-b-0 rounded-t-2xl flex items-center justify-around px-1 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
      style={{ fontFamily: "'SF Pro Display', 'SF Pro Text', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {MOBILE_TAB_ICONS.map(({ type, icon: Icon, key }) => {
        const active = isActive(type)
        const disabled = type === 'editor' && !currentSermon
        return (
          <button
            key={type}
            onClick={() => !disabled && handleTabPress(type)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center justify-center w-11 h-11 rounded-lg transition-all duration-150 active:scale-95',
              active
                ? 'text-primary'
                : 'text-muted-foreground dark:text-muted-foreground',
 disabled && 'opacity-30'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] mt-0.5 truncate max-w-[48px]"
              style={{ letterSpacing: '-0.06px' }}
            >
              {type === 'editor' ? t('sermon.mobileTabEditor') : t(`sermon.${key}`)}
            </span>
          </button>
        )
      })}
    </div>
  )
}