// components/bible/Sidebar.tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { BIBLE_BOOKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Book, ChevronRight, Search, X, Library } from "lucide-react";

export function Sidebar() {
  const router = useRouter();
  const { tabs, activeTabId, updateActiveTab, isSidebarOpen, toggleSidebar, setActiveTab, addTab } = useBibleStore();
  
  // 获取当前正在阅读的书卷和章节
  // [修复 TS 报错] 使用 ?? null 将可能的 undefined 强制转换为 null
  const activeTab = tabs.find(t => t.id === activeTabId);
  const currentBook = activeTab?.type === 'read' ? (activeTab.book ?? null) : null;
  const currentChapter = activeTab?.type === 'read' ? (activeTab.chapter ?? null) : null;

  const [expandedBook, setExpandedBook] = useState<string | null>(currentBook);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 用于滚动定位的 ref
  const activeBookRef = useRef<HTMLDivElement>(null);

  // 圣经分为旧约 (前39卷) 和新约 (后27卷)
  const oldTestament = useMemo(() => BIBLE_BOOKS.slice(0, 39), []);
  const newTestament = useMemo(() => BIBLE_BOOKS.slice(39), []);

  // 自动展开当前阅读的书卷，并尝试滚动到可视区域
  useEffect(() => {
    if (currentBook && !expandedBook) {
      setExpandedBook(currentBook);
      setTimeout(() => {
        activeBookRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [currentBook, expandedBook]);

  // 处理章节点击
  const handleChapterClick = (bookId: string, chapter: number) => {
    // 寻找是否已经存在阅读 Tab
    const readTab = tabs.find(t => t.type === 'read');
    
    if (readTab) {
       // 如果有，就激活它并更新内容
       setActiveTab(readTab.id);
       useBibleStore.setState((state) => ({
           tabs: state.tabs.map(t => t.id === readTab.id ? { ...t, book: bookId, chapter: chapter.toString() } : t)
       }));
    } else {
       // 如果没有，就新建一个阅读 Tab
       addTab({ type: 'read', book: bookId, chapter: chapter.toString() });
    }
    
    // 清除可能存在的滚动锚点，确保跳到章节开头
    useBibleStore.getState().setScrollToVerse(null);
    
    // 同步 URL
    router.push(`/?book=${bookId}&chapter=${chapter}`);
    
    if (isSidebarOpen) {
      toggleSidebar();
    }
  };

  // 渲染书卷列表的通用函数
  const renderBookList = (books: typeof BIBLE_BOOKS, title: string) => {
     // 搜索过滤逻辑
     const filtered = books.filter(b => 
       b.name.includes(searchQuery) || b.id.toLowerCase().includes(searchQuery.toLowerCase())
     );
     
     if (filtered.length === 0) return null;

     return (
       <div className="mb-8">
         <div className="flex items-center gap-2 px-6 mb-3 opacity-60">
           <div className="h-[1px] flex-1 bg-border"></div>
           <h3 className="text-[11px] font-bold text-foreground uppercase tracking-widest">{title}</h3>
           <div className="h-[1px] flex-1 bg-border"></div>
         </div>
         
         <div className="space-y-1.5 px-3">
            {filtered.map(book => {
              const isExpanded = expandedBook === book.id;
              const isActiveBook = currentBook === book.id;

              return (
                <div 
                  key={book.id} 
                  className="flex flex-col"
                  ref={isActiveBook ? activeBookRef : null}
                >
                  <button
                    onClick={() => setExpandedBook(isExpanded ? null : book.id)}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3 rounded-2xl transition-all duration-300 text-[15px]",
                      isActiveBook 
                        ? "bg-primary/10 dark:bg-primary/20 text-primary font-bold shadow-sm" 
                        : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Book className={cn("w-4 h-4", isActiveBook ? "text-primary" : "text-muted-foreground")} />
                      <span className="tracking-wide">{book.name}</span>
                    </div>
                    <ChevronRight 
                      className={cn(
                        "w-4 h-4 transition-transform duration-300", 
                        isExpanded ? "rotate-90 text-primary" : "text-muted-foreground/50",
                        isActiveBook && !isExpanded && "text-primary/60"
                      )} 
                    />
                  </button>
                  
                  {/* 章节网格平滑展开 */}
                  <div 
                    className={cn(
                      "overflow-hidden transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)", 
                      isExpanded ? "max-h-[800px] opacity-100 mt-2 mb-2" : "max-h-0 opacity-0 m-0"
                    )}
                  >
                    <div className="grid grid-cols-5 gap-2 p-3 bg-secondary/40 dark:bg-black/20 rounded-2xl mx-1 border border-border/50">
                      {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => {
                         const isActiveChapter = isActiveBook && currentChapter === chapter.toString();
                         return (
                           <button
                             key={chapter}
                             onClick={() => handleChapterClick(book.id, chapter)}
                             className={cn(
                               "aspect-square flex items-center justify-center rounded-xl text-[13px] transition-all duration-300",
                               isActiveChapter 
                                 ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(59,130,246,0.3)] font-bold scale-105" 
                                 : "bg-background/80 text-foreground/80 hover:bg-white dark:hover:bg-slate-800 hover:text-foreground hover:scale-110 hover:shadow-sm border border-border/60"
                             )}
                           >
                             {chapter}
                           </button>
                         )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
         </div>
       </div>
     );
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      
      {/* 顶部标题与搜索栏 (毛玻璃悬浮效果) */}
      <div className="pt-6 pb-4 px-4 shrink-0 glass-panel rounded-none border-x-0 border-t-0 z-10 sticky top-0">
        <div className="flex items-center gap-2.5 mb-5 px-2">
           <div className="p-1.5 bg-primary/10 rounded-lg">
             <Library className="w-5 h-5 text-primary" />
           </div>
           <h2 className="text-xl font-serif font-bold text-foreground tracking-widest select-none">圣经目录</h2>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="搜索卷名拼音或汉字..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/60 text-foreground text-sm rounded-2xl pl-10 pr-10 py-2.5 border border-border/50 focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/60"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-secondary hover:bg-border rounded-full p-0.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 书卷列表滚动区 */}
      <div className="flex-1 overflow-y-auto no-scrollbar pt-6 pb-28">
         {renderBookList(oldTestament, "旧约全书")}
         {renderBookList(newTestament, "新约全书")}
         
         {/* 底部留白插画或签名空间 */}
         {searchQuery === "" && (
            <div className="flex flex-col items-center justify-center opacity-30 mt-10 mb-8 pointer-events-none select-none">
                <Library className="w-8 h-8 mb-2" />
                <span className="text-[10px] font-serif tracking-[0.2em] uppercase">Scripture AI</span>
            </div>
         )}
      </div>
    </div>
  );
}