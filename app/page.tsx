// app/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/bible/Sidebar";
import { Reader } from "@/components/bible/Reader";
import { SearchResults } from "@/components/bible/SearchResults";
import { SearchDialog } from "@/components/bible/SearchDialog";
import { NoteEditor } from "@/components/bible/NoteEditor"; 
import { ShareCard } from "@/components/bible/ShareCard"; 
import { Slider } from "@/components/ui/slider";
import { useBibleStore } from "@/store/useBibleStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Settings, Languages, Sparkles, Plus, X, AlignJustify, Moon, Sun, Search, PanelLeft, Maximize, Minimize, Type, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AISidebar } from "@/components/bible/AISidebar";
import { cn } from "@/lib/utils";
import { MagicBall } from "@/components/bible/MagicBall"; 
import { HeaderPlayer } from "@/components/bible/HeaderPlayer"; 
import { BIBLE_BOOKS } from "@/lib/constants"; 
import { useAudioPlayer } from "@/hooks/use-audio-player"; // 引入 Hook

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false); 
  
  const { 
    fontSize, setFontSize, 
    isSidebarOpen, toggleSidebar,
    isDesktopSidebarOpen, toggleDesktopSidebar,
    isAiOpen, setAiOpen, 
    showEnglish, toggleEnglish,
    lineHeight, setLineHeight, 
    tabs, activeTabId, setActiveTab, addTab, closeTab, updateActiveTab,
    sidebarWidth,
    isDarkMode, toggleDarkMode,
    chapterSpeechText 
  } = useBibleStore();

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // --- 播放器核心逻辑 ---
  const autoPlayRef = useRef(false);
  const prevTextRef = useRef(chapterSpeechText);

  // 下一章跳转逻辑
  const handleNextChapter = useCallback(() => {
    if (activeTab.type !== 'read') return;
    
    const currentBookId = activeTab.book || 'Gen';
    const currentChapter = parseInt(activeTab.chapter || '1');
    const currentBookIndex = BIBLE_BOOKS.findIndex(b => b.id === currentBookId);
    if (currentBookIndex === -1) return;
    const currentBookConfig = BIBLE_BOOKS[currentBookIndex];
    
    let nextBookId = currentBookId;
    let nextChapter = currentChapter;

    if (currentChapter < currentBookConfig.chapters) {
        nextChapter = currentChapter + 1;
    } else if (currentBookIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[currentBookIndex + 1];
        nextBookId = nextBook.id;
        nextChapter = 1;
    } else {
        return; 
    }
    router.push(`/?book=${nextBookId}&chapter=${nextChapter}`);
  }, [activeTab, router]);

  // 播放结束回调：标记自动播放并跳转
  const onPlaybackFinished = useCallback(() => {
      autoPlayRef.current = true;
      handleNextChapter();
  }, [handleNextChapter]);

  // 初始化播放器 Hook
  const player = useAudioPlayer(onPlaybackFinished);

  // 监听文本变化，触发自动播放
  useEffect(() => {
    if (chapterSpeechText && autoPlayRef.current && chapterSpeechText !== prevTextRef.current) {
        player.play(chapterSpeechText);
        autoPlayRef.current = false;
    }
    // 如果文本被清空（加载中），停止当前播放
    if (!chapterSpeechText) {
        player.stop();
    }
    prevTextRef.current = chapterSpeechText;
  }, [chapterSpeechText, player]);
  // ---------------------

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const book = searchParams.get("book");
    const chapter = searchParams.get("chapter");
    if (book && chapter && activeTab.type === 'read') {
      if (activeTab.book !== book || activeTab.chapter !== chapter) {
        updateActiveTab({ book, chapter });
      }
    }
  }, [searchParams, activeTab, updateActiveTab]);

  const handleSwitchTab = (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      setActiveTab(id);
      if (tab.type === 'read') {
          router.push(`/?book=${tab.book}&chapter=${tab.chapter}`);
      } else {
          router.push('/'); 
      }
    }
  };

  const handleAddTab = () => {
    addTab({ type: 'read', book: 'Gen', chapter: '1' });
  };

  const toggleLineHeight = () => {
    if (lineHeight <= 1.6) setLineHeight(1.8);
    else if (lineHeight <= 1.8) setLineHeight(2.2);
    else setLineHeight(1.6);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-950 relative transition-colors duration-300">
      
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <NoteEditor />
      <ShareCard />
      <MagicBall /> 

      {/* --- 桌面端可收缩侧边栏 --- */}
      {isDesktopSidebarOpen && (
        <aside className="hidden md:block w-72 h-full border-r dark:border-slate-800 shrink-0 transition-all duration-300">
          <Sidebar />
        </aside>
      )}

      {/* --- 移动端侧边栏 --- */}
      <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
        <SheetContent side="left" className="p-0 w-80 dark:bg-slate-900 dark:border-slate-800">
          <SheetTitle className="sr-only">圣经目录</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* --- 移动端设置面板 --- */}
      <Sheet open={isMobileSettingsOpen} onOpenChange={setIsMobileSettingsOpen}>
        <SheetContent side="bottom" className="dark:bg-slate-900 dark:border-slate-800 pb-10">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5" /> 阅读设置
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            
            {/* [新增] 移动端完整播放器 (放在设置面板最上方) */}
            {activeTab.type === 'read' && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                 <div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <Headphones className="w-4 h-4" /> 语音朗读
                 </div>
                 <HeaderPlayer 
                    player={player} 
                    text={chapterSpeechText || ""} 
                    mode="full"
                    className="bg-white dark:bg-slate-900 border-none shadow-sm w-full"
                 />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>字号</span>
                <span>{fontSize}px</span>
              </div>
              <Slider value={[fontSize]} min={14} max={32} step={1} onValueChange={(val) => setFontSize(val[0])} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">行间距</span>
              <Button variant="outline" size="sm" onClick={toggleLineHeight} className="min-w-[80px]">
                {lineHeight === 1.6 && "紧凑"}
                {lineHeight === 1.8 && "标准"}
                {lineHeight > 1.8 && "宽松"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">中英对照</span>
              <Button variant={showEnglish ? "default" : "outline"} size="sm" onClick={toggleEnglish} className="min-w-[80px]">
                {showEnglish ? "开启" : "关闭"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AISidebar />

      <div 
        style={{ '--ai-offset': isAiOpen ? `${sidebarWidth}px` : '0px' } as any}
        className={cn(
          "flex-1 flex flex-col h-full relative min-w-0 transition-[margin] duration-300 ease-in-out",
          "md:mr-[var(--ai-offset)]"
        )}
      >
        
        <header className="h-14 border-b flex items-center justify-between px-4 bg-white dark:bg-slate-950 dark:border-slate-800 z-10 sticky top-0 shrink-0 gap-2 transition-colors duration-300">
          
          <div className="flex items-center gap-2 shrink-0">
            {/* 移动端菜单开关 */}
            <Button variant="ghost" size="icon" className="md:hidden dark:text-slate-200" onClick={() => toggleSidebar()}>
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* 桌面端侧边栏开关 */}
            <Button 
                variant="ghost" 
                size="icon" 
                className={cn("hidden md:flex dark:text-slate-200", !isDesktopSidebarOpen && "text-slate-400")} 
                onClick={toggleDesktopSidebar}
                title={isDesktopSidebarOpen ? "收起目录" : "展开目录"}
            >
              <PanelLeft className="h-5 w-5" />
            </Button>

            <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-slate-500 dark:text-slate-400 dark:bg-slate-900 dark:border-slate-700 hidden md:flex"
                onClick={() => setIsSearchOpen(true)}
            >
                <Search className="w-4 h-4" />
                <span className="text-xs">搜索...</span>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden dark:text-slate-200" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-5 w-5" />
            </Button>
          </div>
          
          {/* 标签页区域 */}
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
                 <span className="max-w-[100px] truncate">
                    {tab.type === 'read' 
                        ? `${tab.book} ${tab.chapter}` 
                        : `${tab.searchMode === 'ai' ? '✨' : '🔍'} ${tab.query}`}
                 </span>
                 <X 
                   className={cn(
                     "w-3 h-3 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors flex-shrink-0",
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

          <div className="flex items-center gap-2 shrink-0">
            {/* 全屏按钮 */}
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="hidden sm:flex text-slate-500 dark:text-slate-400 dark:hover:bg-slate-800" title={isFullscreen ? "退出全屏" : "全屏沉浸"}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>

            {/* [关键] 播放器控制区 */}
            {activeTab.type === 'read' && (
               <>
                 {/* Desktop: 完整播放器 */}
                 <HeaderPlayer 
                   player={player}
                   text={chapterSpeechText || ""} 
                   className="hidden sm:flex" 
                   mode="full"
                 />
                 {/* Mobile: 仅显示播放按钮 (点击设置可看完整版) */}
                 <HeaderPlayer 
                   player={player}
                   text={chapterSpeechText || ""} 
                   className="sm:hidden border-none bg-transparent p-0" 
                   mode="minimal"
                 />
               </>
            )}

            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="text-slate-500 dark:text-slate-400 dark:hover:bg-slate-800" title="切换主题">
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={toggleLineHeight} className="hidden sm:flex text-slate-500 dark:text-slate-400 dark:hover:bg-slate-800" title="行高">
              <AlignJustify className="h-4 w-4" />
            </Button>

            <Button variant={showEnglish ? "secondary" : "ghost"} size="sm" onClick={toggleEnglish} className="hidden sm:flex gap-1 text-xs font-bold dark:text-slate-300 dark:hover:bg-slate-800">
              <Languages className="h-4 w-4" />
              {showEnglish ? "中/英" : "中"}
            </Button>
            
            <Button variant={isAiOpen ? "secondary" : "ghost"} size="icon" onClick={() => setAiOpen(!isAiOpen)} className={cn(
              isAiOpen && "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400",
              "dark:text-slate-400 dark:hover:bg-slate-800"
            )} title="AI 助手">
                <Sparkles className="h-5 w-5" />
            </Button>

            <div className="hidden sm:flex items-center gap-2 w-24 mx-2">
               <Slider value={[fontSize]} min={14} max={32} step={1} onValueChange={(val) => setFontSize(val[0])} />
            </div>
            
            {/* 移动端设置按钮 */}
            <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setIsMobileSettingsOpen(true)}>
              <Settings className="h-5 w-5 text-slate-500" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth bg-white dark:bg-slate-950 transition-colors duration-300">
          {activeTab.type === 'read' ? (
              <Reader 
                key={activeTab.id} 
                initialBook={activeTab.book || 'Gen'} 
                initialChapter={activeTab.chapter || '1'} 
              />
          ) : (
              <SearchResults 
                key={activeTab.id}
                query={activeTab.query || ''}
                mode={activeTab.searchMode || 'exact'}
                cachedResults={activeTab.results}
                onUpdateResults={(data) => updateActiveTab({ results: data })}
              />
          )}
        </div>

      </div>
    </main>
  );
}