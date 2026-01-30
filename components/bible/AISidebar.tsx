// components/bible/AISidebar.tsx
"use client";

import { useChat } from 'ai/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Send, BookOpen, Search, Lightbulb, LayoutList, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEOLOGICAL_PROMPTS } from '@/lib/constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function AISidebar() {
  const { 
    isAiOpen, setAiOpen, clearSelection, aiRequestTrigger,
    sidebarWidth, setSidebarWidth 
  } = useBibleStore();
  
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [isImmersive, setIsImmersive] = useState(false);
  
  const lastProcessedTimeRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, append, isLoading } = useChat({
    api: '/api/chat',
    onError: (error) => console.error("🔥 AI Error:", error)
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isAiOpen) {
      setIsImmersive(false);
    }
  }, [isAiOpen]);

  useEffect(() => {
    if (!aiRequestTrigger) return;
    if (aiRequestTrigger.timestamp === lastProcessedTimeRef.current) return;

    lastProcessedTimeRef.current = aiRequestTrigger.timestamp;

    const contextRequest = {
      bookName: aiRequestTrigger.ref.bookName,
      chapter: aiRequestTrigger.ref.chapter,
      verse: aiRequestTrigger.ref.verse,
      selectedText: aiRequestTrigger.content, 
      contextText: aiRequestTrigger.context   
    };

    append({
      role: 'user',
      content: aiRequestTrigger.prompt,
    }, {
      body: { context: contextRequest }
    });
    
    setIsImmersive(false);

  }, [aiRequestTrigger, append]);

  // --- 拖拽调整宽度逻辑 ---
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = document.body.clientWidth - mouseMoveEvent.clientX;
        if (newWidth > 300 && newWidth < 1200) { 
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing, setSidebarWidth]
  );

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
    if (isLoading || !aiRequestTrigger) return;
    
    const contextRequest = {
      bookName: aiRequestTrigger.ref.bookName,
      chapter: aiRequestTrigger.ref.chapter,
      verse: aiRequestTrigger.ref.verse,
      selectedText: aiRequestTrigger.content,
      contextText: aiRequestTrigger.context
    };

    append({ role: 'user', content: prompt }, { body: { context: contextRequest } });
    setIsImmersive(false); 
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'detail': return <LayoutList className="w-3 h-3" />;
      case 'context': return <BookOpen className="w-3 h-3" />;
      case 'original': return <Search className="w-3 h-3" />;
      case 'application': return <Lightbulb className="w-3 h-3" />;
      default: return <Sparkles className="w-3 h-3" />;
    }
  };

  if (!isAiOpen) return null;

  return (
    <div 
        ref={sidebarRef}
        style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties & { [key: string]: string }}
        className={cn(
            // 面板背景：dark:bg-slate-900, 边框：dark:border-slate-800
            "fixed inset-y-0 right-0 z-50 bg-white dark:bg-slate-900 shadow-2xl border-l dark:border-slate-800 flex flex-col",
            "w-full md:w-[var(--sidebar-width)]",
            isResizing ? "transition-none" : "animate-in slide-in-from-right duration-300"
        )}
    >
      
      {/* 拖拽手柄 */}
      <div 
        onMouseDown={startResizing}
        className="hidden md:block absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400/50 transition-colors z-50 group"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-slate-200 dark:bg-slate-700 rounded group-hover:bg-blue-500 transition-colors" />
      </div>

      {/* 顶部标题栏 */}
      <div 
        className={cn(
          "flex items-center justify-between px-4 bg-slate-50 dark:bg-slate-900 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
          isImmersive ? "h-0 opacity-0 border-none" : "h-14 opacity-100 border-b dark:border-slate-800"
        )}
      >
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold select-none">
          <Sparkles className="w-5 h-5" />
          <span>AI 灵修伴侣</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => {
            setAiOpen(false); 
            clearSelection(); 
        }} className="dark:text-slate-400 dark:hover:bg-slate-800">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* 聊天内容 */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-slate-50/30 dark:bg-slate-950/30 min-h-0 space-y-6 cursor-pointer relative tap-highlight-transparent"
        onClick={() => setIsImmersive(!isImmersive)} 
      >
        {messages.length === 0 && !isLoading && (
            <div className="text-center text-slate-400 dark:text-slate-500 mt-10 text-sm select-none">
                👋 选中经文，点击菜单即可开始。<br/>
                或点击下方按钮生成全章摘要。
            </div>
        )}

        {isImmersive && (
             <div className="fixed top-6 left-1/2 -translate-x-1/2 md:left-auto md:right-[calc(var(--sidebar-width)/2)] md:translate-x-1/2 z-50 pointer-events-none animate-in fade-in duration-500">
                 <div className="bg-black/60 text-white text-[10px] px-3 py-1 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1">
                    <Minimize2 className="w-3 h-3" />
                    轻触屏幕显示菜单
                 </div>
             </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[95%] rounded-xl px-4 py-3 shadow-sm border", 
              m.role === 'user' 
                ? "bg-blue-600 text-white border-blue-600 text-base" // 用户消息保持蓝色
                : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-lg" // AI 消息深色化
            )}>
              {m.role === 'user' ? (
                 <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              ) : (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mt-6 mb-3 pb-1 border-b border-blue-100 dark:border-blue-900 flex items-center first:mt-0" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 mt-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="text-lg text-slate-700 dark:text-slate-300 leading-loose mb-4 last:mb-0 text-justify" {...props} />, 
                    ul: ({node, ...props}) => <ul className="my-2 space-y-2 pl-1" {...props} />,
                    li: ({node, ...props}) => (
                      <li className="text-lg text-slate-700 dark:text-slate-300 leading-loose flex gap-2" {...props}>
                         <span className="text-blue-300 dark:text-blue-500 select-none mt-3 text-[6px]">•</span> 
                         <span className="flex-1">{props.children}</span>
                      </li>
                    ),
                    strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white bg-yellow-50 dark:bg-blue-900/50 px-1 rounded mx-0.5" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-200 dark:border-slate-700 pl-3 italic text-slate-500 dark:text-slate-400 text-sm my-4 bg-slate-50 dark:bg-slate-900/50 py-2 pr-2 rounded-r" {...props} />,
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm p-2 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>AI 正在深入思考...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部操作区 */}
      <div 
        className={cn(
            "bg-white dark:bg-slate-900 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]",
            isImmersive ? "max-h-0 opacity-0" : "max-h-[300px] opacity-100" 
        )}
      >
          {!isLoading && messages.length > 0 && (
            <div className="px-4 pb-2 flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">深度探索</div>
               <div className="flex flex-wrap gap-2">
                 {THEOLOGICAL_PROMPTS.map((t) => (
                   <button
                     key={t.id}
                     onClick={() => handleChipClick(t.prompt)}
                     className={cn(
                       "flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium border dark:border-slate-700 transition-all active:scale-95 shadow-sm dark:bg-slate-800 dark:text-slate-200",
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
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                value={input}
                onChange={handleInputChange}
                placeholder="追问..."
              />
              <Button type="submit" size="icon" disabled={isLoading} className="rounded-full w-12 h-12 shrink-0 bg-blue-600 hover:bg-blue-700">
                <Send className="w-5 h-5" />
              </Button>
            </form>
            <div className="mt-2 text-[10px] text-center text-slate-400 select-none">
              ⚠️ AI 辅助仅供参考，请依靠圣灵与圣经原文。
            </div>
          </div>
      </div>
      
      {isResizing && <div className="fixed inset-0 z-[100] cursor-col-resize" />}
    </div>
  );
}