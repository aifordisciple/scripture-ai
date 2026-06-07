'use client'

import { memo, useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, Bookmark, Share2, RefreshCw, User, Sparkles, ArrowRight, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AudioButton } from './AudioButton'
import { useToast } from '@/components/ui/toast'
import { useTranslation } from '@/lib/i18n'
import { parseThinkTags, stripAllThinkTags } from '@/lib/ai'

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
  onSendMessage?: (content: string) => void
  locale?: 'zh' | 'en'
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge'
  isSaved?: (messageId: string) => boolean
  wasStreamCancelled?: boolean
}

// 检查消息看起来是否"未完成"（被截断）
// 采用保守策略：只在明显中途截断时才返回 true
// 中英文 AI 回复常不以 。 结尾，不能因此判断为"未完成"
function looksIncomplete(content: string): boolean {
  const cleaned = stripAllThinkTags(content).trim();
  if (cleaned.length < 30) return false; // 太短无法判断，按"完整"处理
  if (cleaned.length === 0) return false;

  const lastChar = cleaned[cleaned.length - 1];
  // 仅当结尾是明显"句中"标点时才算未完成
  // 中英文逗号、分号、冒号、顿号、未配对的左括号 / 中括号
  if (/[,;:、，；：]/.test(lastChar)) return true;
  // Markdown 未闭合的格式符（开括号但无对应闭括号 / 列表项只有短横）
  if (/[\(\[\{]/.test(lastChar)) return true;
  return false;
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

  const { displayText: mainText, isThinking } = parseThinkTags(content)


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
          ? 'max-w-[88%] rounded-2xl rounded-tr-md px-4 py-3 bg-primary text-white text-[14.5px]'
          : 'w-full'
      )}>
        {role === 'user' && (
          <div className="absolute -top-5 right-0 flex items-center gap-1 text-[10px] font-semibold opacity-50 select-none text-white/50 flex-row-reverse">
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
              <div className="w-5 h-5 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">{t('bible.aiInterpretation')}</span>
            </div>

            {isThinking && (
              <div className="flex items-center gap-2.5 text-primary mb-4 text-[13px] font-semibold select-none">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </div>
                <span className="text-muted-foreground">{t('bible.deepInterpreting')}</span>
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
                      copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
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
                        bookmarked ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                      )}
                    >
                      <Bookmark className={cn('w-3.5 h-3.5', bookmarked && 'fill-current')} />
                      {bookmarked ? t('bible.bookmarked') : t('bible.bookmark')}
                    </button>
                  )}

                  {onShare && (
                    <button
                      onClick={onShare}
                      className="flex items-center gap-1.5 text-[11px] font-semibold transition-all px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {t('bible.share')}
                    </button>
                  )}

                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="flex items-center gap-1.5 text-[11px] font-semibold transition-all px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t('bible.retry')}
                    </button>
                  )}
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <AudioButton text={mainText} size="sm" variant="ghost" className="text-muted-foreground hover:text-primary h-8 px-2.5 text-[11px] rounded-lg" label={t('bible.readAloud')} />
                </div>
              </div>
            )}
          </>
        )}

        {role === 'assistant' && isLatest && !isThinking && (
          <span className="inline-block w-2.5 h-2.5 ml-1 bg-primary rounded-full animate-pulse align-baseline" />
        )}
      </div>
    </div>
  )
})

