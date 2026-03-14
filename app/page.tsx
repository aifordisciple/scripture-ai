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
import { Menu, Settings, Languages, Plus, X, AlignJustify, Search, PanelLeft, Maximize, Minimize, Headphones, ChevronLeft, ChevronRight, Flame, Users, BookOpen, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeaderPlayer } from "@/components/bible/HeaderPlayer";
import { BIBLE_BOOKS } from "@/lib/constants";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { useGroupUnread } from "@/hooks/use-group-unread";
import { UserMenu } from "@/components/auth/UserMenu";
import { SyncSettings } from "@/components/settings/SyncSettings";
import { BookPicker } from "@/components/bible/BookPicker";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { NotificationCenter } from "@/components/common/NotificationCenter";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { OnboardingManager } from "@/components/onboarding/OnboardingManager";

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
const PlanDailyFlow = dynamic(() => import("@/components/bible/PlanDailyFlow").then(mod => mod.PlanDailyFlow), { ssr: false });
const CrossRefTab = dynamic(() => import("@/components/bible/CrossRefTab").then(mod => mod.CrossRefTab), { ssr: false });
const GroupTab = dynamic(() => import("@/components/bible/GroupTab").then(mod => mod.GroupTab), { ssr: false });
const GroupPlanDailyFlow = dynamic(() => import("@/components/group/GroupPlanDailyFlow").then(mod => mod.GroupPlanDailyFlow), { ssr: false });
const AtlasPanel = dynamic(() => import("@/components/atlas/AtlasPanel").then(mod => mod.default), { ssr: false });

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
              {tab.type === 'read' ? `${tab.book} ${tab.chapter}` : tab.type === 'search' ? `${tab.searchMode === 'ai' ? '✨' : tab.searchMode === 'fuzzy' ? '🌊' : '🔍'} ${tab.query}` : tab.type === 'dashboard' ? '📊 数据看板' : tab.type === 'highlights' ? '🖍️ 我的高亮' : tab.type === 'notes' ? '📝 我的笔记' : tab.type === 'cross-ref' ? '🔗 经文串珠' : tab.type === 'group' ? '👥 小组读经' : tab.type === 'atlas' ? '🗺️ 圣经地图' : tab.type === 'theme-graph' ? '🕸️ 主题网络' : '📅 读经计划'}
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
  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false);
  
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
    isDarkMode, toggleDarkMode,
    chapterSpeechText,
    isMobileSettingsOpen,
    setMobileSettingsOpen,
    streakCount
  } = useBibleStore();

  // 用于追踪 activeTabId 变化，以重置滚动检测状态
  const prevActiveTabIdRef = useRef(activeTabId);

  // 当 activeTabId 变化时，重置 lastScrollY 以确保菜单栏滚动检测正常工作
  useEffect(() => {
    if (activeTabId !== prevActiveTabIdRef.current) {
      lastScrollY.current = 0;
      setIsNavVisible(true);
      prevActiveTabIdRef.current = activeTabId;
    }
  }, [activeTabId]);

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
  const { totalUnread: groupUnread } = useGroupUnread();

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

  // 处理 BookPicker 选择
  const handleBookPickerSelect = useCallback((bookId: string, chapter: number) => {
    router.push(`/?book=${bookId}&chapter=${chapter}`);
  }, [router]);

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
      <MagicBall
        onOpenBookPicker={() => setIsBookPickerOpen(true)}
        isBookPickerOpen={isBookPickerOpen}
        onCloseBookPicker={() => setIsBookPickerOpen(false)}
      />
      <InstallPrompt />
      <FeedbackButton />
      <OnboardingManager />

      {/* Mobile BookPicker - 移动端经文选择器 */}
      <BookPicker
        open={isBookPickerOpen}
        onOpenChange={setIsBookPickerOpen}
        currentBook={activeTab.type === 'read' ? activeTab.book : undefined}
        currentChapter={activeTab.type === 'read' ? activeTab.chapter : undefined}
        onSelect={handleBookPickerSelect}
      /> 

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
              <Settings className="w-5 h-5 text-primary" /> 设置
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            {/* 明暗模式设置 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {isDarkMode ? "深色模式" : "浅色模式"}
              </span>
              <Button variant={isDarkMode ? "default" : "secondary"} size="sm" onClick={toggleDarkMode} className="rounded-full px-4">
                {isDarkMode ? "切换浅色" : "切换深色"}
              </Button>
            </div>

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
          <header className="h-14 flex items-center justify-between px-2 md:px-4 glass-panel rounded-2xl pointer-events-auto shadow-sm">

            {/* 左侧：菜单 + 搜索 */}
            <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
              <Button variant="ghost" size="icon" className="md:hidden text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full h-9 w-9" onClick={() => toggleSidebar()}>
                <Menu className="h-5 w-5" />
              </Button>

              <Button variant="ghost" size="icon" className={cn("hidden md:flex rounded-full hover:bg-black/5 dark:hover:bg-white/5", !isDesktopSidebarOpen ? "text-muted-foreground" : "text-primary")} onClick={toggleDesktopSidebar}>
                <PanelLeft className="h-5 w-5" />
              </Button>

              <Button variant="secondary" size="sm" className="gap-2 hidden md:flex rounded-full bg-secondary/60 hover:bg-secondary border-none ml-1" onClick={() => setIsSearchOpen(true)}>
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground pr-2">搜索经文、问题... ( / 或 Cmd+K )</span>
              </Button>

              <Button variant="ghost" size="icon" className="md:hidden flex text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full h-9 w-9" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            </div>

            {/* 桌面端 Tab 列表 */}
            <div className="hidden md:flex flex-1 items-center overflow-hidden mx-4 mask-linear-fade pl-2 min-w-0">
               <TabList
                 tabs={tabs}
                 activeTabId={activeTabId}
                 onSwitchTab={handleSwitchTab}
                 onCloseTab={closeTab}
                 onAddTab={handleAddTab}
               />
            </div>

            {/* 移动端中间：书卷章节选择器 */}
            <div className="md:hidden flex-1 text-center min-w-0 px-1">
              <button
                onClick={() => {
                  if (activeTab.type === 'read') {
                    setIsBookPickerOpen(true);
                  }
                }}
                className={cn(
                  "inline-flex items-center font-serif font-bold text-base text-foreground tracking-wide max-w-full",
                  activeTab.type === 'read' && "hover:text-primary transition-colors"
                )}
              >
                <span className="truncate">
                  {activeTab.type === 'read' ? (
                    <>{activeTab.book} {activeTab.chapter}</>
                  ) : activeTab.type === 'search' ? "搜索结果" : activeTab.type === 'dashboard' ? "数据看板" : activeTab.type === 'highlights' ? "我的高亮" : activeTab.type === 'notes' ? "我的笔记" : activeTab.type === 'cross-ref' ? "经文串珠" : activeTab.type === 'group' ? "小组读经" : activeTab.type === 'atlas' ? "圣经地图" : "读经计划"}
                </span>
              </button>
            </div>

            {/* 桌面端右侧工具栏 */}
            <div className="hidden sm:flex items-center gap-1 shrink-0">

              {activeTab.type === 'read' && (
                 <HeaderPlayer player={player} text={chapterSpeechText || ""} className="bg-transparent border-none" mode="full" />
              )}

              <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-muted-foreground rounded-full hover:bg-black/5 dark:hover:bg-white/5" title="全屏">
                <Maximize className="h-4 w-4" />
              </Button>

              <div className="mx-1 border-l h-5 border-border/50"></div>

              <Button variant="ghost" size="icon" onClick={toggleLineHeight} className="text-muted-foreground rounded-full hover:bg-black/5 dark:hover:bg-white/5" title="调整行高">
                <AlignJustify className="h-4 w-4" />
              </Button>

              <Button variant={showEnglish ? "secondary" : "ghost"} size="sm" onClick={toggleEnglish} className="gap-1 text-xs font-bold rounded-full">
                <Languages className="h-4 w-4" />{showEnglish ? "中/英" : "中"}
              </Button>

              <div className="w-20 mx-2 group relative flex items-center">
                <Slider value={[fontSize]} min={14} max={32} step={1} onValueChange={(val) => setFontSize(val[0])} className="cursor-pointer" />
              </div>

              <div className="mx-1 border-l h-5 border-border/50"></div>

              {/* 火苗动效 - 桌面端 */}
              {streakCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 dark:bg-orange-950/30 rounded-full border border-orange-100 dark:border-orange-900/50">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{streakCount}</span>
                </div>
              )}

              {/* 小组读经入口 - 桌面端 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const groupTab = tabs.find(t => t.type === 'group');
                  if (groupTab) {
                    setActiveTab(groupTab.id);
                  } else {
                    addTab({ type: 'group' });
                  }
                }}
                className="rounded-full text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 transition-colors relative"
                title="小组读经"
              >
                <Users className="h-5 w-5" />
                {groupUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                    {groupUnread > 99 ? '99+' : groupUnread}
                  </span>
                )}
              </Button>

              {/* 通知中心 */}
              <NotificationCenter />

               <div className="pl-1">
                 <UserMenu />
               </div>
            </div>

            {/* 移动端右侧：精简工具栏 */}
            <div className="flex sm:hidden items-center gap-0.5 shrink-0">
              {/* 朗读播放 - 移动端 */}
              {activeTab.type === 'read' && (
                <HeaderPlayer player={player} text={chapterSpeechText || ""} className="bg-transparent border-none" mode="minimal" />
              )}

              {/* 通知中心 - 移动端 */}
              <NotificationCenter />

              <UserMenu />

              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 h-9 w-9" onClick={() => setMobileSettingsOpen(true)}>
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
          ) : activeTab.type === 'cross-ref' ? (
              <CrossRefTab key={activeTab.id} sourceVerse={activeTab.crossRefSource!} />
          ) : activeTab.type === 'group' ? (
              <GroupTab key={activeTab.id} />
          ) : activeTab.type === 'atlas' ? (
              <div key={activeTab.id} className="h-[calc(100vh-8rem)]">
                <AtlasPanel />
              </div>
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

        {/* 沉浸式读经计划控制器 */}
        <PlanDailyFlow />

        {/* 小组读经计划控制器 */}
        <GroupPlanDailyFlow />

      </div>
    </main>
  );
}
