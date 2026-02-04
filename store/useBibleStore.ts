// store/useBibleStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. 定义数据结构
// --------------------------------------------------

export interface Tab {
  id: string;
  type: 'read' | 'search';
  book?: string; 
  chapter?: string; 
  query?: string;
  searchMode?: 'exact' | 'ai';
  results?: any[]; 
  scrollTop?: number;
}

export interface HighlightData {
  bookId: string;
  chapter: number;
  verse: number;
  color: string;
}

// 对应 Prisma Note 模型的简化版
export interface NoteData {
  id: string; // 可能是临时ID或数据库ID
  bookId: string;
  chapter: number;
  verse: number;
  content: string;
}

interface VerseRef {
  bookName: string;
  chapter: number;
  verse: number;
}

// 2. 定义 Store 接口
// --------------------------------------------------

// 认证相关
interface AuthSlice {
  isAuthOpen: boolean;
  setAuthOpen: (open: boolean) => void;
}

// 核心业务相关
interface BibleSlice {
  // --- 阅读器设置 ---
  fontSize: number;
  setFontSize: (size: number) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  showEnglish: boolean; 
  toggleEnglish: () => void; 
  
  // --- 界面状态 ---
  isSidebarOpen: boolean; 
  toggleSidebar: (open?: boolean) => void;
  isDesktopSidebarOpen: boolean;
  toggleDesktopSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  isMobileSettingsOpen: boolean;
  setMobileSettingsOpen: (open: boolean) => void;

  // --- AI 状态 ---
  isAiOpen: boolean; 
  setAiOpen: (open: boolean) => void;
  isAiGenerating: boolean;
  setAiGenerating: (isGenerating: boolean) => void;
  aiRequestTrigger: {
    prompt: string;
    content: string;
    context: string;
    ref: VerseRef;
    timestamp: number;
  } | null;
  triggerAI: (prompt: string, content: string, context: string, ref: VerseRef) => void;

  // --- 标签页系统 ---
  tabs: Tab[];
  activeTabId: string;
  addTab: (params: { type: 'read' | 'search'; book?: string; chapter?: string; query?: string; searchMode?: 'exact' | 'ai' }) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateActiveTab: (data: Partial<Tab>) => void;

  // --- 选中与高亮 ---
  selectedVerses: number[];
  toggleVerseSelection: (id: number) => void;
  clearSelection: () => void;
  
  highlights: HighlightData[];
  setHighlights: (highlights: HighlightData[]) => void;
  addHighlightLocally: (h: HighlightData) => void;
  removeHighlightLocally: (bookId: string, chapter: number, verse: number) => void;

  // --- 笔记系统 ---
  notes: NoteData[];
  addNote: (note: NoteData) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  
  isNoteOpen: boolean;
  noteTargetVerse: { bookId: string, chapter: number, verse: number } | null;
  openNoteEditor: (bookId: string, chapter: number, verse: number) => void;
  closeNoteEditor: () => void;

  // --- 分享系统 ---
  isShareOpen: boolean;
  shareData: { book: string; chapter: number; verses: number[] } | null;
  openShareModal: (book: string, chapter: number, verses: number[]) => void;
  closeShareModal: () => void;

  // --- 语音播放 ---
  chapterSpeechText: string;
  setChapterSpeechText: (text: string) => void;

  // --- 数据同步 (用于从服务器批量更新) ---
  setAllUserData: (data: { settings?: any, highlights?: any[], notes?: any[] }) => void;
}

// 合并所有 Slice
type BibleState = BibleSlice & AuthSlice;

// 3. 实现 Store
// --------------------------------------------------

