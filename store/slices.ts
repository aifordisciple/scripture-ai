// store/slices.ts
import { StateCreator } from 'zustand';
import { StoreState, UISlice, ReaderSlice, AISlice, UserDataSlice, Tab, SyncSlice } from './types';
import { BIBLE_PLANS } from '@/lib/plans';

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

  // [新增] 记住当前查看的计划
  viewingPlanId: null,
  setViewingPlanId: (id) => set({ viewingPlanId: id }),
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
      if (data.settings.customPlans) {
          try { updates.customPlans = JSON.parse(data.settings.customPlans); } catch (e) {}
      }
    }
    if (data.highlights) updates.highlights = data.highlights;
    if (data.notes) {
      updates.notes = data.notes.map((n: any) => ({ id: n.id, bookId: n.bookId, chapter: n.chapter, verse: n.verse, content: n.content }));
    }
    if (data.interactions) {
      updates.interactions = data.interactions.map((i: any) => ({ bookId: i.bookId, chapter: i.chapter, count: i.count }));
    }
      if (data.activePlans) {
      updates.activePlans = data.activePlans.map((p: any) => ({
        planId: p.planId,
        startDate: new Date(p.startDate).getTime(),
        completedTasks: typeof p.completedTasks === 'string' ? JSON.parse(p.completedTasks) : (p.completedTasks || {}),
        // [修复] 补上从云端同步的 AI 导读数据
        savedDevotionals: typeof p.savedDevotionals === 'string' ? JSON.parse(p.savedDevotionals) : (p.savedDevotionals || {}),
        // [修复] 补上荣誉墙的归档状态
        status: p.status || 'active'
      }));
    }
    if (data.streakCount !== undefined) updates.streakCount = data.streakCount;
    if (data.lastActiveDate !== undefined) updates.lastActiveDate = data.lastActiveDate;
    if (data.badges) updates.badges = data.badges;
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

  // [修改] 读经计划多任务逻辑
  activePlans: [],
  startPlan: (planId) => set((state) => {
    if (state.activePlans.some(p => p.planId === planId)) return state;
    return { activePlans: [...state.activePlans, { planId, startDate: Date.now(), status: 'active', completedTasks: {} }] };
  }),
  archivePlan: (planId) => set((state) => ({
    activePlans: state.activePlans.map(p => p.planId === planId ? { ...p, status: 'completed' } : p)
  })),
  toggleTaskCompleted: (planId, day, taskId) => set((state) => {
    const plan = state.activePlans.find(p => p.planId === planId);
    if (!plan) return state;

    const dayKey = day.toString();
    const currentTasks = plan.completedTasks[dayKey] || [];

    const newTasks = currentTasks.includes(taskId)
      ? currentTasks.filter(id => id !== taskId)
      : [...currentTasks, taskId].sort();

    // 更新火苗
    const now = new Date();
    const todayStr = now.toDateString();
    const lastDate = state.lastActiveDate ? new Date(state.lastActiveDate) : null;
    let newStreakCount = state.streakCount;
    let newLastActiveDate = state.lastActiveDate;

    if (lastDate?.toDateString() !== todayStr) {
      if (!lastDate) {
        newStreakCount = 1;
      } else {
        const diffTime = now.getTime() - lastDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        if (diffDays <= 1.5) {
          newStreakCount += 1;
        } else {
          newStreakCount = 1;
        }
      }
      newLastActiveDate = now.getTime();
    }

    // 延迟检查勋章
    setTimeout(() => get().checkAndUnlockBadges(), 100);

    return {
      activePlans: state.activePlans.map(p =>
        p.planId === planId ? { ...p, completedTasks: { ...p.completedTasks, [dayKey]: newTasks } } : p
      ),
      streakCount: newStreakCount,
      lastActiveDate: newLastActiveDate
    };
  }),
  quitPlan: (planId) => set((state) => ({
    activePlans: state.activePlans.filter(p => p.planId !== planId)
  })),

  // [新增] 自定义计划逻辑
  customPlans: [],
  addCustomPlan: (plan) => set((state) => ({ customPlans: [plan, ...state.customPlans] })),
  deleteCustomPlan: (id) => set((state) => ({ customPlans: state.customPlans.filter(p => p.id !== id) })),

  // [新增] 连读火苗与统计逻辑
  streakCount: 0,
  lastActiveDate: null,

  // [新增] 读经计划上下文
  readingPlanContext: null,
  setReadingPlanContext: (ctx) => set({ readingPlanContext: ctx }),

  // [新增] 前进到计划的下一步
  advancePlanStep: () => {
    const state = get();
    const ctx = state.readingPlanContext;
    if (!ctx) return;
    const step = ctx.steps[ctx.stepIndex];

    // 1. 自动打卡当前步骤（防重复触发）
    if (step.taskId !== 'completion') {
       const plan = state.activePlans.find(p => p.planId === ctx.planId);
       const currentTasks = plan?.completedTasks[ctx.day.toString()] || [];
       if (!currentTasks.includes(step.taskId)) {
           state.toggleTaskCompleted(ctx.planId, ctx.day, step.taskId);
       }
    }

    // 2. 推进进度
    if (ctx.stepIndex < ctx.steps.length - 1) {
        set({ readingPlanContext: { ...ctx, stepIndex: ctx.stepIndex + 1 } });
    } else {
        set({ readingPlanContext: null }); // 结束流
        const planTab = state.tabs.find(t => t.type === 'plans');
        if (planTab) state.setActiveTab(planTab.id);
    }
  },

  // [新增] 后退到计划的上一步
  previousPlanStep: () => {
    const state = get();
    const ctx = state.readingPlanContext;
    if (!ctx) return;
    if (ctx.stepIndex > 0) {
        set({ readingPlanContext: { ...ctx, stepIndex: ctx.stepIndex - 1 } });
    }
  },

  // [新增] 追赶进度
  catchUpPlan: (planId) => set((state) => {
    const plan = state.activePlans.find(p => p.planId === planId);
    if (!plan) return state;

    const allDays = Object.keys(plan.completedTasks).map(Number).sort((a,b) => a-b);
    const lastCompletedDay = allDays.length > 0 ? Math.max(...allDays) : 0;
    const nextDay = lastCompletedDay + 1;

    const todayMidnight = new Date().setHours(0,0,0,0);
    const newStartDate = todayMidnight - (nextDay - 1) * 86400000;

    return {
      activePlans: state.activePlans.map(p =>
        p.planId === planId ? { ...p, startDate: newStartDate } : p
      )
    };
  }),
  updateStreak: () => set((state) => {
    const now = new Date();
    const todayStr = now.toDateString();
    const lastDate = state.lastActiveDate ? new Date(state.lastActiveDate) : null;

    if (lastDate?.toDateString() === todayStr) return state;

    let newCount = state.streakCount;
    if (!lastDate) {
      newCount = 1;
    } else {
      const todayMidnight = new Date(now).setHours(0,0,0,0);
      const lastMidnight = new Date(lastDate).setHours(0,0,0,0);
      const diffDays = Math.round((todayMidnight - lastMidnight) / 86400000);

      if (diffDays === 1) {
        newCount += 1;
      } else if (diffDays === 0) {
      } else {
        newCount = 1;
      }
    }

    return { streakCount: newCount, lastActiveDate: now.getTime() };
  }),

  // [新增] 勋章功能
  badges: [],
  saveGeneratedDevotional: (planId: string, day: number, content: string) => set((state) => ({
    activePlans: state.activePlans.map(p =>
        p.planId === planId ? { ...p, savedDevotionals: { ...p.savedDevotionals, [day.toString()]: content } } : p
    )
  })),
  checkAndUnlockBadges: () => {
    const state = get();
    const newBadges: string[] = [];

    if (state.streakCount >= 3) newBadges.push("STREAK_3");
    if (state.streakCount >= 7) newBadges.push("STREAK_7");
    if (state.streakCount >= 30) newBadges.push("STREAK_30");

    state.activePlans.forEach(plan => {
      const totalDays = BIBLE_PLANS.find(p => p.id === plan.planId)?.durationDays || 0;
      if (totalDays > 0 && Object.keys(plan.completedTasks).length >= totalDays) {
        newBadges.push(`PLAN_DONE_${plan.planId}`);
      }
    });

    const toUnlock = newBadges.filter(type => !state.badges.find(b => b.type === type));

    if (toUnlock.length > 0) {
      const newlyEarned = toUnlock.map(type => ({ type, earnedAt: Date.now() }));
      set({ badges: [...state.badges, ...newlyEarned] });

       if (typeof window !== 'undefined') {
         window.dispatchEvent(new CustomEvent('badge-earned', { detail: toUnlock[0] }));
       }
     }
   },

   // [新增] AI 灵修导读生成
   generateAiDevotional: async (planId, day, planTitle, readings) => {
     const res = await fetch("/api/chat/devotional", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ planTitle, day, readings })
     });
     const data = await res.json();
     if (data.devotional) {
       set((state) => ({
         activePlans: state.activePlans.map(p => {
           if (p.planId === planId) {
             return {
               ...p,
               savedDevotionals: { ...(p.savedDevotionals || {}), [day.toString()]: data.devotional }
             };
           }
           return p;
         })
       }));
     } else {
       throw new Error("No devotional returned");
     }
   },

  // API configuration
  apiConfig: {
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
  },
  setApiConfig: (config) => set((state) => ({
    apiConfig: { ...state.apiConfig, ...config }
  })),
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