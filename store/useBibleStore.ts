// store/useBibleStore.ts
import { create } from 'zustand';

interface VerseRef {
  bookName: string;
  chapter: number;
  verse: number;
}

interface BibleState {
  fontSize: number;
  setFontSize: (size: number) => void;

  // --- 左侧目录 (Mobile) ---
  isSidebarOpen: boolean; // 左侧抽屉菜单状态
  toggleSidebar: (open?: boolean) => void;

  // --- 右侧 AI 面板 ---
  isAiOpen: boolean; // <--- 新增：专门控制 AI 面板
  setAiOpen: (open: boolean) => void; // <--- 新增：控制方法

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

  // 动作
  toggleVerseSelection: (id: number) => void;
  clearSelection: () => void;
  triggerAI: (prompt: string, content: string, context: string, ref: VerseRef) => void;
}

export const useBibleStore = create<BibleState>((set) => ({
  fontSize: 18,
  setFontSize: (size) => set({ fontSize: size }),

  // 左侧目录逻辑
  isSidebarOpen: false,
  toggleSidebar: (open) => set((state) => ({ 
    isSidebarOpen: open !== undefined ? open : !state.isSidebarOpen 
  })),

  // 右侧 AI 逻辑
  isAiOpen: false, // 默认关闭
  setAiOpen: (open) => set({ isAiOpen: open }),

  selectedVerses: [],
  aiRequestTrigger: null,

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

  // 触发 AI：同时设置 Trigger 数据，并强制打开 AI 面板
  triggerAI: (prompt, content, context, ref) => set({
    isAiOpen: true, // <--- 修复：只打开右侧 AI 面板，不影响左侧
    aiRequestTrigger: {
      prompt,
      content,
      context,
      ref,
      timestamp: Date.now()
    }
  })
}));