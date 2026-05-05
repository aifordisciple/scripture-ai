'use client'

import { memo, useRef, useCallback, useEffect, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, Bookmark, Share2, RefreshCw, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AudioButton } from './AudioButton'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from '@/lib/i18n'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface VirtualizedMessageListProps {
  messages: Message[]
  isLoading: boolean
  error: Error | null
  onRetry?: () => void
  onSaveInsight?: (messageId: string, content: string) => void
  onShare?: () => void
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge'
  isSaved?: (messageId: string) => boolean
}

// 消息气泡组件
const MessageBubble = memo(function MessageBubble({
  message,
  isLatest,
  onRetry,
  onSaveInsight,
  onShare,
  isSaved,
  fontSize = 'medium',
}: {
  message: Message
  isLatest: boolean
  onRetry?: () => void
  onSaveInsight?: () => void
  onShare?: () => void
  isSaved?: boolean
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge'
}) {
  const [copied, setCopied] = useState(false)
  const [bookmarked, setBookmarked] = useState(isSaved || false)
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { role, content } = message

  // 处理 <think> 标签
  let mainText = content
  let isThinking = false

  const thinkStart = content.indexOf('<think>')
  const thinkEnd = content.indexOf('</think>')

  if (thinkStart !== -1) {
    if (thinkEnd !== -1) {
      mainText = (content.substring(0, thinkStart) + content.substring(thinkEnd + 8)).trim()
      isThinking = false
    } else {
      mainText = content.substring(0, thinkStart).trim()
      isThinking = true
    }
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    const copyText = mainText || content

    const fallbackCopy = () => {
      const textArea = document.createElement('textarea')
      textArea.value = copyText
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      textArea.style.top = '-9999px'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      let success = false
      try {
        success = document.execCommand('copy')
      } catch {
        success = false
      }
      document.body.removeChild(textArea)
      return success
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyText)
        .then(() => {
          setCopied(true)
          addToast({ type: 'success', message: t('bible.copiedToClipboard') });
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(() => {
          const success = fallbackCopy()
          if (success) {
            setCopied(true)
            addToast({ type: 'success', message: t('bible.copiedToClipboard') });
            setTimeout(() => setCopied(false), 2000)
          } else {
            addToast({ type: 'error', message: t('bible.copyFailed') || '复制失败' });
          }
        })
    } else {
      const success = fallbackCopy()
      if (success) {
        setCopied(true)
        addToast({ type: 'success', message: t('bible.copiedToClipboard') });
        setTimeout(() => setCopied(false), 2000)
      } else {
        addToast({ type: 'error', message: t('bible.copyFailed') || '复制失败' });
      }
    }
  }

  return (
    <div className={cn('flex group relative mb-5', role === 'user' ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'relative transition-all',
        role === 'user'
          ? 'max-w-[88%] rounded-2xl rounded-tr-md px-4 py-3 bg-primary dark:bg-primary text-white text-[14.5px]'
          : 'w-full'
      )}>
        {role === 'user' && (
          <div className="absolute -top-5 right-0 flex items-center gap-1 text-[10px] font-semibold opacity-50 select-none text-blue-400 flex-row-reverse">
            <User className="w-3 h-3" />
            <span>{t('bible.you')}</span>
          </div>
        )}

        {role === 'user' ? (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words text-white">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <>
            {/* AI 标识 */}
            <div className="flex items-center gap-2 mb-4 select-none">
              <div className="w-5 h-5 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">{t('bible.aiInterpretation')}</span>
            </div>

            {isThinking && (
              <div className="flex items-center gap-2.5 text-blue-500 mb-4 text-[13px] font-semibold select-none">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </div>
                <span className="text-muted-foreground dark:text-muted-foreground">{t('bible.deepInterpreting')}</span>
              </div>
            )}

            {mainText && (
              <div className={cn(
                'prose prose-slate dark:prose-invert max-w-none break-words',
                fontSize === 'small' && 'prose-sm',
                fontSize === 'large' && 'prose-lg',
                fontSize === 'xlarge' && 'prose-xl'
              )}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{mainText}</ReactMarkdown>
              </div>
            )}

            {/* 底部工具栏 */}
            {(mainText || !isThinking) && (
              <div className="mt-5 pt-4 border-t border-border/80 dark:border-border/60 flex justify-between items-center opacity-100 select-none">
                <div className="flex items-center gap-0.5 flex-wrap">
                  <button
                    onClick={handleCopy}
                    className={cn(
                      'flex items-center gap-1.5 text-[11px] font-semibold transition-all px-2.5 py-1.5 rounded-lg',
                      copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-muted-foreground hover:text-muted-foreground dark:hover:text-foreground hover:bg-accent dark:hover:bg-accent/60'
                    )}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? t('bible.copied') : t('bible.copy')}
                  </button>

                  {onSaveInsight && (
                    <button
                      onClick={() => { onSaveInsight(); setBookmarked(true); }}
                      className={cn(
                        'flex items-center gap-1.5 text-[11px] font-semibold transition-all px-2.5 py-1.5 rounded-lg',
                        bookmarked ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-accent dark:hover:bg-accent/60'
                      )}
                    >
                      <Bookmark className={cn('w-3.5 h-3.5', bookmarked && 'fill-current')} />
                      {bookmarked ? t('bible.bookmarked') : t('bible.bookmark')}
                    </button>
                  )}

                  {onShare && (
                    <button
                      onClick={onShare}
                      className="flex items-center gap-1.5 text-[11px] font-semibold transition-all px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 hover:bg-accent dark:hover:bg-accent/60"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {t('bible.share')}
                    </button>
                  )}

                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="flex items-center gap-1.5 text-[11px] font-semibold transition-all px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-muted-foreground dark:hover:text-foreground hover:bg-accent dark:hover:bg-accent/60"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t('bible.retry')}
                    </button>
                  )}
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <AudioButton text={mainText} size="sm" variant="ghost" className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 h-8 px-2.5 text-[11px] rounded-lg" label={t('bible.readAloud')} />
                </div>
              </div>
            )}
          </>
        )}

        {role === 'assistant' && isLatest && !isThinking && (
          <span className="inline-block w-2.5 h-2.5 ml-1 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-full animate-pulse align-baseline" />
        )}
      </div>
    </div>
  )
})

