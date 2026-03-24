// store/types.ts

// --------------------------------------------------
// 1. 基础数据结构
// --------------------------------------------------

// [新增] 会话状态机状态
export type SessionStatus = 'idle' | 'loading' | 'ready' | 'creating' | 'error';

// [新增] 会话错误类型
export type SessionErrorType =
  | 'LOAD_FAILED'
  | 'CREATE_FAILED'
  | 'MESSAGE_SAVE_FAILED'
  | 'NETWORK_ERROR';

// [新增] 会话错误信息
export interface SessionError {
  type: SessionErrorType;
  message: string;
  recoverable: boolean;
}

export interface Tab {
  id: string;
  type: 'read' | 'search' | 'dashboard' | 'highlights' | 'notes' | 'plans' | 'cross-ref' | 'group' | 'atlas' | 'theme-graph' | 'insights';
  book?: string;
  chapter?: string;
  query?: string;
  searchMode?: 'exact' | 'ai' | 'fuzzy';
  results?: any[];
  scrollTop?: number;
  // Cross-ref specific
  crossRefSource?: {
    bookId: string;
    bookName: string;
    chapter: number;
    verse: number;
    content: string;
  };
  // Atlas specific
  atlasData?: {
    locationId?: string;
    year?: number;
    journeyId?: string;
    // 经文上下文，用于 AI 提取地点
    bookId?: string;
    bookName?: string;
    chapter?: number;
    verseStart?: number;
    verseEnd?: number;
    verseContent?: string;
  };
  // Theme-graph specific
  themeGraphData?: {
    themeId?: string;
    searchTerm?: string;
  };
}

export interface HighlightData {
  bookId: string;
  chapter: number;
  verse: number;
  color: string;
  updatedAt?: string;
}

export type SyncMode = 'merge' | 'overwrite';

export interface SyncSlice {
  syncMode: SyncMode;
  setSyncMode: (mode: SyncMode) => void;
  lastSyncTime: number | null;
  setLastSyncTime: (time: number) => void;
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
  syncError: string | null;
  setSyncError: (error: string | null) => void;
}

export interface NoteData {
  id: string; 
  bookId: string;
  chapter: number;
  verse: number;
  content: string;
  updatedAt?: string;
}

export interface VerseRef {
  bookName: string;
  chapter: number;
  verse: number;
}

// AI 队列请求项
export interface AIQueueItem {
  id: string;
  prompt: string;
  content: string;
  context: string;
  ref: VerseRef;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'error';
  error?: string;
}

export interface InteractionLog {
  bookId: string;
  chapter: number;
  count: number;
}

export interface Badge {
  type: string;
  earnedAt: number;
}


// API configuration
// Simplified: local (Ollama) or cloud (OpenAI-compatible API)
export interface ApiConfig {
  provider: 'local' | 'cloud';
  baseUrl: string;
  apiKey: string;
  model: string;
}

// [新增] AI 风格设置
export interface AIStyleSettings {
  aiDetail: 'concise' | 'balanced' | 'detailed';
  aiDepth: 'beginner' | 'intermediate' | 'academic';
  aiTone: 'modern' | 'traditional';
}

// [新增] AI 会话
export interface ChatSession {
  id: string;
  bookId?: string;
  chapter?: number;
  startVerse?: number;
  endVerse?: number;
  title?: string;
  mode: 'general' | 'tutor' | 'sermon' | 'study-guide' | 'custom';
  createdAt: string;
  updatedAt: string;
}

// [新增] 自定义提示词
export interface CustomPrompt {
  id: string;
  label: string;
  prompt: string;
  isDefault: boolean;
  createdAt: string;
}

// [新增] AI 解读收藏
export interface SavedInsight {
  id: string;
  messageId: string;
  bookId: string;
  chapter: number;
  verse?: number;
  title?: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

// [新增] 快捷动作配置
export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  prompt: string;
  mode?: 'general' | 'tutor' | 'sermon' | 'study-guide';
  priority: number;
  category?: 'selected' | 'reading' | 'plan' | 'completed';
}

