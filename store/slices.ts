// store/slices.ts
import { StateCreator } from 'zustand';
import { StoreState, UISlice, ReaderSlice, AISlice, UserDataSlice, Tab, SyncSlice, AIQueueItem, GroupSlice, GroupPlanContext, ChatSession, AIStyleSettings, CustomPrompt, SavedInsight, QuickAction, AtlasSlice, ThemeGraphSlice, ThemeGraphData } from './types';
import { BIBLE_PLANS } from '@/lib/plans';
import { THEOLOGICAL_PROMPTS } from '@/lib/constants';

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
  addTab: ({ type, book = 'Gen', chapter = '1', query, searchMode, crossRefSource }) => set((state) => {
      const newId = `tab-${Date.now()}`;
      const newTab: Tab = { id: newId, type };
      if (type === 'read') { newTab.book = book; newTab.chapter = chapter; }
      else if (type === 'search') { newTab.query = query; newTab.searchMode = searchMode; }
      else if (type === 'cross-ref' && crossRefSource) { newTab.crossRefSource = crossRefSource; }
      else if (type === 'atlas') { newTab.atlasData = {}; }
      else if (type === 'theme-graph') { newTab.themeGraphData = {}; }
      // dashboard、highlights、notes、plans、group 都不需要额外参数
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

export const createAISlice: StateCreator<StoreState, [], [], AISlice> = (set, get) => ({
  isAiOpen: false,
  setAiOpen: (open) => set({ isAiOpen: open }),
  isAiGenerating: false,
  setAiGenerating: (isAiGenerating) => set({ isAiGenerating }),

  // 队列状态
  currentAiRequest: null,
  aiQueue: [],

  // 入队方法：如果无当前任务则立即开始，否则加入队列
  enqueueAI: (prompt, content, context, ref) => {
    const newItem: AIQueueItem = {
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      prompt,
      content,
      context,
      ref,
      timestamp: Date.now(),
      status: 'pending'
    };

    const { currentAiRequest } = get();

    // 无当前任务，立即开始处理
    if (!currentAiRequest || currentAiRequest.status === 'completed' || currentAiRequest.status === 'error') {
      set({
        currentAiRequest: { ...newItem, status: 'processing' },
        aiRequestTrigger: { prompt, content, context, ref, timestamp: Date.now() } // 兼容旧代码
      });
    } else {
      // 有任务进行中，加入队列
      set({ aiQueue: [...get().aiQueue, newItem] });
    }
  },

  // 取消请求
  cancelAIRequest: (id) => {
    const { currentAiRequest, aiQueue } = get();

    if (currentAiRequest?.id === id) {
      // 取消当前处理的请求，开始下一个
      set({
        currentAiRequest: { ...currentAiRequest, status: 'cancelled' },
        isAiGenerating: false
      });
      // 延迟触发下一个
      setTimeout(() => get().startProcessingNext(), 100);
    } else {
      // 从队列中移除
      set({ aiQueue: aiQueue.filter(item => item.id !== id) });
    }
  },

  // 清空队列
  clearAIQueue: () => set({ aiQueue: [] }),

  // 开始处理下一个请求
  startProcessingNext: () => {
    const { aiQueue } = get();

    if (aiQueue.length === 0) {
      set({ currentAiRequest: null });
      return;
    }

    const [nextItem, ...remainingQueue] = aiQueue;
    set({
      currentAiRequest: { ...nextItem, status: 'processing' },
      aiQueue: remainingQueue,
      aiRequestTrigger: {
        prompt: nextItem.prompt,
        content: nextItem.content,
        context: nextItem.context,
        ref: nextItem.ref,
        timestamp: Date.now()
      }
    });
  },

  // 完成当前请求
  completeCurrentRequest: () => {
    const { currentAiRequest } = get();
    if (currentAiRequest) {
      set({
        currentAiRequest: { ...currentAiRequest, status: 'completed' },
        isAiGenerating: false
      });
      // 自动开始下一个
      setTimeout(() => get().startProcessingNext(), 500);
    }
  },

  // 失败处理
  failCurrentRequest: (error) => {
    const { currentAiRequest } = get();
    if (currentAiRequest) {
      set({
        currentAiRequest: { ...currentAiRequest, status: 'error', error },
        isAiGenerating: false
      });
      // 延迟后开始下一个
      setTimeout(() => get().startProcessingNext(), 1000);
    }
  },

  // 兼容旧接口
  aiRequestTrigger: null,
  triggerAI: (prompt, content, context, ref) => {
    get().enqueueAI(prompt, content, context, ref);
  },

  // [新增] 会话管理
  currentSessionId: null,
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  sessions: [],
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((state) => ({ sessions: [session, ...state.sessions] })),
  updateSession: (id, data) => set((state) => ({
    sessions: state.sessions.map(s => s.id === id ? { ...s, ...data } : s)
  })),
  deleteSession: (id) => set((state) => ({
    sessions: state.sessions.filter(s => s.id !== id),
    currentSessionId: state.currentSessionId === id ? null : state.currentSessionId
  })),

  // [新增] AI 模式
  aiMode: 'general',
  setAiMode: (mode) => set({ aiMode: mode }),

  // [新增] AI 风格设置
  aiStyleSettings: {
    aiDetail: 'balanced',
    aiDepth: 'intermediate',
    aiTone: 'modern'
  },
  setAiStyleSettings: (settings) => set((state) => ({
    aiStyleSettings: { ...state.aiStyleSettings, ...settings }
  })),

  // [新增] 自定义提示词
  customPrompts: [],
  setCustomPrompts: (prompts) => set({ customPrompts: prompts }),
  addCustomPrompt: (prompt) => set((state) => ({ customPrompts: [...state.customPrompts, prompt] })),
  deleteCustomPrompt: (id) => set((state) => ({ customPrompts: state.customPrompts.filter(p => p.id !== id) })),

  // [新增] 收藏的 AI 解读
  savedInsights: [],
  setSavedInsights: (insights) => set({ savedInsights: insights }),
  addSavedInsight: (insight) => set((state) => ({ savedInsights: [insight, ...state.savedInsights] })),
  deleteSavedInsight: (id) => set((state) => ({ savedInsights: state.savedInsights.filter(i => i.id !== id) })),

  // [新增] 快捷动作 - 从 THEOLOGICAL_PROMPTS 初始化
  quickActions: THEOLOGICAL_PROMPTS.slice(0, 6).map((p, index) => ({
    id: p.id,
    label: p.label,
    prompt: p.prompt,
    mode: p.mode,
    priority: index,
    category: ['detail', 'original', 'application', 'prayer'].includes(p.id) ? 'selected' :
              ['context'].includes(p.id) ? 'reading' : undefined
  })) as QuickAction[],
  activeQuickAction: null,
  setActiveQuickAction: (action) => set({ activeQuickAction: action }),

  // [新增] 引导状态
  onboardingStep: null,
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  hasCompletedOnboarding: typeof window !== 'undefined' ? localStorage.getItem('magicBall_onboarding_complete') === 'true' : false,
  setHasCompletedOnboarding: (completed) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('magicBall_onboarding_complete', String(completed));
    }
    set({ hasCompletedOnboarding: completed });
  },

  // [新增] Magic Ball 位置 - 从 localStorage 初始化
  magicBallPosition: typeof window !== 'undefined' ? (() => {
    try {
      const saved = localStorage.getItem('magicBall_position');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { bottom: 150, right: 30 };
  })() : { bottom: 150, right: 30 },
  setMagicBallPosition: (position) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('magicBall_position', JSON.stringify(position));
    }
    set({ magicBallPosition: position });
  },

  // [新增] AI 字体大小
  aiFontSize: (() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ai_fontSize');
        if (saved && ['small', 'medium', 'large', 'xlarge'].includes(saved)) {
          return saved as 'small' | 'medium' | 'large' | 'xlarge';
        }
      } catch (e) {}
    }
    return 'medium';
  })() as 'small' | 'medium' | 'large' | 'xlarge',
  setAiFontSize: (size) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_fontSize', size);
    }
    set({ aiFontSize: size });
  },
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
  deleteCustomPlan: (id) => set((state) => ({
    customPlans: state.customPlans.filter(p => p.id !== id),
    // 同时清除 activePlans 中对应的记录
    activePlans: state.activePlans.filter(p => p.planId !== id)
  })),

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
     // [修复] 从 store 获取当前 apiConfig
     const { apiConfig } = useBibleStore.getState();
     const res = await fetch("/api/chat/devotional", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ planTitle, day, readings, apiConfig }) // [修复] 传递 apiConfig
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

  // API configuration - Default to cloud MiniMax
  apiConfig: {
    provider: 'cloud',
    baseUrl: 'https://api.minimaxi.com/v1',
    apiKey: '',
    model: 'MiniMax-M2.5',
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

// [新增] 小组读经计划状态
export const createGroupSlice: StateCreator<StoreState, [], [], GroupSlice> = (set, get) => ({
  groupPlanContext: null,

  // 小组计划选择状态（用于跨标签页保持）
  selectedGroupForPlan: null,
  selectedPlanId: null,
  setSelectedGroupForPlan: (group) => set({ selectedGroupForPlan: group }),
  setSelectedPlanId: (planId) => set({ selectedPlanId: planId }),

  setGroupPlanContext: (ctx) => set({ groupPlanContext: ctx }),

  advanceGroupPlanStep: () => {
    const state = get();
    const ctx = state.groupPlanContext;
    if (!ctx) return;

    const step = ctx.steps[ctx.stepIndex];

    // 1. 自动打卡当前步骤（防重复触发）
    if (step.taskId !== 'completion') {
      state.toggleGroupTaskCompleted(
        ctx.churchId,
        ctx.planId,
        ctx.day,
        step.taskId,
        'complete'
      );
    }

    // 2. 推进进度
    if (ctx.stepIndex < ctx.steps.length - 1) {
      set({ groupPlanContext: { ...ctx, stepIndex: ctx.stepIndex + 1 } });
    } else {
      // 结束流，保持在当前阅读页面（用户刚读完的经文），不自动跳回小组页面
      set({ groupPlanContext: null });
    }
  },

  previousGroupPlanStep: () => {
    const state = get();
    const ctx = state.groupPlanContext;
    if (!ctx) return;

    if (ctx.stepIndex > 0) {
      set({ groupPlanContext: { ...ctx, stepIndex: ctx.stepIndex - 1 } });
    }
  },

  toggleGroupTaskCompleted: async (churchId, planId, day, taskId, action = 'complete') => {
    try {
      const res = await fetch(`/api/church/${churchId}/plan/${planId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, taskId, action })
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Toggle group task error:', error);
      throw error;
    }
  },

  startGroupPlanFlow: (churchId, planId, planName, tasks, day) => {
    const state = get();
    const task = tasks.find((t: any) => t.day === day);
    if (!task) return;

    // 构建步骤数组
    const steps: GroupPlanContext['steps'] = [];

    // 步骤1：灵修导读
    if (task.devotional) {
      steps.push({
        type: 'devotional',
        taskId: 'devotional',
        content: task.devotional
      });
    }

    // 步骤2-N：经文阅读
    task.readings.forEach((reading: any, index: number) => {
      steps.push({
        type: 'reading',
        taskId: `reading-${index}`,
        book: reading.book,
        chapter: reading.chapter
      });
    });

    // 最后一步：完成庆祝
    steps.push({
      type: 'completion',
      taskId: 'completion'
    });

    set({
      groupPlanContext: {
        churchId,
        planId,
        planName,
        day,
        stepIndex: 0,
        steps
      }
    });

    // 如果第一步是灵修导读，保持在当前页面
    // 如果第一步是阅读，切换到阅读 Tab
    if (steps[0].type === 'reading' && steps[0].book && steps[0].chapter) {
      const readTab = state.tabs.find(t => t.type === 'read');
      if (readTab) {
        // 先更新 tab 数据，再切换 activeTab
        useBibleStore.setState((s) => ({
          tabs: s.tabs.map(t => t.id === readTab.id ? { ...t, book: steps[0].book, chapter: steps[0].chapter!.toString() } : t)
        }));
        state.setActiveTab(readTab.id);
      } else {
        state.addTab({ type: 'read', book: steps[0].book, chapter: steps[0].chapter.toString() });
      }
    }
  }
});

// [新增] 圣经地图与时间线状态
export const createAtlasSlice: StateCreator<StoreState, [], [], AtlasSlice> = (set, get) => ({
  // 当前选中的地点
  selectedLocationId: null,
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),

  // 地点详情
  selectedLocation: null,
  setSelectedLocation: (location) => set({ selectedLocation: location }),

  // 时间线状态 (默认显示公元前1000年到公元100年)
  timelineYear: 0,
  setTimelineYear: (year) => set({ timelineYear: year }),
  timelineRange: [-2000, 100],
  setTimelineRange: (range) => set({ timelineRange: range }),

  // 旅程播放
  activeJourneyId: null,
  setActiveJourneyId: (id) => set({ activeJourneyId: id }),
  journeyStep: 0,
  setJourneyStep: (step) => set({ journeyStep: step }),
  isPlayingJourney: false,
  setIsPlayingJourney: (playing) => set({ isPlayingJourney: playing }),

  // 地图视图状态 (默认以耶路撒冷为中心)
  mapCenter: [31.7683, 35.2137],
  setMapCenter: (center) => set({ mapCenter: center }),
  mapZoom: 8,
  setMapZoom: (zoom) => set({ mapZoom: zoom }),

  // 地点搜索
  locationSearchQuery: '',
  setLocationSearchQuery: (query) => set({ locationSearchQuery: query }),
  locationSearchResults: [],
  setLocationSearchResults: (results) => set({ locationSearchResults: results }),

  // 面板状态
  isAtlasPanelOpen: false,
  setAtlasPanelOpen: (open) => set({ isAtlasPanelOpen: open }),
  atlasPanelTab: 'map',
  setAtlasPanelTab: (tab) => set({ atlasPanelTab: tab }),

  // 经文上下文 - 用于AI提取地点
  atlasVerseContext: null,
  setAtlasVerseContext: (context) => set({ atlasVerseContext: context }),
});

// [新增] 主题网络图状态
export const createThemeGraphSlice: StateCreator<StoreState, [], [], ThemeGraphSlice> = (set, get) => ({
  // 当前选中的主题
  selectedThemeId: null,
  setSelectedThemeId: (id) => set({ selectedThemeId: id }),

  // 主题详情
  selectedTheme: null,
  setSelectedTheme: (theme) => set({ selectedTheme: theme }),

  // 图谱数据
  graphData: { nodes: [], edges: [] },
  setGraphData: (data) => set({ graphData: data }),

  // 图谱配置
  graphDepth: 2,
  setGraphDepth: (depth) => set({ graphDepth: depth }),
  themeCategoryFilter: [],
  setThemeCategoryFilter: (categories) => set({ themeCategoryFilter: categories }),

  // 主题搜索
  themeSearchQuery: '',
  setThemeSearchQuery: (query) => set({ themeSearchQuery: query }),
  themeSearchResults: [],
  setThemeSearchResults: (results) => set({ themeSearchResults: results }),

  // 收藏的主题
  savedThemes: [],
  addSavedTheme: (themeId) => set((state) => ({
    savedThemes: state.savedThemes.includes(themeId) ? state.savedThemes : [...state.savedThemes, themeId]
  })),
  removeSavedTheme: (themeId) => set((state) => ({
    savedThemes: state.savedThemes.filter(id => id !== themeId)
  })),

  // 面板状态
  isThemeGraphPanelOpen: false,
  setThemeGraphPanelOpen: (open) => set({ isThemeGraphPanelOpen: open }),

  // 图谱视图模式
  graphViewMode: 'network',
  setGraphViewMode: (mode) => set({ graphViewMode: mode }),
});