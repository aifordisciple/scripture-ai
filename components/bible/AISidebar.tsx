// components/bible/AISidebar.tsx
"use client";

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Send, BookOpen, Search, Lightbulb, LayoutList, Minimize2, Copy, Check, Bot, User, StopCircle, Eraser, Quote, ChevronRight, Loader2, RefreshCw, AlertCircle, PenLine, MessageSquare, Plus, History, Bookmark, Share2, ChevronDown, Trash2, GraduationCap, FileText, BookMarked } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEOLOGICAL_PROMPTS } from '@/lib/constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AudioButton } from './AudioButton';
import { useChat } from 'ai/react';
import { motion, AnimatePresence } from "framer-motion";
import type { ChatSession } from '@/store/types';

// --- 1. 子组件：高性能消息气泡 ---
const MessageBubble = memo(({
  role,
  content,
  isLatest,
  onRetry,
  // [新增] 传入用于保存笔记的上下文信息
  onSaveToNote,
  // [新增] 收藏功能
  onSaveInsight,
  isSaved,
  // [新增] 分享功能
  onShare
}: {
  role: string;
  content: string;
  isLatest: boolean;
  onRetry?: () => void;
  onSaveToNote?: (text: string) => void;
  onSaveInsight?: () => void;
  isSaved?: boolean;
  onShare?: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bookmarked, setBookmarked] = useState(isSaved);

  let mainText = content;
  let isThinking = false;

  const thinkStart = content.indexOf('<think>');
  if (thinkStart !== -1) {
    const thinkEnd = content.indexOf('</think>');
    if (thinkEnd !== -1) {
      mainText = (content.substring(0, thinkStart) + content.substring(thinkEnd + 8)).trim();
      isThinking = false;
    } else {
      mainText = content.substring(0, thinkStart).trim();
      isThinking = true;
    }
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    const copyText = mainText || content;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyText)
        .then(() => showSuccess(setCopied))
        .catch((err) => {
          console.warn("Clipboard API failed, trying fallback...", err);
          fallbackCopy(copyText, setCopied);
        });
    } else {
      fallbackCopy(copyText, setCopied);
    }
  };

  const handleSaveToNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSaveToNote) {
       onSaveToNote(mainText);
       showSuccess(setSaved);
    }
  };

  const fallbackCopy = (text: string, setSuccessState: Function) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) showSuccess(setSuccessState);
    } catch (err) {
      console.error("Fallback copy failed", err);
    }
  };

  const showSuccess = (setSuccessState: Function) => {
    setSuccessState(true);
    setTimeout(() => setSuccessState(false), 2000);
  };

  return (
    <div className={cn("flex group relative mb-4", role === 'user' ? "justify-end" : "justify-start")}>
      <div className={cn(
        "relative transition-all",
        role === 'user'
          ? "max-w-[90%] rounded-2xl px-4 py-3 shadow-sm bg-blue-600 text-white text-[15px]"
          : "w-full" // AI 消息全宽，无背景框
      )}>
        {/* 用户消息显示用户标识在右上角 */}
        {role === 'user' && (
          <div className="absolute -top-5 right-0 flex items-center gap-1 text-[10px] font-bold opacity-60 select-none text-blue-500 flex-row-reverse">
            <User className="w-3 h-3" />
            <span>你</span>
          </div>
        )}

        {role === 'user' ? (
           <div className="prose prose-sm dark:prose-invert max-w-none break-words text-white">
             <ReactMarkdown
                components={{
                    blockquote: ({node, ...props}) => <blockquote className="relative border-l-4 border-white/50 pl-3 py-1 my-2 bg-white/10 rounded-r-md italic text-white/90 text-xs" {...props} />,
                    p: ({node, ...props}) => <p className="leading-relaxed mb-2 last:mb-0" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-white bg-white/20 px-1 py-0.5 rounded text-[13px]" {...props} />
                }}
             >
                {content}
             </ReactMarkdown>
           </div>
        ) : (
          <>
            {/* AI 标识 */}
            <div className="flex items-center gap-1.5 mb-3 text-slate-400 dark:text-slate-500 select-none">
              <Bot className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">AI</span>
            </div>

            {isThinking && (
              <div className="flex items-center gap-2 text-blue-500 mb-3 text-[13px] font-medium animate-pulse select-none">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span>AI 正在深度解读中...</span>
              </div>
            )}

            {mainText && (
              <div className="prose prose-slate dark:prose-invert max-w-none break-words">
                {typeof ReactMarkdown !== 'undefined' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h3: ({node, ...props}) => (
                          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-6 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                              <span className="w-1 h-4 bg-blue-500 rounded-full inline-block"></span>
                              {props.children}
                          </h3>
                        ),
                        h4: ({node, ...props}) => <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-4 mb-2 flex items-center gap-1" {...props}><ChevronRight className="w-3 h-3 text-blue-400" />{props.children}</h4>,
                        p: ({node, ...props}) => <p className="text-[15px] leading-7 text-slate-600 dark:text-slate-300 mb-3 last:mb-0 text-justify" {...props} />,
                        ul: ({node, ...props}) => <ul className="my-2 space-y-1 pl-1" {...props} />,
                        li: ({node, ...props}) => (
                          <li className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 flex items-start gap-2 pl-1" {...props}>
                             <span className="text-blue-400 select-none mt-2 text-[6px] shrink-0">●</span>
                             <span className="flex-1">{props.children}</span>
                          </li>
                        ),
                        strong: ({node, ...props}) => <strong className="font-semibold text-blue-900 dark:text-blue-100 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded mx-0.5 text-[14px]" {...props} />,
                        blockquote: ({node, ...props}) => (
                          <blockquote className="relative border-l-4 border-blue-300 dark:border-blue-700 pl-4 py-2 my-4 bg-slate-50 dark:bg-slate-800/50 rounded-r-lg" {...props}>
                              <Quote className="absolute top-2 right-2 w-4 h-4 text-slate-200 dark:text-slate-700" />
                              <div className="italic text-slate-600 dark:text-slate-400 text-sm">{props.children}</div>
                          </blockquote>
                        ),
                        code: ({node, ...props}) => <code className="bg-slate-100 dark:bg-slate-800 text-red-500 dark:text-red-400 px-1.5 py-0.5 rounded text-xs font-mono border dark:border-slate-700" {...props} />,
                      }}
                    >
                      {mainText}
                    </ReactMarkdown>
                ) : (
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">{mainText}</div>
                )}
              </div>
            )}

            {/* 底部工具栏：复制 + 笔记 + 收藏 + 重试 + 朗读 */}
            {(mainText || !isThinking) && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center opacity-100 select-none">
                  <div className="flex items-center gap-1 flex-wrap">
                      <button
                          onClick={handleCopy}
                          className={cn(
                              "flex items-center gap-1.5 text-[11px] font-medium transition-all px-2 py-1 rounded-md",
                              copied ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                          title="复制内容"
                      >
                          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied ? "已复制" : "复制"}
                      </button>

                      {/* [新增] 保存到笔记按钮 */}
                      {onSaveToNote && (
                        <button
                            onClick={handleSaveToNote}
                            className={cn(
                                "flex items-center gap-1.5 text-[11px] font-medium transition-all px-2 py-1 rounded-md",
                                saved ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "text-slate-400 hover:text-amber-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                            title="存为笔记"
                        >
                            {saved ? <Check className="w-3 h-3" /> : <PenLine className="w-3 h-3" />}
                            {saved ? "已添加" : "笔记"}
                        </button>
                      )}

                      {/* [新增] 收藏按钮 */}
                      {onSaveInsight && (
                        <button
                            onClick={() => { onSaveInsight(); setBookmarked(true); }}
                            className={cn(
                                "flex items-center gap-1.5 text-[11px] font-medium transition-all px-2 py-1 rounded-md",
                                bookmarked ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                            title="收藏解读"
                        >
                            <Bookmark className={cn("w-3 h-3", bookmarked && "fill-current")} />
                            {bookmarked ? "已收藏" : "收藏"}
                        </button>
                      )}

                      {/* [新增] 分享按钮 */}
                      {onShare && (
                        <button
                            onClick={onShare}
                            className="flex items-center gap-1.5 text-[11px] font-medium transition-all px-2 py-1 rounded-md text-slate-400 hover:text-teal-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                            title="分享到小组"
                        >
                            <Share2 className="w-3 h-3" />
                            分享
                        </button>
                      )}

                      {onRetry && (
                        <button
                            onClick={onRetry}
                            className="flex items-center gap-1.5 text-[11px] font-medium transition-all px-2 py-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                            title="重新生成"
                        >
                            <RefreshCw className="w-3 h-3" />
                            重试
                        </button>
                      )}
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                      <AudioButton text={mainText} size="sm" variant="ghost" className="text-slate-400 hover:text-blue-600 h-7 px-2 text-[11px]" label="朗读" />
                  </div>
              </div>
            )}
          </>
        )}

        {role === 'assistant' && isLatest && !isThinking && (
             <span className="inline-block w-2.5 h-2.5 ml-1 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-full animate-pulse align-baseline shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
        )}
      </div>
    </div>
  );
}, (prev, next) => prev.content === next.content && prev.isLatest === next.isLatest);

