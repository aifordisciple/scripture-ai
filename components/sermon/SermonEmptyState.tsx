'use client'

import { useTranslation } from '@/lib/i18n'
import { BookOpen } from 'lucide-react'

export function SermonEmptyState() {
  const { t } = useTranslation()

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-5">
        <BookOpen className="w-10 h-10 text-orange-400 dark:text-orange-500" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('sermon.noSermons')}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">{t('sermon.noSermonsDesc')}</p>
    </div>
  )
}