export interface PlanProgress {
  planId: string;
  startDate: number;
  status?: 'active' | 'completed';
  completedTasks: Record<string, string[]>;
  savedDevotionals?: Record<string, string>;
}

// --------------------------------------------------
// 2. 状态切片 (Slice) 接口
// --------------------------------------------------
// 新手引导状态
export interface OnboardingState {
  completed: boolean;
  shown: boolean;
}

export interface OnboardingStatus {
  welcome: OnboardingState;
  reading: OnboardingState;
  ai: OnboardingState;
  plan: OnboardingState;
  group: OnboardingState;
}

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

  // [新增] 记住用户在读经计划页面当前查看的计划ID
  viewingPlanId: string | null;
  setViewingPlanId: (id: string | null) => void;

  // [新增] 新手引导状态
  onboarding: OnboardingStatus;
  initOnboarding: (status: Partial<OnboardingStatus>) => void;
  startOnboarding: (type: keyof OnboardingStatus) => void;
  completeOnboarding: (type: keyof OnboardingStatus) => void;
  skipOnboarding: (type: keyof OnboardingStatus) => void;
  resetOnboarding: (type?: keyof OnboardingStatus) => void;
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
  // [修复] 在这里补上 'highlights' | 'notes' | 'plans' | 'cross-ref' | 'group'
  addTab: (params: {
    type: 'read' | 'search' | 'dashboard' | 'highlights' | 'notes' | 'plans' | 'cross-ref' | 'group' | 'atlas' | 'theme-graph' | 'insights';
    book?: string;
    chapter?: string;
    query?: string;
    searchMode?: 'exact' | 'ai' | 'fuzzy';
    crossRefSource?: {
      bookId: string;
      bookName: string;
      chapter: number;
      verse: number;
      content: string;
    };
  }) => void;
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
  // 队列相关
  currentAiRequest: AIQueueItem | null;
  aiQueue: AIQueueItem[];
  enqueueAI: (prompt: string, content: string, context: string, ref: VerseRef) => void;
  cancelAIRequest: (id: string) => void;
  clearAIQueue: () => void;
  startProcessingNext: () => void;
  completeCurrentRequest: () => void;
  failCurrentRequest: (error?: string) => void;
  // 兼容旧接口（标记为废弃但仍保留）
  /** @deprecated Use enqueueAI instead */
  aiRequestTrigger: { prompt: string; content: string; context: string; ref: VerseRef; timestamp: number; } | null;
  /** @deprecated Use enqueueAI instead */
  triggerAI: (prompt: string, content: string, context: string, ref: VerseRef) => void;

  // [新增] 会话状态机 - 简化状态管理
  sessionStatus: SessionStatus;
  sessionError: SessionError | null;
  setSessionStatus: (status: SessionStatus) => void;
  setSessionError: (error: SessionError | null) => void;
  resetSession: () => void;

  // [新增] 会话加载状态
  sessionsLoading: boolean;
  messagesLoading: boolean;
  setSessionsLoading: (loading: boolean) => void;
  setMessagesLoading: (loading: boolean) => void;

  // [新增] 会话管理
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  sessions: ChatSession[];
  setSessions: (sessions: ChatSession[]) => void;
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, data: Partial<ChatSession>) => void;
  deleteSession: (id: string) => void;
  // [新增] AI 模式
  aiMode: 'general' | 'tutor' | 'sermon' | 'study-guide' | 'custom';
  setAiMode: (mode: 'general' | 'tutor' | 'sermon' | 'study-guide' | 'custom') => void;
  // [新增] AI 风格设置
  aiStyleSettings: AIStyleSettings;
  setAiStyleSettings: (settings: Partial<AIStyleSettings>) => void;
  // [新增] 自定义提示词
  customPrompts: CustomPrompt[];
  setCustomPrompts: (prompts: CustomPrompt[]) => void;
  addCustomPrompt: (prompt: CustomPrompt) => void;
  deleteCustomPrompt: (id: string) => void;
  // [新增] 收藏的 AI 解读
  savedInsights: SavedInsight[];
  setSavedInsights: (insights: SavedInsight[]) => void;
  addSavedInsight: (insight: SavedInsight) => void;
  updateSavedInsight: (id: string, data: Partial<SavedInsight>) => void;
  deleteSavedInsight: (id: string) => void;
  // [新增] 快捷动作
  quickActions: QuickAction[];
  activeQuickAction: QuickAction | null;
  setActiveQuickAction: (action: QuickAction | null) => void;
  // [新增] 引导状态
  onboardingStep: number | null;
  setOnboardingStep: (step: number | null) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  // [新增] Magic Ball 位置
  magicBallPosition: { bottom: number; right: number };
  setMagicBallPosition: (position: { bottom: number; right: number }) => void;
  // [新增] AI 字体大小
  aiFontSize: 'small' | 'medium' | 'large' | 'xlarge';
  setAiFontSize: (size: 'small' | 'medium' | 'large' | 'xlarge') => void;
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

  setAllUserData: (data: { settings?: any, highlights?: any[], notes?: any[], interactions?: any[], activePlans?: any[], customPlans?: any[], streakCount?: number, lastActiveDate?: number | null, badges?: Badge[] }) => void;

  interactions: InteractionLog[];
  recordInteraction: (bookId: string, chapter: number, weight?: number) => void;

  clearAllHighlights: () => void;
  clearAllNotes: () => void;
  clearAllInteractions: () => void;

  // [新增] 读经计划状态（支持多计划、火苗与颗粒度）
  // [修复] 补回自定义计划的类型声明
  customPlans: any[];
  addCustomPlan: (plan: any) => void;
  deleteCustomPlan: (id: string) => void;
  activePlans: PlanProgress[];
  startPlan: (planId: string) => void;
  toggleTaskCompleted: (planId: string, day: number, taskId: string) => void; // 修改方法名以反映"任务级"概念
  quitPlan: (planId: string) => void;
  archivePlan: (planId: string) => void;

  // [新增] 火苗与统计
  streakCount: number;
  lastActiveDate: number | null;

  // [修改] 追赶进度与流式阅读上下文
  catchUpPlan: (planId: string) => void;
  
  readingPlanContext: {
    planId: string;
    planTitle: string;
    day: number;
    stepIndex: number;
    steps: {
      type: 'devotional' | 'reading' | 'completion';
      taskId: string;
      book?: string;
      chapter?: number;
      content?: string;
    }[]
  } | null;
  setReadingPlanContext: (ctx: any) => void;
  advancePlanStep: () => void;
  previousPlanStep: () => void;
  updateStreak: () => void;

  // [新增] 勋章系统
  badges: Badge[];
  checkAndUnlockBadges: () => void;

  // [新增] AI 灵修导读生成
  generateAiDevotional: (planId: string, day: number, planTitle: string, readings: any[]) => Promise<void>;

  // API configuration
  apiConfig: ApiConfig;
  setApiConfig: (config: Partial<ApiConfig>) => void;
}

