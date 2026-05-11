'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from 'ai/react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { useBreakpoint } from '@/hooks/use-media-query'
import { Bot, Send, StopCircle, ClipboardPaste, Sparkles, PenLine, BookOpen, Lightbulb, Link2, Target, MessageCircle, Compass, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSermonEditor } from './SermonEditorContext'
import { stripAllThinkTags } from '@/lib/ai'
import { getStageInfo, getStageSuggestions } from '@/lib/sermon-flow'

type AiTab = 'chat' | 'suggest' | 'context'

export function SermonAIPanel() {
  const { t } = useTranslation()
  const { isMd } = useBreakpoint()
  const { currentSermon, apiConfig, locale, sermonFlowStage, sermonAiSuggestions } = useBibleStore()
  const { insertContent } = useSermonEditor()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [chatKey, setChatKey] = useState(0)
  const [activeTab, setActiveTab] = useState<AiTab>('chat')
  const prevSermonIdRef = useRef(currentSermon?.id)

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
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleInsertToEditor = (content: string) => {
    if (!currentSermon) return
    insertContent(content)
  }

  const quickPrompts = [
    { key: 'aiQuickContinue', icon: Sparkles, promptKey: 'aiQuickContinuePrompt' },
    { key: 'aiQuickPolish', icon: PenLine, promptKey: 'aiQuickPolishPrompt' },
    { key: 'aiQuickVerse', icon: BookOpen, promptKey: 'aiQuickVersePrompt' },
    { key: 'aiQuickExample', icon: Lightbulb, promptKey: 'aiQuickExamplePrompt' },
    { key: 'aiQuickCrossRef', icon: Link2, promptKey: 'aiQuickCrossRefPrompt' },
    { key: 'aiQuickApplication', icon: Target, promptKey: 'aiQuickApplicationPrompt' },
  ]

  const stageInfo = getStageInfo(sermonFlowStage)
  const suggestions = sermonAiSuggestions.length > 0 ? sermonAiSuggestions : getStageSuggestions(sermonFlowStage)

  if (!currentSermon) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">{t('sermon.aiNoSermon')}</p>
      </div>
    )
  }

  const tabs: { key: AiTab; icon: typeof Bot; label: string }[] = [
    { key: 'chat', icon: MessageCircle, label: locale === 'en' ? 'Chat' : '对话' },
    { key: 'suggest', icon: Compass, label: locale === 'en' ? 'Suggest' : '建议' },
    { key: 'context', icon: FileText, label: locale === 'en' ? 'Context' : '上下文' },
  ]

  return (
    <div className="h-full flex flex-col bg-secondary">
      {/* Header with tabs */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 mb-2">
          <Bot className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground/90">{locale === 'en' ? 'AI Copilot' : 'AI 副驾驶'}</span>
        </div>
        <div className="flex gap-0.5">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] rounded-md transition-colors ${
                activeTab === key
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'chat' && (
        <>
          {/* Quick Prompts */}
          <div className="px-3 py-2 border-b border-border flex flex-wrap gap-1">
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
                className={`inline-flex items-center gap-1 ${isMd ? 'px-2 py-1' : 'px-3 py-2 min-h-[36px]'} text-[10px] rounded-full bg-card border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-50 transition-colors active:scale-95`}
              >
                <Icon className="w-2.5 h-2.5" />
                {t(`sermon.${key}`)}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>{t('sermon.aiPlaceholder')}</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground/90'
                }`}>
                  <div className="whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{stripAllThinkTags(msg.content)}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleInsertToEditor(stripAllThinkTags(msg.content))}
                      className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary/80"
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
                <div className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
                  {t('sermon.aiThinking')}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-border">
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
                className={`flex-1 px-2.5 ${isMd ? 'py-1.5' : 'py-2.5'} text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50`}
              />
              {isLoading ? (
                <button type="button" onClick={() => stop()} className={`${isMd ? 'p-1.5' : 'p-2.5 min-h-[44px] min-w-[44px]'} rounded-lg text-destructive hover:bg-destructive/10 active:scale-95`}>
                  <StopCircle className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={!input.trim()} className={`${isMd ? 'p-1.5' : 'p-2.5 min-h-[44px] min-w-[44px]'} rounded-lg text-primary hover:bg-primary/10 disabled:opacity-30 active:scale-95`}>
                  <Send className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </>
      )}

      {activeTab === 'suggest' && (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {/* Current stage */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {locale === 'en' ? stageInfo.labelEn : stageInfo.labelZh}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {locale === 'en' ? stageInfo.descriptionEn : stageInfo.descriptionZh}
            </p>
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            {suggestions.map((suggestion) => {
              const iconMap: Record<string, typeof Sparkles> = {
                continue: Sparkles,
                polish: PenLine,
                'insert-verse': BookOpen,
                'add-example': Lightbulb,
                'cross-ref': Link2,
                review: Target,
              }
              const Icon = iconMap[suggestion.action] || Sparkles
              return (
                <button
                  key={suggestion.id}
                  onClick={() => {
                    // Trigger the action via the AI chat
                    const promptText = locale === 'en' ? suggestion.labelEn : suggestion.labelZh
                    setInput(promptText)
                    setActiveTab('chat')
                    setTimeout(() => handleSubmit(), 0)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs text-foreground/90">
                    {locale === 'en' ? suggestion.labelEn : suggestion.labelZh}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'context' && (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {/* Sermon info */}
          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <h4 className="text-xs font-semibold text-foreground/90">
              {locale === 'en' ? 'Sermon Info' : '讲章信息'}
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{locale === 'en' ? 'Title' : '标题'}</span>
                <span className="text-foreground/80 font-medium">{currentSermon.title || (locale === 'en' ? 'Untitled' : '无标题')}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{locale === 'en' ? 'Style' : '风格'}</span>
                <span className="text-foreground/80 font-medium">{currentSermon.style}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{locale === 'en' ? 'Status' : '状态'}</span>
                <span className="text-foreground/80 font-medium">{currentSermon.status}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{locale === 'en' ? 'Words' : '字数'}</span>
                <span className="text-foreground/80 font-medium">{currentSermon.wordCount}</span>
              </div>
            </div>
          </div>

          {/* Verse refs */}
          {currentSermon.verseRefs && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <h4 className="text-xs font-semibold text-foreground/90">
                {locale === 'en' ? 'Verse References' : '经文引用'}
              </h4>
              <div className="flex flex-wrap gap-1">
                {currentSermon.verseRefs.split(';').map((ref, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                    {ref.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Flow stage */}
          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <h4 className="text-xs font-semibold text-foreground/90">
              {locale === 'en' ? 'Progress' : '写作进度'}
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stageInfo.progress}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{stageInfo.progress}%</span>
            </div>
            <p className="text-[10px] text-primary font-medium">
              {locale === 'en' ? stageInfo.labelEn : stageInfo.labelZh}
            </p>
          </div>

          {/* Content outline */}
          {currentSermon.content && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <h4 className="text-xs font-semibold text-foreground/90">
                {locale === 'en' ? 'Outline' : '大纲结构'}
              </h4>
              <div className="space-y-1">
                {currentSermon.content.split('\n')
                  .filter(line => /^#{1,3}\s/.test(line))
                  .slice(0, 8)
                  .map((line, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground pl-2 border-l-2 border-primary/20">
                      {line.replace(/^#{1,3}\s/, '').replace(/[🎯💡📌📖🔧✅🙏]/g, '').trim()}
                    </p>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
