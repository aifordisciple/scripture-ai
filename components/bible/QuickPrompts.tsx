'use client'

import { memo, useRef, useCallback } from 'react'
import { Sparkles, GraduationCap, FileText, BookMarked, Settings, LayoutList, BookOpen, Search, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { THEOLOGICAL_PROMPTS } from '@/lib/constants'
import { useTranslation, resolveDualLang } from '@/lib/i18n'

export interface QuickPromptsProps {
  isLoading: boolean
  messagesCount: number
  aiMode: 'general' | 'tutor' | 'sermon' | 'study-guide' | 'custom'
  onChipClick: (prompt: string) => void
  customPrompts?: Array<{ id: string; label: string; prompt: string }>
}

const MODE_LABELS: Record<string, string> = {
  general: 'bible.modeDeepExplore',
  tutor: 'bible.modeSocraticGuide',
  sermon: 'bible.modeSermonTool',
  'study-guide': 'bible.modeStudyGuideTool',
  custom: 'bible.modeCustomPrompt',
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
  const { t, locale } = useTranslation()

  // 滚轮横向滚动
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current
    if (!container) return

    // 检查是否有水平滚动空间
    if (container.scrollWidth <= container.clientWidth) return

    // 阻止默认垂直滚动行为
    e.preventDefault()
    e.stopPropagation()

    // 将垂直滚轮转换为水平滚动
    container.scrollLeft += e.deltaY
  }, [])

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
    <div className="px-4 pb-2 pt-3 border-t border-[#e0e0e0] dark:border-[#3a3a3c]">
      <div className="text-[10px] text-[#7a7a7a] font-semibold uppercase tracking-widest pl-1 mb-2">
        {t(MODE_LABELS[aiMode] || MODE_LABELS.general)}
      </div>

      {/* 水平滚动容器 */}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1"
      >
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* 自定义模式 */}
        {aiMode === 'custom' ? (
          <>
            {customPrompts.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-[#7a7a7a]">
                <span>{t('bible.noCustomPrompts')}</span>
                <a href="/settings/prompts" className="text-[#0066cc] hover:text-[#0071e3] underline">
                  {t('bible.goAdd')}
                </a>
              </div>
            ) : (
              customPrompts.map(p => (
                <button
                  key={p.id}
                  onClick={() => onChipClick(p.prompt)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium border dark:border-[#3a3a3c] transition-all active:scale-95 dark:bg-[#2a2a2c] dark:text-white/80 whitespace-nowrap shrink-0 bg-[#f5f5f7] text-[#1d1d1f] border-[#e0e0e0] hover:bg-[#e0e0e0]"
                >
                  <Sparkles className="w-3 h-3" />
                  {p.label}
                </button>
              ))
            )}
            {/* 管理按钮 */}
            <a
              href="/settings/prompts"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium border dark:border-[#3a3a3c] transition-all active:scale-95 dark:bg-[#2a2a2c] dark:text-white/80 whitespace-nowrap shrink-0 bg-[#0066cc]/5 text-[#0066cc] border-[#0066cc]/10 hover:bg-[#0066cc]/10"
            >
              <Settings className="w-3 h-3" />
              {t('bible.manage')}
            </a>
          </>
        ) : (
          // 标准提示词
          displayPrompts.map(t => (
            <button
              key={t.id}
              onClick={() => onChipClick(resolveDualLang(t.prompt, locale))}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium border dark:border-[#3a3a3c] transition-all active:scale-95 dark:bg-[#2a2a2c] dark:text-white/80 whitespace-nowrap shrink-0',
                t.color
              )}
            >
              {getIcon(t.id)}
              {resolveDualLang(t.label, locale)}
            </button>
          ))
        )}
      </div>
    </div>
  )
})

QuickPrompts.displayName = 'QuickPrompts'