'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from 'ai/react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { useSermonEditor } from './SermonEditorContext'
import { Bot, Send, StopCircle, ClipboardPaste, Sparkles, PenLine, BookOpen, Lightbulb, Link2, Target } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function SermonAIPanel() {
  const { t } = useTranslation()
  const { currentSermon, apiConfig, locale } = useBibleStore()
  const editor = useSermonEditor()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [chatKey, setChatKey] = useState(0)
  const prevSermonIdRef = useRef(currentSermon?.id)

  // Reset chat when switching sermons
  useEffect(() => {
    if (currentSermon?.id !== prevSermonIdRef.current) {
      prevSermonIdRef.current = currentSermon?.id
      setChatKey(prev => prev + 1)
    }
  }, [currentSermon?.id])

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, error } = useChat({
    id: `sermon-ai-${currentSermon?.id || 'none'}-${chatKey}`,
    api: currentSermon ? `/api/sermon/${currentSermon.id}/ai-chat` : '',
    body: { apiConfig, locale },
    streamProtocol: 'data',
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleInsertToEditor = (content: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(content).run()
  }

  const quickPrompts = [
    { key: 'aiQuickContinue', icon: Sparkles, promptKey: 'aiQuickContinuePrompt' },
    { key: 'aiQuickPolish', icon: PenLine, promptKey: 'aiQuickPolishPrompt' },
    { key: 'aiQuickVerse', icon: BookOpen, promptKey: 'aiQuickVersePrompt' },
    { key: 'aiQuickExample', icon: Lightbulb, promptKey: 'aiQuickExamplePrompt' },
    { key: 'aiQuickCrossRef', icon: Link2, promptKey: 'aiQuickCrossRefPrompt' },
    { key: 'aiQuickApplication', icon: Target, promptKey: 'aiQuickApplicationPrompt' },
  ]

  if (!currentSermon) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-xs text-slate-400">{t('sermon.aiNoSermon')}</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('sermon.aiPanelTitle')}</span>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1">
        {quickPrompts.map(({ key, icon: Icon, promptKey }) => (
          <button
            key={key}
            onClick={() => {
              if (!isLoading) {
                handleSubmit(undefined, { content: t(`sermon.${promptKey}`) } as any)
              }
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 disabled:opacity-50 transition-colors"
          >
            <Icon className="w-2.5 h-2.5" />
            {t(`sermon.${key}`)}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            <Bot className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>{t('sermon.aiPlaceholder')}</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              <div className="whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => handleInsertToEditor(msg.content)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600"
                >
                  <ClipboardPaste className="w-2.5 h-2.5" />
                  {t('sermon.aiInsertToEditor')}
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-400">
              {t('sermon.aiThinking')}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(e)
          }}
          className="flex items-center gap-1"
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={t('sermon.aiPlaceholder')}
            disabled={isLoading}
            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          {isLoading ? (
            <button type="button" onClick={() => stop()} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              <StopCircle className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-30">
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
