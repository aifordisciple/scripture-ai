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
    currentAiRequest, aiQueue, completeCurrentRequest, failCurrentRequest,
    // 会话管理
    currentSessionId, setCurrentSessionId, sessions, setSessions, addSession, updateSession, deleteSession,
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
      setAiGenerating(false)
      failCurrentRequest(error.message || t('ai.aiGenerateFailed'))
    },
    onFinish: () => {
      setAiGenerating(false)
      completeCurrentRequest()
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
    let wakeLock: any = null
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isLoading) {
          wakeLock = await (navigator as any).wakeLock.request('screen')
        }
      } catch (err) {}
    }
    const releaseWakeLock = async () => {
      if (wakeLock) {
        try { await wakeLock.release() } catch (e) {}
        wakeLock = null
      }
    }
    if (isLoading) requestWakeLock()
    else releaseWakeLock()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoading) requestWakeLock()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      releaseWakeLock()
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
  useEffect(() => {
    if (sessionsLoading) return

    if (isAiOpen && !currentSessionId && sessionStatus !== 'creating') {
      const tempId = `temp-${Date.now()}`
      setChatKey(`chat-${Date.now()}`)
      setCurrentSessionId(tempId)
      setSessionStatus('idle')
      setMessages([])
      loadedSessionRef.current = tempId
    }
  }, [isAiOpen, currentSessionId, sessionsLoading, sessionStatus, setCurrentSessionId, setMessages, setSessionStatus, setChatKey])

  // 重置状态 - 仅在切换会话时重置，关闭侧边栏时不重置
  // 避免关闭再打开时从服务器重新加载消息覆盖 useChat 内存中的消息
  // loadedSessionRef 会在 handleSelectSession/handleNewSession 中正确更新

  // 保存临时会话
  const savePendingSession = useCallback(async (tempId: string, firstMessage?: string): Promise<string | null> => {
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
      addSession(session)
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
  }, [aiMode, aiRequestTrigger, addSession, setSessionStatus, setSessionError])

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
    if (!aiRequestTrigger) return

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

  // 清空对话
  const handleClearChat = async () => {
    if (confirm(t('ai.clearAllConfirm'))) {
      setMessages([])
      await fetch('/api/chat/history', { method: 'DELETE' })
    }
  }

  // AI 生成状态
  useEffect(() => {
    setAiGenerating(isLoading)
  }, [isLoading, setAiGenerating])

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
  useEffect(() => {
    if (!aiRequestTrigger) return
    if (aiRequestTrigger.timestamp === lastProcessedTimeRef.current) return

    lastProcessedTimeRef.current = aiRequestTrigger.timestamp
    shouldAutoScrollRef.current = true

    const sendMessage = async () => {
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

      append(
        { role: 'user', content: enrichedPrompt },
        { body: { sessionId } }
      )
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
          "fixed inset-y-0 right-0 z-50 bg-white dark:bg-slate-900 shadow-2xl border-l dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out",
          "w-full md:w-[var(--sidebar-width)]",
          isAiOpen ? "translate-x-0" : "translate-x-full",
          isResizing && "transition-none"
        )}
      >
        {/* 调整大小手柄 */}
        <div
          onMouseDown={startResizing}
          className="hidden md:block absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400/50 transition-colors z-50 group"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-slate-200 dark:bg-slate-700 rounded group-hover:bg-blue-500 transition-colors" />
        </div>

        {/* 头部 */}
        <div className={cn(
          "flex items-center justify-between px-4 bg-slate-50 dark:bg-slate-900 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-b dark:border-slate-800",
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
              <span className="text-xs font-normal bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
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
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                  aiMode === 'general' ? "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" : "",
                  aiMode === 'tutor' ? "text-violet-600 bg-violet-50 dark:bg-violet-900/20" : "",
                  aiMode === 'sermon' ? "text-orange-600 bg-orange-50 dark:bg-orange-900/20" : "",
                  aiMode === 'study-guide' ? "text-teal-600 bg-teal-50 dark:bg-teal-900/20" : "",
                  aiMode === 'custom' ? "text-slate-600 bg-slate-100 dark:bg-slate-800" : ""
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
                    className="fixed top-20 right-20 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 z-[200] overflow-hidden"
                  >
                    {[
                      { mode: 'general' as const, icon: Sparkles, label: t('ai.generalDesc'), color: 'text-slate-600' },
                      { mode: 'tutor' as const, icon: GraduationCap, label: t('ai.tutorDesc'), color: 'text-violet-600' },
                      { mode: 'sermon' as const, icon: FileText, label: t('ai.sermonDesc'), color: 'text-orange-600' },
                      { mode: 'study-guide' as const, icon: BookMarked, label: t('ai.studyGuideDesc'), color: 'text-teal-600' },
                      { mode: 'custom' as const, icon: Settings, label: t('ai.custom'), color: 'text-slate-600' },
                    ].map(item => (
                      <button
                        key={item.mode}
                        onClick={() => { setAiMode(item.mode); setShowModeSelector(false); }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors",
                          aiMode === item.mode
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
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
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                  aiFontSize === 'medium' ? "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" : "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
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
                    className="fixed top-20 right-32 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 z-[200] overflow-hidden"
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
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
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
              <Eraser className="w-4 h-4 text-slate-400" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { setAiOpen(false); clearSelection(); }} className="dark:text-slate-400 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 消息列表 */}
        <div
          className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/50 min-h-0 space-y-6 relative scroll-smooth"
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
              <div className="bg-black/60 text-white text-[10px] px-3 py-1 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1">
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
          "bg-white dark:bg-slate-900 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
          isImmersive ? "h-0 opacity-0 shadow-none" : "opacity-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
        )}>
          <AIInputForm
            input={input}
            isLoading={isLoading}
            onInputChange={(value) => {
              const event = { target: { value } } as React.ChangeEvent<HTMLInputElement>
              handleInputChange(event)
            }}
            onSubmit={handleFormSubmit}
            onStop={stop}
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
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-5 w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-500" />
            {t('ai.renameChat')}
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={t('ai.renamePlaceholder')}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-900 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmit()
                if (e.key === 'Escape') onClose()
              }}
            />
            <button
              disabled={isGenerating}
              className="px-3 py-3 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              {t('ai.cancel')}
            </button>
            <button
              onClick={onSubmit}
              disabled={!title.trim()}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-5 w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{t('ai.deleteChat')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('ai.deleteChatHint')}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 px-1">
            {t('ai.deleteChatConfirm', { title: session.title || t('ai.unnamedChat') })}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              {t('ai.cancel')}
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-colors shadow-sm"
            >
              {t('ai.confirmDelete')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}