// 引导式标签组件 - 显示建议问题或"继续"按钮
const SuggestedFollowUps = memo(function SuggestedFollowUps({
  lastAssistantContent,
  lastUserContent,
  isStreaming,
  isIncomplete,
  isLatest,
  locale,
  onSendMessage,
  onContinue,
}: {
  lastAssistantContent: string
  lastUserContent: string
  isStreaming: boolean
  isIncomplete: boolean
  isLatest: boolean
  locale: 'zh' | 'en'
  onSendMessage?: (content: string) => void
  onContinue?: () => void
}) {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedIdRef = useRef<string>('');

  useEffect(() => {
    // 流式中或被截断时清空旧建议
    if (isStreaming || isIncomplete) {
      if (suggestions.length > 0) setSuggestions([]);
      if (isIncomplete) return;
    }

    // 只在最新消息、已结束、未截断、且有内容时获取建议
    if (!isLatest || isStreaming || isIncomplete) return;
    if (!lastAssistantContent || lastAssistantContent.trim().length < 10) return;

    // 用 lastAssistantContent 的 hash 作为幂等键,避免重复请求
    const fetchKey = `${lastAssistantContent.length}-${lastAssistantContent.slice(-50)}`;
    if (fetchedIdRef.current === fetchKey) return;
    fetchedIdRef.current = fetchKey;

    let cancelled = false;
    setLoading(true);

    fetch('/api/chat/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lastUserMessage: lastUserContent,
        lastAssistantMessage: lastAssistantContent,
        locale,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (!cancelled && Array.isArray(data?.suggestions)) {
          setSuggestions(data.suggestions);
        }
      })
      .catch(err => {
        console.error('Failed to fetch suggestions:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lastAssistantContent, lastUserContent, isStreaming, isIncomplete, isLatest, locale, suggestions.length]);

  // 1) 已截断且未在流式：显示"继续"按钮
  if (isIncomplete && !isStreaming && onContinue) {
    return (
      <div className="flex flex-wrap gap-2 mt-3 mb-3 pl-1">
        <button
          onClick={onContinue}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
          title={t('ai.continueHint')}
        >
          <ArrowRight className="w-3 h-3" />
          {t('ai.continueAnswer')}
        </button>
      </div>
    );
  }

  // 2) 流式中：什么都不显示（避免在生成中弹出建议）
  if (isStreaming) return null;

  // 3) 加载中：显示骨架占位
  if (loading && suggestions.length === 0) {
    return (
      <div className="flex flex-col gap-2 mt-3 mb-3 pl-1 animate-in fade-in duration-300">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
          <Lightbulb className="w-3 h-3" />
          {t('ai.suggestedQuestions')}
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-7 w-24 rounded-full bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // 4) 没有建议：不渲染
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-3 mb-3 pl-1 animate-in fade-in slide-in-from-bottom-1 duration-400">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
        <Lightbulb className="w-3 h-3" />
        {t('ai.suggestedQuestions')}
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <button
            key={`${i}-${s.slice(0, 10)}`}
            onClick={() => onSendMessage?.(s)}
            disabled={!onSendMessage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 bg-secondary text-foreground border-border hover:bg-accent hover:border-primary/30 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-primary/70" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
});

// 空状态组件
function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground select-none opacity-60">
      <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-5">
        <svg className="w-10 h-10 stroke-1 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="16" r="1" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <p className="text-[13px] text-muted-foreground">{t('bible.emptyStateHint')}</p>
    </div>
  )
}

// 错误状态组件
function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center p-4 mt-2 mb-4 bg-destructive/5 border border-destructive/10 rounded-lg">
      <svg className="w-6 h-6 text-amber-500 mb-2 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span className="text-xs text-muted-foreground text-center mb-3">
        {t('bible.errorInterrupted')}<br />
        {t('bible.errorReasons')}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-8 text-xs rounded-full border border-border text-primary hover:bg-primary/5 px-4"
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
  onSendMessage,
  locale = 'zh',
  fontSize = 'medium',
  isSaved,
  wasStreamCancelled = false,
}: MessageListProps) {
  const { addToast } = useToast();

  if (messages.length === 0 && !isLoading) {
    return <EmptyState />
  }

  // 找到最后一条 assistant 消息及其前一条 user 消息
  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return i;
    }
    return -1;
  })();

  const lastAssistant = lastAssistantIndex >= 0 ? messages[lastAssistantIndex] : null;
  const lastUserMessage = (() => {
    for (let i = lastAssistantIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i];
    }
    return null;
  })();

  const isLastMessageLatest = lastAssistantIndex === messages.length - 1;
  const assistantContent = lastAssistant?.content || '';
  const isStreaming = isLoading && isLastMessageLatest;
  // 流式中也可能是截断（用户主动停止），但流式中我们隐藏建议
  // 优先用 wasStreamCancelled 信号；否则用启发式判断
  const isIncomplete = !isStreaming && assistantContent.length > 0 && (
    wasStreamCancelled || looksIncomplete(assistantContent)
  );

  const handleContinue = () => {
    if (!onSendMessage) return;
    // 简单提示词让 AI 接着说
    const prompt = locale === 'en' ? 'Please continue from where you left off.' : '请接着刚才的回答继续说，不要重复已说过的内容。';
    onSendMessage(prompt);
  };

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

      {/* 引导式建议问题 / 继续按钮 - 显示在最新 assistant 消息之后 */}
      {lastAssistant && lastAssistantIndex === messages.length - 1 && (
        <SuggestedFollowUps
          lastAssistantContent={assistantContent}
          lastUserContent={lastUserMessage?.content || ''}
          isStreaming={isStreaming}
          isIncomplete={isIncomplete}
          isLatest={isLastMessageLatest}
          locale={locale}
          onSendMessage={onSendMessage}
          onContinue={handleContinue}
        />
      )}

      {error && <ErrorState error={error} onRetry={onRetry} />}
    </div>
  )
})

MessageList.displayName = 'MessageList'
