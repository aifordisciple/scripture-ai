'use client'

import { useTranslation } from '@/lib/i18n'
import { BookOpen, Plus } from 'lucide-react'

export function SermonEmptyState({ onNewSermon }: { onNewSermon?: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="h-full flex items-center justify-center bg-white dark:bg-[#272729]"
      style={{ fontFamily: "'SF Pro Display', 'SF Pro Text', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      <div className="text-center px-6" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <BookOpen className="w-16 h-16 mx-auto mb-5 text-[#7a7a7a]/30" strokeWidth={1.2} />
        <h3 className="text-[28px] font-semibold text-[#1d1d1f] dark:text-white mb-2 leading-tight"
          style={{ letterSpacing: '0.196px' }}
        >
          {t('sermon.emptyTitle')}
        </h3>
        <p className="text-sm text-[#7a7a7a] dark:text-[#999] mb-8 max-w-[280px] mx-auto leading-relaxed">
          {t('sermon.emptyDesc')}
        </p>
        {onNewSermon && (
          <button
            onClick={onNewSermon}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-sm font-normal transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t('sermon.newSermon')}
          </button>
        )}
      </div>
    </div>
  )
}