export const useBibleStore = create<BibleState>()(
  persist(
    (set, get) => ({
      // === 认证 ===
      isAuthOpen: false,
      setAuthOpen: (open) => set({ isAuthOpen: open }),

      // === 设置 ===
      fontSize: 18,
      setFontSize: (size) => set({ fontSize: size }),
      lineHeight: 1.8,
      setLineHeight: (height) => set({ lineHeight: height }),
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      showEnglish: false,
      toggleEnglish: () => set((state) => ({ showEnglish: !state.showEnglish })),

      // === 界面 ===
      isSidebarOpen: false,
      toggleSidebar: (open) => set((state) => ({ isSidebarOpen: open !== undefined ? open : !state.isSidebarOpen })),
      isDesktopSidebarOpen: false,
      toggleDesktopSidebar: () => set((state) => ({ isDesktopSidebarOpen: !state.isDesktopSidebarOpen })),
      sidebarWidth: 480,
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      isMobileSettingsOpen: false,
      setMobileSettingsOpen: (open) => set({ isMobileSettingsOpen: open }),

      // === AI ===
      isAiOpen: false,
      setAiOpen: (open) => set({ isAiOpen: open }),
      isAiGenerating: false,
      setAiGenerating: (isAiGenerating) => set({ isAiGenerating }),
      aiRequestTrigger: null,
      triggerAI: (prompt, content, context, ref) => set({
        aiRequestTrigger: { prompt, content, context, ref, timestamp: Date.now() }
      }),

      // === 标签页 ===
      tabs: [{ id: 'tab-1', type: 'read', book: 'Gen', chapter: '1' }],
      activeTabId: 'tab-1',
      addTab: ({ type, book = 'Gen', chapter = '1', query, searchMode }) => set((state) => {
        const newId = `tab-${Date.now()}`;
        const newTab: Tab = { id: newId, type };
        if (type === 'read') {
            newTab.book = book;
            newTab.chapter = chapter;
        } else {
            newTab.query = query;
            newTab.searchMode = searchMode;
        }
        return { tabs: [...state.tabs, newTab], activeTabId: newId };
      }),
      closeTab: (id) => set((state) => {
        if (state.tabs.length <= 1) return state; 
        const newTabs = state.tabs.filter(t => t.id !== id);
        let newActiveId = state.activeTabId;
        if (id === state.activeTabId) { newActiveId = newTabs[newTabs.length - 1].id; }
        return { tabs: newTabs, activeTabId: newActiveId };
      }),
      setActiveTab: (id) => set({ activeTabId: id }),
      updateActiveTab: (data) => set((state) => ({
        tabs: state.tabs.map(t => t.id === state.activeTabId ? { ...t, ...data } : t )
      })),

      // === 选择与高亮 ===
      selectedVerses: [],
      toggleVerseSelection: (id) => set((state) => {
        const isSelected = state.selectedVerses.includes(id);
        let newSelection;
        if (isSelected) { newSelection = state.selectedVerses.filter(v => v !== id); } 
        else { newSelection = [...state.selectedVerses, id].sort((a, b) => a - b); }
        return { selectedVerses: newSelection };
      }),
      clearSelection: () => set({ selectedVerses: [] }),

      highlights: [],
      setHighlights: (highlights) => set({ highlights }),
      addHighlightLocally: (h) => set((state) => ({
        highlights: [...state.highlights.filter(i => !(i.bookId === h.bookId && i.chapter === h.chapter && i.verse === h.verse)), h]
      })),
      removeHighlightLocally: (bookId, chapter, verse) => set((state) => ({
        highlights: state.highlights.filter(h => !(h.bookId === bookId && h.chapter === chapter && h.verse === verse))
      })),

      // === 笔记 ===
      notes: [],
      addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
      updateNote: (id, content) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, content } : n)
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(n => n.id !== id)
      })),
      
      isNoteOpen: false,
      noteTargetVerse: null,
      openNoteEditor: (bookId, chapter, verse) => set({ isNoteOpen: true, noteTargetVerse: { bookId, chapter, verse } }),
      closeNoteEditor: () => set({ isNoteOpen: false, noteTargetVerse: null }),

      // === 分享 ===
      isShareOpen: false,
      shareData: null,
      openShareModal: (book, chapter, verses) => set({ isShareOpen: true, shareData: { book, chapter, verses } }),
      closeShareModal: () => set({ isShareOpen: false, shareData: null }),

      // === 语音 ===
      chapterSpeechText: "",
      setChapterSpeechText: (text) => set({ chapterSpeechText: text }),

      // === 数据同步 (从服务器批量加载) ===
      setAllUserData: (data) => {
        const updates: any = {};
        
        if (data.settings) {
          updates.fontSize = data.settings.fontSize;
          updates.lineHeight = data.settings.lineHeight;
          updates.isDarkMode = data.settings.isDarkMode;
          updates.showEnglish = data.settings.showEnglish;
          
          // 恢复上次阅读位置
          if (data.settings.lastBook && data.settings.lastChapter) {
             const tabs = get().tabs;
             if (tabs.length > 0 && tabs[0].type === 'read') {
                 const newTabs = [...tabs];
                 newTabs[0] = { 
                    ...newTabs[0], 
                    book: data.settings.lastBook, 
                    chapter: data.settings.lastChapter.toString() 
                 };
                 updates.tabs = newTabs;
             }
          }
        }
        
        if (data.highlights) {
          updates.highlights = data.highlights.map((h: any) => ({
              bookId: h.bookId,
              chapter: h.chapter,
              verse: h.verse,
              color: h.color
          }));
        }
        
        if (data.notes) {
          updates.notes = data.notes.map((n: any) => ({
              id: n.id,
              bookId: n.bookId,
              chapter: n.chapter,
              verse: n.verse,
              content: n.content
          }));
        }

        set(updates);
      },
    }),
    {
      name: 'bible-storage', 
      storage: createJSONStorage(() => localStorage),
      // [关键修改] 在 partialize 中将 isAiOpen 设置为 false
      // 这样每次刷新或重新加载页面时，AI 侧边栏默认是关闭的
      partialize: (state) => ({
        ...state,
        isAuthOpen: false,
        isShareOpen: false,
        isNoteOpen: false,
        isAiGenerating: false,
        isMobileSettingsOpen: false,
        isAiOpen: false, // <--- 强制不持久化开启状态
        aiRequestTrigger: null,
        chapterSpeechText: "", 
      }),
    }
  )
);