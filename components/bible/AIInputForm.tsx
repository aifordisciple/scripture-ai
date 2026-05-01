'use client'

import { memo } from 'react'
import { Send, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'

export interface AIInputFormProps {
  input: string
  isLoading: boolean
  onInputChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onStop: () => void
}

export const AIInputForm = memo(function AIInputForm({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStop,
}: AIInputFormProps) {
  const { t } = useTranslation()
  return (
    <div className="bg-white dark:bg-slate-900 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="p-4 safe-area-bottom">
        <form onSubmit={onSubmit} className="flex gap-2 items-end relative" role="form">
          <textarea
            className="flex-1 px-4 py-3 pr-12 border border-slate-200 dark:border-slate-700 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 resize-none max-h-32"
            value={input}
            onChange={(e) => {
              onInputChange(e.target.value)
              // 自动增长高度
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSubmit(e)
              }
            }}
            placeholder={t('bible.followUpPlaceholder')}
            disabled={isLoading}
            rows={1}
          />

          <div className="absolute right-2 bottom-2">
            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-8 w-8 rounded-full"
                onClick={onStop}
                aria-label={t('bible.stop')}
              >
                <StopCircle className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700"
                aria-label={t('bible.send')}
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>

        <div className="mt-2 text-[10px] text-center text-slate-400 select-none">
          {t('bible.aiDisclaimer')}
        </div>
      </div>
    </div>
  )
})

AIInputForm.displayName = 'AIInputForm'