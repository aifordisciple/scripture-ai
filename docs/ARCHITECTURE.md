# AI读 (Scripture AI) 系统架构文档

## 概述

**AI读**是一款AI驱动的圣经阅读与灵修应用，提供AI经文解读、TTS语音朗读、高亮标记、笔记、阅读计划等功能。中文优先界面，支持CUV/KJV双语对照。

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router), TypeScript |
| UI组件 | Radix UI, Tailwind CSS 4, Framer Motion, Lucide React |
| 状态管理 | Zustand (Redux-like slices模式) |
| 数据库 | PostgreSQL + Prisma ORM (pgvector向量嵌入) |
| 认证 | NextAuth.js v5 (Credentials provider) |
| AI | OpenAI SDK / DeepSeek / Ollama |
| TTS | Python edge-tts |
| 移动端 | Expo React Native (`app-mobile/`) |

---

## 1. 目录结构

```
scripture-ai/
├── app/                        # Next.js App Router
│   ├── api/                    # API路由 (40+端点)
│   │   ├── auth/               # NextAuth认证
│   │   ├── chat/              # AI聊天: 主对话、灵修、祷告、讲道等
│   │   ├── church/             # 教会/小组系统
│   │   ├── highlight/          # 高亮 CRUD
│   │   ├── note/              # 笔记 CRUD
│   │   ├── tts/               # 文字转语音
│   │   ├── atlas/              # 圣经地图/时间线数据
│   │   ├── theme/              # 主题图谱端点
│   │   └── ...                # user, sync, feedback, memory等
│   ├── layout.tsx              # 根布局
│   └── page.tsx                # 主阅读页面
├── components/                 # React组件
│   ├── bible/                  # 核心阅读组件
│   │   ├── Reader.tsx          # 经文渲染 (~400行)
│   │   ├── AISidebar.tsx      # AI聊天界面 (~600行)
│   │   ├── MagicBall.tsx      # 浮动操作按钮
│   │   ├── PlanTab.tsx        # 阅读计划UI (~600行)
│   │   └── ShareCard.tsx      # 经文图片生成 (~700行)
│   ├── atlas/                  # 圣经地图组件
│   ├── theme/                  # 主题图谱组件
│   ├── group/                   # 小组读经组件
│   ├── ui/                     # Radix UI原语组件
│   ├── auth/                   # 认证组件
│   └── ...
├── store/                      # Zustand状态管理
│   ├── slices.ts               # 8个slice定义
│   ├── useBibleStore.ts        # 主store导出
│   └── types.ts                # TypeScript类型
├── lib/                        # 核心工具库
│   ├── auth.ts                 # NextAuth配置
│   ├── prisma.ts               # Prisma单例
│   ├── constants.ts            # 圣经书卷、提示词
│   ├── plans.ts                # 阅读计划定义
│   └── ai-client.ts            # AI模型工厂
├── hooks/                      # 自定义React Hooks
│   ├── use-audio-player.ts     # 音频播放
│   ├── use-bible-search.ts     # 经文搜索
│   └── ...
├── prisma/
│   └── schema.prisma            # 数据库模型 (35+模型)
└── app-mobile/                 # Expo React Native移动端
```

---

## 2. 应用层 (app/)

### 2.1 根布局 (`app/layout.tsx`)

根布局包裹整个应用，提供全局Provider：

```tsx
// 核心Provider
<AuthProvider>           // NextAuth会话管理
<SyncProvider>           // 背景数据同步组件
<BadgePopup>            // 徽章成就通知
<AnalyticsTracker>       // 页面浏览分析
```

**功能**：
- SEO配置 (metadata API)
- PWA清单支持
- OpenGraph社交分享
- JSON-LD结构化数据

### 2.2 主页面 (`app/page.tsx`)

单页应用入口，渲染圣经阅读器界面：

**核心功能**：
- 动态Tab系统，支持多种视图类型
- 桌面端侧边栏 + 移动端Sheet侧边栏
- Tab列表（水平滚动）
- 设置下拉菜单（字体大小、行高、暗色模式、全屏）
- 音频播放器集成
- 键盘快捷键 (Ctrl+K搜索, Alt+1-4 AI模式)

