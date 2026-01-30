// components/bible/AISidebar.tsx
"use client";

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Send, BookOpen, Search, Lightbulb, LayoutList, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEOLOGICAL_PROMPTS } from '@/lib/constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function AISidebar() {
  const { isAiOpen, setAiOpen, clearSelection, aiRequestTrigger } = useBibleStore();
  
  // --- 新增状态：控制是否为沉浸模式 ---
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

  // 当 AI 面板打开时，默认非沉浸模式
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
    
    // 发送新请求时，自动退出沉浸模式，确保用户看到正在生成
    setIsImmersive(false);

  }, [aiRequestTrigger, append]);

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
    setIsImmersive(false); // 点击后退出沉浸模式
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
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl border-l flex flex-col z-50 animate-in slide-in-from-right duration-300">
      
      {/* --- 顶部标题栏 --- */}
      {/* 使用 CSS transition 实现平滑隐藏/显示，为了彻底释放空间，隐藏时高度设为 0 并 hidden */}
      <div 
        className={cn(
          "flex items-center justify-between px-4 bg-slate-50 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
          isImmersive ? "h-0 opacity-0 border-none" : "h-14 opacity-100 border-b"
        )}
      >
        <div className="flex items-center gap-2 text-blue-700 font-bold">
          <Sparkles className="w-5 h-5" />
          <span>AI 灵修伴侣</span>
        </div>
        <div className="flex gap-1">
             {/* 关闭按钮 */}
            <Button variant="ghost" size="icon" onClick={() => {
                setAiOpen(false); 
                clearSelection(); 
            }}>
            <X className="w-5 h-5" />
            </Button>
        </div>
      </div>

      {/* --- 聊天内容区域 --- */}
      {/* 点击此处切换模式 */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-slate-50/30 min-h-0 space-y-6 cursor-pointer relative tap-highlight-transparent"
        onClick={() => setIsImmersive(!isImmersive)} // 点击切换
      >
        {messages.length === 0 && !isLoading && (
            <div className="text-center text-slate-400 mt-10 text-sm">
                👋 选中经文，点击菜单即可开始。<br/>
                或点击下方按钮生成全章摘要。
            </div>
        )}

        {/* 沉浸模式下的浮动提示 (3秒后可以考虑自动消失，这里简单做成一直显示但半透明) */}
        {isImmersive && (
             <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in duration-500">
                 <div className="bg-black/60 text-white text-[10px] px-3 py-1 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1">
                    <Minimize2 className="w-3 h-3" />
                    点击屏幕显示菜单
                 </div>
             </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[95%] rounded-xl px-4 py-3 shadow-sm border text-lg", // 增加 text-lg 适应老年人
              m.role === 'user' 
                ? "bg-blue-600 text-white border-blue-600" 
                : "bg-white border-slate-100 text-slate-800"
            )}>
              {m.role === 'user' ? (
                 <div className="whitespace-pre-wrap leading-relaxed text-base">{m.content}</div>
              ) : (
                // 增加 prose-lg 和 leading-loose 提高可读性
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-blue-700 mt-6 mb-3 pb-1 border-b border-blue-100 flex items-center first:mt-0" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-base font-bold text-slate-700 mt-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="text-base text-slate-700 leading-loose mb-4 last:mb-0 text-justify" {...props} />, // 加大行高和字号
                    ul: ({node, ...props}) => <ul className="my-2 space-y-2 pl-1" {...props} />,
                    li: ({node, ...props}) => (
                      <li className="text-base text-slate-700 leading-loose flex gap-2" {...props}>
                         <span className="text-blue-300 select-none mt-3 text-[6px]">•</span> 
                         <span className="flex-1">{props.children}</span>
                      </li>
                    ),
                    strong: ({node, ...props}) => <strong className="font-bold text-slate-900 bg-yellow-50 px-1 rounded mx-0.5" {...props} />, // 使用柔和的黄色高亮
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

      {/* --- 底部操作区 (包含快捷指令和输入框) --- */}
      {/* 同样使用高度和透明度动画来实现平滑隐藏 */}
      <div 
        className={cn(
            "bg-white flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]",
            isImmersive ? "max-h-0 opacity-0" : "max-h-[300px] opacity-100" // max-h 设置一个足够大的值以便动画生效
        )}
      >
          {/* 快捷指令区 */}
          {!isLoading && messages.length > 0 && (
            <div className="px-4 pb-2 flex flex-col gap-2 pt-3 border-t border-slate-100">
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-1">深度探索</div>
               <div className="flex flex-wrap gap-2">
                 {THEOLOGICAL_PROMPTS.map((t) => (
                   <button
                     key={t.id}
                     onClick={() => handleChipClick(t.prompt)}
                     className={cn(
                       "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all active:scale-95 shadow-sm", // 按钮稍微加大
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

          {/* 底部输入框 */}
          <div className="p-4">
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
            <div className="mt-2 text-[10px] text-center text-slate-400">
              ⚠️ AI 辅助仅供参考，请依靠圣灵与圣经原文。
            </div>
          </div>
      </div>
    </div>
  );
}