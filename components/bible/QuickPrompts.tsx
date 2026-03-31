'use client'

import { memo } from 'react'
import { Sparkles, GraduationCap, FileText, BookMarked, Settings, LayoutList, BookOpen, Search, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { THEOLOGICAL_PROMPTS } from '@/lib/constants'

export interface QuickPromptsProps {
  isLoading: boolean
  messagesCount: number
  aiMode: 'general' | 'tutor' | 'sermon' | 'study-guide' | 'custom'
  onChipClick: (prompt: string) => void
  customPrompts?: Array<{ id: string; label: string; prompt: string }>
}

const MODE_LABELS: Record<string, string> = {
  general: '深度探索',
  tutor: '苏格拉底式引导',
  sermon: '讲章工具',
  'study-guide': '查经工具',
  custom: '自定义快捷问题',
}

const getIcon = (id: string) => {
  switch (id) {
    case 'detail':
      return <LayoutList className="w-3 h-3" />
    case 'context':
      return <BookOpen className="w-3 h-3" />
    case 'original':
      return <Search className="w-3 h-3" />
    case 'application':
      return <Lightbulb className="w-3 h-3" />
    default:
      return <Sparkles className="w-3 h-3" />
  }
}

export const QuickPrompts = memo(function QuickPrompts({
  isLoading,
  messagesCount,
  aiMode,
  onChipClick,
  customPrompts = [],
}: QuickPromptsProps) {
  // 不在加载时或没有消息时渲染
  if (isLoading || messagesCount === 0) {
    return null
  }

  // 根据模式获取显示的提示词
  const displayPrompts = aiMode === 'custom'
    ? [] // 自定义模式使用 customPrompts
    : THEOLOGICAL_PROMPTS.filter(t => {
        if (aiMode === 'tutor') return t.id === 'tutor'
        if (aiMode === 'sermon') return t.id === 'sermon'
        if (aiMode === 'study-guide') return t.id === 'study-guide'
        return !t.mode // 标准模式显示基础提示词
      })

  return (
    <div className="px-4 pb-2 pt-3 border-t border-slate-100 dark:border-slate-800">
      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1 mb-2">
        {MODE_LABELS[aiMode] || '深度探索'}
      </div>

      {/* 水平滚动容器 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* 自定义模式 */}
        {aiMode === 'custom' ? (
          <>
            {customPrompts.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
                <span>暂无自定义问题</span>
                <a href="/settings/prompts" className="text-blue-500 hover:text-blue-600 underline">
                  去添加
                </a>
              </div>
            ) : (
              customPrompts.map(p => (
                <button
                  key={p.id}
                  onClick={() => onChipClick(p.prompt)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium border dark:border-slate-700 transition-all active:scale-95 shadow-sm dark:bg-slate-800 dark:text-slate-200 hover:brightness-95 whitespace-nowrap shrink-0 bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                >
                  <Sparkles className="w-3 h-3" />
                  {p.label}
                </button>
              ))
            )}
            {/* 管理按钮 */}
            <a
              href="/settings/prompts"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium border dark:border-slate-700 transition-all active:scale-95 shadow-sm dark:bg-slate-800 dark:text-slate-200 hover:brightness-95 whitespace-nowrap shrink-0 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              <Settings className="w-3 h-3" />
              管理
            </a>
          </>
        ) : (
          // 标准提示词
          displayPrompts.map(t => (
            <button
              key={t.id}
              onClick={() => onChipClick(t.prompt)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium border dark:border-slate-700 transition-all active:scale-95 shadow-sm dark:bg-slate-800 dark:text-slate-200 hover:brightness-95 whitespace-nowrap shrink-0',
                t.color
              )}
            >
              {getIcon(t.id)}
              {t.label}
            </button>
          ))
        )}
      </div>
    </div>
  )
})

QuickPrompts.displayName = 'QuickPrompts'