**支持的Tab类型**：

| Tab类型 | 组件 | 用途 |
|---------|------|------|
| `read` | Reader.tsx | 圣经文本显示 |
| `search` | SearchResults.tsx | 搜索结果 |
| `dashboard` | DashboardTab.tsx | 用户统计 |
| `highlights` | HighlightsTab.tsx | 高亮经文 |
| `notes` | NotesTab.tsx | 用户笔记 |
| `plan` | PlanTab.tsx | 阅读计划 |
| `cross-ref` | CrossRefTab.tsx | 经文交叉引用 |
| `group` | GroupTab.tsx | 教会/小组读经 |
| `atlas` | atlas组件 | 圣经地理 |
| `theme-graph` | ThemeGraphTab.tsx | 主题网络图 |
| `insights` | InsightsTab.tsx | 保存的AI解读 |
| `bookmarks` | BookmarksTab.tsx | 书签章节 |
| `reading-history` | ReadingHistoryTab.tsx | 阅读历史 |

---

## 3. API路由架构 (app/api/)

### 3.1 API路由总览

```
app/api/
├── auth/[...nextauth]/     # NextAuth认证
├── bible/                  # 圣经数据获取
├── chat/                   # AI聊天主路由
│   ├── route.ts           # 流式AI响应
│   ├── message/           # 消息CRUD
│   ├── session/           # 会话管理
│   ├── devotional/        # 灵修模式
│   ├── plan/             # 计划模式
│   ├── prayer/           # 祷告模式
│   ├── verse/            # 经文解释
│   ├── tutor/            # 导师模式
│   ├── sermon/           # 讲道模式
│   └── study-guide/       # 学习指南
├── church/                # 教会/小组系统
│   ├── route.ts          # 教会CRUD
│   ├── [id]/route.ts     # 单个教会
│   ├── [id]/plan/        # 小组读经计划
│   ├── [id]/plan/[planId]/progress/  # 进度追踪
│   ├── [id]/leaderboard/ # 排行榜
│   ├── [id]/activity/    # 活动动态
│   ├── [id]/announcement/# 公告
│   ├── [id]/chat/        # 小组聊天
│   ├── [id]/badges/      # 小组徽章
│   ├── [id]/behind-members/  # 落后成员
│   ├── [id]/remind/      # 提醒
│   └── unread-count/      # 未读计数
├── highlight/             # 高亮 CRUD
├── note/                  # 笔记 CRUD
├── search/                # 经文搜索
├── cross-reference/        # 交叉引用
├── atlas/
│   ├── locations/         # 地理位置
│   ├── events/           # 历史事件
│   ├── journeys/          # 圣经旅程
│   └── ai-extract/       # AI提取位置
├── card-image/            # 经文卡片图片
├── card-theme/            # 卡片主题
├── tts/                   # 文字转语音
├── user/
│   ├── sync/             # 数据同步
│   ├── dashboard/        # 仪表盘统计
│   ├── settings/         # 用户设置
│   ├── onboarding/       # 入门引导
│   └── api-keys/         # API密钥
├── admin/                 # 管理后台
│   ├── stats/            # 平台统计
│   ├── churches/         # 教会管理
│   ├── users/           # 用户管理
│   ├── messages/         # 批量消息
│   ├── announcements/    # 系统公告
│   └── logs/             # 操作日志
├── events/               # SSE实时更新
├── feedback/             # 用户反馈
├── friends/              # 好友关系
├── posts/                # 社交帖子
├── memory/               # 间隔重复记忆卡
├── insights/             # 保存的AI解读
├── reminder/             # 阅读提醒
├── notification/         # 用户通知
└── theme/                # 主题管理
```

### 3.2 认证流程 (`app/api/auth/[...nextauth]/route.ts`)

NextAuth v5使用JWT策略，Credentials provider：

```
1. 用户提交 email/password
2. bcrypt验证密码
3. 生成JWT token存入session
4. AuthProvider包装应用，SessionProvider提供会话
```

### 3.3 AI聊天流程 (`app/api/chat/route.ts`)

