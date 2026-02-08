// store/useBibleStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. 定义数据结构
// ... (保持不变)
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

export interface NoteData {
  id: string; 
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
// ... (AuthSlice 保持不变)
interface AuthSlice {
  isAuthOpen: boolean;
  setAuthOpen: (open: boolean) => void;
}

interface BibleSlice {
  // ... (原有其他状态保持不变)
  fontSize: number;
  setFontSize: (size: number) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  showEnglish: boolean; 
  toggleEnglish: () => void; 
  
  isSidebarOpen: boolean; 
  toggleSidebar: (open?: boolean) => void;
  isDesktopSidebarOpen: boolean;
  toggleDesktopSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  isMobileSettingsOpen: boolean;
  setMobileSettingsOpen: (open: boolean) => void;

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

  tabs: Tab[];
  activeTabId: string;
  addTab: (params: { type: 'read' | 'search'; book?: string; chapter?: string; query?: string; searchMode?: 'exact' | 'ai' }) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateActiveTab: (data: Partial<Tab>) => void;

  selectedVerses: number[];
  toggleVerseSelection: (id: number) => void;
  clearSelection: () => void;
  
  highlights: HighlightData[];
  setHighlights: (highlights: HighlightData[]) => void;
  addHighlightLocally: (h: HighlightData) => void;
  removeHighlightLocally: (bookId: string, chapter: number, verse: number) => void;

  notes: NoteData[];
  addNote: (note: NoteData) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  
  isNoteOpen: boolean;
  noteTargetVerse: { bookId: string, chapter: number, verse: number } | null;
  openNoteEditor: (bookId: string, chapter: number, verse: number) => void;
  closeNoteEditor: () => void;

  isShareOpen: boolean;
  shareData: { book: string; chapter: number; verses: number[] } | null;
  openShareModal: (book: string, chapter: number, verses: number[]) => void;
  closeShareModal: () => void;

  chapterSpeechText: string;
  setChapterSpeechText: (text: string) => void;

  setAllUserData: (data: { settings?: any, highlights?: any[], notes?: any[] }) => void;

  // [新增] 滚动目标节
  scrollToVerse: number | null;
  setScrollToVerse: (verse: number | null) => void;
}

type BibleState = BibleSlice & AuthSlice;

// 3. 实现 Store
export const useBibleStore = create<BibleState>()(
  persist(
    (set, get) => ({
      // ... (其他初始状态保持不变)
      isAuthOpen: false,
      setAuthOpen: (open) => set({ isAuthOpen: open }),

      fontSize: 18,
      setFontSize: (size) => set({ fontSize: size }),
      lineHeight: 1.8,
      setLineHeight: (height) => set({ lineHeight: height }),
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      showEnglish: false,
      toggleEnglish: () => set((state) => ({ showEnglish: !state.showEnglish })),

      isSidebarOpen: false,
      toggleSidebar: (open) => set((state) => ({ isSidebarOpen: open !== undefined ? open : !state.isSidebarOpen })),
      isDesktopSidebarOpen: false,
      toggleDesktopSidebar: () => set((state) => ({ isDesktopSidebarOpen: !state.isDesktopSidebarOpen })),
      sidebarWidth: 480,
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      isMobileSettingsOpen: false,
      setMobileSettingsOpen: (open) => set({ isMobileSettingsOpen: open }),

      isAiOpen: false,
      setAiOpen: (open) => set({ isAiOpen: open }),
      isAiGenerating: false,
      setAiGenerating: (isAiGenerating) => set({ isAiGenerating }),
      aiRequestTrigger: null,
      triggerAI: (prompt, content, context, ref) => set({
        aiRequestTrigger: { prompt, content, context, ref, timestamp: Date.now() }
      }),

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

      isShareOpen: false,
      shareData: null,
      openShareModal: (book, chapter, verses) => set({ isShareOpen: true, shareData: { book, chapter, verses } }),
      closeShareModal: () => set({ isShareOpen: false, shareData: null }),

      chapterSpeechText: "",
      setChapterSpeechText: (text) => set({ chapterSpeechText: text }),

      setAllUserData: (data) => {
        const updates: any = {};
        if (data.settings) {
          updates.fontSize = data.settings.fontSize;
          updates.lineHeight = data.settings.lineHeight;
          updates.isDarkMode = data.settings.isDarkMode;
          updates.showEnglish = data.settings.showEnglish;
          if (data.settings.lastBook && data.settings.lastChapter) {
             const tabs = get().tabs;
             if (tabs.length > 0 && tabs[0].type === 'read') {
                 const newTabs = [...tabs];
                 newTabs[0] = { ...newTabs[0], book: data.settings.lastBook, chapter: data.settings.lastChapter.toString() };
                 updates.tabs = newTabs;
             }
          }
        }
        if (data.highlights) {
          updates.highlights = data.highlights.map((h: any) => ({ bookId: h.bookId, chapter: h.chapter, verse: h.verse, color: h.color }));
        }
        if (data.notes) {
          updates.notes = data.notes.map((n: any) => ({ id: n.id, bookId: n.bookId, chapter: n.chapter, verse: n.verse, content: n.content }));
        }
        set(updates);
      },

      // [新增] 实现
      scrollToVerse: null,
      setScrollToVerse: (verse) => set({ scrollToVerse: verse }),
    }),
    {
      name: 'bible-storage', 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ...state,
        isAuthOpen: false,
        isShareOpen: false,
        isNoteOpen: false,
        isAiGenerating: false,
        isMobileSettingsOpen: false,
        isAiOpen: false,
        aiRequestTrigger: null,
        chapterSpeechText: "", 
        scrollToVerse: null, // 不持久化滚动位置
      }),
    }
  )
);