// --------------------------------------------------
// 3. 聚合总状态类型
// --------------------------------------------------
export type StoreState = UISlice & ReaderSlice & AISlice & UserDataSlice & SyncSlice & GroupSlice & AtlasSlice & DMSlice;

// --------------------------------------------------
// 4. 小组读经计划状态 (GroupSlice)
// --------------------------------------------------
export interface GroupPlanContext {
  churchId: string;
  planId: string;
  planName: string;
  day: number;
  stepIndex: number;
  steps: {
    type: 'devotional' | 'reading' | 'completion';
    taskId: string;
    book?: string;
    chapter?: number;
    content?: string;
  }[];
}

export interface GroupSlice {
  // 小组阅读上下文
  groupPlanContext: GroupPlanContext | null;

  // 小组计划选择状态（用于跨标签页保持）
  selectedGroupForPlan: { churchId: string; role: string; church: any } | null;
  selectedPlanId: string | null;
  setSelectedGroupForPlan: (group: { churchId: string; role: string; church: any } | null) => void;
  setSelectedPlanId: (planId: string | null) => void;

  // 方法
  setGroupPlanContext: (ctx: GroupPlanContext | null) => void;
  advanceGroupPlanStep: () => void;
  previousGroupPlanStep: () => void;
  toggleGroupTaskCompleted: (churchId: string, planId: string, day: number, taskId: string, action?: 'complete' | 'uncomplete') => Promise<void>;
  startGroupPlanFlow: (churchId: string, planId: string, planName: string, tasks: any[], day: number) => void;
}