使用Vercel AI SDK实现流式响应：

```typescript
// 请求流程
1. POST /api/chat 接收消息数组
2. 原子性保存用户消息到数据库
3. 构建系统提示词（包含神学偏好、记忆上下文）
4. 调用 streamText 触发AI模型
5. SSE流式返回响应
6. 流结束保存AI回复到数据库
```

**AI模式**：
- `general` - 一般对话
- `tutor` - 经文导师
- `sermon` - 讲道助手
- `study-guide` - 学习指南
- `devotional` - 灵修
- `prayer` - 祷告伴侣

### 3.4 数据同步 (`app/api/user/sync/route.ts`)

双向同步localStorage和服务器：

| 方法 | 端点 | 用途 |
|------|------|------|
| GET | `/api/user/sync` | 获取所有用户数据（设置、高亮、笔记、交互、计划、徽章） |
| POST | `/api/user/sync` | 保存本地状态到服务器（merge/overwrite模式） |

### 3.5 教会/小组系统 (`app/api/church/`)

```
Church (教会)
├── ChurchMember (成员)
├── GroupPlan (读经计划)
│   └── GroupPlanProgress (个人进度)
├── GroupChatMessage (群聊消息)
├── GroupAnnouncement (公告)
├── GroupBadge (徽章)
└── InviteCode (邀请码)
```

**角色权限**：`OWNER` > `ADMIN` > `MEMBER`

### 3.6 SSE实时更新 (`app/api/events/route.ts`)

支持的事件类型：
- `notifications` - 通知
- `group_messages` - 群消息
- `direct_messages` - 私信
- `feedback_replies` - 反馈回复
- `plan_updates` - 计划更新
- `heartbeat` - 心跳保活

---

## 4. 组件层 (components/)

### 4.1 核心阅读组件 (`components/bible/`)

#### Reader.tsx

圣经阅读器主组件 (~400行)：

**功能**：
- CUV/KJV双语对照显示
- 高亮颜色（黄、绿、蓝、红）
- 长按选择经文
- 浮动上下文菜单
- 左右滑动切换章节
- AI解释触发
- 经文复制
- 预加载下一章
- 阅读进度追踪（停留30秒=1次交互）

```tsx
// 核心状态
const [selectedVerse, setSelectedVerse] = useState<VerseRef | null>(null)
const [contextMenu, setContextMenu] = useState<{verse: VerseRef, position: Position} | null>(null)

// 关键函数
handleVerseSelect(verse: VerseRef)      // 选择经文
handleAISuggest(verse: VerseRef)        // 触发AI解释
preloadChapter(bookId: string, chapter: number)  // 预加载
```

#### AISidebar.tsx

AI聊天侧边栏 (~600行)：

**功能**：
- 虚拟化消息列表
- 快速提示词快捷方式
- 会话管理
- 多AI模式切换
- 流式响应展示
- 消息复制
- 保存解读管理

#### MagicBall.tsx

浮动操作按钮：
- 快速书籍选择器
- AI激活
- 可拖动定位

#### PlanTab.tsx

阅读计划UI (~600行)：
- 计划列表展示
- 每日读经流程
- 进度追踪
- 灵修生成

#### ShareCard.tsx

经文卡片生成器 (~700行)：
- 经文图片生成
- 多种主题样式
- 分享到社交媒体

### 4.2 小组组件 (`components/group/`)

| 组件 | 用途 |
|------|------|
| `GroupPlanDetail.tsx` | 小组计划展示与日历 |
| `GroupPlanDailyFlow.tsx` | 每日读经流程控制器 |
| `GroupChat.tsx` | 小组聊天界面 |
| `MemberManager.tsx` | 成员管理 |
| `Leaderboard.tsx` | 排行榜展示 |
| `GroupStats.tsx` | 小组统计 |
| `AnnouncementManager.tsx` | 公告管理 |
| `InviteCodeManager.tsx` | 邀请码生成 |
| `GroupProgressCalendar.tsx` | 进度可视化日历 |
| `BehindMembersPanel.tsx` | 需要鼓励的落后成员 |
| `GroupBadgeGallery.tsx` | 小组徽章墙 |
| `PlanCompletionCelebration.tsx` | 完成庆祝动画 |

