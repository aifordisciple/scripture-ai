'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eraser, Sparkles, GraduationCap, FileText, BookMarked, Settings, Type, Edit, Trash2, Loader2 } from 'lucide-react'
import { useChat } from 'ai/react'
import { useSession } from 'next-auth/react'

import { useBibleStore } from '@/store/useBibleStore'
import { BIBLE_BOOKS } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

// 拆分后的子组件
import { MessageList } from './MessageList'
import { SessionSelector } from './SessionSelector'
import { QuickPrompts } from './QuickPrompts'
import { AIInputForm } from './AIInputForm'

// --- 主组件：AI Sidebar ---
export function AISidebar() {
  const { status } = useSession();
  const {
    isAiOpen, setAiOpen, clearSelection, aiRequestTrigger,
    sidebarWidth, setSidebarWidth,
    setAiGenerating,
    // 队列相关
    currentAiRequest, aiQueue, completeCurrentRequest, failCurrentRequest, cancelAIRequest,
    shouldAbortStream, clearAbortStream, startProcessingNext,
    // 会话管理
    currentSessionId, setCurrentSessionId, sessions, setSessions, addSession, updateSession, deleteSession, replaceSessionId,
    sessionStatus, sessionError, setSessionStatus, setSessionError,
    sessionsLoading, setSessionsLoading, setMessagesLoading,
    // AI 模式
    aiMode, setAiMode,
    // 自定义提示词
    customPrompts, setCustomPrompts,
    // 收藏
    savedInsights, addSavedInsight,
    // AI 字体大小
    aiFontSize, setAiFontSize,
  } = useBibleStore()

  const { t } = useTranslation()

  // UI 状态
  const [showSessionList, setShowSessionList] = useState(false)
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [showFontSizeSelector, setShowFontSizeSelector] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isImmersive, setIsImmersive] = useState(false)

  // 下拉菜单 ref（用于 click-outside 检测）
  const modeSelectorRef = useRef<HTMLDivElement>(null)
  const fontSizeSelectorRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (!showModeSelector && !showFontSizeSelector && !showSessionList) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (showModeSelector && modeSelectorRef.current && !modeSelectorRef.current.contains(target)) {
        setShowModeSelector(false)
      }
      if (showFontSizeSelector && fontSizeSelectorRef.current && !fontSizeSelectorRef.current.contains(target)) {
        setShowFontSizeSelector(false)
      }
      if (showSessionList) {
        const sessionEl = document.querySelector('[data-session-selector]')
        if (!sessionEl || !sessionEl.contains(target)) {
          setShowSessionList(false)
        }
      }
    }

    // 使用 mousedown 而非 click，避免与按钮的 onClick 冲突
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModeSelector, showFontSizeSelector, showSessionList])

  // 弹窗状态
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTargetSession, setDeleteTargetSession] = useState<any>(null)

  // Refs
  const sidebarRef = useRef<HTMLDivElement>(null)
  const lastProcessedTimeRef = useRef<number>(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  const loadedSessionRef = useRef<string | null>(null)
  // 稳定的 chat key state，避免 currentSessionId 从 temp-xxx 变为真实ID 时
  // useChat 的 SWR key 变化导致消息被重置为空
  // 只有在显式创建新会话/切换会话时才更新
  const [chatKey, setChatKey] = useState(`chat-${Date.now()}`)

  const { apiConfig } = useBibleStore()
  const { addToast } = useToast()

  // useChat hook - 使用稳定的 chatKey 作为 id，避免会话ID变化时消息丢失
  const { locale } = useBibleStore();
  const { messages, input, handleInputChange, handleSubmit, append, isLoading, stop, setMessages, error, reload, setInput } = useChat({
    id: chatKey,
    api: '/api/chat',
    body: {
      apiConfig,
      sessionId: currentSessionId,
      locale,
      context: aiRequestTrigger ? {
        bookName: aiRequestTrigger.ref.bookName,
        chapter: aiRequestTrigger.ref.chapter,
        verse: aiRequestTrigger.ref.verse,
        selectedText: aiRequestTrigger.content,
        contextText: aiRequestTrigger.context
      } : null
    },
    streamProtocol: 'data',
    onError: (error) => {
      console.error("AI Error:", error)
      // 延迟到下一个事件循环，避免在useChat的渲染周期中触发Zustand set()导致React error #185
      setTimeout(() => {
        setAiGenerating(false)
        failCurrentRequest(error.message || t('ai.aiGenerateFailed'))
      }, 0)
    },
    onFinish: () => {
      // 延迟到下一个事件循环，避免在useChat的渲染周期中触发Zustand set()导致React error #185
      setTimeout(() => {
        setAiGenerating(false)
        completeCurrentRequest()
      }, 0)
    }
  })

  // 显示session错误toast
  useEffect(() => {
    if (sessionError) {
      addToast({ type: 'error', message: sessionError.message || t('ai.sessionError') });
    }
  }, [sessionError, addToast]);

  // 屏幕防睡眠
  useEffect(() => {
    // [P3-3修复] 使用数组追踪所有 wake lock 引用，防止覆盖泄漏
    const wakeLocks: any[] = []
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isLoading) {
          const lock = await (navigator as any).wakeLock.request('screen')
          wakeLocks.push(lock)
        }
      } catch (err) {}
    }
    const releaseAllWakeLocks = async () => {
      for (const lock of wakeLocks) {
        try { await lock.release() } catch (e) {}
      }
      wakeLocks.length = 0
    }
    if (isLoading) requestWakeLock()
    else releaseAllWakeLocks()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoading) requestWakeLock()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      releaseAllWakeLocks()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isLoading])

  // 加载会话列表
  useEffect(() => {
    // Only load sessions when authenticated
    if (status !== 'authenticated') {
      setSessionsLoading(false);
      return;
    }

    const loadSessions = async () => {
      setSessionsLoading(true)
      setSessionStatus('loading')

      try {
        const res = await fetch('/api/chat/session')
        if (!res.ok) {
          if (res.status === 401) {
            setSessionStatus('idle')
          } else {
            throw new Error(`HTTP ${res.status}`)
          }
          return
        }
        const data = await res.json()
        if (Array.isArray(data)) {
          setSessions(data)
          setSessionStatus('ready')
        }
      } catch (err) {
        console.error("Failed to load sessions:", err)
        setSessionError({
          type: 'LOAD_FAILED',
          message: t('ai.sessionLoadFailed'),
          recoverable: true,
        })
        setSessionStatus('error')
      } finally {
        setSessionsLoading(false)
      }
    }
    loadSessions()
  }, [setSessions, setSessionsLoading, setSessionStatus, setSessionError, status])

  // 加载自定义提示词
  useEffect(() => {
    // Only load prompts when authenticated
    if (status !== 'authenticated') return;

    fetch('/api/prompts')
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setCustomPrompts(data)
      })
      .catch(err => console.error("Failed to load custom prompts", err))
  }, [setCustomPrompts, status])

  // 恢复会话消息
  useEffect(() => {
    if (isAiOpen && currentSessionId && !currentSessionId.startsWith('temp-')) {
      if (loadedSessionRef.current !== currentSessionId) {
        loadedSessionRef.current = currentSessionId
        setMessagesLoading(true)

        fetch(`/api/chat/history?sessionId=${currentSessionId}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data) && data.length > 0) {
              setMessages(data.map((m: any) => ({ id: m.id, role: m.role, content: m.content })))
            }
            setSessionStatus('ready')
          })
          .catch(err => console.error("Failed to load session messages", err))
          .finally(() => setMessagesLoading(false))
      }
    }
  }, [isAiOpen, currentSessionId, setMessages, setMessagesLoading, setSessionStatus, setSessionError])

  // 创建临时会话
  // 注意：不再调用 setMessages([])，因为更改 chatKey 已经创建新的空 SWR 缓存条目。
  // 之前的 setMessages([]) 会在 sendMessage effect 的 append() 之后运行，导致竞态条件清除用户消息。
  useEffect(() => {
    if (sessionsLoading) return

    if (isAiOpen && !currentSessionId && sessionStatus !== 'creating') {
      const tempId = `temp-${Date.now()}`
      setChatKey(`chat-${Date.now()}`)
      setCurrentSessionId(tempId)
      setSessionStatus('idle')
      loadedSessionRef.current = tempId
    }
  }, [isAiOpen, currentSessionId, sessionsLoading, sessionStatus, setCurrentSessionId, setSessionStatus, setChatKey])

  // 重置状态 - 仅在切换会话时重置，关闭侧边栏时不重置
  // 避免关闭再打开时从服务器重新加载消息覆盖 useChat 内存中的消息
  // loadedSessionRef 会在 handleSelectSession/handleNewSession 中正确更新

  // 保存临时会话 - 未登录时跳过服务器端创建，直接使用临时ID
  const savePendingSession = useCallback(async (tempId: string, firstMessage?: string): Promise<string | null> => {
    // 未认证用户不需要创建服务器端会话，直接使用临时ID即可
    if (status !== 'authenticated') {
      setSessionStatus('ready')
      return tempId
    }

    setSessionStatus('creating')

    let title = t('ai.newChat')
    let bookId: string | undefined
    let chapter: number | undefined

    if (aiRequestTrigger) {
      const { ref } = aiRequestTrigger
      const verseSuffix = ref.verse > 0 ? `:${ref.verse}` : ''
      title = `${ref.bookName} ${ref.chapter}${verseSuffix}`
      const book = BIBLE_BOOKS.find(b => b.name === ref.bookName || b.nameEn === ref.bookName || b.id === ref.bookName)
      bookId = book?.id
      chapter = ref.chapter
    } else if (firstMessage) {
      title = firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '')
    }

    try {
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: aiMode,
          title,
          bookId,
          chapter,
          startVerse: aiRequestTrigger?.ref?.verse && aiRequestTrigger.ref.verse > 0 ? aiRequestTrigger.ref.verse : undefined,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const session = await res.json()
      // [P1-2修复] 使用replaceSessionId原子性地替换临时ID，避免消息丢失
      replaceSessionId(tempId, session.id)
      setSessionStatus('ready')
      return session.id
    } catch (error) {
      console.error('Failed to save pending session:', error)
      setSessionError({
        type: 'CREATE_FAILED',
        message: t('ai.sessionCreateFailed'),
        recoverable: true,
      })
      setSessionStatus('error')
      return null
    }
  }, [status, aiMode, aiRequestTrigger, addSession, setSessionStatus, setSessionError])

  // 会话操作
  const handleNewSession = useCallback(async () => {
    const tempId = `temp-${Date.now()}`
    setChatKey(`chat-${Date.now()}`)  // 新会话需要新的 chat key
    setCurrentSessionId(tempId)
    setSessionStatus('idle')
    loadedSessionRef.current = tempId
    setMessages([])
    setShowSessionList(false)
    setSessionError(null)
  }, [setCurrentSessionId, setMessages, setSessionStatus, setSessionError, setChatKey])

  const handleSelectSession = useCallback(async (session: any) => {
    setChatKey(`chat-${Date.now()}`)  // 切换会话需要新的 chat key
    setCurrentSessionId(session.id)
    setSessionStatus('loading')
    loadedSessionRef.current = session.id

    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/chat/history?sessionId=${session.id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const msgs = await res.json()
      if (Array.isArray(msgs)) {
        setMessages(msgs.map((m: any) => ({ id: m.id, role: m.role, content: m.content })))
      }
      setSessionStatus('ready')
      setSessionError(null)
    } catch (error) {
      console.error('Failed to load session messages:', error)
      setSessionError({
        type: 'LOAD_FAILED',
        message: t('ai.historyLoadFailed'),
        recoverable: true,
      })
      setSessionStatus('error')
    } finally {
      setMessagesLoading(false)
    }
    setShowSessionList(false)
  }, [setCurrentSessionId, setMessages, setSessionStatus, setSessionError, setMessagesLoading, setChatKey])

  const handleDeleteSession = useCallback(async (session: any) => {
    setDeleteTargetSession(session)
    setShowDeleteConfirm(true)
    setShowSessionList(false)
  }, [])

  const confirmDeleteSession = useCallback(async () => {
    if (!deleteTargetSession) return

    const sessionId = deleteTargetSession.id

    try {
      await fetch(`/api/chat/session?id=${sessionId}`, { method: 'DELETE' })
      deleteSession(sessionId)

      if (currentSessionId === sessionId) {
        const tempId = `temp-${Date.now()}`
        setCurrentSessionId(tempId)
        setSessionStatus('idle')
        setMessages([])
        loadedSessionRef.current = tempId
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    } finally {
      setShowDeleteConfirm(false)
      setDeleteTargetSession(null)
    }
  }, [currentSessionId, deleteSession, deleteTargetSession, setCurrentSessionId, setMessages, setSessionStatus])

  const handleOpenRename = useCallback((session: any) => {
    setRenameSessionId(session.id)
    setRenameTitle(session.title || '')
    setShowRenameModal(true)
    setShowSessionList(false)
  }, [])

  const handleRenameSubmit = useCallback(async () => {
    if (!renameSessionId || !renameTitle.trim()) return

    try {
      const res = await fetch('/api/chat/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: renameSessionId, title: renameTitle.trim() }),
      })
      const data = await res.json()
      if (data.id) {
        updateSession(renameSessionId, { title: renameTitle.trim() })
      }
    } catch (error) {
      console.error('Failed to rename session:', error)
    } finally {
      setShowRenameModal(false)
      setRenameSessionId(null)
      setRenameTitle('')
    }
  }, [renameSessionId, renameTitle, updateSession])

  // 收藏消息
  const handleSaveInsight = useCallback(async (messageId: string, content: string) => {
    // [P3-2修复] 无触发源时显示提示而非静默失败
    if (!aiRequestTrigger) {
      addToast({ type: 'warning', message: t('ai.selectVerseFirst') })
      return
    }

    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId,
        bookId: aiRequestTrigger.ref.bookName,
        chapter: aiRequestTrigger.ref.chapter,
        verse: aiRequestTrigger.ref.verse > 0 ? aiRequestTrigger.ref.verse : undefined,
        title: content.substring(0, 50) + '...',
        content: content,
      }),
    })
    const insight = await res.json()
    addSavedInsight(insight)
  }, [aiRequestTrigger, addSavedInsight])

  // 清空当前会话对话 - 仅删除当前 session 的历史
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const handleClearChat = async () => {
    setShowClearConfirm(true)
  }
  const confirmClearChat = async () => {
    setShowClearConfirm(false)
    setMessages([])
    // 仅删除当前会话的历史，而非全部
    if (currentSessionId && !currentSessionId.startsWith('temp-')) {
      await fetch(`/api/chat/history?sessionId=${currentSessionId}`, { method: 'DELETE' })
    }
  }

  // [P1-1修复] 组件卸载时中止AI请求，防止内存泄漏和过期状态更新
  useEffect(() => {
    return () => {
      if (isLoading) {
        stop()
        setAiGenerating(false)
      }
    }
  }, [isLoading, stop, setAiGenerating])

  // AI 生成状态
  // 使用setTimeout避免在effect执行期间触发连锁Zustand set()导致React error #185
  useEffect(() => {
    if (isLoading) {
      setTimeout(() => setAiGenerating(true), 0)
    } else if (!currentAiRequest || currentAiRequest.status !== 'processing') {
      setTimeout(() => setAiGenerating(false), 0)
    }
  }, [isLoading, setAiGenerating, currentAiRequest])

  // 监听流中止信号，异步调用stop()避免React error #185
  // 关键：cancelAIRequest只设置Zustand标志，stop()在AISidebar自己的effect中异步调用
  // 这样避免了跨组件同步setState导致的渲染冲突
  useEffect(() => {
    if (shouldAbortStream) {
      // 使用setTimeout确保stop()在下一个事件循环中执行，
      // 完全脱离当前渲染周期
      const timer = setTimeout(() => {
        stop();
        clearAbortStream();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [shouldAbortStream, stop, clearAbortStream])

  // 自动滚动
  useEffect(() => {
    if (scrollRef.current && shouldAutoScrollRef.current) {
      const div = scrollRef.current
      div.scrollTop = div.scrollHeight
    }
  }, [messages, isLoading, error])

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      shouldAutoScrollRef.current = distanceFromBottom <= 100
    }
  }

  // 处理 AI 请求触发
  // [修复] 等待 currentSessionId 被设置后再发送消息，避免竞态条件
  useEffect(() => {
    if (!aiRequestTrigger) return
    if (aiRequestTrigger.timestamp === lastProcessedTimeRef.current) return
    // 等待会话ID被创建，避免在 null sessionId 时发送消息
    if (!currentSessionId) return

    lastProcessedTimeRef.current = aiRequestTrigger.timestamp
    shouldAutoScrollRef.current = true

    const sendMessage = async () => {
      try {
        let sessionId = currentSessionId

        if (currentSessionId?.startsWith('temp-')) {
          let reference = `${aiRequestTrigger.ref.bookName} ${aiRequestTrigger.ref.chapter}`
          if (aiRequestTrigger.ref.verse > 0) {
            reference += `:${aiRequestTrigger.ref.verse}`
          }
          const savedId = await savePendingSession(currentSessionId, reference)
          if (savedId) {
            setCurrentSessionId(savedId)
            loadedSessionRef.current = savedId  // 同步更新，避免恢复会话effect重新触发
            sessionId = savedId
          }
        }

        let reference = `${aiRequestTrigger.ref.bookName} ${aiRequestTrigger.ref.chapter}`
        if (aiRequestTrigger.ref.verse > 0) {
          reference += `:${aiRequestTrigger.ref.verse}`
        } else {
          reference += t('ai.chapterSuffix')
        }

        const displayQuote = aiRequestTrigger.content.split('\n').map(line => `> ${line}`).join('\n')
        const enrichedPrompt = `**📖 ${reference}**\n\n${displayQuote}\n\n**${t('ai.myRequest')}**：${aiRequestTrigger.prompt}`

        // 延迟append，避免在effect执行期间触发useChat的SWR mutate导致React error #185
        setTimeout(() => {
          append(
            { role: 'user', content: enrichedPrompt },
            { body: { sessionId } }
          )
        }, 0)
      } catch (error) {
        // [P0-1修复] 确保所有错误路径都释放AI生成状态，避免队列永久阻塞
        console.error('AI request trigger error:', error)
        setTimeout(() => {
          setAiGenerating(false)
          failCurrentRequest(error instanceof Error ? error.message : t('ai.aiGenerateFailed'))
        }, 0)
      }
    }

    sendMessage()
  }, [aiRequestTrigger, append, currentSessionId, savePendingSession, setCurrentSessionId])

  // 窗口调整
  const startResizing = useCallback(() => setIsResizing(true), [])
  const stopResizing = useCallback(() => setIsResizing(false), [])
  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = document.body.clientWidth - e.clientX
      if (newWidth > 300 && newWidth < 1200) setSidebarWidth(newWidth)
    }
  }, [isResizing, setSidebarWidth])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize)
      window.addEventListener("mouseup", stopResizing)
    }
    return () => {
      window.removeEventListener("mousemove", resize)
      window.removeEventListener("mouseup", stopResizing)
    }
  }, [isResizing, resize, stopResizing])

  // 快捷提示词点击
  const handleChipClick = useCallback(async (prompt: string) => {
    if (isLoading) return
    shouldAutoScrollRef.current = true

    let sessionId = currentSessionId
    if (currentSessionId?.startsWith('temp-')) {
      let reference = ''
      if (aiRequestTrigger) {
        reference = `${aiRequestTrigger.ref.bookName} ${aiRequestTrigger.ref.chapter}`
        if (aiRequestTrigger.ref.verse > 0) reference += `:${aiRequestTrigger.ref.verse}`
      }
      const savedId = await savePendingSession(currentSessionId, reference || prompt)
      if (savedId) {
        setCurrentSessionId(savedId)
        sessionId = savedId
      }
    }

    let finalPrompt = prompt
    if (aiRequestTrigger && messages.length === 0) {
      let reference = `${aiRequestTrigger.ref.bookName} ${aiRequestTrigger.ref.chapter}`
      if (aiRequestTrigger.ref.verse > 0) reference += `:${aiRequestTrigger.ref.verse}`
      const displayQuote = aiRequestTrigger.content.split('\n').map(line => `> ${line}`).join('\n')
      finalPrompt = `**📖 ${reference}**\n\n${displayQuote}\n\n**${t('ai.myRequest')}**：${prompt}`
    }

    append(
      { role: 'user', content: finalPrompt },
      { body: { sessionId } }
    )
  }, [isLoading, currentSessionId, aiRequestTrigger, messages.length, savePendingSession, setCurrentSessionId, append])

  // 表单提交
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    let sessionId = currentSessionId
    if (currentSessionId?.startsWith('temp-')) {
      const savedId = await savePendingSession(currentSessionId, input.trim())
      if (savedId) {
        setCurrentSessionId(savedId)
        sessionId = savedId
      }
    }

    const messageContent = input.trim()
    append(
      { role: 'user', content: messageContent },
      { body: { sessionId } }
    )
    setInput('')
  }, [input, isLoading, currentSessionId, savePendingSession, setCurrentSessionId, append, setInput])

  return (
    <>
      <AnimatePresence>
        {isAiOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAiOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <div
        ref={sidebarRef}
        style={{ '--sidebar-width': `${sidebarWidth}px` } as any}
        className={cn(
          "fixed inset-y-0 right-0 z-50 bg-card dark:bg-card border-l border-border dark:border-border flex flex-col transition-transform duration-300 ease-in-out",
          "w-full md:w-[var(--sidebar-width)]",
          isAiOpen ? "translate-x-0" : "translate-x-full",
          isResizing && "transition-none"
        )}
      >
        {/* 调整大小手柄 — 支持鼠标和触摸 */}
        <div
          onMouseDown={startResizing}
          onTouchStart={startResizing}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 transition-colors z-50 group"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-border dark:bg-border rounded group-hover:bg-primary transition-colors" />
        </div>

        {/* 头部 */}
        <div className={cn(
          "flex items-center justify-between px-4 bg-background dark:bg-background flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-b border-border dark:border-border",
          isImmersive ? "h-0 opacity-0 border-none p-0" : "h-14 opacity-100 py-3"
        )}>
          <div className="flex items-center gap-2">
            <SessionSelector
              sessions={sessions}
              currentSessionId={currentSessionId}
              showSessionList={showSessionList}
              onToggleSessionList={() => { setShowSessionList(!showSessionList); setShowModeSelector(false); setShowFontSizeSelector(false); }}
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
              onDeleteSession={handleDeleteSession}
              onRenameSession={handleOpenRename}
            />

            {(currentAiRequest || aiQueue.length > 0) && (
              <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {currentAiRequest?.status === 'processing' && t('ai.processing')}
                {aiQueue.length > 0 && ` · ${t('ai.queuedCount', { count: aiQueue.length })}`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* AI 模式选择 */}
            <div className="relative" ref={modeSelectorRef}>
              <button
                onClick={() => { setShowModeSelector(!showModeSelector); setShowFontSizeSelector(false); setShowSessionList(false); }}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors",
                  aiMode === 'general' ? "text-muted-foreground hover:bg-black/[0.04]" : "",
                  aiMode === 'tutor' ? "text-primary bg-primary/10" : "",
                  aiMode === 'sermon' ? "text-primary bg-primary/10" : "",
                  aiMode === 'study-guide' ? "text-primary bg-primary/10" : "",
                  aiMode === 'custom' ? "text-primary bg-primary/10" : ""
                )}
              >
                {aiMode === 'tutor' && <GraduationCap className="w-3.5 h-3.5" />}
                {aiMode === 'sermon' && <FileText className="w-3.5 h-3.5" />}
                {aiMode === 'study-guide' && <BookMarked className="w-3.5 h-3.5" />}
                {aiMode === 'general' && <Sparkles className="w-3.5 h-3.5" />}
                {aiMode === 'custom' && <Settings className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">
                  {aiMode === 'general' && t('ai.general')}
                  {aiMode === 'tutor' && t('ai.tutorShort')}
                  {aiMode === 'sermon' && t('ai.sermonShort')}
                  {aiMode === 'study-guide' && t('ai.studyGuideShort')}
                  {aiMode === 'custom' && t('ai.custom')}
                </span>
              </button>

              <AnimatePresence>
                {showModeSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="fixed top-20 right-20 w-40 glass-panel rounded-lg border border-border dark:border-border z-[200] overflow-hidden"
                  >
                    {[
                      { mode: 'general' as const, icon: Sparkles, label: t('ai.generalDesc'), color: 'text-primary' },
                      { mode: 'tutor' as const, icon: GraduationCap, label: t('ai.tutorDesc'), color: 'text-primary' },
                      { mode: 'sermon' as const, icon: FileText, label: t('ai.sermonDesc'), color: 'text-primary' },
                      { mode: 'study-guide' as const, icon: BookMarked, label: t('ai.studyGuideDesc'), color: 'text-primary' },
                      { mode: 'custom' as const, icon: Settings, label: t('ai.custom'), color: 'text-primary' },
                    ].map(item => (
                      <button
                        key={item.mode}
                        onClick={() => { setAiMode(item.mode); setShowModeSelector(false); }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors",
                          aiMode === item.mode
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                        )}
                      >
                        <item.icon className={cn("w-4 h-4", item.color)} />
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 字体大小选择器 */}
            <div className="relative" ref={fontSizeSelectorRef}>
              <button
                onClick={() => { setShowFontSizeSelector(!showFontSizeSelector); setShowModeSelector(false); setShowSessionList(false); }}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors",
                  aiFontSize === 'medium' ? "text-muted-foreground hover:bg-black/[0.04]" : "text-primary bg-primary/10"
                )}
                title={t('ai.fontSize')}
              >
                <Type className="w-3.5 h-3.5" />
              </button>

              <AnimatePresence>
                {showFontSizeSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="fixed top-20 right-32 w-32 glass-panel rounded-lg border border-border dark:border-border z-[200] overflow-hidden"
                  >
                    {[
                      { size: 'small' as const, label: t('ai.fontSmall') },
                      { size: 'medium' as const, label: t('ai.fontMedium') },
                      { size: 'large' as const, label: t('ai.fontLarge') },
                      { size: 'xlarge' as const, label: t('ai.fontXLarge') },
                    ].map(item => (
                      <button
                        key={item.size}
                        onClick={() => { setAiFontSize(item.size); setShowFontSizeSelector(false); }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors",
                          aiFontSize === item.size
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                        )}
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button variant="ghost" size="icon" onClick={handleClearChat} title={t('ai.clear')}>
              <Eraser className="w-4 h-4 text-muted-foreground" />
            </Button>
            {/* [P3-1修复] 自定义确认对话框替代原生 confirm() */}
            {showClearConfirm && (
              <div className="absolute top-12 right-2 z-50 glass-panel rounded-lg border border-border dark:border-border p-3 text-sm">
                <p className="mb-2 text-foreground dark:text-foreground/80">{t('ai.clearAllConfirm')}</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowClearConfirm(false)} className="px-3 py-1 text-xs rounded-lg bg-secondary dark:bg-card text-foreground dark:text-foreground/80 hover:bg-accent">{t('common.cancel')}</button>
                  <button onClick={confirmClearChat} className="px-3 py-1 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600">{t('common.confirm')}</button>
                </div>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={() => { setAiOpen(false); clearSelection(); }} className="dark:text-foreground/50 dark:hover:bg-white/[0.06]">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 消息列表 */}
        <div
          className="flex-1 overflow-y-auto p-4 bg-background dark:bg-background min-h-0 space-y-6 relative scroll-smooth"
          ref={scrollRef}
          onScroll={handleScroll}
          onClick={() => {
            if (messages.length > 0) setIsImmersive(!isImmersive)
          }}
        >
          <MessageList
            messages={messages.map(m => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content
            }))}
            isLoading={isLoading}
            error={error || null}
            onRetry={!isLoading ? () => reload() : undefined}
            onSaveInsight={handleSaveInsight}
            fontSize={aiFontSize}
            isSaved={(messageId) => savedInsights.some(i => i.messageId === messageId)}
          />

          {isImmersive && (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 md:left-auto md:right-[calc(var(--sidebar-width)/2)] md:translate-x-1/2 z-50 pointer-events-none animate-in fade-in duration-500">
              <div className="bg-black/60 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                {t('ai.immersiveHint')}
              </div>
            </div>
          )}
        </div>

        {/* 快捷提示词 */}
        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isImmersive ? "h-0 opacity-0 border-none" : "opacity-100"
        )}>
          <QuickPrompts
            isLoading={isLoading}
            messagesCount={messages.length}
            aiMode={aiMode}
            onChipClick={handleChipClick}
            customPrompts={customPrompts}
          />
        </div>

        {/* 输入表单 */}
        <div className={cn(
          "bg-card dark:bg-card flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
          isImmersive ? "h-0 opacity-0" : "opacity-100"
        )}>
          <AIInputForm
            input={input}
            isLoading={isLoading}
            onInputChange={(value) => {
              const event = { target: { value } } as React.ChangeEvent<HTMLInputElement>
              handleInputChange(event)
            }}
            onSubmit={handleFormSubmit}
            onStop={() => {
              // 统一通过cancelAIRequest处理，shouldAbortStream effect会调用stop()并推进队列
              if (currentAiRequest) {
                cancelAIRequest(currentAiRequest.id)
              } else {
                stop()
              }
            }}
          />
        </div>

        {isResizing && <div className="fixed inset-0 z-[100] cursor-col-resize" />}
      </div>

      {/* 重命名弹窗 */}
      <RenameModal
        show={showRenameModal}
        title={renameTitle}
        isGenerating={isGeneratingTitle}
        onClose={() => { setShowRenameModal(false); setRenameSessionId(null); }}
        onSubmit={handleRenameSubmit}
        onTitleChange={setRenameTitle}
      />

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        show={showDeleteConfirm}
        session={deleteTargetSession}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTargetSession(null); }}
        onConfirm={confirmDeleteSession}
      />
    </>
  )
}

// 重命名弹窗组件
function RenameModal({
  show,
  title,
  isGenerating,
  onClose,
  onSubmit,
  onTitleChange,
}: {
  show: boolean
  title: string
  isGenerating: boolean
  onClose: () => void
  onSubmit: () => void
  onTitleChange: (value: string) => void
}) {
  const { t } = useTranslation()
  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel rounded-lg p-5 w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-foreground flex items-center gap-2 tracking-[-0.022em]">
            <Edit className="w-5 h-5 text-primary" />
            {t('ai.renameChat')}
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={t('ai.renamePlaceholder')}
              className="flex-1 px-4 py-3 border border-border dark:border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-card dark:bg-card dark:text-foreground"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmit()
                if (e.key === 'Escape') onClose()
              }}
            />
            <button
              disabled={isGenerating}
              className="px-3 py-3 text-xs text-primary hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-foreground dark:text-foreground/60 hover:bg-black/[0.04] rounded-lg transition-colors"
            >
              {t('ai.cancel')}
            </button>
            <button
              onClick={onSubmit}
              disabled={!title.trim()}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-apple-focus rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('ai.save')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// 删除确认弹窗组件
function DeleteConfirmModal({
  show,
  session,
  onClose,
  onConfirm,
}: {
  show: boolean
  session: any
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  if (!show || !session) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel rounded-lg p-5 w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground dark:text-foreground tracking-[-0.022em]">{t('ai.deleteChat')}</h3>
              <p className="text-sm text-muted-foreground">{t('ai.deleteChatHint')}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-5 px-1">
            {t('ai.deleteChatConfirm', { title: session.title || t('ai.unnamedChat') })}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-foreground dark:text-foreground/60 hover:bg-black/[0.04] rounded-lg transition-colors"
            >
              {t('ai.cancel')}
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors"
            >
              {t('ai.confirmDelete')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}