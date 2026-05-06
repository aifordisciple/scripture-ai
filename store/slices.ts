// store/slices.ts
import { StateCreator } from 'zustand';
import { StoreState, UISlice, ReaderSlice, AISlice, UserDataSlice, Tab, SyncSlice, AIQueueItem, GroupSlice, GroupPlanContext, ChatSession, AIStyleSettings, CustomPrompt, SavedInsight, QuickAction, AtlasSlice, DMSlice, OnboardingStatus, SessionStatus, SessionError, ReadingHistoryData, SearchHistoryData, LocaleSlice, SermonSlice } from './types';
import { createLocaleSlice } from './slices/localeSlice';
export { createLocaleSlice };
import { createSermonSlice } from './slices/sermonSlice';
export { createSermonSlice };
import { BIBLE_PLANS } from '@/lib/plans';
import { BIBLE_BOOKS, THEOLOGICAL_PROMPTS } from '@/lib/constants';

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set, get) => ({
  isAuthOpen: false,
  setAuthOpen: (open) => set({ isAuthOpen: open }),
  isSidebarOpen: false,
  toggleSidebar: (open) => set((state) => {
    const newOpen = open !== undefined ? open : !state.isSidebarOpen;
    // 移动端互斥：打开侧边栏时关闭AI侧边栏
    return { isSidebarOpen: newOpen, isAiOpen: newOpen ? false : state.isAiOpen };
  }),
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

  // [新增] 新手引导状态
  onboarding: {
    welcome: { completed: false, shown: false },
    reading: { completed: false, shown: false },
    ai: { completed: false, shown: false },
    plan: { completed: false, shown: false },
    group: { completed: false, shown: false },
  },

  initOnboarding: (status) => set((state) => ({
    onboarding: { ...state.onboarding, ...status }
  })),

  startOnboarding: (type) => set((state) => ({
    onboarding: {
      ...state.onboarding,
      [type]: { ...state.onboarding[type], shown: true }
    }
  })),

  completeOnboarding: (type) => {
    const newStatus = { ...get().onboarding[type], completed: true, shown: true };
    set((state) => ({
      onboarding: { ...state.onboarding, [type]: newStatus }
    }));
    // 同步到云端
    if (typeof window !== 'undefined') {
      fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, completed: true })
      }).catch(() => {});
    }
  },

  skipOnboarding: (type) => {
    const newStatus = { ...get().onboarding[type], completed: true, shown: true };
    set((state) => ({
      onboarding: { ...state.onboarding, [type]: newStatus }
    }));
    // 同步到云端
    if (typeof window !== 'undefined') {
      fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, completed: true, skipped: true })
      }).catch(() => {});
    }
  },

  resetOnboarding: (type) => set((state) => {
    if (type) {
      return {
        onboarding: {
          ...state.onboarding,
          [type]: { completed: false, shown: false }
        }
      };
    }
    // 重置所有
    return {
      onboarding: {
        welcome: { completed: false, shown: false },
        reading: { completed: false, shown: false },
        ai: { completed: false, shown: false },
        plan: { completed: false, shown: false },
        group: { completed: false, shown: false },
      }
    };
  }),
});

