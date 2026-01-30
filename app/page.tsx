// app/page.tsx
"use client";

import { Sidebar } from "@/components/bible/Sidebar";
import { Reader } from "@/components/bible/Reader";
import { Slider } from "@/components/ui/slider";
import { useBibleStore } from "@/store/useBibleStore";
// 引入 SheetTitle 以修复无障碍报错
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Menu, Settings, Languages } from "lucide-react"; // 确保引入了 Languages 图标
import { Button } from "@/components/ui/button";
import { AISidebar } from "@/components/bible/AISidebar";

export default function Home() {
  // 确保这里获取了所有需要的状态
  const { 
    fontSize, 
    setFontSize, 
    isSidebarOpen, 
    toggleSidebar,
    showEnglish,      // 任务 5.2 新增
    toggleEnglish     // 任务 5.2 新增
  } = useBibleStore();

  return (
    <main className="flex h-screen w-full overflow-hidden bg-white relative">
      
      {/* --- 1. 桌面端左侧边栏 (目录) --- */}
      <aside className="hidden md:block w-72 h-full border-r shrink-0">
        <Sidebar />
      </aside>

      {/* --- 2. 移动端左侧边栏 (抽屉模式) --- */}
      <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
        <SheetContent side="left" className="p-0 w-80">
          {/* --- 修复点：添加隐藏的标题以满足无障碍要求 --- */}
          <SheetTitle className="sr-only">圣经目录</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* --- 3. AI 智能侧边栏 --- */}
      <AISidebar />

      {/* --- 4. 主内容区域 --- */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* 顶部导航栏 */}
        <header className="h-14 border-b flex items-center justify-between px-4 bg-white/80 backdrop-blur z-10 sticky top-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => toggleSidebar()}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-slate-700">Scripture AI</span>
          </div>

          {/* 右侧工具栏：中英对照 + 字体调节 */}
          <div className="flex items-center gap-4">
            
            {/* 中英对照切换按钮 */}
            <Button 
              variant={showEnglish ? "secondary" : "ghost"} 
              size="sm" 
              onClick={toggleEnglish}
              className="gap-1 text-xs font-bold"
            >
              <Languages className="h-4 w-4" />
              {showEnglish ? "对照: ON" : "对照: OFF"}
            </Button>

            {/* 字体调节器 */}
            <div className="hidden sm:flex items-center gap-2 w-32">
              <span className="text-xs text-slate-400">A</span>
              <Slider 
                value={[fontSize]} 
                min={14} 
                max={32} 
                step={1} 
                onValueChange={(val) => setFontSize(val[0])}
                className="cursor-pointer"
              />
              <span className="text-lg text-slate-600">A</span>
            </div>
            
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5 text-slate-500" />
            </Button>
          </div>
        </header>

        {/* 核心阅读区 */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <Reader />
        </div>

      </div>
    </main>
  );
}