### 4.3 UI组件 (`components/ui/`)

基于Radix UI的原始组件：
- `button`, `dialog`, `dropdown-menu`, `sheet`, `tabs`
- `slider`, `switch`, `select`, `textarea`
- `avatar`, `badge`, `card`, `progress`, `skeleton`
- `scroll-area`, `separator`, `label`, `input`, `icon`

---

## 5. 状态管理 (store/)

### 5.1 Zustand Slice架构

使用Redux风格的slice模式：

```typescript
// store/useBibleStore.ts
const useBibleStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createUISlice(...a),        // UI状态
      ...createReaderSlice(...a),    // 阅读器状态
      ...createAISlice(...a),        // AI状态
      ...createUserDataSlice(...a),  // 用户数据
      ...createSyncSlice(...a),      // 同步状态
      ...createGroupSlice(...a),     // 小组状态
      ...createAtlasSlice(...a),     // 地图状态
      ...createDMSlice(...a),       // 私信状态
    }),
    { name: 'bible-storage', storage: localStorage, partialize: (...) => {...} }
  )
)
```

### 5.2 Slice详情

#### UISlice
```typescript
{
  isAuthOpen: boolean,           // 认证弹窗
  isSidebarOpen: boolean,         // 侧边栏开关
  onboarding: OnboardingState,    // 入门引导状态
  actions: { toggleSidebar, setAuthOpen, ... }
}
```

#### ReaderSlice
```typescript
{
  tabs: Tab[],                    // 所有打开的Tab
  activeTabId: string,            // 当前活跃Tab
  fontSize: number,               // 字体大小
  isDarkMode: boolean,            // 暗色模式
  actions: { addTab, closeTab, setActiveTab, ... }
}
```

#### AISlice
```typescript
{
  isAiOpen: boolean,              // AI侧边栏
  sessions: ChatSession[],        // AI会话列表
  currentSessionId: string | null,
  aiQueue: AIQueueItem[],         // AI请求队列
  aiStyleSettings: AIStyleSettings,
  actions: { enqueueAI, completeCurrentRequest, cancelAIRequest, ... }
}
```

#### UserDataSlice
```typescript
{
  highlights: Highlight[],         // 高亮列表
  notes: Note[],                  // 笔记列表
  activePlans: PlanProgress[],    // 活跃计划
  bookmarks: Bookmark[],          // 书签
  readingHistory: Interaction[], // 阅读历史
  actions: { addHighlightLocally, toggleTaskCompleted, generateAiDevotional, ... }
}
```

#### GroupSlice
```typescript
{
  groupPlanContext: GroupPlanContext | null,  // 小组读经流程上下文
  selectedGroupForPlan: Church | null,
  actions: { startGroupPlanFlow, advanceGroupPlanStep, toggleGroupTaskCompleted, ... }
}
```

### 5.3 持久化策略

**localStorage持久化** (通过Zustand persist中间件)：
- UISlice (部分)
- ReaderSlice
- UserDataSlice
- GroupSlice (部分)

**不持久化** (页面刷新重置)：
- AI会话和消息 (从API加载)
- 同步状态
- 小组计划上下文
- 地图状态
- 私信状态

---

## 6. 核心库 (lib/)

### 6.1 核心文件

| 文件 | 用途 |
|------|------|
| `auth.ts` | NextAuth配置，Credentials provider |
| `prisma.ts` | Prisma客户端单例，全局缓存 |
| `constants.ts` | 圣经书卷数据，系统提示词 |
| `plans.ts` | 阅读计划模板 (如"新约90天通读") |
| `ai-client.ts` | AI模型工厂 (Ollama/MiniMax) |
| `utils.ts` | `cn()`工具 (clsx + tailwind-merge) |

### 6.2 AI客户端配置

```typescript
interface AIConfig {
  provider: 'local' | 'cloud',  // local=Ollama, cloud=MiniMax
  model: string,
  apiKey: string,
  baseUrl: string,
}

// 优先级: 请求配置 > 数据库配置 > 环境变量
getAIModel(requestConfig?, userId?) → 配置好的AI模型
```

