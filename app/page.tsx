// app/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Sidebar } from "@/components/bible/Sidebar";
import { Slider } from "@/components/ui/slider";
import { useBibleStore } from "@/store/useBibleStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, Settings, Languages, Plus, X, AlignJustify, Search, PanelLeft, Maximize, Minimize, Headphones, ChevronLeft, ChevronRight, Flame, Users, BookOpen, BookOpenCheck, Moon, Sun, ChevronDown, Type, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import { HeaderPlayer } from "@/components/bible/HeaderPlayer";
import { BIBLE_BOOKS, getBookDisplayName } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { useGroupUnread } from "@/hooks/use-group-unread";
import { UserMenu } from "@/components/auth/UserMenu";
import { SyncSettings } from "@/components/settings/SyncSettings";
import { BookPicker } from "@/components/bible/BookPicker";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OnboardingManager } from "@/components/onboarding/OnboardingManager";
import { TabContentRenderer } from "@/components/bible/TabContentRenderer";
import { KeyboardShortcutsDialog } from "@/components/common/KeyboardShortcutsDialog";

// 动态按需加载 - 非Tab内容组件
const AISidebar = dynamic(() => import("@/components/bible/AISidebar").then(mod => mod.AISidebar), { ssr: false });
const MagicBall = dynamic(() => import("@/components/bible/MagicBall").then(mod => mod.MagicBall), { ssr: false });
const SearchDialog = dynamic(() => import("@/components/bible/SearchDialog").then(mod => mod.SearchDialog), { ssr: false });
const NoteEditor = dynamic(() => import("@/components/bible/NoteEditor").then(mod => mod.NoteEditor), { ssr: false });
const ShareCard = dynamic(() => import("@/components/bible/ShareCard").then(mod => mod.ShareCard), { ssr: false });
const AuthDialog = dynamic(() => import("@/components/auth/AuthDialog").then(mod => mod.AuthDialog), { ssr: false });
const PlanDailyFlow = dynamic(() => import("@/components/bible/PlanDailyFlow").then(mod => mod.PlanDailyFlow), { ssr: false });
const GroupPlanDailyFlow = dynamic(() => import("@/components/group/GroupPlanDailyFlow").then(mod => mod.GroupPlanDailyFlow), { ssr: false });

