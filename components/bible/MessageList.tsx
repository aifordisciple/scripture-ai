'use client'

import { memo, useState } from 'react'
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

export interface MessageListProps {
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
  role,
  content,
  isLatest,
  onRetry,
  onSaveInsight,
  onShare,
  isSaved,
  fontSize = 'medium',
}: {
  role: 'user' | 'assistant'
  content: string
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
          ? 'max-w-[88%] rounded-2xl rounded-tr-md px-4 py-3 shadow-sm bg-[#0066cc] text-white text-[14.5px]'
          : 'w-full'
      )}>
        {role === 'user' && (
          <div className="absolute -top-5 right-0 flex items-center gap-1 text-[10px] font-medium opacity-50 select-none text-white/50 flex-row-reverse">
            <User className="w-3 h-3" />
            <span>{t('bible.you')}</span>
          </div>
        )}

        {role === 'user' ? (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words text-white user-message-content">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <>
            {/* AI 标识 */}
            <div className="flex items-center gap-2 mb-4 select-none">
              <div className="w-5 h-5 rounded-lg bg-[#0066cc] flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-[11px] font-medium text-[#7a7a7a]">{t('bible.aiInterpretation')}</span>
            </div>

            {isThinking && (
              <div className="flex items-center gap-2.5 text-blue-500 mb-4 text-[13px] font-medium select-none">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#0066cc] rounded-full animate-pulse"></span>
                  <span className="w-1.5 h-1.5 bg-[#0066cc] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#0066cc] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </div>
                <span className="text-[#7a7a7a]">{t('bible.deepInterpreting')}</span>
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
              <div className="mt-5 pt-4 border-t border-[#e0e0e0]/80 dark:border-[#3a3a3c]/60 flex justify-between items-center opacity-100 select-none">
                <div className="flex items-center gap-0.5 flex-wrap">
                  <button
                    onClick={handleCopy}
                    className={cn(
                      'flex items-center gap-1.5 text-[11px] font-medium transition-all px-2.5 py-1.5 rounded-lg',
                      copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-[#7a7a7a] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                    )}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? t('bible.copied') : t('bible.copy')}
                  </button>

                  {onSaveInsight && (
                    <button
                      onClick={() => { onSaveInsight(); setBookmarked(true); }}
                      className={cn(
                        'flex items-center gap-1.5 text-[11px] font-medium transition-all px-2.5 py-1.5 rounded-lg',
                        bookmarked ? 'bg-[#0066cc]/10 text-[#0066cc]' : 'text-[#7a7a7a] hover:text-[#0066cc] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                      )}
                    >
                      <Bookmark className={cn('w-3.5 h-3.5', bookmarked && 'fill-current')} />
                      {bookmarked ? t('bible.bookmarked') : t('bible.bookmark')}
                    </button>
                  )}

                  {onShare && (
                    <button
                      onClick={onShare}
                      className="flex items-center gap-1.5 text-[11px] font-medium transition-all px-2.5 py-1.5 rounded-lg text-[#7a7a7a] hover:text-[#0066cc] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {t('bible.share')}
                    </button>
                  )}

                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="flex items-center gap-1.5 text-[11px] font-medium transition-all px-2.5 py-1.5 rounded-lg text-[#7a7a7a] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t('bible.retry')}
                    </button>
                  )}
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <AudioButton text={mainText} size="sm" variant="ghost" className="text-[#7a7a7a] hover:text-[#0066cc] h-8 px-2.5 text-[11px] rounded-lg" label={t('bible.readAloud')} />
                </div>
              </div>
            )}
          </>
        )}

        {role === 'assistant' && isLatest && !isThinking && (
          <span className="inline-block w-2.5 h-2.5 ml-1 bg-[#0066cc] rounded-full animate-pulse align-baseline" />
        )}
      </div>
    </div>
  )
})

// 空状态组件
function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 select-none opacity-60">
      <div className="w-20 h-20 rounded-2xl bg-[#0066cc]/5 flex items-center justify-center mb-5">
        <svg className="w-10 h-10 stroke-1 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="16" r="1" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <p className="text-[13px] text-[#7a7a7a]">{t('bible.emptyStateHint')}</p>
    </div>
  )
}

// 错误状态组件
function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center p-4 mt-2 mb-4 bg-[#cc0000]/5 border border-[#cc0000]/10 rounded-lg">
      <svg className="w-6 h-6 text-amber-500 mb-2 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span className="text-xs text-[#7a7a7a] text-center mb-3">
        {t('bible.errorInterrupted')}<br />
        {t('bible.errorReasons')}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-8 text-xs rounded-full border border-[#e0e0e0] text-[#0066cc] hover:bg-[#0066cc]/5 px-4"
        >
          <RefreshCw className="w-3 h-3 mr-1 inline" /> {t('bible.regenerate')}
        </button>
      )}
    </div>
  )
}

// 主组件
export const MessageList = memo(function MessageList({
  messages,
  isLoading,
  error,
  onRetry,
  onSaveInsight,
  onShare,
  fontSize = 'medium',
  isSaved,
}: MessageListProps) {
  const { addToast } = useToast();

  if (messages.length === 0 && !isLoading) {
    return <EmptyState />
  }

  return (
    <div className="flex flex-col pb-6 pt-2">
      {messages.map((m, index) => {
        const isLatest = index === messages.length - 1
        const isAssistant = m.role === 'assistant'
        const messageId = m.id || `msg-${index}`

        return (
          <MessageBubble
            key={messageId}
            role={m.role}
            content={m.content}
            isLatest={isLatest && isLoading}
            onRetry={!isLoading && isAssistant && isLatest ? onRetry : undefined}
            onSaveInsight={isAssistant && m.content.length > 0 ? () => onSaveInsight?.(messageId, m.content) : undefined}
            onShare={isAssistant && m.content.length > 0 ? onShare : undefined}
            isSaved={isSaved?.(messageId)}
            fontSize={fontSize}
          />
        )
      })}

      {error && <ErrorState error={error} onRetry={onRetry} />}
    </div>
  )
})

MessageList.displayName = 'MessageList'