**支持的AI提供商**：
- **本地**: Ollama @ `http://host.docker.internal:11434/v1`
- **云端**: MiniMax API @ `https://api.minimaxi.com/v1`

### 6.3 工具库

| 文件 | 用途 |
|------|------|
| `bible-periods.ts` | 圣经时期定义 |
| `group-badges.ts` | 徽章类型定义 |
| `cache.ts` | 缓存工具 |
| `rate-limit.ts` | 限流助手 |
| `sse-manager.ts` | SSE连接管理 |
| `verse-preloader-service.ts` | 章节预加载服务 |
| `ai-context-builder.ts` | 构建AI上下文提示词 |
| `notification-service.ts` | 通知助手 |
| `memory-reminder-service.ts` | 间隔重复调度 |
| `cross-reference-ai.ts` | AI交叉引用 |

---

## 7. 自定义Hooks (hooks/)

### 7.1 Hook总览

| Hook | 用途 |
|------|------|
| `useAudioPlayer` | TTS音频播放，Media Session API |
| `useBibleData` | 获取和缓存圣经章节 |
| `useOfflineCache` | IndexedDB离线存储 |
| `useRealtime` | SSE实时连接 |
| `useSwipeNavigation` | 触摸滑动章节导航 |
| `useVerseMenu` | 经文上下文菜单 |
| `useGroupUnread` | 小组未读计数 |
| `usePwaInstall` | PWA安装提示 |
| `useMediaQuery` | 响应式设计辅助 |

### 7.2 useAudioPlayer

```typescript
useAudioPlayer(onFinished?: () => void)
// 返回: { isPlaying, isLoading, duration, currentTime, playbackRate, play, pause, stop, seek, setRate }

// 功能:
// - Lock screen控件 (Media Session API)
// - 完成后自动下一章
// - 遵循阅读计划上下文
// - 播放速率控制
```

### 7.3 useOfflineCache

```typescript
useOfflineCache()
// 返回: { isOnline, cachedChapters, cacheChapter, getCachedChapter, clearCache, syncData }

// IndexedDB结构:
// - store: chapters
// - keyPath: [bookId, chapter]
// - index: cachedAt
```

---

## 8. 数据库层 (Prisma)

### 8.1 数据模型总览 (35+模型)

```
User System
├── User                  # 用户账户
├── UserSetting           # 偏好设置和API配置
├── Badge                 # 成就徽章
└── PrivacySettings       # 隐私设置

Bible Content
├── BibleVerse            # 圣经经文 (带向量嵌入)
├── BibleLocation         # 地理位置
├── BibleVerseLocation    # 经文-位置关联
├── BibleEvent            # 历史事件
├── BibleJourney          # 圣经旅程
├── BibleTheme            # 神学主题
└── VerseConnection       # 经文关联 (主题/引用/平行/预言)

Reading Features
├── Highlight             # 高亮
├── Note                  # 笔记 (可分享到小组)
├── Interaction           # 阅读历史
├── Bookmark              # 书签
└── MemoryCard            # 间隔重复记忆卡
    └── ReviewLog         # 复习记录

AI Features
├── ChatSession           # AI对话会话
├── ChatMessage           # 消息
├── CustomPrompt          # 自定义提示词
└── SavedInsight          # 保存的AI解读

Social Features
├── Friend                # 好友关系
├── DirectMessage         # 私信
├── Like                  # 点赞
├── Comment               # 评论
└── Feedback              # 用户反馈

Group System
├── Church                # 教会/小组
├── ChurchMember          # 成员 (OWNER/ADMIN/MEMBER)
├── GroupPlan             # 小组读经计划
├── GroupPlanProgress     # 个人进度
├── GroupChatMessage      # 群聊消息
├── GroupAnnouncement     # 公告
├── GroupBadge            # 小组徽章
├── GroupCheckInActivity  # 每日签到动态
├── LeaderboardEntry      # 排行榜
└── InviteCode            # 邀请码

Activity & Analytics
├── ActivityLog           # 每日活动记录
├── PageView              # 页面浏览
└── Notification          # 应用内通知

System
├── Reminder              # 提醒
├── NotificationToken     # FCM推送Token
├── ApiKey                # API访问密钥
├── AdminLog              # 管理员操作日志
└── SystemAnnouncement    # 系统公告
```

