'use client'

import { memo } from 'react'
import { Send, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  return (
    <div className="bg-white dark:bg-slate-900 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="p-4 safe-area-bottom">
        <form onSubmit={onSubmit} className="flex gap-2 relative" role="form">
          <input
            className="flex-1 px-4 py-3 pr-12 border border-slate-200 dark:border-slate-700 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="追问..."
            disabled={isLoading}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-8 w-8 rounded-full"
                onClick={onStop}
                aria-label="停止"
              >
                <StopCircle className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700"
                aria-label="发送"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>

        <div className="mt-2 text-[10px] text-center text-slate-400 select-none">
          ⚠️ AI 辅助仅供参考，请依靠圣灵与圣经原文。
        </div>
      </div>
    </div>
  )
})

AIInputForm.displayName = 'AIInputForm'