export const createReaderSlice: StateCreator<StoreState, [], [], ReaderSlice> = (set) => ({
  fontSize: 18,
  setFontSize: (size) => set({ fontSize: size }),
  lineHeight: 1.8,
  setLineHeight: (height) => set({ lineHeight: height }),
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  showDualVersion: false,
  toggleDualVersion: () => set((state) => ({ showDualVersion: !state.showDualVersion })),
  
  tabs: [{ id: 'tab-1', type: 'read', book: 'Gen', chapter: '1' }],
  activeTabId: 'tab-1',
  addTab: ({ type, book = 'Gen', chapter = '1', query, searchMode, crossRefSource }) => set((state) => {
      // [P2-13修复] 添加随机后缀防止 Date.now() 碰撞
      const newId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
  setAiOpen: (open) => set((state) => {
    // 移动端互斥：打开AI侧边栏时关闭主侧边栏
    return { isAiOpen: open, isSidebarOpen: open ? false : state.isSidebarOpen };
  }),
  isAiGenerating: false,
  setAiGenerating: (isAiGenerating) => set({ isAiGenerating }),
  shouldAbortStream: false,
  clearAbortStream: () => set({ shouldAbortStream: false }),

  // [新增] 会话状态机 - 简化状态管理
  sessionStatus: 'idle',
  sessionError: null,
  setSessionStatus: (status) => set({ sessionStatus: status }),
  setSessionError: (error) => set({ sessionError: error }),
  resetSession: () => set({
    sessionStatus: 'idle',
    sessionError: null,
    currentSessionId: null,
  }),

  // [新增] 会话加载状态
  sessionsLoading: false,
  messagesLoading: false,
  setSessionsLoading: (loading) => set({ sessionsLoading: loading }),
  setMessagesLoading: (loading) => set({ messagesLoading: loading }),

  // 队列状态
  currentAiRequest: null,
  aiQueue: [],

  // 入队方法：如果无当前任务则立即开始，否则加入队列
  // [P0-2修复] 添加去重检查，防止重复请求入队
  enqueueAI: (prompt, content, context, ref) => {
    const { currentAiRequest, aiQueue, isAiOpen } = get();

    // 去重：检查队列中是否已有相同prompt的请求
    const isDuplicate = aiQueue.some(item => item.prompt === prompt && item.content === content)
      || (currentAiRequest?.prompt === prompt && currentAiRequest?.content === content);
    if (isDuplicate) return;

    const newItem: AIQueueItem = {
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      prompt,
      content,
      context,
      ref,
      timestamp: Date.now(),
      status: 'pending'
    };

    // 无当前任务，立即开始处理
    if (!currentAiRequest || currentAiRequest.status === 'completed' || currentAiRequest.status === 'error' || currentAiRequest.status === 'cancelled') {
      set({
        currentAiRequest: { ...newItem, status: 'processing' },
        aiRequestTrigger: { prompt, content, context, ref, timestamp: Date.now() }, // 兼容旧代码
        // 自动打开AI侧边栏，避免isAiOpen与aiRequestTrigger的竞态条件
        ...(!isAiOpen ? { isAiOpen: true } : {})
      });
    } else {
      // 有任务进行中，加入队列
      set({
        aiQueue: [...get().aiQueue, newItem],
        // 自动打开AI侧边栏
        ...(!isAiOpen ? { isAiOpen: true } : {})
      });
    }
  },

  // 取消请求
  cancelAIRequest: (id) => {
    const { currentAiRequest, aiQueue } = get();

    if (currentAiRequest?.id === id) {
      // 设置中止信号，AISidebar的useEffect会异步调用stop()
      if (aiQueue.length > 0) {
        // 有排队项：标记取消+中止信号，保持isAiGenerating避免动画抖动
        set({
          currentAiRequest: { ...currentAiRequest, status: 'cancelled' },
          isAiGenerating: true,
          shouldAbortStream: true
        });
        // 异步启动下一个请求
        setTimeout(() => get().startProcessingNext(), 0);
      } else {
        // 无排队项：清空当前请求+中止信号
        set({
          currentAiRequest: null,
          isAiGenerating: false,
          shouldAbortStream: true
        });
      }
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
  // [P1-3修复] 删除会话时同时清理currentSessionId，切换到上一个可用会话
  deleteSession: (id) => set((state) => {
    const remaining = state.sessions.filter(s => s.id !== id);
    const newCurrentId = state.currentSessionId === id
      ? (remaining.length > 0 ? remaining[0].id : null)
      : state.currentSessionId;
    return {
      sessions: remaining,
      currentSessionId: newCurrentId
    };
  }),
  // [P1-2修复] 替换临时会话ID为真实ID，同时迁移消息Record的key
  replaceSessionId: (tempId, realId) => set((state) => ({
    sessions: state.sessions.map(s => s.id === tempId ? { ...s, id: realId } : s),
    currentSessionId: state.currentSessionId === tempId ? realId : state.currentSessionId,
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
  updateSavedInsight: (id, data) => set((state) => ({
    savedInsights: state.savedInsights.map(i => i.id === id ? { ...i, ...data } : i)
  })),
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
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: (completed) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('magicBall_onboarding_complete', String(completed));
    }
    set({ hasCompletedOnboarding: completed });
  },

  // [新增] Magic Ball 位置 - SSR 安全默认值，客户端通过 useEffect 初始化
  magicBallPosition: { bottom: 150, right: 30 },
  setMagicBallPosition: (position) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('magicBall_position', JSON.stringify(position));
    }
    set({ magicBallPosition: position });
  },

  // [新增] AI 字体大小 - SSR 安全默认值
  aiFontSize: 'medium' as 'small' | 'medium' | 'large' | 'xlarge',
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
      updates.showDualVersion = data.settings.showEnglish;
      if (data.settings.lastBook && data.settings.lastChapter) {
         const tabs = get().tabs;
         if (tabs.length > 0 && tabs[0].type === 'read') {
             const newTabs = [...tabs];
             newTabs[0] = { ...newTabs[0], book: data.settings.lastBook, chapter: data.settings.lastChapter.toString() };
             updates.tabs = newTabs;
         }
      }
      if (data.settings.customPlans !== undefined && data.settings.customPlans !== null) {
          try { updates.customPlans = JSON.parse(data.settings.customPlans); } catch (e) { updates.customPlans = []; }
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
        // 统一使用午夜对齐的日期比较，与updateStreak保持一致
        const todayMidnight = new Date(now).setHours(0,0,0,0);
        const lastMidnight = new Date(lastDate).setHours(0,0,0,0);
        const diffDays = Math.round((todayMidnight - lastMidnight) / 86400000);

        if (diffDays === 1) {
          newStreakCount += 1;
        } else if (diffDays === 0) {
          // 同一天，不重复增加
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
        const planTab = state.tabs.find(t => t.type === 'plan');
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
      const planDef = BIBLE_PLANS.find(p => p.id === plan.planId);
      const totalDays = planDef?.durationDays || 0;
      // 严谨检查：每天的所有任务都已完成才算完成
      if (totalDays > 0) {
        const allDaysComplete = Array.from({ length: totalDays }, (_, i) => i + 1).every(day => {
          const dayTasks = plan.completedTasks[day.toString()];
          return Array.isArray(dayTasks) && dayTasks.length > 0;
        });
        if (allDaysComplete) {
          newBadges.push(`PLAN_DONE_${plan.planId}`);
        }
      }
    });

    const toUnlock = newBadges.filter(type => !state.badges.find(b => b.type === type));

    if (toUnlock.length > 0) {
      const newlyEarned = toUnlock.map(type => ({ type, earnedAt: Date.now() }));
      set({ badges: [...state.badges, ...newlyEarned] });

       if (typeof window !== 'undefined') {
         // 为每个新勋章分别触发事件，让BadgePopup可以依次展示
         toUnlock.forEach((type, index) => {
           setTimeout(() => {
             window.dispatchEvent(new CustomEvent('badge-earned', { detail: type }));
           }, index * 1500); // 每个勋章间隔1.5秒依次展示
         });
       }
     }
   },

   // [新增] AI 灵修导读生成
   generateAiDevotional: async (planId, day, planTitle, readings) => {
     // [修复] 从 store 获取当前 apiConfig
     const { apiConfig, locale } = get();
     const resolvedLocale = locale || 'zh';
     const res = await fetch("/api/chat/devotional", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ planTitle, day, readings, apiConfig, locale: resolvedLocale }) // [修复] 传递 apiConfig + locale
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

  // [P1增强] 书签系统
  bookmarks: [],
  addBookmark: (bookId, chapter) => set((state) => {
    // 检查是否已存在
    const exists = state.bookmarks.some(b => b.bookId === bookId && b.chapter === chapter);
    if (exists) return state;
    return {
      bookmarks: [...state.bookmarks, {
        id: `bookmark-${Date.now()}`,
        bookId,
        chapter,
        createdAt: Date.now()
      }]
    };
  }),
  removeBookmark: (id) => set((state) => ({
    bookmarks: state.bookmarks.filter(b => b.id !== id)
  })),
  isBookmarked: (bookId, chapter) => {
    const state = get();
    return state.bookmarks.some(b => b.bookId === bookId && b.chapter === chapter);
  },

  // [P2增强] 阅读历史系统
  readingHistory: [],
  addReadingHistory: (bookId, chapter, duration) => set((state) => {
    const id = `history-${Date.now()}`;
    const newEntry: ReadingHistoryData = { id, bookId, chapter, timestamp: Date.now(), duration };
    // 保留最近100条记录
    const newHistory = [newEntry, ...state.readingHistory].slice(0, 100);
    return { readingHistory: newHistory };
  }),
  clearReadingHistory: () => set({ readingHistory: [] }),
  getRecentReading: (limit = 10) => {
    const state = get();
    return state.readingHistory.slice(0, limit);
  },
  getContinueReading: () => {
    const state = get();
    if (state.readingHistory.length === 0) return null;

    // 找到最近阅读的书卷和章节
    const recent = state.readingHistory[0];
    const { bookId, chapter } = recent;

    // 检查下一章是否已读
    const nextChapterRead = state.readingHistory.some(
      h => h.bookId === bookId && h.chapter === chapter + 1
    );

    // 如果下一章已读，推荐当前书卷未读的下一章
    if (nextChapterRead) {
      // 找到该书卷最大已读章节
      const chaptersRead = state.readingHistory
        .filter(h => h.bookId === bookId)
        .map(h => h.chapter);
      const maxChapter = Math.max(...chaptersRead);
      // [P2-12修复] 检查推荐章节不超出该书卷总章数
      const bookInfo = BIBLE_BOOKS.find(b => b.id === bookId);
      const maxAllowed = bookInfo ? bookInfo.chapters : 150;
      const recommendedChapter = Math.min(maxChapter + 1, maxAllowed);
      if (recommendedChapter <= maxChapter) return null; // 已读完该书卷
      return { bookId, chapter: recommendedChapter };
    }

    // [P2-12修复] 检查 chapter + 1 不超出该书卷总章数
    const bookInfo = BIBLE_BOOKS.find(b => b.id === bookId);
    const maxAllowed = bookInfo ? bookInfo.chapters : 150;
    if (chapter + 1 > maxAllowed) return null; // 已读完该书卷
    return { bookId, chapter: chapter + 1 };
  },

  // 搜索历史系统
  searchHistory: [],
  addSearchHistory: (query, searchMode) => set((state) => {
    const existingIndex = state.searchHistory.findIndex(
      h => h.query === query && h.searchMode === searchMode
    );
    const id = `search-history-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newEntry: SearchHistoryData = { id, query, searchMode, timestamp: Date.now() };
    let newHistory: SearchHistoryData[];
    if (existingIndex >= 0) {
      // 去重：将已有记录移到顶部并更新时间戳
      newHistory = [newEntry, ...state.searchHistory.filter((_, i) => i !== existingIndex)].slice(0, 100);
    } else {
      newHistory = [newEntry, ...state.searchHistory].slice(0, 100);
    }
    return { searchHistory: newHistory };
  }),
  removeSearchHistory: (id) => set((state) => ({
    searchHistory: state.searchHistory.filter(h => h.id !== id)
  })),
  clearSearchHistory: () => set({ searchHistory: [] }),
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

  advanceGroupPlanStep: async () => {
    const state = get();
    const ctx = state.groupPlanContext;
    if (!ctx) return;

    const step = ctx.steps[ctx.stepIndex];

    // 1. 自动打卡当前步骤（防重复触发）- await server confirmation
    if (step.taskId !== 'completion') {
      try {
        await state.toggleGroupTaskCompleted(
          ctx.churchId,
          ctx.planId,
          ctx.day,
          step.taskId,
          'complete'
        );
      } catch (error) {
        // Server failed to record completion - don't advance UI
        console.error('Failed to complete group task, not advancing step:', error);
        return;
      }
    }

    // 2. 推进进度
    if (ctx.stepIndex < ctx.steps.length - 1) {
      set({ groupPlanContext: { ...ctx, stepIndex: ctx.stepIndex + 1 } });
    } else {
      // 结束流，派遣自定义事件通知 GroupPlanDetail 刷新进度
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('group-plan-flow-complete', {
          detail: { churchId: ctx.churchId, planId: ctx.planId }
        }));
      }
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

    // 如果第一步是阅读，需要同时更新标签页和切换
    if (steps[0].type === 'reading' && steps[0].book && steps[0].chapter) {
      const readTab = state.tabs.find(t => t.type === 'read');
      if (readTab) {
        // 合并所有状态更新为一次原子操作
        set({
          groupPlanContext: {
            churchId,
            planId,
            planName,
            day,
            stepIndex: 0,
            steps
          },
          tabs: state.tabs.map(t => t.id === readTab.id ? { ...t, book: steps[0].book, chapter: steps[0].chapter!.toString() } : t),
          activeTabId: readTab.id
        });
      } else {
        // 创建新标签页并设置 context
        const newTabId = `tab-${Date.now()}`;
        const newTab: any = {
          id: newTabId,
          type: 'read',
          book: steps[0].book,
          chapter: steps[0].chapter.toString()
        };
        set({
          groupPlanContext: {
            churchId,
            planId,
            planName,
            day,
            stepIndex: 0,
            steps
          },
          tabs: [...state.tabs, newTab],
          activeTabId: newTabId
        });
      }
    } else {
      // 第一步是灵修导读，只需设置 context（保持在当前页面，GroupPlanDailyFlow 会显示全屏导读）
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
    }
  },

  // [新增] 追赶进度 - 计算第一个需要补做的天数
  catchUpGroupPlan: (progress, tasks, currentDay) => {
    // 找出第一个未完成且已过期的天数（包含当前天）
    for (let day = 1; day <= currentDay; day++) {
      const task = tasks.find((t: any) => t.day === day);
      if (!task) continue;

      const dayTasks = progress.completedTasks?.[day.toString()] || [];
      const hasDevotional = task.devotional;
      const devotionalCompleted = !hasDevotional || dayTasks.includes('devotional');
      const readingsCompleted = task.readings.every((_: any, i: number) => dayTasks.includes(`reading-${i}`));

      if (!devotionalCompleted || !readingsCompleted) {
        return day;
      }
    }
    return null; // 没有需要补做的
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

  // 查看地点相关经文
  viewingLocationVerses: null,
  setViewingLocationVerses: (data) => set({ viewingLocationVerses: data }),
});

// [新增] 私信状态
export const createDMSlice: StateCreator<StoreState, [], [], DMSlice> = (set, get) => ({
  // 私信面板状态
  isDmPanelOpen: false,
  setDmPanelOpen: (open) => set({ isDmPanelOpen: open }),

  // 会话列表
  dmConversations: [],
  setDmConversations: (conversations) => set({ dmConversations: conversations }),

  // 当前选中的会话
  activeDmUserId: null,
  setActiveDmUserId: (userId) => set({ activeDmUserId: userId }),

  // 当前会话的消息
  dmMessages: [],
  setDmMessages: (messages) => set({ dmMessages: messages }),
  addDmMessage: (message) => set((state) => ({
    dmMessages: [...state.dmMessages, message]
  })),

  // 未读数
  dmUnreadCount: 0,
  setDmUnreadCount: (count) => set({ dmUnreadCount: count }),
  incrementDmUnread: () => set((state) => ({ dmUnreadCount: state.dmUnreadCount + 1 })),
  decrementDmUnread: (count = 1) => set((state) => ({
    dmUnreadCount: Math.max(0, state.dmUnreadCount - count)
  })),
});