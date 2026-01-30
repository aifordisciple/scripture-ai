// components/bible/AISidebar.tsx
"use client";

import { useChat } from 'ai/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Send, BookOpen, Search, Lightbulb, LayoutList, Minimize2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEOLOGICAL_PROMPTS } from '@/lib/constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function AISidebar() {
  const { isAiOpen, setAiOpen, clearSelection, aiRequestTrigger } = useBibleStore();
  
  // --- 新增状态：侧边栏宽度 (默认 480px) ---
  const [sidebarWidth, setSidebarWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // --- 沉浸模式状态 ---
  const [isImmersive, setIsImmersive] = useState(false);
  
  const lastProcessedTimeRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, append, isLoading } = useChat({
    api: '/api/chat',
    onError: (error) => console.error("🔥 AI Error:", error)
  });

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 打开时重置沉浸模式
  useEffect(() => {
    if (isAiOpen) {
      setIsImmersive(false);
    }
  }, [isAiOpen]);

  // 监听触发器
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
        // 计算新宽度：窗口总宽 - 鼠标当前的 X 坐标
        const newWidth = document.body.clientWidth - mouseMoveEvent.clientX;
        // 限制宽度范围：最小 300px，最大 800px
        if (newWidth > 300 && newWidth < 800) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
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
        // 使用 style 变量传递宽度，配合 Tailwind 的 w-[var(...)] 实现响应式
        style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
        className={cn(
            "fixed inset-y-0 right-0 z-50 bg-white shadow-2xl border-l flex flex-col",
            // 移动端 w-full，桌面端使用自定义宽度
            "w-full md:w-[var(--sidebar-width)]",
            // 只有在非拖拽状态下才启用过渡动画，防止拖拽卡顿
            isResizing ? "transition-none" : "animate-in slide-in-from-right duration-300"
        )}
    >
      
      {/* --- 拖拽手柄 (仅桌面端显示) --- */}
      <div 
        onMouseDown={startResizing}
        className="hidden md:block absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400/50 transition-colors z-50 group"
      >
        {/* 视觉提示条 */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-slate-200 rounded group-hover:bg-blue-500 transition-colors" />
      </div>

      {/* --- 顶部标题栏 --- */}
      <div 
        className={cn(
          "flex items-center justify-between px-4 bg-slate-50 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
          isImmersive ? "h-0 opacity-0 border-none" : "h-14 opacity-100 border-b"
        )}
      >
        <div className="flex items-center gap-2 text-blue-700 font-bold select-none">
          <Sparkles className="w-5 h-5" />
          <span>AI 灵修伴侣</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => {
            setAiOpen(false); 
            clearSelection(); 
        }}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* --- 聊天内容区域 --- */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-slate-50/30 min-h-0 space-y-6 cursor-pointer relative tap-highlight-transparent"
        onClick={() => setIsImmersive(!isImmersive)} 
      >
        {messages.length === 0 && !isLoading && (
            <div className="text-center text-slate-400 mt-10 text-sm select-none">
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
                ? "bg-blue-600 text-white border-blue-600 text-base" 
                : "bg-white border-slate-100 text-slate-800 text-lg"
            )}>
              {m.role === 'user' ? (
                 <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              ) : (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-blue-700 mt-6 mb-3 pb-1 border-b border-blue-100 flex items-center first:mt-0" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-base font-bold text-slate-700 mt-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="text-lg text-slate-700 leading-loose mb-4 last:mb-0 text-justify" {...props} />, 
                    ul: ({node, ...props}) => <ul className="my-2 space-y-2 pl-1" {...props} />,
                    li: ({node, ...props}) => (
                      <li className="text-lg text-slate-700 leading-loose flex gap-2" {...props}>
                         <span className="text-blue-300 select-none mt-3 text-[6px]">•</span> 
                         <span className="flex-1">{props.children}</span>
                      </li>
                    ),
                    strong: ({node, ...props}) => <strong className="font-bold text-slate-900 bg-yellow-50 px-1 rounded mx-0.5" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-200 pl-3 italic text-slate-500 text-sm my-4 bg-slate-50 py-2 pr-2 rounded-r" {...props} />,
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

      {/* --- 底部操作区 --- */}
      <div 
        className={cn(
            "bg-white flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]",
            isImmersive ? "max-h-0 opacity-0" : "max-h-[300px] opacity-100" 
        )}
      >
          {!isLoading && messages.length > 0 && (
            <div className="px-4 pb-2 flex flex-col gap-2 pt-3 border-t border-slate-100">
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">深度探索</div>
               <div className="flex flex-wrap gap-2">
                 {THEOLOGICAL_PROMPTS.map((t) => (
                   <button
                     key={t.id}
                     onClick={() => handleChipClick(t.prompt)}
                     className={cn(
                       "flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium border transition-all active:scale-95 shadow-sm",
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
                className="flex-1 px-4 py-3 border border-slate-200 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
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
      
      {/* 拖拽遮罩层 (防止拖拽时 iframe/text 干扰) */}
      {isResizing && <div className="fixed inset-0 z-[100] cursor-col-resize" />}
    </div>
  );
}