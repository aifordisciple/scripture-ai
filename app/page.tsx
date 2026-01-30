// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/bible/Sidebar";
import { Reader } from "@/components/bible/Reader";
import { Slider } from "@/components/ui/slider";
import { useBibleStore } from "@/store/useBibleStore";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Menu, Settings, Languages, Sparkles, Plus, X, AlignJustify } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AISidebar } from "@/components/bible/AISidebar";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { 
    fontSize, setFontSize, 
    isSidebarOpen, toggleSidebar,
    isAiOpen, setAiOpen, // AI 面板状态
    showEnglish, toggleEnglish,
    lineHeight, setLineHeight, // 行高状态
    tabs, activeTabId, setActiveTab, addTab, closeTab, updateActiveTab // 标签页状态
  } = useBibleStore();

  // 获取当前激活的 Tab
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

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

  // 3. 新建 Tab
  const handleAddTab = () => {
    addTab(activeTab.book, activeTab.chapter);
  };

  // 4. 切换行距 (1.6 -> 1.8 -> 2.2)
  const toggleLineHeight = () => {
    if (lineHeight <= 1.6) setLineHeight(1.8);
    else if (lineHeight <= 1.8) setLineHeight(2.2);
    else setLineHeight(1.6);
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-white relative">
      
      {/* 桌面端左侧边栏 */}
      <aside className="hidden md:block w-72 h-full border-r shrink-0">
        <Sidebar />
      </aside>

      {/* 移动端左侧边栏 */}
      <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
        <SheetContent side="left" className="p-0 w-80">
          <SheetTitle className="sr-only">圣经目录</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* AI 侧边栏 */}
      <AISidebar />

      {/* 主区域 */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* --- 顶部导航栏 --- */}
        <header className="h-14 border-b flex items-center justify-between px-4 bg-white z-10 sticky top-0 shrink-0 gap-2">
          
          {/* 左侧：菜单 & Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => toggleSidebar()}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-slate-700 hidden md:inline">Scripture AI</span>
          </div>
          
          {/* 中间：多标签页栏 (支持水平滚动) */}
          <div className="flex-1 flex items-center overflow-x-auto no-scrollbar gap-1 px-2 mask-linear-fade">
             {tabs.map(tab => (
               <div 
                 key={tab.id}
                 onClick={() => handleSwitchTab(tab.id)}
                 className={cn(
                   "flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium cursor-pointer transition-all border-b-2 whitespace-nowrap min-w-[80px] justify-between group",
                   activeTabId === tab.id 
                     ? "bg-slate-50 border-blue-500 text-blue-700 shadow-sm" 
                     : "hover:bg-slate-50 border-transparent text-slate-500"
                 )}
               >
                 <span>{tab.book} {tab.chapter}</span>
                 {/* 关闭按钮 (hover 显示，选中时常显) */}
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
             <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full ml-1 shrink-0" onClick={handleAddTab}>
               <Plus className="w-4 h-4 text-slate-400" />
             </Button>
          </div>

          {/* 右侧：工具栏 */}
          <div className="flex items-center gap-1 shrink-0">
            
            {/* 行距调节 */}
            <Button 
              variant="ghost" size="icon" 
              onClick={toggleLineHeight}
              className="hidden sm:flex text-slate-500"
              title="调整行距"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>

            {/* 中英对照 */}
            <Button 
              variant={showEnglish ? "secondary" : "ghost"} 
              size="sm" 
              onClick={toggleEnglish}
              className="hidden sm:flex gap-1 text-xs font-bold"
            >
              <Languages className="h-4 w-4" />
              {showEnglish ? "中/英" : "中"}
            </Button>
            
            {/* AI 开关 (高亮状态) */}
            <Button 
                variant={isAiOpen ? "secondary" : "ghost"} 
                size="icon" 
                onClick={() => setAiOpen(!isAiOpen)}
                className={cn(isAiOpen && "text-blue-600 bg-blue-50")}
            >
                <Sparkles className="h-5 w-5" />
            </Button>

            {/* 字体设置 */}
            <div className="hidden sm:flex items-center gap-2 w-24 mx-2">
               <Slider 
                value={[fontSize]} min={14} max={32} step={1} 
                onValueChange={(val) => setFontSize(val[0])}
               />
            </div>
            
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Settings className="h-5 w-5 text-slate-500" />
            </Button>
          </div>
        </header>

        {/* 核心阅读区 - 使用 key 强制重渲染以重置滚动条 */}
        <div className="flex-1 overflow-y-auto scroll-smooth bg-white">
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