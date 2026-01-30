// store/useBibleStore.ts
import { create } from 'zustand';

// 定义标签页数据结构
export interface Tab {
  id: string;
  book: string; // 书卷 ID，如 "Gen"
  chapter: string; // 章节号
  scrollTop?: number; // (预留) 记忆滚动位置
}

interface VerseRef {
  bookName: string;
  chapter: number;
  verse: number;
}

interface BibleState {
  fontSize: number;
  setFontSize: (size: number) => void;

  // --- 新增：行高控制 ---
  lineHeight: number;
  setLineHeight: (height: number) => void;

  // --- 左侧目录 ---
  isSidebarOpen: boolean; 
  toggleSidebar: (open?: boolean) => void;

  // --- 右侧 AI 面板 ---
  isAiOpen: boolean; 
  setAiOpen: (open: boolean) => void;

  // --- 新增：中英对照开关 ---
  showEnglish: boolean; // <--- 之前缺这个
  toggleEnglish: () => void; // <--- 之前缺这个

  // --- 核心：多选状态 ---
  selectedVerses: number[];
  
  // --- 核心：AI 请求触发器 ---
  aiRequestTrigger: {
    prompt: string;
    content: string;
    context: string;
    ref: VerseRef;
    timestamp: number;
  } | null;

  // --- 新增：多标签页管理 ---
  tabs: Tab[];
  activeTabId: string;
  
  // 动作
  addTab: (book?: string, chapter?: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateActiveTab: (book: string, chapter: string) => void; 
  
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
  toggleSidebar: (open) => set((state) => ({ 
    isSidebarOpen: open !== undefined ? open : !state.isSidebarOpen 
  })),

  isAiOpen: false,
  setAiOpen: (open) => set({ isAiOpen: open }),

  // --- 初始化中英对照 ---
  showEnglish: false,
  toggleEnglish: () => set((state) => ({ showEnglish: !state.showEnglish })),

  selectedVerses: [],
  aiRequestTrigger: null,

  // --- 初始化标签页 ---
  tabs: [{ id: 'tab-1', book: 'Gen', chapter: '1' }], 
  activeTabId: 'tab-1',

  addTab: (book = 'Gen', chapter = '1') => set((state) => {
    const newId = `tab-${Date.now()}`;
    return {
      tabs: [...state.tabs, { id: newId, book, chapter }],
      activeTabId: newId
    };
  }),

  closeTab: (id) => set((state) => {
    if (state.tabs.length <= 1) return state; 
    const newTabs = state.tabs.filter(t => t.id !== id);
    let newActiveId = state.activeTabId;
    if (id === state.activeTabId) {
      newActiveId = newTabs[newTabs.length - 1].id;
    }
    return { tabs: newTabs, activeTabId: newActiveId };
  }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateActiveTab: (book, chapter) => set((state) => ({
    tabs: state.tabs.map(t => 
      t.id === state.activeTabId ? { ...t, book, chapter } : t
    )
  })),

  toggleVerseSelection: (id) => set((state) => {
    const isSelected = state.selectedVerses.includes(id);
    let newSelection;
    if (isSelected) {
      newSelection = state.selectedVerses.filter(v => v !== id);
    } else {
      newSelection = [...state.selectedVerses, id].sort((a, b) => a - b);
    }
    return { selectedVerses: newSelection };
  }),

  clearSelection: () => set({ selectedVerses: [] }),

  triggerAI: (prompt, content, context, ref) => set({
    isAiOpen: true,
    aiRequestTrigger: {
      prompt,
      content,
      context,
      ref,
      timestamp: Date.now()
    }
  })
}));