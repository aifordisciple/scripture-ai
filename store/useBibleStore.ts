// store/useBibleStore.ts
import { create } from 'zustand';

// 定义标签页数据结构
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

interface VerseRef {
  bookName: string;
  chapter: number;
  verse: number;
}

interface BibleState {
  fontSize: number;
  setFontSize: (size: number) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  
  isSidebarOpen: boolean; 
  toggleSidebar: (open?: boolean) => void;
  isDesktopSidebarOpen: boolean;
  toggleDesktopSidebar: () => void;

  isAiOpen: boolean; 
  setAiOpen: (open: boolean) => void;
  
  // --- AI 生成状态 ---
  isAiGenerating: boolean;
  setAiGenerating: (isGenerating: boolean) => void;

  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  showEnglish: boolean; 
  toggleEnglish: () => void; 
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  selectedVerses: number[];
  aiRequestTrigger: {
    prompt: string;
    content: string;
    context: string;
    ref: VerseRef;
    timestamp: number;
  } | null;

  tabs: Tab[];
  activeTabId: string;

  highlights: HighlightData[];
  setHighlights: (highlights: HighlightData[]) => void;
  addHighlightLocally: (h: HighlightData) => void;
  removeHighlightLocally: (bookId: string, chapter: number, verse: number) => void;

  isNoteOpen: boolean;
  noteTargetVerse: { bookId: string, chapter: number, verse: number } | null;
  openNoteEditor: (bookId: string, chapter: number, verse: number) => void;
  closeNoteEditor: () => void;

  isShareOpen: boolean;
  shareData: { book: string; chapter: number; verses: number[] } | null;
  openShareModal: (book: string, chapter: number, verses: number[]) => void;
  closeShareModal: () => void;
  
  addTab: (params: { type: 'read' | 'search'; book?: string; chapter?: string; query?: string; searchMode?: 'exact' | 'ai' }) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateActiveTab: (data: Partial<Tab>) => void; 
  toggleVerseSelection: (id: number) => void;
  clearSelection: () => void;
  triggerAI: (prompt: string, content: string, context: string, ref: VerseRef) => void;
}

export const useBibleStore = create<BibleState>((set) => ({
  fontSize: 18,
  setFontSize: (size) => set({ fontSize: size }),
  lineHeight: 1.8,
  setLineHeight: (height) => set({ lineHeight: height }),
  
  isSidebarOpen: false,
  toggleSidebar: (open) => set((state) => ({ isSidebarOpen: open !== undefined ? open : !state.isSidebarOpen })),
  isDesktopSidebarOpen: false,
  toggleDesktopSidebar: () => set((state) => ({ isDesktopSidebarOpen: !state.isDesktopSidebarOpen })),

  isAiOpen: false,
  setAiOpen: (open) => set({ isAiOpen: open }),

  // --- AI 生成状态 (已修正参数名) ---
  isAiGenerating: false,
  setAiGenerating: (isAiGenerating) => set({ isAiGenerating }),

  sidebarWidth: 480,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  showEnglish: false,
  toggleEnglish: () => set((state) => ({ showEnglish: !state.showEnglish })),
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  selectedVerses: [],
  aiRequestTrigger: null,
  tabs: [{ id: 'tab-1', type: 'read', book: 'Gen', chapter: '1' }], 
  activeTabId: 'tab-1',

  highlights: [],
  setHighlights: (highlights) => set({ highlights }),
  addHighlightLocally: (h) => set((state) => ({
    highlights: [...state.highlights.filter(i => i.verse !== h.verse), h]
  })),
  removeHighlightLocally: (bookId, chapter, verse) => set((state) => ({
    highlights: state.highlights.filter(h => !(h.bookId === bookId && h.chapter === chapter && h.verse === verse))
  })),

  isNoteOpen: false,
  noteTargetVerse: null,
  openNoteEditor: (bookId, chapter, verse) => set({ isNoteOpen: true, noteTargetVerse: { bookId, chapter, verse } }),
  closeNoteEditor: () => set({ isNoteOpen: false, noteTargetVerse: null }),

  isShareOpen: false,
  shareData: null,
  openShareModal: (book, chapter, verses) => set({ isShareOpen: true, shareData: { book, chapter, verses } }),
  closeShareModal: () => set({ isShareOpen: false, shareData: null }),

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
  toggleVerseSelection: (id) => set((state) => {
    const isSelected = state.selectedVerses.includes(id);
    let newSelection;
    if (isSelected) { newSelection = state.selectedVerses.filter(v => v !== id); } 
    else { newSelection = [...state.selectedVerses, id].sort((a, b) => a - b); }
    return { selectedVerses: newSelection };
  }),
  clearSelection: () => set({ selectedVerses: [] }),
  
  triggerAI: (prompt, content, context, ref) => set({
    aiRequestTrigger: { prompt, content, context, ref, timestamp: Date.now() }
  })
}));