// 空状态组件
function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground dark:text-muted-foreground select-none opacity-60">
      <div className="w-20 h-20 rounded-2xl bg-primary/5 dark:bg-card flex items-center justify-center mb-5">
        <svg className="w-10 h-10 stroke-1 text-muted-foreground dark:text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="16" r="1" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">{t('bible.emptyStateHint')}</p>
    </div>
  )
}

// 错误状态组件
function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center p-4 mt-2 mb-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
      <svg className="w-6 h-6 text-amber-500 mb-2 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span className="text-xs text-amber-600 dark:text-amber-400 text-center mb-3">
        {t('bible.errorInterrupted')}<br />
        {t('bible.errorReasons')}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-8 text-xs rounded-full border border-amber-200 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 px-4"
        >
          <RefreshCw className="w-3 h-3 mr-1 inline" /> {t('bible.regenerate')}
        </button>
      )}
    </div>
  )
}

// 加载状态组件
function LoadingIndicator() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2.5 text-blue-500 mb-4 text-[13px] font-semibold select-none p-4">
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
      </div>
      <span className="text-muted-foreground dark:text-muted-foreground">{t('bible.deepInterpreting')}</span>
    </div>
  )
}

// 主组件 - 使用虚拟列表
export const VirtualizedMessageList = memo(function VirtualizedMessageList({
  messages,
  isLoading,
  error,
  onRetry,
  onSaveInsight,
  onShare,
  fontSize = 'medium',
  isSaved,
}: VirtualizedMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // 估计每条消息的高度 (用于虚拟化)
  const estimateSize = useCallback((index: number) => {
    const message = messages[index]
    // 基础高度 + 内容长度估算
    const baseHeight = message.role === 'user' ? 80 : 150
    const contentLines = Math.ceil(message.content.length / 50)
    return baseHeight + Math.min(contentLines * 24, 300)
  }, [messages])

  // 创建虚拟化器
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5, // 预渲染额外5条消息
  })

  // 自动滚动到底部
  useEffect(() => {
    if (parentRef.current && messages.length > 0) {
      rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' })
    }
  }, [messages.length, rowVirtualizer])

  if (messages.length === 0 && !isLoading) {
    return <EmptyState />
  }

  return (
    <div
      ref={parentRef}
      data-testid="virtualized-list"
      className="flex flex-col h-full overflow-y-auto scroll-smooth"
    >
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const message = messages[virtualRow.index]
          const isLatest = virtualRow.index === messages.length - 1
          const isAssistant = message.role === 'assistant'

          return (
            <div
              key={message.id}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <MessageBubble
                message={message}
                isLatest={isLatest && isLoading}
                onRetry={!isLoading && isAssistant && isLatest ? onRetry : undefined}
                onSaveInsight={isAssistant && message.content.length > 0 ? () => onSaveInsight?.(message.id, message.content) : undefined}
                onShare={isAssistant && message.content.length > 0 ? onShare : undefined}
                isSaved={isSaved?.(message.id)}
                fontSize={fontSize}
              />
            </div>
          )
        })}
      </div>

      {isLoading && <LoadingIndicator />}
      {error && <ErrorState error={error} onRetry={onRetry} />}
    </div>
  )
})

VirtualizedMessageList.displayName = 'VirtualizedMessageList'