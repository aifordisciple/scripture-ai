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
import { Menu, Settings, Languages, Plus, X, AlignJustify, Search, PanelLeft, Maximize, Minimize, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AISidebar } from "@/components/bible/AISidebar";
import { cn } from "@/lib/utils";
import { MagicBall } from "@/components/bible/MagicBall"; 
import { HeaderPlayer } from "@/components/bible/HeaderPlayer"; 
import { BIBLE_BOOKS } from "@/lib/constants"; 
import { useAudioPlayer } from "@/hooks/use-audio-player"; 
import { AuthDialog } from "@/components/auth/AuthDialog";
import { UserMenu } from "@/components/auth/UserMenu";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { 
    fontSize, setFontSize, 
    isSidebarOpen, toggleSidebar,
    isDesktopSidebarOpen, toggleDesktopSidebar,
    isAiOpen, setAiOpen, 
    showEnglish, toggleEnglish,
    lineHeight, setLineHeight, 
    tabs, activeTabId, setActiveTab, addTab, closeTab, updateActiveTab,
    sidebarWidth,
    isDarkMode, 
    chapterSpeechText,
    isMobileSettingsOpen,
    setMobileSettingsOpen
  } = useBibleStore();

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // --- 播放器逻辑 ---
  const autoPlayRef = useRef(false);
  const prevTextRef = useRef(chapterSpeechText);

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
    } else { return; }
    router.push(`/?book=${nextBookId}&chapter=${nextChapter}`);
  }, [activeTab, router]);

  const onPlaybackFinished = useCallback(() => {
      autoPlayRef.current = true;
      handleNextChapter();
  }, [handleNextChapter]);

  const player = useAudioPlayer(onPlaybackFinished);

  useEffect(() => {
    if (chapterSpeechText && autoPlayRef.current && chapterSpeechText !== prevTextRef.current) {
        player.play(chapterSpeechText);
        autoPlayRef.current = false;
    }
    if (!chapterSpeechText) { player.stop(); }
    prevTextRef.current = chapterSpeechText;
  }, [chapterSpeechText, player]);
  // ---------------------

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
  }, [isDarkMode]);

  useEffect(() => {
    const handleFullscreenChange = () => { setIsFullscreen(!!document.fullscreenElement); };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // [修复] 监听参数变化，翻页时滚动回顶部
  useEffect(() => {
    const book = searchParams.get("book");
    const chapter = searchParams.get("chapter");
    if (book && chapter && activeTab.type === 'read') {
      if (activeTab.book !== book || activeTab.chapter !== chapter) {
        updateActiveTab({ book, chapter });
        
        // 滚动到阅读容器顶部
        const container = document.getElementById('reader-scroll-container');
        if (container) {
            container.scrollTo(0, 0);
        }
      }
    }
  }, [searchParams, activeTab, updateActiveTab]);

  const handleSwitchTab = (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      setActiveTab(id);
      if (tab.type === 'read') { router.push(`/?book=${tab.book}&chapter=${tab.chapter}`); } 
      else { router.push('/'); }
    }
  };

  const handleAddTab = () => { addTab({ type: 'read', book: 'Gen', chapter: '1' }); };
  const toggleLineHeight = () => {
    if (lineHeight <= 1.6) setLineHeight(1.8);
    else if (lineHeight <= 1.8) setLineHeight(2.2);
    else setLineHeight(1.6);
  };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } 
    else { if (document.exitFullscreen) { document.exitFullscreen(); } }
  };

  const TabList = () => (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full">
        {tabs.map(tab => (
        <div key={tab.id} onClick={() => handleSwitchTab(tab.id)} className={cn("flex items-center gap-1.5 px-3 py-2 md:py-1.5 rounded-lg md:rounded-t-lg text-sm md:text-xs font-medium cursor-pointer transition-all border md:border-b-2 md:border-x-0 md:border-t-0 whitespace-nowrap min-w-[100px] justify-between group shrink-0", activeTabId === tab.id ? "bg-blue-50 dark:bg-slate-800 border-blue-500 md:border-b-blue-500 text-blue-700 dark:text-blue-400" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 md:border-transparent text-slate-500 dark:text-slate-400")}>
            <span className="max-w-[120px] truncate">{tab.type === 'read' ? `${tab.book} ${tab.chapter}` : `${tab.searchMode === 'ai' ? '✨' : '🔍'} ${tab.query}`}</span>
            <X className={cn("w-3 h-3 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors flex-shrink-0", activeTabId === tab.id ? "opacity-50 hover:opacity-100" : "opacity-0 group-hover:opacity-50")} onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} />
        </div>
        ))}
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500" onClick={handleAddTab}><Plus className="w-4 h-4" /></Button>
    </div>
  );

  return (
    <main className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-950 relative transition-colors duration-300">
      <AuthDialog />
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <NoteEditor />
      <ShareCard />
      {/* 调整 MagicBall 层级在组件内部做，或者确保它在文档流下方 */}
      <MagicBall /> 

      {/* Desktop Sidebar */}
      {isDesktopSidebarOpen && (
        <aside className="hidden md:block w-72 h-full border-r dark:border-slate-800 shrink-0 transition-all duration-300">
          <Sidebar />
        </aside>
      )}

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
        <SheetContent side="left" className="p-0 w-80 dark:bg-slate-900 dark:border-slate-800">
          <SheetTitle className="sr-only">圣经目录</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Mobile Settings Sheet */}
      <Sheet open={isMobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
        <SheetContent side="bottom" className="dark:bg-slate-900 dark:border-slate-800 pb-10">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5" /> 阅读设置
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            {activeTab.type === 'read' && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                 <div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <Headphones className="w-4 h-4" /> 语音朗读
                 </div>
                 <HeaderPlayer player={player} text={chapterSpeechText || ""} mode="full" className="bg-white dark:bg-slate-900 border-none shadow-sm w-full" />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-500"><span>字号</span><span>{fontSize}px</span></div>
              <Slider value={[fontSize]} min={14} max={32} step={1} onValueChange={(val) => setFontSize(val[0])} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">行间距</span>
              <Button variant="outline" size="sm" onClick={toggleLineHeight} className="min-w-[80px]">
                {lineHeight === 1.6 && "紧凑"}{lineHeight === 1.8 && "标准"}{lineHeight > 1.8 && "宽松"}
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
        
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-4 bg-white dark:bg-slate-950 dark:border-slate-800 z-10 sticky top-0 shrink-0 gap-2 transition-colors duration-300">
          
          {/* Left Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" className="md:hidden dark:text-slate-200" onClick={() => toggleSidebar()}><Menu className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className={cn("hidden md:flex dark:text-slate-200", !isDesktopSidebarOpen && "text-slate-400")} onClick={toggleDesktopSidebar}><PanelLeft className="h-5 w-5" /></Button>
            <Button variant="outline" size="sm" className="gap-2 text-slate-500 dark:text-slate-400 dark:bg-slate-900 dark:border-slate-700 hidden md:flex" onClick={() => setIsSearchOpen(true)}><Search className="w-4 h-4" /><span className="text-xs">搜索...</span></Button>
            <Button variant="ghost" size="icon" className="md:hidden dark:text-slate-200" onClick={() => setIsSearchOpen(true)}><Search className="h-5 w-5" /></Button>
          </div>
          
          {/* 桌面端标签页 */}
          <div className="hidden md:flex flex-1 items-center overflow-x-auto no-scrollbar gap-1 px-2 mask-linear-fade">
             <TabList />
          </div>

          {/* 移动端标题 */}
          <div className="md:hidden flex-1 text-center font-serif font-bold text-lg text-slate-800 dark:text-slate-200 truncate px-2">
             {activeTab.type === 'read' ? `${activeTab.book} ${activeTab.chapter}` : "搜索"}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="hidden sm:flex text-slate-500 dark:text-slate-400 dark:hover:bg-slate-800" title="全屏"><Maximize className="h-4 w-4" /></Button>

            {activeTab.type === 'read' && (
               <>
                 <HeaderPlayer player={player} text={chapterSpeechText || ""} className="hidden sm:flex" mode="full" />
                 <HeaderPlayer player={player} text={chapterSpeechText || ""} className="sm:hidden border-none bg-transparent p-0" mode="minimal" />
               </>
            )}

            {/* 用户菜单 */}
            <UserMenu />

            {/* 桌面端工具 */}
            <div className="hidden sm:flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={toggleLineHeight} className="text-slate-500 dark:text-slate-400" title="行高"><AlignJustify className="h-4 w-4" /></Button>
                <Button variant={showEnglish ? "secondary" : "ghost"} size="sm" onClick={toggleEnglish} className="gap-1 text-xs font-bold dark:text-slate-300"><Languages className="h-4 w-4" />{showEnglish ? "中/英" : "中"}</Button>
                <div className="w-24 mx-2"><Slider value={[fontSize]} min={14} max={32} step={1} onValueChange={(val) => setFontSize(val[0])} /></div>
            </div>
            
            {/* 移动端设置按钮 (Hidden but functional via UserMenu) */}
            <Button variant="ghost" size="icon" className="sm:hidden hidden" onClick={() => setMobileSettingsOpen(true)}>
              <Settings className="h-5 w-5 text-slate-500" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div 
            id="reader-scroll-container" // [修复] 添加 ID
            className="flex-1 overflow-y-auto scroll-smooth bg-white dark:bg-slate-950 transition-colors duration-300 pb-20 md:pb-0"
        >
          {activeTab.type === 'read' ? (
              <Reader key={activeTab.id} initialBook={activeTab.book || 'Gen'} initialChapter={activeTab.chapter || '1'} />
          ) : (
              <SearchResults key={activeTab.id} query={activeTab.query || ''} mode={activeTab.searchMode || 'exact'} cachedResults={activeTab.results} onUpdateResults={(data) => updateActiveTab({ results: data })} />
          )}
        </div>

        {/* 移动端底部标签栏 */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-950 border-t dark:border-slate-800 flex items-center px-4 z-20 pb-safe">
            <TabList />
        </div>

      </div>
    </main>
  );
}