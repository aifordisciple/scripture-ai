// store/types.ts

// --------------------------------------------------
// 1. 基础数据结构
// --------------------------------------------------
export interface Tab {
  id: string;
  type: 'read' | 'search' | 'dashboard' | 'highlights';
  book?: string; 
  chapter?: string; 
  query?: string;
  searchMode?: 'exact' | 'ai' | 'fuzzy'; 
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

export interface VerseRef {
  bookName: string;
  chapter: number;
  verse: number;
}

export interface InteractionLog {
  bookId: string;
  chapter: number;
  count: number;
}

// --------------------------------------------------
// 2. 状态切片 (Slice) 接口
// --------------------------------------------------
export interface UISlice {
  isAuthOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  isSidebarOpen: boolean; 
  toggleSidebar: (open?: boolean) => void;
  isDesktopSidebarOpen: boolean;
  toggleDesktopSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  isMobileSettingsOpen: boolean;
  setMobileSettingsOpen: (open: boolean) => void;
  isShareOpen: boolean;
  shareData: { book: string; chapter: number; verses: number[] } | null;
  openShareModal: (book: string, chapter: number, verses: number[]) => void;
  closeShareModal: () => void;
  isDashboardOpen: boolean;
  setDashboardOpen: (open: boolean) => void;
}

export interface ReaderSlice {
  fontSize: number;
  setFontSize: (size: number) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  showEnglish: boolean; 
  toggleEnglish: () => void; 
  tabs: Tab[];
  activeTabId: string;
  // [修复] 在这里补上 'highlights'
  addTab: (params: { type: 'read' | 'search' | 'dashboard' | 'highlights'; book?: string; chapter?: string; query?: string; searchMode?: 'exact' | 'ai' | 'fuzzy' }) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateActiveTab: (data: Partial<Tab>) => void;
  chapterSpeechText: string;
  setChapterSpeechText: (text: string) => void;
  scrollToVerse: number | null;
  setScrollToVerse: (verse: number | null) => void;
}

export interface AISlice {
  isAiOpen: boolean; 
  setAiOpen: (open: boolean) => void;
  isAiGenerating: boolean;
  setAiGenerating: (isGenerating: boolean) => void;
  aiRequestTrigger: { prompt: string; content: string; context: string; ref: VerseRef; timestamp: number; } | null;
  triggerAI: (prompt: string, content: string, context: string, ref: VerseRef) => void;
}

export interface UserDataSlice {
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
  
  setAllUserData: (data: { settings?: any, highlights?: any[], notes?: any[] }) => void;
  
  interactions: InteractionLog[];
  recordInteraction: (bookId: string, chapter: number, weight?: number) => void;

  clearAllHighlights: () => void;
  clearAllNotes: () => void;
  clearAllInteractions: () => void;
}

// --------------------------------------------------
// 3. 聚合总状态类型
// --------------------------------------------------
export type StoreState = UISlice & ReaderSlice & AISlice & UserDataSlice;