MessageBubble.displayName = "MessageBubble";

// --- 2. 主组件：AI Sidebar ---
export function AISidebar() {
  const {
    isAiOpen, setAiOpen, clearSelection, aiRequestTrigger,
    sidebarWidth, setSidebarWidth,
    setAiGenerating, openNoteEditor, notes, updateNote,
    // 队列相关
    currentAiRequest, aiQueue, completeCurrentRequest, failCurrentRequest, cancelAIRequest,
    // [新增] 会话管理
    currentSessionId, setCurrentSessionId, sessions, setSessions, addSession, deleteSession,
    // [新增] AI 模式
    aiMode, setAiMode,
    // [新增] 收藏
    savedInsights, addSavedInsight, deleteSavedInsight
  } = useBibleStore();

  // [新增] 会话相关状态
  const [showSessionList, setShowSessionList] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isImmersive, setIsImmersive] = useState(false); 
  
  const lastProcessedTimeRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const { apiConfig } = useBibleStore();
  const { messages, input, handleInputChange, handleSubmit, append, isLoading, stop, setMessages, error, reload } = useChat({
    api: '/api/chat',
    body: {
        apiConfig: apiConfig,
        context: aiRequestTrigger ? {
            bookName: aiRequestTrigger.ref.bookName,
            chapter: aiRequestTrigger.ref.chapter,
            verse: aiRequestTrigger.ref.verse,
            selectedText: aiRequestTrigger.content,
            contextText: aiRequestTrigger.context
        } : null
    },
    onError: (error) => {
        console.error("🔥 AI Error:", error);
        setAiGenerating(false);
        failCurrentRequest(error.message || 'AI 生成失败');
    },
    onFinish: () => {
        setAiGenerating(false);
        completeCurrentRequest();
    }
  });

  // 屏幕防睡眠机制
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isLoading) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {}
    };
    const releaseWakeLock = async () => {
      if (wakeLock) {
        try { await wakeLock.release(); } catch (e) {}
        wakeLock = null;
      }
    };
    if (isLoading) requestWakeLock();
    else releaseWakeLock();

    const handleVisibilityChange = () => { if (document.visibilityState === 'visible' && isLoading) requestWakeLock(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { releaseWakeLock(); document.removeEventListener('visibilitychange', handleVisibilityChange); };
  }, [isLoading]);

  useEffect(() => {
    fetch('/api/chat/history')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setMessages(data.map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
        }
      })
      .catch(err => console.error("Failed to load chat history", err));
  }, [setMessages]);

  // [新增] 加载会话列表
  useEffect(() => {
    fetch('/api/chat/session')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSessions(data);
        }
      })
      .catch(err => console.error("Failed to load sessions", err));
  }, [setSessions]);

  // [新增] 创建新会话
  const handleNewSession = useCallback(async () => {
    if (!aiRequestTrigger) {
      // 没有经文上下文时创建空会话
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: aiMode }),
      });
      const session = await res.json();
      addSession(session);
      setCurrentSessionId(session.id);
      setMessages([]);
      return;
    }

    // 有经文上下文时创建关联会话
    const res = await fetch('/api/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId: aiRequestTrigger.ref.bookName,
        chapter: aiRequestTrigger.ref.chapter,
        startVerse: aiRequestTrigger.ref.verse > 0 ? aiRequestTrigger.ref.verse : undefined,
        mode: aiMode,
      }),
    });
    const session = await res.json();
    addSession(session);
    setCurrentSessionId(session.id);
  }, [aiRequestTrigger, aiMode, addSession, setCurrentSessionId, setMessages]);

  // [新增] 切换会话
  const handleSelectSession = useCallback(async (session: ChatSession) => {
    setCurrentSessionId(session.id);
    // 加载该会话的消息
    const res = await fetch(`/api/chat/history?sessionId=${session.id}`);
    const messages = await res.json();
    if (Array.isArray(messages)) {
      setMessages(messages.map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
    }
    setShowSessionList(false);
  }, [setCurrentSessionId, setMessages]);

  // [新增] 删除会话
  const handleDeleteSession = useCallback(async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个会话吗？')) return;

    await fetch(`/api/chat/session?id=${sessionId}`, { method: 'DELETE' });
    deleteSession(sessionId);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setMessages([]);
    }
  }, [currentSessionId, deleteSession, setCurrentSessionId, setMessages]);

  // [新增] 收藏消息
  const handleSaveInsight = useCallback(async (messageId: string, content: string) => {
    if (!aiRequestTrigger) return;

    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId,
        bookId: aiRequestTrigger.ref.bookName,
        chapter: aiRequestTrigger.ref.chapter,
        verse: aiRequestTrigger.ref.verse > 0 ? aiRequestTrigger.ref.verse : undefined,
        title: content.substring(0, 50) + '...',
      }),
    });
    const insight = await res.json();
    addSavedInsight(insight);
  }, [aiRequestTrigger, addSavedInsight]);

  const handleClearChat = async () => {
    if(confirm("确定要清空所有灵修对话历史吗？")) {
        setMessages([]);
        await fetch('/api/chat/history', { method: 'DELETE' });
    }
  };

  useEffect(() => {
    setAiGenerating(isLoading);
  }, [isLoading, setAiGenerating]);

  useEffect(() => {
    if (scrollRef.current && shouldAutoScrollRef.current) {
        const div = scrollRef.current;
        div.scrollTop = div.scrollHeight;
    }
  }, [messages, isLoading, error]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom <= 100;
    }
  };

  useEffect(() => {
    if (!aiRequestTrigger) return;
    if (aiRequestTrigger.timestamp === lastProcessedTimeRef.current) return;

    lastProcessedTimeRef.current = aiRequestTrigger.timestamp;
    shouldAutoScrollRef.current = true;

    let reference = `${aiRequestTrigger.ref.bookName} ${aiRequestTrigger.ref.chapter}`;
    if (aiRequestTrigger.ref.verse > 0) {
        reference += `:${aiRequestTrigger.ref.verse}`;
    } else {
        reference += ` 章 (全章摘要)`;
    }

    const displayQuote = aiRequestTrigger.content.split('\n').map(line => `> ${line}`).join('\n');
    const enrichedPrompt = `**📖 ${reference}**\n\n${displayQuote}\n\n**我的请求**：${aiRequestTrigger.prompt}`;

    append({ role: 'user', content: enrichedPrompt });
  }, [aiRequestTrigger, append]);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e: MouseEvent) => {
      if (isResizing) {
        const newWidth = document.body.clientWidth - e.clientX;
        if (newWidth > 300 && newWidth < 1200) setSidebarWidth(newWidth);
      }
    }, [isResizing, setSidebarWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const handleChipClick = (prompt: string) => {
    if (isLoading) return;
    shouldAutoScrollRef.current = true; 
    let finalPrompt = prompt;
    if (aiRequestTrigger && messages.length === 0) {
        let reference = `${aiRequestTrigger.ref.bookName} ${aiRequestTrigger.ref.chapter}`;
        if (aiRequestTrigger.ref.verse > 0) reference += `:${aiRequestTrigger.ref.verse}`;
        const displayQuote = aiRequestTrigger.content.split('\n').map(line => `> ${line}`).join('\n');
        finalPrompt = `**📖 ${reference}**\n\n${displayQuote}\n\n**我的请求**：${prompt}`;
    }
    append({ role: 'user', content: finalPrompt });
  };

  // [新增] 处理将 AI 解读一键追加到笔记中的逻辑
  const handleSaveToNote = useCallback((aiText: string) => {
    if (!aiRequestTrigger) {
      alert("请先在左侧经文中选中并触发一次对话，才能关联笔记哦！");
      return;
    }
    
    const { bookName, chapter, verse } = aiRequestTrigger.ref;
    
    // 打开笔记面板（此操作会自动去 store 找是否有对应的 existingNote）
    openNoteEditor(bookName, chapter, verse);
    
    // 我们需要把内容追加进去
    // 注意：这里的逻辑依赖于 NoteEditor.tsx 中对 zustand 状态的同步
    // 为了防止覆写，我们最好构造一段漂亮的 Markdown
    setTimeout(() => {
      const appendContent = `\n\n---\n**✨ AI 启发 (${new Date().toLocaleDateString()})：**\n${aiText}`;
      
      const existingNote = useBibleStore.getState().notes.find(n => n.bookId === bookName && n.chapter === chapter && n.verse === verse);
      
      if (existingNote) {
         // 如果已经有笔记了，直接更新 Zustand
         useBibleStore.getState().updateNote(existingNote.id, existingNote.content + appendContent);
      } else {
         // 如果是全新的，由于 openNoteEditor 只设了 targetVerse，我们需要模拟新建并保存的过程
         // 更好的做法是在 NoteEditor 里暴露一个追加事件，或者利用 zustand
         const tempId = `temp-${Date.now()}`;
         useBibleStore.getState().addNote({
            id: tempId, bookId: bookName, chapter, verse, content: appendContent.trim()
         });
      }
    }, 100); 

  }, [aiRequestTrigger, openNoteEditor]);


  const getIcon = (id: string) => {
    switch (id) {
      case 'detail': return <LayoutList className="w-3 h-3" />;
      case 'context': return <BookOpen className="w-3 h-3" />;
      case 'original': return <Search className="w-3 h-3" />;
      case 'application': return <Lightbulb className="w-3 h-3" />;
      default: return <Sparkles className="w-3 h-3" />;
    }
  };

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
        <div 
          onMouseDown={startResizing}
          className="hidden md:block absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400/50 transition-colors z-50 group"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-slate-200 dark:bg-slate-700 rounded group-hover:bg-blue-500 transition-colors" />
        </div>

        <div
          className={cn(
            "flex items-center justify-between px-4 bg-slate-50 dark:bg-slate-900 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-b dark:border-slate-800",
            isImmersive ? "h-0 opacity-0 border-none p-0" : "h-14 opacity-100 py-3"
          )}
        >
          <div className="flex items-center gap-2">
            {/* [新增] 会话选择器 */}
            <div className="relative">
              <button
                onClick={() => setShowSessionList(!showSessionList)}
                className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold select-none hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm max-w-[120px] truncate">
                  {sessions.find(s => s.id === currentSessionId)?.title || '新对话'}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* 会话列表下拉 */}
              <AnimatePresence>
                {showSessionList && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="fixed top-20 left-4 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 z-[200] max-h-80 overflow-y-auto"
                  >
                    <div className="p-2 border-b dark:border-slate-700">
                      <button
                        onClick={handleNewSession}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        新建对话
                      </button>
                    </div>
                    <div className="p-1">
                      {sessions.length === 0 ? (
                        <div className="px-3 py-4 text-center text-slate-400 text-sm">暂无历史对话</div>
                      ) : (
                        sessions.map(session => (
                          <div
                            key={session.id}
                            onClick={() => handleSelectSession(session)}
                            className={cn(
                              "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors group",
                              currentSessionId === session.id
                                ? "bg-blue-50 dark:bg-blue-900/30"
                                : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{session.title || '未命名对话'}</div>
                              <div className="text-xs text-slate-400">
                                {new Date(session.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 队列状态指示 */}
            {(currentAiRequest || aiQueue.length > 0) && (
              <span className="text-xs font-normal bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                {currentAiRequest?.status === 'processing' && '处理中'}
                {aiQueue.length > 0 && ` · ${aiQueue.length} 排队`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* [新增] AI 模式选择 */}
            <div className="relative">
              <button
                onClick={() => setShowModeSelector(!showModeSelector)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                  aiMode === 'general' ? "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" : "",
                  aiMode === 'tutor' ? "text-violet-600 bg-violet-50 dark:bg-violet-900/20" : "",
                  aiMode === 'sermon' ? "text-orange-600 bg-orange-50 dark:bg-orange-900/20" : "",
                  aiMode === 'study-guide' ? "text-teal-600 bg-teal-50 dark:bg-teal-900/20" : ""
                )}
              >
                {aiMode === 'tutor' && <GraduationCap className="w-3.5 h-3.5" />}
                {aiMode === 'sermon' && <FileText className="w-3.5 h-3.5" />}
                {aiMode === 'study-guide' && <BookMarked className="w-3.5 h-3.5" />}
                {aiMode === 'general' && <Sparkles className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">
                  {aiMode === 'general' && '标准'}
                  {aiMode === 'tutor' && '导师'}
                  {aiMode === 'sermon' && '讲章'}
                  {aiMode === 'study-guide' && '查经'}
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
                      { mode: 'general' as const, icon: Sparkles, label: '标准解读', color: 'text-slate-600' },
                      { mode: 'tutor' as const, icon: GraduationCap, label: '苏格拉底导师', color: 'text-violet-600' },
                      { mode: 'sermon' as const, icon: FileText, label: '讲章生成', color: 'text-orange-600' },
                      { mode: 'study-guide' as const, icon: BookMarked, label: '查经材料', color: 'text-teal-600' },
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

            <Button variant="ghost" size="icon" onClick={handleClearChat} title="清空">
                <Eraser className="w-4 h-4 text-slate-400" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { setAiOpen(false); clearSelection(); }} className="dark:text-slate-400 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/50 min-h-0 space-y-6 relative scroll-smooth"
          ref={scrollRef}
          onScroll={handleScroll} 
          onClick={() => {
              if (messages.length > 0) setIsImmersive(!isImmersive);
          }} 
        >
          {messages.length === 0 && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 select-none opacity-60">
                <Bot className="w-16 h-16 stroke-1 mb-4" />
                <p className="text-sm">👋 选中经文，点击菜单即可开始。</p>
            </div>
          ) : (
            <div className="flex flex-col pb-4">
                {messages.map((m, index) => {
                    const isLatest = index === messages.length - 1;
                    const isAssistant = m.role === 'assistant';
                    const messageId = m.id || `msg-${index}`;
                    return (
                        <MessageBubble
                            key={messageId}
                            role={m.role}
                            content={m.content}
                            isLatest={isLatest && isLoading}
                            onRetry={(!isLoading && isAssistant && isLatest) ? () => reload() : undefined}
                            // [新增] 只有助手回复并且不为空时才显示保存笔记按钮
                            onSaveToNote={(isAssistant && m.content.length > 0) ? handleSaveToNote : undefined}
                            // [新增] 收藏功能
                            onSaveInsight={(isAssistant && m.content.length > 0 && aiRequestTrigger) ? () => handleSaveInsight(messageId, m.content) : undefined}
                            isSaved={savedInsights.some(i => i.messageId === messageId)}
                            // [新增] 分享功能
                            onShare={(isAssistant && m.content.length > 0) ? () => {
                              // TODO: 实现分享到小组功能
                              alert('分享功能开发中...');
                            } : undefined}
                        />
                    );
                })}

                {error && (
                    <div className="flex flex-col items-center justify-center p-4 mt-2 mb-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                        <AlertCircle className="w-6 h-6 text-red-500 mb-2 opacity-80" />
                        <span className="text-xs text-red-600 dark:text-red-400 text-center mb-3">
                            由于网络波动或熄屏，AI 生成已中断。<br/>请保持屏幕常亮并重新尝试。
                        </span>
                        <Button variant="outline" size="sm" onClick={() => reload()} className="h-8 text-xs rounded-full border-red-200 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30">
                           <RefreshCw className="w-3 h-3 mr-1" /> 重新生成
                        </Button>
                    </div>
                )}
            </div>
          )}

          {isImmersive && (
             <div className="fixed top-6 left-1/2 -translate-x-1/2 md:left-auto md:right-[calc(var(--sidebar-width)/2)] md:translate-x-1/2 z-50 pointer-events-none animate-in fade-in duration-500">
                 <div className="bg-black/60 text-white text-[10px] px-3 py-1 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1">
                    <Minimize2 className="w-3 h-3" />
                    轻触显示菜单
                 </div>
             </div>
          )}
        </div>

        <div 
          className={cn(
              "bg-white dark:bg-slate-900 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]",
              isImmersive ? "max-h-0 opacity-0" : "max-h-[300px] opacity-100" 
          )}
        >
            {!isLoading && messages.length > 0 && (
              <div className="px-4 pb-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1 mb-2">
                   {aiMode === 'tutor' ? '苏格拉底式引导' :
                    aiMode === 'sermon' ? '讲章工具' :
                    aiMode === 'study-guide' ? '查经工具' : '深度探索'}
                 </div>
                 {/* 水平滚动容器，隐藏滚动条 */}
                 <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
                   <style jsx>{`
                     .scrollbar-hide::-webkit-scrollbar { display: none; }
                     .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                   `}</style>
                   {THEOLOGICAL_PROMPTS.filter(t => {
                     // 根据模式过滤显示的提示词
                     if (aiMode === 'tutor') return t.id === 'tutor';
                     if (aiMode === 'sermon') return t.id === 'sermon';
                     if (aiMode === 'study-guide') return t.id === 'study-guide';
                     return !t.mode; // 标准模式显示基础提示词
                   }).map((t) => (
                     <button
                       key={t.id}
                       onClick={() => handleChipClick(t.prompt)}
                       className={cn(
                         "flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium border dark:border-slate-700 transition-all active:scale-95 shadow-sm dark:bg-slate-800 dark:text-slate-200 hover:brightness-95 whitespace-nowrap shrink-0",
                         t.color
                       )}
                     >
                       {getIcon(t.id)}
                       {t.label}
                     </button>
                   ))}
                 </div>
              </div>
            )}

            <div className="p-4 safe-area-bottom">
              <form onSubmit={handleSubmit} className="flex gap-2 relative">
                <input
                  className="flex-1 px-4 py-3 pr-12 border border-slate-200 dark:border-slate-700 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="追问..."
                  disabled={isLoading}
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {isLoading ? (
                        <Button type="button" size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => stop()}>
                            <StopCircle className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button type="submit" size="icon" disabled={!input.trim()} className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700">
                            <Send className="w-4 h-4" />
                        </Button>
                    )}
                </div>
              </form>
              <div className="mt-2 text-[10px] text-center text-slate-400 select-none">
                ⚠️ AI 辅助仅供参考，请依靠圣灵与圣经原文。
              </div>
            </div>
        </div>
        
        {isResizing && <div className="fixed inset-0 z-[100] cursor-col-resize" />}
      </div>
    </>
  );
}