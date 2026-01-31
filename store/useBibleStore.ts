// store/useBibleStore.ts
import { create } from 'zustand';

// 修改：增加 results 字段缓存搜索结果
export interface Tab {
  id: string;
  type: 'read' | 'search';
  
  // 阅读模式
  book?: string; 
  chapter?: string; 
  
  // 搜索模式
  query?: string;
  searchMode?: 'exact' | 'ai';
  results?: any[]; // <--- 新增：缓存搜索结果数据
  
  scrollTop?: number;
}

interface VerseRef {
  bookName: string;
  chapter: number;
  verse: number;
}

// 新增高亮数据接口
export interface HighlightData {
  bookId: string;
  chapter: number;
  verse: number;
  color: string;
}

interface BibleState {
  // ... (保留原有的 fontSize, sidebarWidth, showEnglish 等所有状态)
  fontSize: number;
  setFontSize: (size: number) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  isSidebarOpen: boolean; 
  toggleSidebar: (open?: boolean) => void;
  isAiOpen: boolean; 
  setAiOpen: (open: boolean) => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  showEnglish: boolean; 
  toggleEnglish: () => void; 
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  selectedVerses: number[];
  aiRequestTrigger: any; 
  tabs: any[]; 
  activeTabId: string;

  // --- 新增：笔记与高亮相关状态 ---
  highlights: HighlightData[]; // 当前章节的高亮列表
  setHighlights: (highlights: HighlightData[]) => void;
  addHighlightLocally: (h: HighlightData) => void; // 乐观更新
  removeHighlightLocally: (bookId: string, chapter: number, verse: number) => void;

  isNoteOpen: boolean;
  noteTargetVerse: { bookId: string, chapter: number, verse: number } | null;
  openNoteEditor: (bookId: string, chapter: number, verse: number) => void;
  closeNoteEditor: () => void;

  // ... (保留原有的 actions: addTab, closeTab 等)
  addTab: (params: any) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateActiveTab: (data: any) => void;
  toggleVerseSelection: (id: number) => void;
  clearSelection: () => void;
  triggerAI: (prompt: string, content: string, context: string, ref: any) => void;
}

export const useBibleStore = create<BibleState>((set) => ({
  // ... (保留原有的初始值)
  fontSize: 18,
  setFontSize: (size) => set({ fontSize: size }),
  lineHeight: 1.8,
  setLineHeight: (height) => set({ lineHeight: height }),
  isSidebarOpen: false,
  toggleSidebar: (open) => set((state) => ({ isSidebarOpen: open !== undefined ? open : !state.isSidebarOpen })),
  isAiOpen: false,
  setAiOpen: (open) => set({ isAiOpen: open }),
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

  // --- 新增：初始化笔记与高亮状态 ---
  highlights: [],
  setHighlights: (highlights) => set({ highlights }),
  
  addHighlightLocally: (h) => set((state) => ({
    // 先移除旧的（如果是改颜色），再加新的
    highlights: [...state.highlights.filter(i => i.verse !== h.verse), h]
  })),
  
  removeHighlightLocally: (bookId, chapter, verse) => set((state) => ({
    highlights: state.highlights.filter(h => !(h.bookId === bookId && h.chapter === chapter && h.verse === verse))
  })),

  isNoteOpen: false,
  noteTargetVerse: null,
  
  openNoteEditor: (bookId, chapter, verse) => set({ 
    isNoteOpen: true, 
    noteTargetVerse: { bookId, chapter, verse } 
  }),
  
  closeNoteEditor: () => set({ isNoteOpen: false, noteTargetVerse: null }),

  // ... (保留原有的 actions 实现)
  addTab: (params) => set((state) => {
    const newId = `tab-${Date.now()}`;
    return { tabs: [...state.tabs, { id: newId, ...params }], activeTabId: newId };
  }),
  closeTab: (id) => set((state) => {
    if (state.tabs.length <= 1) return state; 
    const newTabs = state.tabs.filter(t => t.id !== id);
    let newActiveId = state.activeTabId;
    if (id === state.activeTabId) { newActiveId = newTabs[newTabs.length - 1].id; }
    return { tabs: newTabs, activeTabId: newActiveId };
  }),
  setActiveTab: (id) => set({ activeTabId: id }),
  updateActiveTab: (data) => set((state) => ({ tabs: state.tabs.map(t => t.id === state.activeTabId ? { ...t, ...data } : t )})),
  toggleVerseSelection: (id) => set((state) => {
    const isSelected = state.selectedVerses.includes(id);
    let newSelection;
    if (isSelected) { newSelection = state.selectedVerses.filter(v => v !== id); } 
    else { newSelection = [...state.selectedVerses, id].sort((a, b) => a - b); }
    return { selectedVerses: newSelection };
  }),
  clearSelection: () => set({ selectedVerses: [] }),
  triggerAI: (prompt, content, context, ref) => set({ isAiOpen: true, aiRequestTrigger: { prompt, content, context, ref, timestamp: Date.now() } })
}));