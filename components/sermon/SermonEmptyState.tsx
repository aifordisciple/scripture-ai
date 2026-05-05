'use client'

import { useTranslation } from '@/lib/i18n'
import { useBreakpoint } from '@/hooks/use-media-query'
import { BookOpen, Plus } from 'lucide-react'

export function SermonEmptyState({ onNewSermon }: { onNewSermon?: () => void }) {
  const { t } = useTranslation()
  const { isMd } = useBreakpoint()

  return (
    <div className="h-full flex items-center justify-center bg-card dark:bg-card"
      style={{ fontFamily: "'SF Pro Display', 'SF Pro Text', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      <div className={`text-center px-6 ${isMd ? '' : 'pb-20'}`} style={{ paddingTop: isMd ? '80px' : '40px', paddingBottom: isMd ? '80px' : '40px' }}>
        <BookOpen className="w-16 h-16 mx-auto mb-5 text-muted-foreground/30" strokeWidth={1.2} />
        <h3 className="text-[28px] font-semibold text-foreground dark:text-foreground mb-2 leading-tight"
          style={{ letterSpacing: '0.196px' }}
        >
          {t('sermon.emptyTitle')}
        </h3>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-8 max-w-[280px] mx-auto leading-relaxed">
          {t('sermon.emptyDesc')}
        </p>
        {onNewSermon && (
          <button
            onClick={onNewSermon}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary hover:bg-apple-focus text-white text-sm font-normal transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t('sermon.newSermon')}
          </button>
        )}
      </div>
    </div>
  )
}