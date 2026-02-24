// app/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

import { Sidebar } from "@/components/bible/Sidebar";
import { Reader } from "@/components/bible/Reader";
import { SearchResults } from "@/components/bible/SearchResults";
import { Slider } from "@/components/ui/slider";
import { useBibleStore } from "@/store/useBibleStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, Settings, Languages, Plus, X, AlignJustify, Search, PanelLeft, Maximize, Minimize, Headphones, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeaderPlayer } from "@/components/bible/HeaderPlayer"; 
import { BIBLE_BOOKS } from "@/lib/constants"; 
import { useAudioPlayer } from "@/hooks/use-audio-player"; 
import { UserMenu } from "@/components/auth/UserMenu";
import { SyncSettings } from "@/components/settings/SyncSettings";

// 动态按需加载
const AISidebar = dynamic(() => import("@/components/bible/AISidebar").then(mod => mod.AISidebar), { ssr: false });
const MagicBall = dynamic(() => import("@/components/bible/MagicBall").then(mod => mod.MagicBall), { ssr: false });
const SearchDialog = dynamic(() => import("@/components/bible/SearchDialog").then(mod => mod.SearchDialog), { ssr: false });
const NoteEditor = dynamic(() => import("@/components/bible/NoteEditor").then(mod => mod.NoteEditor), { ssr: false });
const ShareCard = dynamic(() => import("@/components/bible/ShareCard").then(mod => mod.ShareCard), { ssr: false });
const AuthDialog = dynamic(() => import("@/components/auth/AuthDialog").then(mod => mod.AuthDialog), { ssr: false });
const DashboardTab = dynamic(() => import("@/components/bible/DashboardTab").then(mod => mod.DashboardTab), { ssr: false });
const HighlightsTab = dynamic(() => import("@/components/bible/HighlightsTab").then(mod => mod.HighlightsTab), { ssr: false });
const NotesTab = dynamic(() => import("@/components/bible/NotesTab").then(mod => mod.NotesTab), { ssr: false });
const PlanTab = dynamic(() => import("@/components/bible/PlanTab").then(mod => mod.PlanTab), { ssr: false });