### 8.2 关键关系图

```
User (1)
├── UserSetting (1:1)
├── Highlight (1:N)
├── Note (1:N)
├── ChatSession (1:N)
│   └── ChatMessage (1:N)
├── Interaction (1:N)
├── PlanProgress (1:N)
├── Badge (1:N)
├── MemoryCard (1:N)
│   └── ReviewLog (1:N)
├── Church (1:N, as owner)
│   └── ChurchMember (1:N)
├── GroupPlanProgress (1:N)
├── Friend (1:N, bidirectional)
├── DirectMessage (1:N)
├── Feedback (1:N)
├── Notification (1:N)
└── ApiKey (1:N)

Church (1)
├── ChurchMember (1:N)
├── GroupPlan (1:N)
├── GroupChatMessage (1:N)
├── GroupAnnouncement (1:N)
├── GroupBadge (1:N)
└── InviteCode (1:N)
```

---

## 9. 关键工作流

### 9.1 用户认证流程

```
1. 用户在登录弹窗输入 email/password
2. AuthProvider 包装应用的 SessionProvider
3. NextAuth Credentials provider 调用 bcrypt 验证
4. JWT token 存入 session
5. SyncProvider 检测到 session，调用 GET /api/user/sync
6. Store 填充高亮、笔记、计划、徽章等数据
```

### 9.2 AI聊天流程

```
1. 用户选择经文触发AI解释
2. enqueueAI() 添加请求到队列
3. 前端 POST /api/chat 携带消息数组
4. 后端流程:
   a. 原子性保存用户消息
   b. 构建系统提示词 (上下文+用户记忆)
   c. 调用 streamText 流式响应
   d. 流结束保存AI回复
5. 前端接收SSE流增量显示
6. 消息保存到本地会话状态
```

### 9.3 数据同步流程

**登录时**:
```
SyncProvider.useEffect(session)
  → GET /api/user/sync
  → setAllUserData()
```

**状态变更时** (防抖3s):
```
Store状态变更
  → SyncProvider effect
  → POST /api/user/sync
  → setAllUserData(response.data)
```

**同步模式**:
- `merge`: 合并本地和服务器变更
- `overwrite`: 服务器状态覆盖本地

### 9.4 小组读经流程

```
1. 用户创建/加入教会
2. 管理员创建带每日读经的计划
3. 成员在GroupTab看到计划
4. 用户开始每日流程:
   a. startGroupPlanFlow() 设置上下文并导航到阅读Tab
   b. advanceGroupPlanStep() 标记任务完成并推进
   c. toggleGroupTaskCompleted() 同步到服务器
5. 进度更新排行榜
6. 落后成员显示在BehindMembersPanel
```

### 9.5 离线阅读流程

```
1. useOfflineCache hook 管理 IndexedDB
2. 在线时 cacheChapter() 存储获取的经文
3. 离线时 getCachedChapter() 从IndexedDB获取
4. 重新连接时 syncData() 发送待处理变更到服务器
```

### 9.6 音频播放流程

```
1. useBibleData 获取经文并设置 chapterSpeechText
2. useAudioPlayer 监听 chapterSpeechText 变化
3. 文本变化时 POST /api/tts 携带文本
4. 接收MP3 blob，创建object URL，用<audio>播放
5. Media Session API 设置锁屏控件
6. onended 时检查 readingPlanContext:
   - 如果在计划中，调用 advancePlanStep()
   - 否则调用 onFinished (自动下一章)
```

---

## 10. 第三方集成

