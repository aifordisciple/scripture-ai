// store/useBibleStore.ts
import { create } from 'zustand';

interface VerseRef {
  bookName: string;
  chapter: number;
  verse: number;
}

// 定义标签页数据结构
export interface Tab {
  id: string;
  book: string; // 书卷 ID，如 "Gen"
  chapter: string; // 章节号
  scrollTop?: number; // (预留) 记忆滚动位置
}

interface BibleState {
  fontSize: number;
  setFontSize: (size: number) => void;

// --- 新增：行高控制 ---
  lineHeight: number; // 例如 1.6, 1.8, 2.0
  setLineHeight: (height: number) => void;

  // 左侧目录
  isSidebarOpen: boolean;
  toggleSidebar: (open?: boolean) => void;

  // 右侧 AI
  isAiOpen: boolean;
  setAiOpen: (open: boolean) => void;

  // 多选与 AI 请求
  selectedVerses: number[];
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
  updateActiveTab: (book: string, chapter: string) => void; // 更新当前标签页的经文
  
  // 原有动作
  toggleVerseSelection: (id: number) => void;
  clearSelection: () => void;
  triggerAI: (prompt: string, content: string, context: string, ref: VerseRef) => void;
}

export const useBibleStore = create<BibleState>((set) => ({
  fontSize: 18,
  setFontSize: (size) => set({ fontSize: size }),

  lineHeight: 1.8, // 默认行高，比 loose (2.0) 稍微紧凑一点
  setLineHeight: (height) => set({ lineHeight: height }),

  isSidebarOpen: false,
  toggleSidebar: (open) => set((state) => ({ 
    isSidebarOpen: open !== undefined ? open : !state.isSidebarOpen 
  })),

  isAiOpen: false,
  setAiOpen: (open) => set({ isAiOpen: open }),

  selectedVerses: [],
  aiRequestTrigger: null,

  // --- 初始化标签页 ---
  tabs: [{ id: 'tab-1', book: 'Gen', chapter: '1' }], // 默认打开创世记 1章
  activeTabId: 'tab-1',

  addTab: (book = 'Gen', chapter = '1') => set((state) => {
    const newId = `tab-${Date.now()}`;
    return {
      tabs: [...state.tabs, { id: newId, book, chapter }],
      activeTabId: newId
    };
  }),

  closeTab: (id) => set((state) => {
    if (state.tabs.length <= 1) return state; // 至少保留一个标签
    const newTabs = state.tabs.filter(t => t.id !== id);
    
    // 如果关闭的是当前标签，切换到最后一个
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