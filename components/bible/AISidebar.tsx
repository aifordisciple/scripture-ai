// components/bible/AISidebar.tsx
"use client";

import { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Send, BookOpen, Search, Lightbulb, LayoutList, Minimize2, Copy, Check, Bot, User, StopCircle, Eraser, Quote, ChevronRight, Loader2, RefreshCw, AlertCircle, PenLine, MessageSquare, Plus, History, Bookmark, Share2, ChevronDown, Trash2, GraduationCap, FileText, BookMarked, Type, Settings, Edit, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEOLOGICAL_PROMPTS, BIBLE_BOOKS } from '@/lib/constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AudioButton } from './AudioButton';
import { useChat } from 'ai/react';
import { motion, AnimatePresence } from "framer-motion";
import type { ChatSession } from '@/store/types';
import { parseMarkdownToMindMap } from '@/components/mindmap/markdownParser';
import { BookPicker } from './BookPicker';

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
  onShare,
  // [新增] 字体大小
  fontSize,
  // [新增] 打开思维导图
  onOpenMindMap
}: {
  role: string;
  content: string;
  isLatest: boolean;
  onRetry?: () => void;
  onSaveToNote?: (text: string, messageContent?: string) => void;
  onSaveInsight?: () => void;
  isSaved?: boolean;
  onShare?: () => void;
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  onOpenMindMap?: () => void;
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
       onSaveToNote(mainText, content);  // 传入消息内容用于解析经文引用
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
    <div className={cn("flex group relative mb-5", role === 'user' ? "justify-end" : "justify-start")}>
      <div className={cn(
        "relative transition-all",
        role === 'user'
          ? "max-w-[88%] rounded-2xl rounded-tr-md px-4 py-3 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-indigo-600 text-white text-[14.5px]"
          : "w-full" // AI 消息全宽，无背景框
      )}>
        {/* 用户消息显示用户标识在右上角 */}
        {role === 'user' && (
          <div className="absolute -top-5 right-0 flex items-center gap-1 text-[10px] font-medium opacity-50 select-none text-blue-400 flex-row-reverse">
            <User className="w-3 h-3" />
            <span>你</span>
          </div>
        )}

        {role === 'user' ? (
           <div className="prose prose-sm dark:prose-invert max-w-none break-words text-white">
             <ReactMarkdown
                components={{
                    blockquote: ({node, ...props}) => <blockquote className="relative border-l-[3px] border-white/40 pl-3 py-1.5 my-2 bg-white/10 rounded-r-lg italic text-white/90 text-[13px]" {...props} />,
                    p: ({node, ...props}) => <p className="leading-[1.75] mb-2 last:mb-0" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-white bg-white/20 px-1.5 py-0.5 rounded text-[13px]" {...props} />
                }}
             >
                {content}
             </ReactMarkdown>
           </div>
        ) : (
          <>
            {/* AI 标识 - 简化现代风格 */}
            <div className="flex items-center gap-2 mb-4 select-none">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">AI 解读</span>
            </div>

            {isThinking && (
              <div className="flex items-center gap-2.5 text-blue-500 mb-4 text-[13px] font-medium select-none">
                 <div className="flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                   <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                   <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                 </div>
                 <span className="text-slate-500 dark:text-slate-400">正在深度解读中...</span>
              </div>
            )}

            {mainText && (
              <div className={cn(
                "prose prose-slate dark:prose-invert max-w-none break-words",
                fontSize === 'small' && "prose-sm",
                fontSize === 'large' && "prose-lg",
                fontSize === 'xlarge' && "prose-xl"
              )}>
                {typeof ReactMarkdown !== 'undefined' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h3: ({node, ...props}) => (
                          <h3 className={cn(
                            "font-semibold text-slate-900 dark:text-slate-50 mt-8 mb-4 pb-2 border-b border-slate-200/60 dark:border-slate-700/50 flex items-center gap-2.5",
                            fontSize === 'small' ? "text-[15px]" : fontSize === 'large' ? "text-lg" : fontSize === 'xlarge' ? "text-xl" : "text-base"
                          )}>
                              <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full inline-block"></span>
                              {props.children}
                          </h3>
                        ),
                        h4: ({node, ...props}) => <h4 className={cn(
                          "font-medium text-slate-800 dark:text-slate-200 mt-6 mb-3 flex items-center gap-2",
                          fontSize === 'small' ? "text-[13px]" : fontSize === 'large' ? "text-[15px]" : fontSize === 'xlarge' ? "text-base" : "text-[14px]"
                        )} {...props}><span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block"></span>{props.children}</h4>,
                        p: ({node, ...props}) => <p className={cn(
                          "leading-[1.9] text-slate-700 dark:text-slate-300 mb-5 last:mb-0 text-justify",
                          fontSize === 'small' ? "text-[13px] leading-[1.85]" : fontSize === 'large' ? "text-[16px] leading-[1.95]" : fontSize === 'xlarge' ? "text-[17px] leading-[2]" : "text-[14.5px]"
                        )} {...props} />,
                        ul: ({node, ...props}) => <ul className="my-4 space-y-2.5 pl-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="my-4 space-y-2.5 pl-2 list-decimal" {...props} />,
                        li: ({node, ...props}) => (
                          <li className={cn(
                            "leading-[1.8] text-slate-700 dark:text-slate-300 flex items-start gap-2.5 pl-0",
                            fontSize === 'small' ? "text-[13px]" : fontSize === 'large' ? "text-[16px]" : fontSize === 'xlarge' ? "text-[17px]" : "text-[14.5px]"
                          )} {...props}>
                             <span className="text-blue-500 dark:text-blue-400 select-none mt-2 text-[5px] shrink-0">●</span>
                             <span className="flex-1">{props.children}</span>
                          </li>
                        ),
                        strong: ({node, ...props}) => <strong className={cn(
                          "font-semibold text-slate-900 dark:text-slate-50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 px-1.5 py-0.5 rounded",
                          fontSize === 'small' ? "text-[12.5px]" : fontSize === 'large' ? "text-[15.5px]" : fontSize === 'xlarge' ? "text-[16.5px]" : "text-[14px]"
                        )} {...props} />,
                        blockquote: ({node, ...props}) => (
                          <blockquote className="relative border-l-[3px] border-blue-400/60 dark:border-blue-500/50 pl-5 pr-4 py-3 my-5 bg-gradient-to-r from-slate-50/80 to-slate-50/40 dark:from-slate-800/60 dark:to-slate-800/30 rounded-r-xl" {...props}>
                              <Quote className="absolute top-3 right-3 w-4 h-4 text-slate-200 dark:text-slate-600" />
                              <div className={cn(
                                "italic text-slate-600 dark:text-slate-400 leading-relaxed",
                                fontSize === 'small' ? "text-[12.5px]" : fontSize === 'large' ? "text-[15px]" : fontSize === 'xlarge' ? "text-[16px]" : "text-[13.5px]"
                              )}>{props.children}</div>
                          </blockquote>
                        ),
                        code: ({node, className, children, ...props}) => {
                          const isInline = !className;
                          if (isInline) {
                            return <code className="bg-slate-100 dark:bg-slate-800/80 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-slate-200/50 dark:border-slate-700/50" {...props}>{children}</code>;
                          }
                          return <code className={className} {...props}>{children}</code>;
                        },
                        pre: ({node, ...props}) => (
                          <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-xl p-4 my-4 overflow-x-auto border border-slate-800" {...props} />
                        ),
                        hr: ({node, ...props}) => <hr className="my-8 border-slate-200 dark:border-slate-700/50" {...props} />,
                        a: ({node, ...props}) => <a className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-blue-300/50 dark:decoration-blue-500/30 underline-offset-2" {...props} />,
                      }}
                    >
                      {mainText}
                    </ReactMarkdown>
                ) : (
                    <div className={cn(
                      "whitespace-pre-wrap leading-[1.9] text-slate-700 dark:text-slate-300",
                      fontSize === 'small' ? "text-[13px]" : fontSize === 'large' ? "text-[16px]" : fontSize === 'xlarge' ? "text-[17px]" : "text-[14.5px]"
                    )}>{mainText}</div>
                )}
              </div>
            )}

            {/* 底部工具栏：复制 + 笔记 + 收藏 + 重试 + 朗读 */}
            {(mainText || !isThinking) && (
              <div className="mt-5 pt-4 border-t border-slate-100/80 dark:border-slate-800/60 flex justify-between items-center opacity-100 select-none">
                  <div className="flex items-center gap-0.5 flex-wrap">
                      <button
                          onClick={handleCopy}
                          className={cn(
                              "flex items-center gap-1.5 text-[11px] font-medium transition-all px-2.5 py-1.5 rounded-lg",
                              copied ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                          )}
                          title="复制内容"
                      >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? "已复制" : "复制"}
                      </button>

                      {/* [新增] 保存到笔记按钮 */}
                      {onSaveToNote && (
                        <button
                            onClick={handleSaveToNote}
                            className={cn(
                                "flex items-center gap-1.5 text-[11px] font-medium transition-all px-2.5 py-1.5 rounded-lg",
                                saved ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            )}
                            title="存为笔记"
                        >
                            {saved ? <Check className="w-3.5 h-3.5" /> : <PenLine className="w-3.5 h-3.5" />}
                            {saved ? "已保存" : "笔记"}
                        </button>
                      )}

                      {/* [新增] 收藏按钮 */}
                      {onSaveInsight && (
                        <button
                            onClick={() => { onSaveInsight(); setBookmarked(true); }}
                            className={cn(
                                "flex items-center gap-1.5 text-[11px] font-medium transition-all px-2.5 py-1.5 rounded-lg",
                                bookmarked ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            )}
                            title="收藏解读"
                        >
                            <Bookmark className={cn("w-3.5 h-3.5", bookmarked && "fill-current")} />
                            {bookmarked ? "已收藏" : "收藏"}
                        </button>
                      )}

                      {/* [新增] 分享按钮 */}
                      {onShare && (
                        <button
                            onClick={onShare}
                            className="flex items-center gap-1.5 text-[11px] font-medium transition-all px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            title="分享到小组"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            分享
                        </button>
                      )}

                      {/* [新增] 思维导图按钮 */}
                      {onOpenMindMap && (
                        <button
                            onClick={onOpenMindMap}
                            className="flex items-center gap-1.5 text-[11px] font-medium transition-all px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            title="生成思维导图"
                        >
                            <Network className="w-3.5 h-3.5" />
                            导图
                        </button>
                      )}

                      {onRetry && (
                        <button
                            onClick={onRetry}
                            className="flex items-center gap-1.5 text-[11px] font-medium transition-all px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            title="重新生成"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            重试
                        </button>
                      )}
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                      <AudioButton text={mainText} size="sm" variant="ghost" className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 h-8 px-2.5 text-[11px] rounded-lg" label="朗读" />
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
}, (prev, next) => prev.content === next.content && prev.isLatest === next.isLatest && prev.fontSize === next.fontSize);

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
    currentSessionId, setCurrentSessionId, sessions, setSessions, addSession, updateSession, deleteSession,
    // [新增] AI 模式
    aiMode, setAiMode,
    // [新增] 自定义提示词
    customPrompts, setCustomPrompts,
    // [新增] 收藏
    savedInsights, addSavedInsight, deleteSavedInsight,
    // [新增] AI 字体大小
    aiFontSize, setAiFontSize,
    // [新增] 思维导图
    openMindMapModal
  } = useBibleStore();

  // [新增] 会话相关状态
  const [showSessionList, setShowSessionList] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showFontSizeSelector, setShowFontSizeSelector] = useState(false);
  // [修复] 临时会话ID - 用于追踪未保存到数据库的会话
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  // [修复] 追踪临时会话是否已有消息（用于决定是否保存会话）
  const pendingSessionHasMessages = useRef(false);
  
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isImmersive, setIsImmersive] = useState(false); 
  
  const lastProcessedTimeRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // [新增] 经文选择器状态（用于保存笔记时无法自动识别经文的情况）
  const [showVersePicker, setShowVersePicker] = useState(false);
  const [pendingNoteText, setPendingNoteText] = useState<string | null>(null);
  const [isParsingVerse, setIsParsingVerse] = useState(false);

  // [新增] 重命名会话状态
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // [新增] 会话搜索状态
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [activeSessionMenu, setActiveSessionMenu] = useState<string | null>(null);

  // [新增] 删除确认弹窗状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetSession, setDeleteTargetSession] = useState<ChatSession | null>(null);

  // 过滤会话列表
  const filteredSessions = sessions.filter(session => {
    if (!sessionSearchQuery) return true;
    const query = sessionSearchQuery.toLowerCase();
    return (
      session.title?.toLowerCase().includes(query) ||
      new Date(session.updatedAt).toLocaleDateString().includes(query)
    );
  });

  const { apiConfig } = useBibleStore();
  const { messages, input, handleInputChange, handleSubmit, append, isLoading, stop, setMessages, error, reload } = useChat({
    api: '/api/chat',
    body: {
        apiConfig: apiConfig,
        sessionId: currentSessionId, // [修复] 传递当前会话ID
        context: aiRequestTrigger ? {
            bookName: aiRequestTrigger.ref.bookName,
            chapter: aiRequestTrigger.ref.chapter,
            verse: aiRequestTrigger.ref.verse,
            selectedText: aiRequestTrigger.content,
            contextText: aiRequestTrigger.context
        } : null
    },
    // 设置较长的流式响应超时
    streamProtocol: 'data',
    onError: (error) => {
        console.error("🔥 AI Error:", error);
        setAiGenerating(false);
        failCurrentRequest(error.message || 'AI 生成失败');

        // 检测特定错误类型
        const errorMsg = error.message || '';

        // 检测 Server Action 版本不匹配错误
        if (errorMsg.includes('Server Action') || errorMsg.includes('older or newer deployment')) {
          setTimeout(() => {
            if (confirm('检测到应用已更新，请刷新页面以继续使用。是否立即刷新？')) {
              window.location.reload();
            }
          }, 500);
        }
        // 检测网络错误或超时，提供重试建议
        else if (errorMsg.includes('fetch') || errorMsg.includes('network') ||
                 errorMsg.includes('timeout') || errorMsg.includes('abort')) {
          console.log('[AI] 网络错误，可尝试重新生成');
        }
    },
    onFinish: (message) => {
        setAiGenerating(false);
        completeCurrentRequest();
        // 记录完成状态
        console.log('[AI] Stream completed successfully');
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

  // [修复] 不再自动加载所有消息，改为在打开AI解读时或切换会话时加载
  // 历史消息加载逻辑已移到 handleSelectSession 和 isAiOpen effect 中

  // [新增] 加载会话列表 - 使用更健壮的错误处理
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await fetch('/api/chat/session');
        if (!res.ok) {
          if (res.status === 401) {
            // 用户未登录，不显示错误，静默处理
            console.log('[AI] User not logged in, sessions will not be loaded');
          }
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setSessions(data);
          console.log('[AI] Loaded', data.length, 'sessions from server');
        } else if (data.error) {
          console.error('[AI] API error:', data.error);
        }
      } catch (err) {
        console.error("[AI] Failed to load sessions:", err);
      }
    };
    loadSessions();
  }, [setSessions]);

  // [新增] 加载用户自定义提示词
  useEffect(() => {
    fetch('/api/prompts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCustomPrompts(data);
        }
      })
      .catch(err => console.error("Failed to load custom prompts", err));
  }, [setCustomPrompts]);

  // [修复] 标记是否已加载当前会话的消息
  const loadedSessionRef = useRef<string | null>(null);

  // [修复] 当打开AI解读界面时，恢复之前会话的消息
  useEffect(() => {
    if (isAiOpen && currentSessionId && !currentSessionId.startsWith('temp-')) {
      // 有已保存的会话，检查是否需要加载消息
      if (loadedSessionRef.current !== currentSessionId) {
        loadedSessionRef.current = currentSessionId;
        fetch(`/api/chat/history?sessionId=${currentSessionId}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data) && data.length > 0) {
              setMessages(data.map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
            }
          })
          .catch(err => console.error("Failed to load session messages", err));
      }
    }
  }, [isAiOpen, currentSessionId, setMessages]);

  // [修复] 当打开AI解读界面时，自动创建一个临时新会话（仅在没有任何会话时）
  useEffect(() => {
    if (isAiOpen && !currentSessionId && !pendingSessionId) {
      // 生成一个临时会话ID（不保存到数据库）
      const tempId = `temp-${Date.now()}`;
      setPendingSessionId(tempId);
      setCurrentSessionId(tempId);
      setMessages([]);
      pendingSessionHasMessages.current = false;
      loadedSessionRef.current = tempId;
    }
  }, [isAiOpen, currentSessionId, pendingSessionId, setCurrentSessionId, setMessages]);

  // [修复] 当关闭AI解读界面时，清理临时会话（如果没有消息则不保存）
  useEffect(() => {
    if (!isAiOpen && pendingSessionId && !pendingSessionHasMessages.current) {
      // 临时会话没有消息，清理状态
      setPendingSessionId(null);
      setCurrentSessionId(null);
    }
  }, [isAiOpen, pendingSessionId, setCurrentSessionId]);

  // [修复] 创建新会话 - 使用临时会话机制
  const handleNewSession = useCallback(async () => {
    // 清理之前的临时会话状态
    setPendingSessionId(null);
    pendingSessionHasMessages.current = false;

    // 创建新的临时会话ID
    const tempId = `temp-${Date.now()}`;
    setPendingSessionId(tempId);
    setCurrentSessionId(tempId);
    loadedSessionRef.current = tempId; // 标记已加载
    setMessages([]);
    setShowSessionList(false);
  }, [setCurrentSessionId, setMessages]);

  // [修复] 保存临时会话到数据库（当用户发送第一条消息时调用）
  const savePendingSession = useCallback(async (tempId: string, firstMessage?: string): Promise<string | null> => {
    // 生成标题
    let title = '新对话';
    if (aiRequestTrigger) {
      const { ref } = aiRequestTrigger;
      const verseSuffix = ref.verse > 0 ? `:${ref.verse}` : '';
      title = `${ref.bookName} ${ref.chapter}${verseSuffix}`;
    } else if (firstMessage) {
      title = firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '');
    }

    const res = await fetch('/api/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: aiMode,
        title,
        bookId: aiRequestTrigger?.ref.bookName,
        chapter: aiRequestTrigger?.ref.chapter,
        startVerse: aiRequestTrigger?.ref.verse > 0 ? aiRequestTrigger.ref.verse : undefined,
      }),
    });

    if (!res.ok) return null;

    const session = await res.json();
    addSession(session);
    return session.id;
  }, [aiMode, aiRequestTrigger, addSession]);

  // [新增] 切换会话
  const handleSelectSession = useCallback(async (session: ChatSession) => {
    // [修复] 切换会话前，清理临时会话状态
    setPendingSessionId(null);
    pendingSessionHasMessages.current = false;

    setCurrentSessionId(session.id);
    loadedSessionRef.current = session.id; // 标记已加载
    // 加载该会话的消息
    const res = await fetch(`/api/chat/history?sessionId=${session.id}`);
    const messages = await res.json();
    if (Array.isArray(messages)) {
      setMessages(messages.map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
    }
    setShowSessionList(false);
  }, [setCurrentSessionId, setMessages]);

  // [修复] 删除会话
  const handleDeleteSession = useCallback(async (session: ChatSession) => {
    setDeleteTargetSession(session);
    setShowDeleteConfirm(true);
    setShowSessionList(false);
    setActiveSessionMenu(null);
  }, []);

  // [新增] 确认删除会话
  const confirmDeleteSession = useCallback(async () => {
    if (!deleteTargetSession) return;

    const sessionId = deleteTargetSession.id;
    await fetch(`/api/chat/session?id=${sessionId}`, { method: 'DELETE' });
    deleteSession(sessionId);
    if (currentSessionId === sessionId) {
      // 删除当前会话后，创建一个新的临时会话
      const tempId = `temp-${Date.now()}`;
      setPendingSessionId(tempId);
      setCurrentSessionId(tempId);
      setMessages([]);
      pendingSessionHasMessages.current = false;
    }
    setShowDeleteConfirm(false);
    setDeleteTargetSession(null);
  }, [currentSessionId, deleteSession, deleteTargetSession, setCurrentSessionId, setMessages]);

  // [新增] 自动生成会话标题
  const generateSessionTitle = useCallback(async (sessionId: string, firstMessage: string) => {
    try {
      setIsGeneratingTitle(true);
      const res = await fetch('/api/chat/session/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          content: firstMessage,
          bookName: aiRequestTrigger?.ref.bookName,
          chapter: aiRequestTrigger?.ref.chapter,
          verse: aiRequestTrigger?.ref.verse,
          apiConfig,
        }),
      });
      const data = await res.json();
      if (data.title) {
        // 更新本地会话列表中的标题
        updateSession(sessionId, { title: data.title });
      }
    } catch (error) {
      console.error('Failed to generate title:', error);
    } finally {
      setIsGeneratingTitle(false);
    }
  }, [apiConfig, aiRequestTrigger, updateSession]);

  // [新增] 打开重命名弹窗
  const handleOpenRename = useCallback((session: ChatSession) => {
    setRenameSessionId(session.id);
    setRenameTitle(session.title || '');
    setShowRenameModal(true);
    setShowSessionList(false);
    setActiveSessionMenu(null);
  }, []);

  // [新增] 提交重命名
  const handleRenameSubmit = useCallback(async () => {
    if (!renameSessionId || !renameTitle.trim()) return;

    try {
      const res = await fetch('/api/chat/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: renameSessionId, title: renameTitle.trim() }),
      });
      const data = await res.json();
      if (data.id) {
        updateSession(renameSessionId, { title: renameTitle.trim() });
      }
    } catch (error) {
      console.error('Failed to rename session:', error);
    } finally {
      setShowRenameModal(false);
      setRenameSessionId(null);
      setRenameTitle('');
    }
  }, [renameSessionId, renameTitle, updateSession]);

  // [新增] AI自动生成标题（用于重命名）
  const handleAutoGenerateTitle = useCallback(async () => {
    if (!renameSessionId) return;

    // 找到该会话的第一条消息
    const session = sessions.find(s => s.id === renameSessionId);
    if (!session) return;

    try {
      setIsGeneratingTitle(true);
      const res = await fetch('/api/chat/session/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: renameSessionId, apiConfig }),
      });
      const data = await res.json();
      if (data.title) {
        setRenameTitle(data.title);
      }
    } catch (error) {
      console.error('Failed to generate title:', error);
    } finally {
      setIsGeneratingTitle(false);
    }
  }, [renameSessionId, sessions, apiConfig]);

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

  // [新增] 从消息内容中解析经文引用
  const parseVerseReference = useCallback((content: string): { bookId: string; chapter: number; verse: number } | null => {
    // 匹配格式：**📖 创世记 1:1** 或 **📖 创世记 1 章 (全章摘要)**
    const refMatch = content.match(/\*\*📖\s*(.+?)\*\*/);
    if (!refMatch) return null;

    const refText = refMatch[1].trim();

    // 匹配 "书卷 章节:节" 格式
    const verseMatch = refText.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (verseMatch) {
      const bookName = verseMatch[1].trim();
      const chapter = parseInt(verseMatch[2]);
      const verse = parseInt(verseMatch[3]);
      const book = BIBLE_BOOKS.find(b => b.name === bookName || b.id === bookName);
      if (book) {
        return { bookId: book.id, chapter, verse };
      }
    }

    // 匹配 "书卷 章节 章" 格式（全章摘要）
    const chapterMatch = refText.match(/^(.+?)\s+(\d+)\s*章/);
    if (chapterMatch) {
      const bookName = chapterMatch[1].trim();
      const chapter = parseInt(chapterMatch[2]);
      const book = BIBLE_BOOKS.find(b => b.name === bookName || b.id === bookName);
      if (book) {
        return { bookId: book.id, chapter, verse: 0 };
      }
    }

    // 匹配简单的 "书卷 章节" 格式
    const simpleMatch = refText.match(/^(.+?)\s+(\d+)$/);
    if (simpleMatch) {
      const bookName = simpleMatch[1].trim();
      const chapter = parseInt(simpleMatch[2]);
      const book = BIBLE_BOOKS.find(b => b.name === bookName || b.id === bookName);
      if (book) {
        return { bookId: book.id, chapter, verse: 0 };
      }
    }

    return null;
  }, []);

  // [新增] 打开思维导图
  const handleOpenMindMap = useCallback((content: string) => {
    if (!aiRequestTrigger) return;

    // 生成标题
    const { ref } = aiRequestTrigger;
    const title = ref.verse > 0
      ? `${ref.bookName} ${ref.chapter}:${ref.verse}`
      : `${ref.bookName} ${ref.chapter}`;

    // 解析 Markdown 并生成思维导图数据
    const mindMapData = parseMarkdownToMindMap(content, title);

    // 打开思维导图弹窗
    openMindMapModal(mindMapData, title);
  }, [aiRequestTrigger, openMindMapModal]);

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

    // [修复] 如果是临时会话且有第一条消息，先保存会话到数据库
    const sendMessage = async () => {
      let sessionId = currentSessionId;
      let isNewSession = false;

      if (pendingSessionId && !pendingSessionHasMessages.current) {
        // 这是临时会话的第一条消息，需要先保存会话
        let reference = `${aiRequestTrigger.ref.bookName} ${aiRequestTrigger.ref.chapter}`;
        if (aiRequestTrigger.ref.verse > 0) {
          reference += `:${aiRequestTrigger.ref.verse}`;
        }
        const savedId = await savePendingSession(pendingSessionId, reference);
        if (savedId) {
          setCurrentSessionId(savedId);
          setPendingSessionId(null);
          sessionId = savedId;
          isNewSession = true;
        }
        pendingSessionHasMessages.current = true;
      }

      let reference = `${aiRequestTrigger.ref.bookName} ${aiRequestTrigger.ref.chapter}`;
      if (aiRequestTrigger.ref.verse > 0) {
          reference += `:${aiRequestTrigger.ref.verse}`;
      } else {
          reference += ` 章 (全章摘要)`;
      }

      const displayQuote = aiRequestTrigger.content.split('\n').map(line => `> ${line}`).join('\n');
      const enrichedPrompt = `**📖 ${reference}**\n\n${displayQuote}\n\n**我的请求**：${aiRequestTrigger.prompt}`;

      // [修复] 直接在 append 时传递最新的 sessionId
      append(
        { role: 'user', content: enrichedPrompt },
        { body: { sessionId } }
      );

      // [修复] 新会话不需要自动生成标题，因为标题已经使用经文引用命名
      // 如果用户想要自定义标题，可以使用重命名功能
    };

    sendMessage();
  }, [aiRequestTrigger, append, currentSessionId, pendingSessionId, savePendingSession, setCurrentSessionId, generateSessionTitle]);

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

  const handleChipClick = async (prompt: string) => {
    if (isLoading) return;
    shouldAutoScrollRef.current = true;

    // [修复] 如果是临时会话且有第一条消息，先保存会话到数据库
    let sessionId = currentSessionId;
    let isNewSession = false;
    if (pendingSessionId && !pendingSessionHasMessages.current) {
      let reference = '';
      if (aiRequestTrigger) {
        reference = `${aiRequestTrigger.ref.bookName} ${aiRequestTrigger.ref.chapter}`;
        if (aiRequestTrigger.ref.verse > 0) reference += `:${aiRequestTrigger.ref.verse}`;
      }
      const savedId = await savePendingSession(pendingSessionId, reference || prompt);
      if (savedId) {
        setCurrentSessionId(savedId);
        setPendingSessionId(null);
        sessionId = savedId;
        isNewSession = true;
      }
      pendingSessionHasMessages.current = true;
    }

    let finalPrompt = prompt;
    if (aiRequestTrigger && messages.length === 0) {
        let reference = `${aiRequestTrigger.ref.bookName} ${aiRequestTrigger.ref.chapter}`;
        if (aiRequestTrigger.ref.verse > 0) reference += `:${aiRequestTrigger.ref.verse}`;
        const displayQuote = aiRequestTrigger.content.split('\n').map(line => `> ${line}`).join('\n');
        finalPrompt = `**📖 ${reference}**\n\n${displayQuote}\n\n**我的请求**：${prompt}`;
    }
    // [修复] 直接在 append 时传递最新的 sessionId
    append(
      { role: 'user', content: finalPrompt },
      { body: { sessionId } }
    );

    // [修复] 新会话不需要自动生成标题，因为标题已经使用经文引用命名
  };

  // [修复] 自定义表单提交处理 - 在发送前检查临时会话
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 如果是临时会话且有第一条消息，先保存会话到数据库
    let sessionId = currentSessionId;
    let isNewSession = false;
    if (pendingSessionId && !pendingSessionHasMessages.current) {
      const savedId = await savePendingSession(pendingSessionId, input.trim());
      if (savedId) {
        setCurrentSessionId(savedId);
        setPendingSessionId(null);
        sessionId = savedId;
        isNewSession = true;
      }
      pendingSessionHasMessages.current = true;
    }

    // 使用 append 发送消息，传递最新的 sessionId
    const messageContent = input.trim();
    append(
      { role: 'user', content: messageContent },
      { body: { sessionId } }
    );

    // [修复] 新会话不需要自动生成标题，因为标题已经使用经文引用命名
  }, [input, isLoading, currentSessionId, pendingSessionId, savePendingSession, setCurrentSessionId, append]);

  // [新增] 使用AI解析经文引用
  const parseVerseWithAI = useCallback(async (content: string): Promise<{ bookId: string; chapter: number; verse: number } | null> => {
    try {
      const res = await fetch('/api/parse-verse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, apiConfig }),
      });
      const data = await res.json();

      if (data.bookId && data.chapter !== null && data.confidence !== 'none') {
        return {
          bookId: data.bookId,
          chapter: data.chapter,
          verse: data.verse || 0
        };
      }
      return null;
    } catch (error) {
      console.error('AI parse verse error:', error);
      return null;
    }
  }, [apiConfig]);

  // [新增] 实际保存笔记到指定经文
  const saveNoteToVerse = useCallback((aiText: string, bookId: string, chapter: number, verse: number) => {
    openNoteEditor(bookId, chapter, verse);

    setTimeout(() => {
      const appendContent = `\n\n---\n**✨ AI 启发 (${new Date().toLocaleDateString()})：**\n${aiText}`;
      const existingNote = useBibleStore.getState().notes.find(n => n.bookId === bookId && n.chapter === chapter && n.verse === verse);

      if (existingNote) {
        useBibleStore.getState().updateNote(existingNote.id, existingNote.content + appendContent);
      } else {
        const tempId = `temp-${Date.now()}`;
        useBibleStore.getState().addNote({
          id: tempId, bookId, chapter, verse, content: appendContent.trim()
        });
      }
    }, 100);
  }, [openNoteEditor]);

  // [新增] 处理将 AI 解读一键追加到笔记中的逻辑
  const handleSaveToNote = useCallback(async (aiText: string, messageContent?: string) => {
    let bookId: string;
    let chapter: number;
    let verse: number;

    // 优先使用 aiRequestTrigger（当前会话的上下文）
    if (aiRequestTrigger) {
      bookId = aiRequestTrigger.ref.bookName;
      chapter = aiRequestTrigger.ref.chapter;
      verse = aiRequestTrigger.ref.verse;
      saveNoteToVerse(aiText, bookId, chapter, verse);
      return;
    }

    // 尝试从消息内容中解析经文引用
    if (messageContent) {
      const parsed = parseVerseReference(messageContent);
      if (parsed) {
        bookId = parsed.bookId;
        chapter = parsed.chapter;
        verse = parsed.verse;
        saveNoteToVerse(aiText, bookId, chapter, verse);
        return;
      }

      // 正则解析失败，尝试AI解析
      setIsParsingVerse(true);
      try {
        const aiParsed = await parseVerseWithAI(messageContent);
        setIsParsingVerse(false);

        if (aiParsed) {
          saveNoteToVerse(aiText, aiParsed.bookId, aiParsed.chapter, aiParsed.verse);
          return;
        }

        // AI也无法识别，显示手动选择器
        setPendingNoteText(aiText);
        setShowVersePicker(true);
      } catch (error) {
        setIsParsingVerse(false);
        setPendingNoteText(aiText);
        setShowVersePicker(true);
      }
      return;
    }

    // 既没有 aiRequestTrigger 也没有 messageContent
    setPendingNoteText(aiText);
    setShowVersePicker(true);
  }, [aiRequestTrigger, parseVerseReference, parseVerseWithAI, saveNoteToVerse]);

  // [新增] 处理手动选择经文后的保存
  const handleVersePickerSelect = useCallback((bookId: string, chapter: number) => {
    setShowVersePicker(false);
    if (pendingNoteText) {
      saveNoteToVerse(pendingNoteText, bookId, chapter, 0);
      setPendingNoteText(null);
    }
  }, [pendingNoteText, saveNoteToVerse]);


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
                    className="fixed inset-0 md:inset-auto md:top-20 md:left-4 md:w-80 bg-white dark:bg-slate-800 md:rounded-xl shadow-xl border-0 md:border dark:border-slate-700 z-[200] md:max-h-[70vh] overflow-hidden flex flex-col"
                  >
                    {/* 顶部：新建按钮 + 搜索框 */}
                    <div className="p-3 border-b dark:border-slate-700 space-y-2 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleNewSession}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-colors shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          新建对话
                        </button>
                        <button
                          onClick={() => setShowSessionList(false)}
                          className="md:hidden p-2.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      {/* 搜索框 */}
                      {sessions.length > 3 && (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={sessionSearchQuery}
                            onChange={(e) => setSessionSearchQuery(e.target.value)}
                            placeholder="搜索对话..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          {sessionSearchQuery && (
                            <button
                              onClick={() => setSessionSearchQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 会话列表 */}
                    <div className="flex-1 overflow-y-auto overscroll-contain">
                      {filteredSessions.length === 0 ? (
                        <div className="px-3 py-8 text-center text-slate-400 text-sm">
                          {sessionSearchQuery ? '没有找到匹配的对话' : '暂无历史对话'}
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {filteredSessions.map(session => (
                            <div
                              key={session.id}
                              onClick={() => {
                                handleSelectSession(session);
                                setShowSessionList(false);
                                setActiveSessionMenu(null);
                              }}
                              className={cn(
                                "flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all",
                                currentSessionId === session.id
                                  ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent"
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate text-slate-800 dark:text-slate-200">
                                  {session.title || '未命名对话'}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {new Date(session.updatedAt).toLocaleDateString('zh-CN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              {/* 操作按钮 - 始终显示以便移动端操作 */}
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRename(session);
                                  }}
                                  className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all active:scale-95"
                                  title="重命名"
                                >
                                  <Edit className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSession(session);
                                  }}
                                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all active:scale-95"
                                  title="删除"
                                >
                                  <Trash2 className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-red-500" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 底部统计 */}
                    {sessions.length > 0 && (
                      <div className="p-2 border-t dark:border-slate-700 text-center text-xs text-slate-400">
                        共 {sessions.length} 个对话
                      </div>
                    )}
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
                  {aiMode === 'general' && '标准'}
                  {aiMode === 'tutor' && '导师'}
                  {aiMode === 'sermon' && '讲章'}
                  {aiMode === 'study-guide' && '查经'}
                  {aiMode === 'custom' && '自定义'}
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
                      { mode: 'custom' as const, icon: Settings, label: '自定义', color: 'text-slate-600' },
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

            {/* [新增] 字体大小选择器 */}
            <div className="relative">
              <button
                onClick={() => setShowFontSizeSelector(!showFontSizeSelector)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                  aiFontSize === 'medium' ? "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" : "",
                  aiFontSize === 'small' ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "",
                  aiFontSize === 'large' ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "",
                  aiFontSize === 'xlarge' ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : ""
                )}
                title="调整字体大小"
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
                      { size: 'small' as const, label: '小', preview: 'text-xs' },
                      { size: 'medium' as const, label: '中', preview: 'text-sm' },
                      { size: 'large' as const, label: '大', preview: 'text-base' },
                      { size: 'xlarge' as const, label: '超大', preview: 'text-lg' },
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
                        <span className={cn("text-slate-400", item.preview)}>Aa</span>
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
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-5">
                  <Bot className="w-10 h-10 stroke-1 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-[13px] text-slate-500 dark:text-slate-400">选中经文，点击菜单即可开始</p>
            </div>
          ) : (
            <div className="flex flex-col pb-6 pt-2">
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
                            onSaveToNote={(isAssistant && m.content.length > 0) ? (text) => handleSaveToNote(text, m.content) : undefined}
                            // [新增] 收藏功能
                            onSaveInsight={(isAssistant && m.content.length > 0 && aiRequestTrigger) ? () => handleSaveInsight(messageId, m.content) : undefined}
                            isSaved={savedInsights.some(i => i.messageId === messageId)}
                            // [新增] 分享功能
                            onShare={(isAssistant && m.content.length > 0) ? () => {
                              // TODO: 实现分享到小组功能
                              alert('分享功能开发中...');
                            } : undefined}
                            // [新增] 字体大小
                            fontSize={aiFontSize}
                            // [新增] 思维导图
                            onOpenMindMap={(isAssistant && m.content.length > 0 && aiRequestTrigger) ? () => handleOpenMindMap(m.content) : undefined}
                        />
                    );
                })}

                {error && (
                    <div className="flex flex-col items-center justify-center p-4 mt-2 mb-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                        <AlertCircle className="w-6 h-6 text-amber-500 mb-2 opacity-80" />
                        <span className="text-xs text-amber-600 dark:text-amber-400 text-center mb-3">
                            AI 生成已中断，可能原因：<br/>
                            网络波动、服务繁忙或连接超时
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => reload()} className="h-8 text-xs rounded-full border-amber-200 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                             <RefreshCw className="w-3 h-3 mr-1" /> 重新生成
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setMessages(messages.slice(0, -1))} className="h-8 text-xs rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                             忽略
                          </Button>
                        </div>
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
                    aiMode === 'study-guide' ? '查经工具' :
                    aiMode === 'custom' ? '自定义快捷问题' : '深度探索'}
                 </div>
                 {/* 水平滚动容器，隐藏滚动条 */}
                 <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
                   <style jsx>{`
                     .scrollbar-hide::-webkit-scrollbar { display: none; }
                     .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                   `}</style>
                   {/* 自定义模式显示用户的自定义提示词 */}
                   {aiMode === 'custom' ? (
                     <>
                       {customPrompts.length === 0 ? (
                         <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
                           <span>暂无自定义问题</span>
                           <button
                             onClick={() => window.location.href = '/settings/prompts'}
                             className="text-blue-500 hover:text-blue-600 underline"
                           >
                             去添加
                           </button>
                         </div>
                       ) : (
                         customPrompts.map((p) => (
                           <button
                             key={p.id}
                             onClick={() => handleChipClick(p.prompt)}
                             className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium border dark:border-slate-700 transition-all active:scale-95 shadow-sm dark:bg-slate-800 dark:text-slate-200 hover:brightness-95 whitespace-nowrap shrink-0 bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                           >
                             <Sparkles className="w-3 h-3" />
                             {p.label}
                           </button>
                         ))
                       )}
                       {/* 管理按钮 */}
                       <button
                         onClick={() => window.location.href = '/settings/prompts'}
                         className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium border dark:border-slate-700 transition-all active:scale-95 shadow-sm dark:bg-slate-800 dark:text-slate-200 hover:brightness-95 whitespace-nowrap shrink-0 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                       >
                         <Settings className="w-3 h-3" />
                         管理
                       </button>
                     </>
                   ) : (
                     THEOLOGICAL_PROMPTS.filter(t => {
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
                     ))
                   )}
                 </div>
              </div>
            )}

            <div className="p-4 safe-area-bottom">
              <form onSubmit={handleFormSubmit} className="flex gap-2 relative">
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

      {/* [新增] AI解析经文时的加载提示 */}
      {isParsingVerse && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm text-gray-700 dark:text-gray-200">正在识别经文引用...</span>
          </div>
        </div>
      )}

      {/* [新增] 手动选择经文的弹窗 */}
      <BookPicker
        open={showVersePicker}
        onOpenChange={(open) => {
          setShowVersePicker(open);
          if (!open) setPendingNoteText(null);
        }}
        onSelect={handleVersePickerSelect}
      />

      {/* [新增] 重命名会话弹窗 */}
      <AnimatePresence>
        {showRenameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={() => setShowRenameModal(false)}
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
                重命名对话
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  placeholder="输入对话标题..."
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-900 dark:text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') setShowRenameModal(false);
                  }}
                />
                <button
                  onClick={handleAutoGenerateTitle}
                  disabled={isGeneratingTitle}
                  className="px-3 py-3 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors disabled:opacity-50"
                  title="AI自动生成标题"
                >
                  {isGeneratingTitle ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleRenameSubmit}
                  disabled={!renameTitle.trim()}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* [新增] 删除确认弹窗 */}
      <AnimatePresence>
        {showDeleteConfirm && deleteTargetSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteTargetSession(null);
            }}
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
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">删除对话</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">此操作无法撤销</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 px-1">
                确定要删除对话「<span className="font-medium">{deleteTargetSession.title || '未命名对话'}</span>」吗？
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTargetSession(null);
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmDeleteSession}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-colors shadow-sm"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}