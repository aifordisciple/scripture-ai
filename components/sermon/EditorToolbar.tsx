'use client'

import React, { useState } from 'react'
import {
  Bold, Italic, Heading2, Heading3, List, Quote,
  Sparkles, Wand2, Eye, EyeOff, Maximize2, Minimize2,
  Loader2, ChevronDown
} from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'

interface EditorToolbarProps {
  isGenerating: boolean
  onAIAssist: (action: string) => void
  onFormat: (type: 'bold' | 'italic' | 'h2' | 'h3' | 'list' | 'quote') => void
  onFocusMode?: () => void
  isFocusMode?: boolean
}

/** AI assist dropdown options */
const AI_OPTIONS = [
  { action: 'continue', zhLabel: '续写', enLabel: 'Continue', icon: Sparkles },
  { action: 'polish', zhLabel: '润色', enLabel: 'Polish', icon: Wand2 },
  { action: 'add-example', zhLabel: '添加例证', enLabel: 'Add Illustration', icon: Sparkles },
  { action: 'add-application', zhLabel: '添加应用', enLabel: 'Add Application', icon: Sparkles },
  { action: 'add-transition', zhLabel: '添加过渡', enLabel: 'Add Transition', icon: Sparkles },
  { action: 'add-prayer', zhLabel: '添加祷告', enLabel: 'Add Prayer', icon: Sparkles },
  { action: 'expand', zhLabel: '展开', enLabel: 'Expand', icon: Maximize2 },
  { action: 'shrink', zhLabel: '精简', enLabel: 'Shrink', icon: Minimize2 },
]

export function EditorToolbar({ isGenerating, onAIAssist, onFormat, onFocusMode, isFocusMode }: EditorToolbarProps) {
  const { locale } = useBibleStore()
  const isZh = locale !== 'en'
  const [showAIMenu, setShowAIMenu] = useState(false)

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-secondary/50">
      {/* Format buttons */}
      <div className="flex items-center gap-0.5 border-r border-border/50 pr-2">
        <button
          onClick={() => onFormat('bold')}
          className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          title={isZh ? '加粗' : 'Bold'}
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => onFormat('italic')}
          className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          title={isZh ? '斜体' : 'Italic'}
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => onFormat('h2')}
          className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          title={isZh ? '二级标题' : 'Heading 2'}
        >
          <Heading2 size={14} />
        </button>
        <button
          onClick={() => onFormat('h3')}
          className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          title={isZh ? '三级标题' : 'Heading 3'}
        >
          <Heading3 size={14} />
        </button>
        <button
          onClick={() => onFormat('list')}
          className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          title={isZh ? '列表' : 'List'}
        >
          <List size={14} />
        </button>
        <button
          onClick={() => onFormat('quote')}
          className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          title={isZh ? '引用' : 'Quote'}
        >
          <Quote size={14} />
        </button>
      </div>

      {/* AI Assist dropdown */}
      <div className="relative border-r border-border/50 pr-2">
        <button
          onClick={() => setShowAIMenu(!showAIMenu)}
          disabled={isGenerating}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
            isGenerating
              ? 'bg-primary/10 text-primary cursor-wait'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          {isGenerating ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} />
          )}
          {isGenerating
            ? (isZh ? '生成中...' : 'Generating...')
            : (isZh ? 'AI助手' : 'AI Assist')
          }
          {!isGenerating && <ChevronDown size={10} />}
        </button>

        {showAIMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowAIMenu(false)} />
            <div className="absolute left-0 top-full mt-1 z-50 w-40 bg-card border border-border rounded-lg shadow-lg py-1">
              {AI_OPTIONS.map(opt => (
                <button
                  key={opt.action}
                  onClick={() => {
                    onAIAssist(opt.action)
                    setShowAIMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-foreground/80 hover:bg-muted/50 transition-colors"
                >
                  <opt.icon size={12} className="text-primary/60" />
                  {isZh ? opt.zhLabel : opt.enLabel}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Focus mode toggle */}
      {onFocusMode && (
        <button
          onClick={onFocusMode}
          className={`p-1.5 rounded transition-colors ${
            isFocusMode
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
              : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
          title={isFocusMode ? (isZh ? '退出专注模式' : 'Exit Focus') : (isZh ? '专注模式' : 'Focus Mode')}
        >
          {isFocusMode ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}

      {/* Generating indicator */}
      {isGenerating && (
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-primary animate-pulse">
          <Loader2 size={10} className="animate-spin" />
          <span>{isZh ? 'AI生成中' : 'AI generating'}</span>
        </div>
      )}
    </div>
  )
}
