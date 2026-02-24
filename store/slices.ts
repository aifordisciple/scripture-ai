// store/slices.ts
import { StateCreator } from 'zustand';
import { StoreState, UISlice, ReaderSlice, AISlice, UserDataSlice, Tab, SyncSlice } from './types';

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set) => ({
  isAuthOpen: false,
  setAuthOpen: (open) => set({ isAuthOpen: open }),
  isSidebarOpen: false,
  toggleSidebar: (open) => set((state) => ({ isSidebarOpen: open !== undefined ? open : !state.isSidebarOpen })),
  isDesktopSidebarOpen: false,
  toggleDesktopSidebar: () => set((state) => ({ isDesktopSidebarOpen: !state.isDesktopSidebarOpen })),
  sidebarWidth: 480,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  isMobileSettingsOpen: false,
  setMobileSettingsOpen: (open) => set({ isMobileSettingsOpen: open }),
  isShareOpen: false,
  shareData: null,
  openShareModal: (book, chapter, verses) => set({ isShareOpen: true, shareData: { book, chapter, verses } }),
  closeShareModal: () => set({ isShareOpen: false, shareData: null }),
  isDashboardOpen: false,
  setDashboardOpen: (open) => set({ isDashboardOpen: open }),
});

export const createReaderSlice: StateCreator<StoreState, [], [], ReaderSlice> = (set) => ({
  fontSize: 18,
  setFontSize: (size) => set({ fontSize: size }),
  lineHeight: 1.8,
  setLineHeight: (height) => set({ lineHeight: height }),
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  showEnglish: false,
  toggleEnglish: () => set((state) => ({ showEnglish: !state.showEnglish })),
  
  tabs: [{ id: 'tab-1', type: 'read', book: 'Gen', chapter: '1' }],
  activeTabId: 'tab-1',
  addTab: ({ type, book = 'Gen', chapter = '1', query, searchMode }) => set((state) => {
      const newId = `tab-${Date.now()}`;
      const newTab: Tab = { id: newId, type };
      if (type === 'read') { newTab.book = book; newTab.chapter = chapter; } 
      else if (type === 'search') { newTab.query = query; newTab.searchMode = searchMode; }
      // dashboard、highlights 和 notes 都不需要额外参数
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
  
  chapterSpeechText: "",
  setChapterSpeechText: (text) => set({ chapterSpeechText: text }),
  scrollToVerse: null,
  setScrollToVerse: (verse) => set({ scrollToVerse: verse }),
});

export const createAISlice: StateCreator<StoreState, [], [], AISlice> = (set) => ({
  isAiOpen: false,
  setAiOpen: (open) => set({ isAiOpen: open }),
  isAiGenerating: false,
  setAiGenerating: (isAiGenerating) => set({ isAiGenerating }),
  aiRequestTrigger: null,
  triggerAI: (prompt, content, context, ref) => set({
    aiRequestTrigger: { prompt, content, context, ref, timestamp: Date.now() }
  }),
});

export const createUserDataSlice: StateCreator<StoreState, [], [], UserDataSlice> = (set, get) => ({
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
    highlights: [...state.highlights.filter(i => !(i.bookId === h.bookId && i.chapter === h.chapter && i.verse === h.verse)), { 
      ...h, 
      updatedAt: h.updatedAt || new Date().toISOString() 
    }]
  })),
  removeHighlightLocally: (bookId, chapter, verse) => set((state) => ({
    highlights: state.highlights.filter(h => !(h.bookId === bookId && h.chapter === chapter && h.verse === verse))
  })),

  notes: [],
  addNote: (note) => set((state) => ({ 
    notes: [...state.notes, { ...note, updatedAt: note.updatedAt || new Date().toISOString() }] 
  })),
  updateNote: (id, content) => set((state) => ({
    notes: state.notes.map(n => n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n)
  })),
  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter(n => n.id !== id)
  })),
  
  isNoteOpen: false,
  noteTargetVerse: null,
  openNoteEditor: (bookId, chapter, verse) => set({ isNoteOpen: true, noteTargetVerse: { bookId, chapter, verse } }),
  closeNoteEditor: () => set({ isNoteOpen: false, noteTargetVerse: null }),

  setAllUserData: (data) => {
    const updates: Partial<StoreState> = {};
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
    if (data.highlights) updates.highlights = data.highlights;
    if (data.notes) updates.notes = data.notes;
    set(updates);
  },

  interactions: [],
  recordInteraction: (bookId, chapter, weight = 1) => set((state) => {
    const existingIndex = state.interactions.findIndex(i => i.bookId === bookId && i.chapter === chapter);
    if (existingIndex >= 0) {
      const newInteractions = [...state.interactions];
      newInteractions[existingIndex].count += weight;
      return { interactions: newInteractions };
    } else {
      return { interactions: [...state.interactions, { bookId, chapter, count: weight }] };
    }
  }),

  // [新增] 清空数据的具体实现
  clearAllHighlights: () => set({ highlights: [] }),
  clearAllNotes: () => set({ notes: [] }),
  clearAllInteractions: () => set({ interactions: [] }),
});

export const createSyncSlice: StateCreator<StoreState, [], [], SyncSlice> = (set) => ({
  syncMode: 'merge',
  setSyncMode: (mode) => set({ syncMode: mode }),
  lastSyncTime: null,
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  isSyncing: false,
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  syncError: null,
  setSyncError: (error) => set({ syncError: error }),
});