// --- [新增] 独立的带左右滚动按钮的 Tab 标表组件 ---
const TabList = ({ tabs, activeTabId, onSwitchTab, onCloseTab, onAddTab }: any) => {
  const { t, locale } = useTranslation();
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
          <button onClick={(e) => { e.stopPropagation(); scroll('left'); }} className="w-6 h-6 flex items-center justify-center rounded-full bg-background dark:bg-card border border-border dark:border-border text-muted-foreground hover:text-foreground transition-colors active:scale-95">
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
              "flex items-center gap-1.5 px-3 py-1.5 md:py-1 rounded-full text-sm md:text-xs font-semibold cursor-pointer transition-all border whitespace-nowrap min-w-[90px] justify-between group/tab shrink-0 active:scale-95",
              activeTabId === tab.id
                ? "bg-card border-border dark:border-border text-primary"
                : "bg-black/[0.04] dark:bg-white/[0.06] backdrop-blur-lg border-border/60 dark:border-white/10 text-muted-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.1]"
            )}
          >
            <span className="max-w-[120px] truncate select-none">
              {tab.type === 'read' ? `${getBookDisplayName(tab.book, locale)} ${tab.chapter}` : tab.type === 'search' ? `${tab.searchMode === 'ai' ? '✨' : '🔍'} ${tab.query}` : tab.type === 'dashboard' ? `📊 ${t('tabs.dashboard')}` : tab.type === 'highlights' ? `🖍️ ${t('tabs.highlights')}` : tab.type === 'notes' ? `📝 ${t('tabs.notes')}` : tab.type === 'cross-ref' ? `🔗 ${t('tabs.crossref')}` : tab.type === 'group' ? `👥 ${t('tabs.group')}` : tab.type === 'atlas' ? `🗺️ ${t('tabs.atlas')}` : tab.type === 'insights' ? `⭐ ${t('tabs.insights')}` : tab.type === 'sermon' ? `📝 ${t('sermon.title')}` : tab.type === 'theme-graph' ? `🕸️ ${t('tabs.theme')}` : tab.type === 'search-history' ? `🔍 ${t('tabs.searchHistory')}` : `📅 ${t('tabs.plan')}`}
            </span>
            <X
              className={cn(
                "w-3.5 h-3.5 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors flex-shrink-0 p-0.5",
                activeTabId === tab.id ? "opacity-60 hover:opacity-100" : "opacity-40 hover:opacity-100"
              )}
              onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
            />
          </div>
        ))}
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 ml-1 active:scale-95" onClick={onAddTab}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {canScrollRight && (
        <div className="absolute right-0 z-10 h-full flex items-center pl-4 bg-gradient-to-l from-background via-background to-transparent">
          <button onClick={(e) => { e.stopPropagation(); scroll('right'); }} className="w-6 h-6 flex items-center justify-center rounded-full bg-background dark:bg-card border border-border dark:border-border text-muted-foreground hover:text-foreground transition-colors active:scale-95">
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
  const { t } = useTranslation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false); // [新增] 设置下拉菜单状态
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false); // 快捷键帮助对话框
  
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  const {
    fontSize, setFontSize,
    isSidebarOpen, toggleSidebar,
    isDesktopSidebarOpen, toggleDesktopSidebar,
    isAiOpen, setAiOpen,
    showDualVersion, toggleDualVersion,
    locale, setLocale, bibleVersion, setBibleVersion,
    lineHeight, setLineHeight,
    tabs, activeTabId, setActiveTab, addTab, closeTab, updateActiveTab,
    sidebarWidth,
    isDarkMode, toggleDarkMode,
    chapterSpeechText,
    isMobileSettingsOpen,
    setMobileSettingsOpen,
    streakCount,
    aiMode, // [P0优化] AI模式状态
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

  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(isDarkMode ? "dark" : "light");
  }, [isDarkMode, setTheme]);

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

      // [P0优化] Alt+1/2/3/4 切换AI模式
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const { setAiMode } = useBibleStore.getState();
        switch (e.key) {
          case '1':
            e.preventDefault();
            setAiMode('general');
            break;
          case '2':
            e.preventDefault();
            setAiMode('tutor');
            break;
          case '3':
            e.preventDefault();
            setAiMode('sermon');
            break;
          case '4':
            e.preventDefault();
            setAiMode('study-guide');
            break;
        }
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
          case '?':
            e.preventDefault();
            setShowShortcutsDialog(true);
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
    else setLineHeight(1.4);
  };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } 
    else { if (document.exitFullscreen) { document.exitFullscreen(); } }
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-background relative transition-colors duration-500">
      <AuthDialog />
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <KeyboardShortcutsDialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog} />
      <NoteEditor />
      <ShareCard />
      <MagicBall
        onOpenBookPicker={() => setIsBookPickerOpen(true)}
        isBookPickerOpen={isBookPickerOpen}
        onCloseBookPicker={() => setIsBookPickerOpen(false)}
      />
      <InstallPrompt />
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
        <aside className="hidden md:block w-72 h-full border-r bg-card shrink-0 transition-all duration-300 z-20">
          <Sidebar />
        </aside>
      )}

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
        <SheetContent side="left" className="p-0 w-80 bg-card border-r-0">
          <SheetTitle className="sr-only">{t('reader.sidebar.title')}</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Mobile Settings Sheet */}
      <Sheet open={isMobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
        <SheetContent side="bottom" className="bg-card border-t-0 pb-6 rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-4 pt-2">
            <SheetTitle className="text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> {t('settings.title')}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            {/* 明暗模式设置 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
                {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {isDarkMode ? t('settings.darkMode') : t('settings.lightMode')}
              </span>
              <Button variant={isDarkMode ? "default" : "secondary"} size="sm" onClick={toggleDarkMode} className="rounded-full px-4 active:scale-95">
                {isDarkMode ? t('settings.toggleLight') : t('settings.toggleDark')}
              </Button>
            </div>

            {activeTab.type === 'read' && (
              <div className="bg-secondary/50 p-4 rounded-xl border border-border/50">
                 <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
                    <Headphones className="w-4 h-4 text-primary" /> {t('settings.tts')}
                 </div>
                 <HeaderPlayer player={player} text={chapterSpeechText || ""} mode="full" className="bg-background border border-border shadow-sm w-full rounded-lg" />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground font-semibold"><span>{t('settings.fontSize')}</span><span>{fontSize}px</span></div>
              <Slider value={[fontSize]} min={14} max={32} step={1} onValueChange={(val) => setFontSize(val[0])} className="py-2" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-semibold">{t('settings.lineHeight')}</span>
              <SegmentedControl
                options={[
                  { label: t('common.compact'), value: '1.4' },
                  { label: t('common.standard'), value: '1.8' },
                  { label: t('common.loose'), value: '2.2' },
                ]}
                value={String(lineHeight)}
                onChange={(v) => setLineHeight(Number(v))}
              />
            </div>
                        <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-semibold">{t('settings.bilingual')}</span>
              <Button variant={showDualVersion ? "default" : "secondary"} size="sm" onClick={toggleDualVersion} className="rounded-full px-4 active:scale-95">
                {showDualVersion ? t('settings.enabled') : t('settings.disabled')}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
                <Languages className="w-4 h-4" />
                {t('settings.language')}
              </span>
              <div className="flex bg-secondary/50 p-1 rounded-lg">
                <button
                  onClick={() => setLocale('zh')}
                  className={cn("px-3 py-1 text-xs rounded-md transition-all active:scale-95", locale === 'zh' ? "bg-card text-foreground" : "text-muted-foreground")}
                >
                  中文
                </button>
                <button
                  onClick={() => {
                    setLocale('en');
                    if (!showDualVersion) toggleDualVersion();
                  }}
                  className={cn("px-3 py-1 text-xs rounded-md transition-all active:scale-95", locale === 'en' ? "bg-card text-foreground" : "text-muted-foreground")}
                >
                  English
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-semibold">{t('settings.bibleVersion')}</span>
              <div className="flex bg-secondary/50 p-1 rounded-lg">
                <button
                  onClick={() => setBibleVersion('CUV')}
                  className={cn("px-3 py-1 text-xs rounded-md transition-all active:scale-95", bibleVersion === 'CUV' ? "bg-card text-foreground" : "text-muted-foreground")}
                >
                  {t('common.bibleVersionCUV')}
                </button>
                <button
                  onClick={() => setBibleVersion('KJV')}
                  className={cn("px-3 py-1 text-xs rounded-md transition-all active:scale-95", bibleVersion === 'KJV' ? "bg-card text-foreground" : "text-muted-foreground")}
                >
                  KJV
                </button>
              </div>
            </div>

            <div className="pt-2">
              <SyncSettings />
            </div>
          </div>

          <div className="mt-8 mb-4">
            <Button
              className="w-full rounded-full font-semibold h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground active:scale-[0.98]"
              onClick={() => setMobileSettingsOpen(false)}
            >
              {t('settings.closeAndFinish')}
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
        
        {/* Header - Single-line Frosted Glass Bar */}
        <div
          className={cn(
            "absolute top-1.5 left-2 right-4 z-30 pointer-events-none transition-transform duration-300 ease-in-out",
            isNavVisible ? "translate-y-0 opacity-100" : "-translate-y-[120%] opacity-0"
          )}
        >
          <div className="pointer-events-auto rounded-xl bg-card/40 dark:bg-card/40 backdrop-blur-xl backdrop-saturate-[180%] shadow-sm h-10 flex items-center justify-between px-2 md:px-3 gap-1">
            {/* Left side: mobile hamburger / desktop sidebar toggle + search */}
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="md:hidden text-foreground/80 hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/10 rounded-full h-8 w-8 active:scale-95" onClick={() => toggleSidebar()}>
                <Menu className="h-4 w-4" />
              </Button>
              {/* Mobile: search button */}
              <Button variant="ghost" size="icon" className="md:hidden text-foreground/80 hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/10 rounded-full h-8 w-8 active:scale-95" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-[18px] w-[18px]" />
              </Button>
              <Button variant="ghost" size="icon" className={cn("hidden md:flex rounded-full text-foreground/80 hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/10 active:scale-95", !isDesktopSidebarOpen ? "text-muted-foreground" : "text-foreground")} onClick={toggleDesktopSidebar}>
                <PanelLeft className="h-4 w-4" />
              </Button>
              {/* Desktop: search button */}
              <button
                className="hidden md:flex items-center gap-1.5 rounded-full bg-black/[0.04] dark:bg-white/10 hover:bg-black/[0.07] dark:hover:bg-white/15 px-3 py-1 text-xs text-foreground/60 active:scale-95 transition-colors pointer-events-auto"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-3.5 h-3.5" />
                <span>{t('reader.searchPlaceholder')}</span>
              </button>
            </div>

            {/* Mobile: Book/chapter name */}
            <div className="md:hidden flex-1 text-center min-w-0 px-1">
              <button
                onClick={() => {
                  if (activeTab.type === 'read') {
                    setIsBookPickerOpen(true);
                  }
                }}
                className={cn(
                  "inline-flex items-center text-[17px] font-semibold tracking-[0.231px] text-foreground max-w-full active:scale-95",
                  activeTab.type === 'read' && "hover:text-foreground/80 transition-colors"
                )}
              >
                <span className="truncate">
                  {activeTab.type === 'read' ? (
                    <>{activeTab.book} {activeTab.chapter}</>
                  ) : activeTab.type === 'search' ? t('tabs.search') : activeTab.type === 'dashboard' ? t('tabs.dashboard') : activeTab.type === 'highlights' ? t('tabs.highlights') : activeTab.type === 'notes' ? t('tabs.notes') : activeTab.type === 'cross-ref' ? t('tabs.crossref') : activeTab.type === 'group' ? t('tabs.group') : activeTab.type === 'atlas' ? t('tabs.atlas') : activeTab.type === 'insights' ? t('tabs.insights') : activeTab.type === 'search-history' ? `🔍 ${t('tabs.searchHistory')}` : t('tabs.plan')}
                </span>
              </button>
            </div>

            {/* Center: desktop tab pills */}
            <div className="hidden md:flex flex-1 items-center overflow-hidden mx-2 mask-linear-fade pl-2 min-w-0">
               <TabList
                 tabs={tabs}
                 activeTabId={activeTabId}
                 onSwitchTab={handleSwitchTab}
                 onCloseTab={closeTab}
                 onAddTab={handleAddTab}
               />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Mobile: TTS play button */}
              {activeTab.type === 'read' && (
                <HeaderPlayer player={player} text={chapterSpeechText || ""} className="bg-transparent border-none md:hidden" mode="minimal" />
              )}

              {/* Desktop: right-side tools */}
              <div className="hidden sm:flex items-center gap-0.5">
                {activeTab.type === 'read' && (
                   <HeaderPlayer player={player} text={chapterSpeechText || ""} className="bg-transparent border-none" mode="full" />
                )}

                {/* Reading settings dropdown */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                    className={cn(
                      "text-muted-foreground hover:text-foreground rounded-full hover:bg-black/[0.06] dark:hover:bg-white/10 active:scale-95 h-7 w-7",
                      showSettingsDropdown && "bg-black/[0.06] dark:bg-white/10"
                    )}
                    title={t('settings.readingSettings')}
                  >
                    <Settings className="h-[18px] w-[18px]" />
                  </Button>

                  {/* Settings dropdown panel */}
                  {showSettingsDropdown && (
                    <>
                      <div className="fixed inset-0 z-[100] pointer-events-auto" onClick={() => setShowSettingsDropdown(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-card/80 backdrop-blur-[20px] backdrop-saturate-[180%] border border-border/50 dark:border-border rounded-lg z-[100] p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                            {isDarkMode ? t('settings.darkMode') : t('settings.lightMode')}
                          </span>
                          <Button variant={isDarkMode ? "default" : "secondary"} size="sm" onClick={toggleDarkMode} className="rounded-full px-3 h-7 text-xs active:scale-95">
                            {isDarkMode ? t('settings.toggleLight') : t('settings.toggleDark')}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                            {t('reader.fullscreen')}
                          </span>
                          <Button variant={isFullscreen ? "default" : "secondary"} size="sm" onClick={toggleFullscreen} className="rounded-full px-3 h-7 text-xs active:scale-95">
                            {isFullscreen ? t('settings.exitFullscreen') : t('settings.enterFullscreen')}
                          </Button>
                        </div>
                        <div className="border-t border-border/50" />
                        <div className="space-y-1.5">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <AlignJustify className="w-4 h-4" />
                            {t('settings.lineHeight')}
                          </span>
                          <div className="flex bg-secondary/50 p-1 rounded-lg">
                            {[1.4, 1.8, 2.2].map(lh => (
                              <button key={lh} onClick={() => setLineHeight(lh)} className={cn("flex-1 px-2 py-1 text-xs rounded-md transition-all active:scale-95", lineHeight === lh ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground")}>
                                {lh === 1.4 ? t('common.compact') : lh === 1.8 ? t('common.standard') : t('common.loose')}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <Type className="w-4 h-4" />
                              {t('settings.fontSize')}
                            </span>
                            <span className="text-xs text-muted-foreground font-semibold">{fontSize}px</span>
                          </div>
                          <Slider value={[fontSize]} min={14} max={32} step={1} onValueChange={(val) => setFontSize(val[0])} className="cursor-pointer" />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Button variant="ghost" size="sm" onClick={() => setBibleVersion(bibleVersion === 'CUV' ? 'KJV' : 'CUV')} className="gap-1 text-xs font-semibold rounded-full text-foreground/60 hover:text-foreground active:scale-95 h-7 px-2">
                  <BookOpenCheck className="h-4 w-4" />{bibleVersion}
                </Button>
              </div>

              {/* Divider between tool groups */}
              <div className="hidden sm:block h-5 w-px bg-foreground/10 dark:bg-white/15" />

              <div className="hidden sm:flex items-center gap-0.5">
                {streakCount > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full">
                    <Flame className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">{streakCount}</span>
                  </div>
                )}

                <Button variant="ghost" size="icon" onClick={() => {
                  const planTab = tabs.find(t => t.type === 'plan');
                  if (planTab) { setActiveTab(planTab.id); } else { addTab({ type: 'plan' }); }
                }} className="rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors active:scale-95 h-7 w-7" title={t('tabs.plan')}>
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile: settings */}
              <Button variant="ghost" size="icon" className="md:hidden rounded-full text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/10 h-7 w-7 active:scale-95" onClick={() => setMobileSettingsOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>

              {/* User menu */}
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div id="reader-scroll-container" onScroll={handleScroll} className="flex-1 overflow-y-auto scroll-smooth pt-12 md:pt-12 pb-4 relative z-0">
          <TabContentRenderer
            tabs={tabs}
            activeTabId={activeTabId}
            chapterSpeechText={chapterSpeechText}
            updateActiveTab={updateActiveTab}
          />
        </div>

        {/* Mobile Tab Bar - 向下滚动自动隐藏，向上滚动自动显示（与菜单栏一致） */}
        {activeTab?.type !== 'sermon' && !isAiOpen && (
        <div
          className={cn(
            "md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--glass-bg-light)] dark:bg-[var(--glass-bg-dark)] backdrop-blur-[20px] backdrop-saturate-[180%] border-t border-border flex items-center px-2 z-50 pb-safe transition-transform duration-300 ease-in-out",
            isNavVisible ? "translate-y-0" : "translate-y-full"
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
        )}

        {/* 沉浸式读经计划控制器 */}
        <PlanDailyFlow />

        {/* 小组读经计划控制器 */}
        <GroupPlanDailyFlow />

      </div>
    </main>
  );
}