| 服务 | 用途 | 配置 |
|------|------|------|
| NextAuth.js | 认证 | JWT策略，Credentials provider |
| Prisma | ORM | PostgreSQL + pgvector扩展 |
| Vercel AI SDK | AI流式响应 | streamText + onFinish回调 |
| Radix UI | UI原语 | Dialog, Sheet, Tabs等 |
| Tailwind CSS | 样式 | clsx + tailwind-merge |
| Framer Motion | 动画 | 页面过渡，Tab动画 |
| Lucide React | 图标 | 统一图标集 |
| date-fns | 日期处理 | 仪表盘聚合 |
| bcryptjs | 密码哈希 | 用户认证 |
| nodemailer | 邮件发送 | SMTP或控制台日志 |
| @ai-sdk/openai | AI模型接口 | Ollama, MiniMax兼容 |

---

## 11. 环境变量

```bash
# 数据库
DATABASE_URL=postgresql://user:pass@host:5432/db

# NextAuth
NEXTAUTH_URL=https://aidu.app
NEXTAUTH_SECRET=your-secret-key

# SMTP邮件
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=password

# Ollama (本地AI)
OLLAMA_BASE_URL=http://host.docker.internal:11434/v1
OLLAMA_MODEL=llama3

# OpenAI (云端AI)
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o

# DeepSeek
DEEPSEEK_API_KEY=your-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# AI Provider选择
AI_PROVIDER=cloud  # 或 'local'
```

---

## 12. 部署架构

### Docker Compose 服务

```yaml
services:
  web:           # Next.js应用
  db:            # PostgreSQL + pgvector
  redis:         # 缓存 (可选)
```

### 开发命令

```bash
# 开发
npm run dev              # 开发服务器 (3000端口)
npm run build            # 生产构建
npm run start            # 启动生产服务器
npm run lint             # ESLint检查

# 数据库
npx prisma generate      # 生成Prisma客户端
npx prisma db push       # 推送schema到数据库

# 数据填充
node scripts/seed_full.js      # 填充CUV圣经(中文)
node scripts/seed_full_kjv.js # 填充KJV圣经(英文)

# Docker
docker-compose up -d --build   # 构建并启动容器
docker-compose exec web sh     # 进入容器shell
```

---

## 13. 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| 组件 | PascalCase | `Reader.tsx`, `AISidebar.tsx` |
| Hooks | kebab-case | `use-audio-player.ts` |
| API路由 | lowercase | `app/api/chat/route.ts` |
| 导入 | `@/`路径别名 | `import { Reader } from '@/components/bible/Reader'` |
| 指令 | `"use client"` | 客户端组件必须声明 |
| 类型 | 严格TypeScript | 禁止 `as any` 或 `@ts-ignore` |

---

## 14. 重要模式

### 14.1 AI请求队列系统

AISlice管理AI请求队列，防止并发API调用：

```typescript
enqueueAI(request)           // 添加到队列或立即处理
cancelAIRequest()           // 取消当前或排队请求
completeCurrentRequest()     // 完成并自动启动下一个
```

### 14.2 阅读计划流程上下文

用于步骤执行：

```typescript
interface ReadingPlanContext {
  planId: string
  day: number
  stepIndex: number
  steps: PlanStep[]
}

advancePlanStep()  // 移动到下一步，自动签到
```

### 14.3 小组计划流程上下文

类似阅读计划，但用于教会：

```typescript
interface GroupPlanContext {
  churchId: string
  planId: string
  day: number
  stepIndex: number
  steps: PlanStep[]
}
// 通过 /api/church/[id]/plan/[planId]/progress 同步
```

### 14.4 动态导入

重型组件使用 `next/dynamic` 配合 `{ ssr: false }`：

```typescript
const HeavyComponent = dynamic(() => import('@/components/Heavy'), {
  ssr: false,
  loading: () => <Skeleton />
})
```

---

## 15. 错误处理

错误定义在 `lib/errors/chat-errors.ts`：

```typescript
enum ChatErrorCode {
  SESSION_LOAD_FAILED,
  SESSION_CREATE_FAILED,
  SESSION_NOT_FOUND,
  MESSAGE_SAVE_FAILED,
  MESSAGE_LOAD_FAILED,
  NETWORK_ERROR,
  TIMEOUT_ERROR,
  AI_GENERATION_FAILED,
  AI_RATE_LIMITED,
  UNKNOWN_ERROR
}
```

---

*文档版本: 1.0*
*最后更新: 2026-04-09*
