'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useChat } from 'ai/react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { useBreakpoint } from '@/hooks/use-media-query'
import { Bot, Send, StopCircle, X, Sparkles, PenLine, Lightbulb } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { stripAllThinkTags } from '@/lib/ai'

interface AIDrawerProps {
  /** Whether the drawer is open */
  open: boolean
  /** Callback to close the drawer */
  onClose: () => void
}

/**
 * AIDrawer — Slide-in AI chat drawer replacing the fixed SermonAIPanel
 *
 * Key improvements over SermonAIPanel:
 * - Slides in from right as overlay (doesn't shrink editor)
 * - Chat-only interface (suggest/context tabs removed — covered by CommandPalette)
 * - AI responses auto-flow into editor by default
 * - Quick prompts reduced to 3 most useful
 * - Cmd+J shortcut to toggle
 */
export function AIDrawer({ open, onClose }: AIDrawerProps) {
  const { t } = useTranslation()
  const { isMd } = useBreakpoint()
  const { currentSermon, apiConfig, locale } = useBibleStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [chatKey, setChatKey] = useState(0)
  const [autoFlow, setAutoFlow] = useState(true)
  const prevSermonIdRef = useRef(currentSermon?.id)

  /** Insert content into the editor via custom event */
  const insertToEditor = useCallback((text: string) => {
    window.dispatchEvent(new CustomEvent('sermon:insert-content', { detail: { content: text } }))
  }, [])

  // Reset chat when switching sermons
  useEffect(() => {
    if (currentSermon?.id !== prevSermonIdRef.current) {
      prevSermonIdRef.current = currentSermon?.id
      setChatKey(prev => prev + 1)
    }
  }, [currentSermon?.id])

  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading, stop, error } = useChat({
    id: `sermon-ai-${currentSermon?.id || 'none'}-${chatKey}`,
    api: currentSermon ? `/api/sermon/${currentSermon.id}/ai-chat` : '',
    body: { apiConfig, locale },
    streamProtocol: 'data',
    onFinish: (message) => {
      // Auto-flow: insert AI response into editor
      if (autoFlow && message.role === 'assistant') {
        const content = stripAllThinkTags(message.content)
        if (content && content.trim().length > 20) {
          // Small delay to let the message render first
          setTimeout(() => {
            insertToEditor(content)
          }, 300)
        }
      }
    },
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Cmd+J shortcut to toggle
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        // This is handled by SermonEditor, but we also close on Escape
      }
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const quickPrompts = [
    { key: 'aiQuickContinue', icon: Sparkles, promptKey: 'aiQuickContinuePrompt' },
    { key: 'aiQuickPolish', icon: PenLine, promptKey: 'aiQuickPolishPrompt' },
    { key: 'aiQuickExample', icon: Lightbulb, promptKey: 'aiQuickExamplePrompt' },
  ]

  if (!currentSermon) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[400px] max-w-[90vw] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground/90">
              {locale === 'en' ? 'AI Chat' : 'AI 对话'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto-flow toggle */}
            <button
              onClick={() => setAutoFlow(prev => !prev)}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                autoFlow
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
              title={locale === 'en' ? 'Auto-insert AI responses into editor' : 'AI回复自动插入编辑器'}
            >
              {locale === 'en' ? (autoFlow ? 'Auto-flow' : 'Manual') : (autoFlow ? '自动流入' : '手动插入')}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-1">
          {quickPrompts.map(({ key, icon: Icon, promptKey }) => (
            <button
              key={key}
              onClick={() => {
                if (!isLoading) {
                  const promptText = t(`sermon.${promptKey}`)
                  setInput(promptText)
                  setTimeout(() => handleSubmit(), 0)
                }
              }}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-50 transition-colors active:scale-95"
            >
              <Icon className="w-3 h-3" />
              {t(`sermon.${key}`)}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12 text-xs text-muted-foreground">
              <Bot className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium mb-1">{t('sermon.aiPlaceholder')}</p>
              <p className="text-[10px] text-muted-foreground/60">
                {locale === 'en'
                  ? 'AI responses will auto-insert into the editor'
                  : 'AI回复将自动插入编辑器'}
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-foreground/90'
              }`}>
                <div className="whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{stripAllThinkTags(msg.content)}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === 'assistant' && !autoFlow && (
                  <button
                    onClick={() => insertToEditor(stripAllThinkTags(msg.content))}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium"
                  >
                    {locale === 'en' ? 'Insert to editor' : '插入编辑器'}
                  </button>
                )}
                {msg.role === 'assistant' && autoFlow && (
                  <div className="mt-1.5 text-[10px] text-primary/50 flex items-center gap-1">
                    <span>→</span>
                    <span>{locale === 'en' ? 'Inserted' : '已插入'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-muted-foreground animate-pulse">
                {t('sermon.aiThinking')}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit(e)
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={handleInputChange}
              placeholder={t('sermon.aiPlaceholder')}
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
            {isLoading ? (
              <button type="button" onClick={() => stop()} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 active:scale-95">
                <StopCircle className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={!input.trim()} className="p-2 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-30 active:scale-95">
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  )
}