// --------------------------------------------------
// 5. 圣经地图与时间线状态 (AtlasSlice)
// --------------------------------------------------

export interface BibleLocationData {
  id: string;
  nameZh: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  region?: string;
  description?: string;
}

export interface BibleEventData {
  id: string;
  titleZh: string;
  yearStart?: number;
  yearEnd?: number;
  locationId?: string;
  category: string;
}

export interface AtlasSlice {
  // 当前选中的地点
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;

  // 地点详情
  selectedLocation: BibleLocationData | null;
  setSelectedLocation: (location: BibleLocationData | null) => void;

  // 时间线状态
  timelineYear: number;
  setTimelineYear: (year: number) => void;
  timelineRange: [number, number];
  setTimelineRange: (range: [number, number]) => void;

  // 旅程播放
  activeJourneyId: string | null;
  setActiveJourneyId: (id: string | null) => void;
  journeyStep: number;
  setJourneyStep: (step: number) => void;
  isPlayingJourney: boolean;
  setIsPlayingJourney: (playing: boolean) => void;

  // 地图视图状态
  mapCenter: [number, number];
  setMapCenter: (center: [number, number]) => void;
  mapZoom: number;
  setMapZoom: (zoom: number) => void;

  // 地点搜索
  locationSearchQuery: string;
  setLocationSearchQuery: (query: string) => void;
  locationSearchResults: BibleLocationData[];
  setLocationSearchResults: (results: BibleLocationData[]) => void;

  // 面板状态
  isAtlasPanelOpen: boolean;
  setAtlasPanelOpen: (open: boolean) => void;
  atlasPanelTab: 'map' | 'timeline' | 'journey';
  setAtlasPanelTab: (tab: 'map' | 'timeline' | 'journey') => void;

  // 经文上下文 - 用于AI提取地点
  atlasVerseContext: {
    bookId: string;
    bookName: string;
    chapter: number;
    verseStart: number;
    verseEnd: number;
    verseContent: string;
  } | null;
  setAtlasVerseContext: (context: AtlasSlice['atlasVerseContext']) => void;

  // 查看地点相关经文
  viewingLocationVerses: {
    locationId: string;
    locationName: string;
  } | null;
  setViewingLocationVerses: (data: AtlasSlice['viewingLocationVerses']) => void;
}

// --------------------------------------------------
// 6. 私信状态 (DMSlice)
// --------------------------------------------------

export interface DMConversation {
  userId: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface DMMessage {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  type: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
  receiver: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface DMSlice {
  // 私信面板状态
  isDmPanelOpen: boolean;
  setDmPanelOpen: (open: boolean) => void;

  // 会话列表
  dmConversations: DMConversation[];
  setDmConversations: (conversations: DMConversation[]) => void;

  // 当前选中的会话
  activeDmUserId: string | null;
  setActiveDmUserId: (userId: string | null) => void;

  // 当前会话的消息
  dmMessages: DMMessage[];
  setDmMessages: (messages: DMMessage[]) => void;
  addDmMessage: (message: DMMessage) => void;

  // 未读数
  dmUnreadCount: number;
  setDmUnreadCount: (count: number) => void;
  incrementDmUnread: () => void;
  decrementDmUnread: (count?: number) => void;
}