// --- [新增] 独立的带左右滚动按钮的 Tab 标表组件 ---
const TabList = ({ tabs, activeTabId, onSwitchTab, onCloseTab, onAddTab }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    const timer = setTimeout(checkScroll, 150);
    return () => {
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [tabs, checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <div className="relative flex items-center w-full group overflow-hidden">
      {canScrollLeft && (
        <div className="absolute left-0 z-10 h-full flex items-center pr-4 bg-gradient-to-r from-background via-background to-transparent">
          <button onClick={(e) => { e.stopPropagation(); scroll('left'); }} className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border shadow-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full px-1 scroll-smooth"
      >
        {tabs.map((tab: any) => (
          <div
            key={tab.id}
            onClick={() => onSwitchTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 md:py-1 rounded-full md:rounded-lg text-sm md:text-xs font-medium cursor-pointer transition-all border whitespace-nowrap min-w-[90px] justify-between group/tab shrink-0",
              activeTabId === tab.id
                ? "bg-white dark:bg-slate-800 border-primary/20 text-primary shadow-sm"
                : "bg-transparent border-transparent text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <span className="max-w-[120px] truncate select-none">
              {tab.type === 'read' ? `${tab.book} ${tab.chapter}` : tab.type === 'search' ? `${tab.searchMode === 'ai' ? '✨' : tab.searchMode === 'fuzzy' ? '🌊' : '🔍'} ${tab.query}` : tab.type === 'dashboard' ? '📊 数据看板' : tab.type === 'highlights' ? '🖍️ 我的高亮' : tab.type === 'notes' ? '📝 我的笔记' : '📅 读经计划'}
            </span>
            <X
              className={cn(
                "w-3.5 h-3.5 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors flex-shrink-0 p-0.5",
                activeTabId === tab.id ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover/tab:opacity-60"
              )}
              onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
            />
          </div>
        ))}
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 ml-1" onClick={onAddTab}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {canScrollRight && (
        <div className="absolute right-0 z-10 h-full flex items-center pl-4 bg-gradient-to-l from-background via-background to-transparent">
          <button onClick={(e) => { e.stopPropagation(); scroll('right'); }} className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border shadow-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  
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

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    const scrollThreshold = 15; 

    if (currentScrollY <= 60) {
      setIsNavVisible(true);
    } else if (currentScrollY > lastScrollY.current + scrollThreshold) {
      setIsNavVisible(false);
    } else if (currentScrollY < lastScrollY.current - scrollThreshold) {
      setIsNavVisible(true);
    }

    lastScrollY.current = currentScrollY;
  }, []);

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

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
  }, [isDarkMode]);

  useEffect(() => {
    const handleFullscreenChange = () => { setIsFullscreen(!!document.fullscreenElement); };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const book = searchParams.get("book");
    const chapter = searchParams.get("chapter");
    if (book && chapter && activeTab.type === 'read') {
      if (activeTab.book !== book || activeTab.chapter !== chapter) {
        updateActiveTab({ book, chapter });
        const container = document.getElementById('reader-scroll-container');
        if (container) { container.scrollTo(0, 0); }
      }
    }
  }, [searchParams, activeTab, updateActiveTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'f':
            e.preventDefault();
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              if (document.exitFullscreen) document.exitFullscreen();
            }
            break;
          case 'd':
            e.preventDefault();
            const { tabs, setActiveTab, addTab } = useBibleStore.getState();
            const existTab = tabs.find(t => t.type === 'dashboard');
            if (existTab) setActiveTab(existTab.id);
            else addTab({ type: 'dashboard' });
            break;
          case '/':
            e.preventDefault();
            setIsSearchOpen(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  return (
    <main className="flex h-screen w-full overflow-hidden bg-background relative transition-colors duration-500">
      <AuthDialog />
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <NoteEditor />
      <ShareCard />
      <MagicBall /> 

      {/* Desktop Sidebar */}
      {isDesktopSidebarOpen && (
        <aside className="hidden md:block w-72 h-full border-r bg-card/50 backdrop-blur-md shrink-0 transition-all duration-300 z-20">
          <Sidebar />
        </aside>
      )}

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
        <SheetContent side="left" className="p-0 w-80 bg-card border-r-0">
          <SheetTitle className="sr-only">圣经目录</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Mobile Settings Sheet */}
      <Sheet open={isMobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
        <SheetContent side="bottom" className="bg-card border-t-0 pb-6 rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-4 pt-2">
            <SheetTitle className="text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> 阅读设置
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            {activeTab.type === 'read' && (
              <div className="bg-secondary/50 p-4 rounded-xl border border-border/50">
                 <div className="flex items-center gap-2 mb-2 text-sm font-bold text-foreground">
                    <Headphones className="w-4 h-4 text-primary" /> 语音朗读
                 </div>
                 <HeaderPlayer player={player} text={chapterSpeechText || ""} mode="full" className="bg-background border border-border shadow-sm w-full rounded-lg" />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground font-medium"><span>字号大小</span><span>{fontSize}px</span></div>
              <Slider value={[fontSize]} min={14} max={32} step={1} onValueChange={(val) => setFontSize(val[0])} className="py-2" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">行间距</span>
              <div className="flex bg-secondary/50 p-1 rounded-lg">
                {[1.6, 1.8, 2.2].map(lh => (
                  <button 
                    key={lh} 
                    onClick={() => setLineHeight(lh)}
                    className={cn("px-3 py-1 text-xs rounded-md transition-all", lineHeight === lh ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                  >
                    {lh === 1.6 ? "紧凑" : lh === 1.8 ? "标准" : "宽松"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">中英对照</span>
              <Button variant={showEnglish ? "default" : "secondary"} size="sm" onClick={toggleEnglish} className="rounded-full px-4">
                {showEnglish ? "已开启" : "已关闭"}
              </Button>
            </div>
            
            <div className="pt-2">
              <SyncSettings />
            </div>
          </div>
          
          <div className="mt-8 mb-4">
            <Button 
              className="w-full rounded-full font-bold h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground" 
              onClick={() => setMobileSettingsOpen(false)}
            >
              完 成 并 关 闭
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AISidebar />

      <div 
        style={{ '--ai-offset': isAiOpen ? `${sidebarWidth}px` : '0px' } as any}
        className={cn(
          "flex-1 flex flex-col h-full relative min-w-0 transition-[margin] duration-500 cubic-bezier(0.32, 0.72, 0, 1)",
          "md:mr-[var(--ai-offset)]"
        )}
      >
        
        {/* Header */}
        <div 
          className={cn(
            "absolute top-0 left-0 right-0 z-10 p-2 md:p-4 pointer-events-none transition-transform duration-300 ease-in-out",
            isNavVisible ? "translate-y-0 opacity-100" : "-translate-y-[120%] opacity-0"
          )}
        >
          <header className="h-14 flex items-center justify-between px-3 md:px-4 glass-panel rounded-2xl pointer-events-auto shadow-sm">
            
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button variant="ghost" size="icon" className="md:hidden text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full" onClick={() => toggleSidebar()}>
                <Menu className="h-5 w-5" />
              </Button>
              
              <Button variant="ghost" size="icon" className={cn("hidden md:flex rounded-full hover:bg-black/5 dark:hover:bg-white/5", !isDesktopSidebarOpen ? "text-muted-foreground" : "text-primary")} onClick={toggleDesktopSidebar}>
                <PanelLeft className="h-5 w-5" />
              </Button>
              
              <Button variant="secondary" size="sm" className="gap-2 hidden md:flex rounded-full bg-secondary/60 hover:bg-secondary border-none ml-1" onClick={() => setIsSearchOpen(true)}>
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground pr-2">搜索经文、问题... ( / 或 Cmd+K )</span>
              </Button>

              <Button variant="ghost" size="icon" className="md:hidden flex text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="hidden md:flex flex-1 items-center overflow-hidden mx-4 mask-linear-fade pl-2 min-w-0">
               <TabList 
                 tabs={tabs} 
                 activeTabId={activeTabId} 
                 onSwitchTab={handleSwitchTab} 
                 onCloseTab={closeTab} 
                 onAddTab={handleAddTab} 
               />
            </div>

            <div className="md:hidden flex-1 text-center font-serif font-bold text-lg text-foreground truncate px-2 tracking-wide">
              {activeTab.type === 'read' ? `${activeTab.book} ${activeTab.chapter}` : activeTab.type === 'search' ? "搜索结果" : activeTab.type === 'dashboard' ? "数据看板" : activeTab.type === 'highlights' ? "我的高亮" : activeTab.type === 'notes' ? "我的笔记" : "读经计划"}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              
              {activeTab.type === 'read' && (
                 <>
                    <HeaderPlayer player={player} text={chapterSpeechText || ""} className="hidden sm:flex bg-transparent border-none" mode="full" />
                    <HeaderPlayer player={player} text={chapterSpeechText || ""} className="sm:hidden border-none bg-transparent p-0" mode="minimal" />
                 </>
              )}

              <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="hidden sm:flex text-muted-foreground rounded-full hover:bg-black/5 dark:hover:bg-white/5" title="全屏">
                <Maximize className="h-4 w-4" />
              </Button>

              <div className="mx-1 border-l h-5 border-border/50 hidden sm:block"></div>

              <div className="hidden sm:flex items-center gap-1 pl-1">
                  <Button variant="ghost" size="icon" onClick={toggleLineHeight} className="text-muted-foreground rounded-full hover:bg-black/5 dark:hover:bg-white/5" title="调整行高">
                    <AlignJustify className="h-4 w-4" />
                  </Button>
                  
                  <Button variant={showEnglish ? "secondary" : "ghost"} size="sm" onClick={toggleEnglish} className="gap-1 text-xs font-bold rounded-full">
                    <Languages className="h-4 w-4" />{showEnglish ? "中/英" : "中"}
                  </Button>
                  
                  <div className="w-20 mx-2 group relative flex items-center">
                    <Slider value={[fontSize]} min={14} max={32} step={1} onValueChange={(val) => setFontSize(val[0])} className="cursor-pointer" />
                  </div>
              </div>

              <div className="mx-1 border-l h-5 border-border/50 hidden sm:block"></div>

              <div className="pl-1">
                <UserMenu />
              </div>
              
              <Button variant="ghost" size="icon" className="sm:hidden rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setMobileSettingsOpen(true)}>
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </header>
        </div>

        {/* Main Content Area */}
        <div id="reader-scroll-container" onScroll={handleScroll} className="flex-1 overflow-y-auto scroll-smooth pt-20 md:pt-24 pb-24 md:pb-10">
          {activeTab.type === 'read' ? (
              <Reader key={activeTab.id} initialBook={activeTab.book || 'Gen'} initialChapter={activeTab.chapter || '1'} />
          ) : activeTab.type === 'search' ? (
              <SearchResults key={activeTab.id} query={activeTab.query || ''} mode={activeTab.searchMode || 'exact'} cachedResults={activeTab.results} onUpdateResults={(data) => updateActiveTab({ results: data })} />
          ) : activeTab.type === 'dashboard' ? (
              <DashboardTab key={activeTab.id} />
          ) : activeTab.type === 'highlights' ? (
              <HighlightsTab key={activeTab.id} />
          ) : activeTab.type === 'notes' ? (
              <NotesTab key={activeTab.id} />
          ) : (
              <PlanTab key={activeTab.id} />
          )}
        </div>

        {/* Mobile Tab Bar */}
        <div 
          className={cn(
            "md:hidden fixed bottom-0 left-0 right-0 h-16 glass-panel border-t border-b-0 rounded-t-2xl flex items-center px-2 z-20 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-in-out",
            isNavVisible ? "translate-y-0" : "translate-y-[120%]"
          )}
        >
            <TabList 
              tabs={tabs} 
              activeTabId={activeTabId} 
              onSwitchTab={handleSwitchTab} 
              onCloseTab={closeTab} 
              onAddTab={handleAddTab} 
            />
        </div>

      </div>
    </main>
  );
}
