'use client'

import { useTranslation } from '@/lib/i18n'
import { BookOpen, Plus } from 'lucide-react'

export function SermonEmptyState({ onNewSermon }: { onNewSermon?: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <h3 className="text-sm font-medium text-foreground/90 mb-1">{t('sermon.emptyTitle')}</h3>
        <p className="text-xs text-muted-foreground mb-4">{t('sermon.emptyDesc')}</p>
        {onNewSermon && (
          <button
            onClick={onNewSermon}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('sermon.newSermon')}
          </button>
        )}
      </div>
    </div>
  )
}