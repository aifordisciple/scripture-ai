// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/bible/Sidebar";
import { Reader } from "@/components/bible/Reader";
import { Slider } from "@/components/ui/slider";
import { useBibleStore } from "@/store/useBibleStore";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Menu, Settings, Languages, Sparkles, Plus, X, AlignJustify, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AISidebar } from "@/components/bible/AISidebar";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { 
    fontSize, setFontSize, 
    isSidebarOpen, toggleSidebar,
    isAiOpen, setAiOpen, 
    showEnglish, toggleEnglish,
    lineHeight, setLineHeight, 
    tabs, activeTabId, setActiveTab, addTab, closeTab, updateActiveTab,
    sidebarWidth,
    isDarkMode, toggleDarkMode // <--- 获取暗黑模式状态
  } = useBibleStore();

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // 1. 监听暗黑模式变化，动态切换 class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 1. URL 变化 -> 更新当前 Tab 数据
  useEffect(() => {
    const book = searchParams.get("book");
    const chapter = searchParams.get("chapter");
    if (book && chapter) {
      if (activeTab.book !== book || activeTab.chapter !== chapter) {
        updateActiveTab(book, chapter);
      }
    }
  }, [searchParams, activeTab.book, activeTab.chapter, updateActiveTab]);

  // 2. 切换 Tab -> 更新 URL
  const handleSwitchTab = (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      setActiveTab(id);
      router.push(`/?book=${tab.book}&chapter=${tab.chapter}`);
    }
  };

  const handleAddTab = () => {
    addTab(activeTab.book, activeTab.chapter);
  };

  const toggleLineHeight = () => {
    if (lineHeight <= 1.6) setLineHeight(1.8);
    else if (lineHeight <= 1.8) setLineHeight(2.2);
    else setLineHeight(1.6);
  };

  return (
    // 主容器：添加 dark:bg-slate-950 和过渡效果
    <main className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-950 relative transition-colors duration-300">
      
      {/* 桌面端左侧边栏 */}
      <aside className="hidden md:block w-72 h-full border-r dark:border-slate-800 shrink-0">
        <Sidebar />
      </aside>

      {/* 移动端左侧边栏 */}
      <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
        <SheetContent side="left" className="p-0 w-80 dark:bg-slate-900 dark:border-slate-800">
          <SheetTitle className="sr-only">圣经目录</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <AISidebar />

      {/* 主区域 */}
      <div 
        style={{ 
          '--ai-offset': isAiOpen ? `${sidebarWidth}px` : '0px'
        } as React.CSSProperties & { [key: string]: string }}
        className={cn(
          "flex-1 flex flex-col h-full relative min-w-0 transition-[margin] duration-300 ease-in-out",
          "md:mr-[var(--ai-offset)]" // 仅在 PC 端应用右边距
        )}
      >
        
        {/* 顶部导航栏 */}
        <header className="h-14 border-b flex items-center justify-between px-4 bg-white dark:bg-slate-950 dark:border-slate-800 z-10 sticky top-0 shrink-0 gap-2 transition-colors duration-300">
          
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" className="md:hidden dark:text-slate-200" onClick={() => toggleSidebar()}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-slate-700 dark:text-slate-200 hidden md:inline">Scripture AI</span>
          </div>
          
          {/* 标签页栏 */}
          <div className="flex-1 flex items-center overflow-x-auto no-scrollbar gap-1 px-2 mask-linear-fade">
             {tabs.map(tab => (
               <div 
                 key={tab.id}
                 onClick={() => handleSwitchTab(tab.id)}
                 className={cn(
                   "flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer transition-all border-b-2 whitespace-nowrap min-w-[80px] justify-between group",
                   activeTabId === tab.id 
                     ? "bg-slate-50 dark:bg-slate-900 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm" 
                     : "hover:bg-slate-50 dark:hover:bg-slate-900 border-transparent text-slate-500 dark:text-slate-400"
                 )}
               >
                 <span>{tab.book} {tab.chapter}</span>
                 <X 
                   className={cn(
                     "w-3 h-3 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors",
                     activeTabId === tab.id ? "opacity-50 hover:opacity-100" : "opacity-0 group-hover:opacity-50"
                   )}
                   onClick={(e) => {
                     e.stopPropagation();
                     closeTab(tab.id);
                   }}
                 />
               </div>
             ))}
             <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full ml-1 shrink-0 dark:text-slate-400 dark:hover:bg-slate-800" onClick={handleAddTab}>
               <Plus className="w-4 h-4" />
             </Button>
          </div>

          {/* 右侧工具栏 */}
          <div className="flex items-center gap-1 shrink-0">
            
            {/* --- 新增：暗黑模式切换按钮 --- */}
            <Button 
              variant="ghost" size="icon" 
              onClick={toggleDarkMode}
              className="text-slate-500 dark:text-slate-400 dark:hover:bg-slate-800"
              title="切换主题"
            >
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={toggleLineHeight} className="hidden sm:flex text-slate-500 dark:text-slate-400 dark:hover:bg-slate-800" title="调整行距">
              <AlignJustify className="h-4 w-4" />
            </Button>

            <Button variant={showEnglish ? "secondary" : "ghost"} size="sm" onClick={toggleEnglish} className="hidden sm:flex gap-1 text-xs font-bold dark:text-slate-300 dark:hover:bg-slate-800">
              <Languages className="h-4 w-4" />
              {showEnglish ? "中/英" : "中"}
            </Button>
            
            <Button variant={isAiOpen ? "secondary" : "ghost"} size="icon" onClick={() => setAiOpen(!isAiOpen)} className={cn(
              isAiOpen && "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400",
              "dark:text-slate-400 dark:hover:bg-slate-800"
            )}>
                <Sparkles className="h-5 w-5" />
            </Button>

            <div className="hidden sm:flex items-center gap-2 w-24 mx-2">
               <Slider value={[fontSize]} min={14} max={32} step={1} onValueChange={(val) => setFontSize(val[0])} />
            </div>
            
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Settings className="h-5 w-5 text-slate-500" />
            </Button>
          </div>
        </header>

        {/* 核心阅读区 */}
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white dark:bg-slate-950 transition-colors duration-300">
          <Reader 
             key={activeTab.id} 
             initialBook={activeTab.book} 
             initialChapter={activeTab.chapter} 
          />
        </div>

      </div>
    </main>
  );
}