# Scripture AI 升级计划

> 本文档为 Scripture AI 的系统性升级计划，涵盖新功能、现有功能优化、界面升级和技术架构优化。

---

## 一、项目现状分析

### 优势
- 技术栈现代（Next.js 16 + TypeScript + Tailwind CSS 4）
- AI功能丰富（8个专用端点）
- 数据模型完善（20+ Prisma模型）
- 支持向量搜索（pgvector）
- 移动端已有基础（Expo）

### 待改进
- 移动端功能不完整（仅50%）
- 社交功能使用率低
- 记忆系统缺乏提醒机制
- 缺乏可视化辅助（地图、时间线）
- AI上下文记忆不足

### 用户群体定位

| 用户群体 | 核心需求 | 对应功能模块 |
|----------|----------|--------------|
| 普通信徒 | 易用性、社区、读经计划 | AI解读、社交分享、每日灵修 |
| 传道人/神学生 | 研经工具、原文分析、讲章辅助 | 串珠系统、AI讲章助手、原文词义 |
| 家庭/小组 | 家庭读经、小组学习、教会同步 | 小组挑战、教会系统、同步功能 |

### 参考产品借鉴

| 产品 | 借鉴点 | 具体功能 |
|------|--------|----------|
| **YouVersion** | 社区活跃度 | 每日经文、读经计划、社区分享、打卡机制 |
| **Logos Bible** | 研经深度 | 串珠系统、原文分析、主题词研究、图书馆 |
| **Olive Tree** | 移动端体验 | 简洁界面、流畅交互、离线阅读、手势操作 |

---

## 二、新功能建议

### 2.1 经文串珠系统（高优先级）

**功能描述**: 自动识别经文关键词，展示相关经文网络，类似Logos Bible Word Study。

**实现思路**:
1. 利用现有pgvector能力预计算关联关系
2. 新增 `VerseConnection` 模型存储关联数据
3. 在Reader组件添加"串珠"悬浮面板
4. 支持主题词点击展开相关经文

**关键文件**:
- `prisma/schema.prisma` - 添加VerseConnection模型
- `components/bible/Reader.tsx` - 串珠UI集成
- `app/api/cross-reference/route.ts` - 新API端点
- `lib/cross-reference.ts` - 串珠计算逻辑

**数据模型**:
```prisma
model VerseConnection {
  id          String   @id @default(cuid())
  verseId     String
  relatedVerseId String
  connectionType String  // theme, quote, parallel
  strength    Float    // 关联强度 0-1
  createdAt   DateTime @default(now())

  verse       BibleVerse @relation(fields: [verseId], references: [id])
  relatedVerse BibleVerse @relation(fields: [relatedVerseId], references: [id])
}
```

**预估工作量**: 3周

---

### 2.2 圣经地图与时间线（中优先级）

**功能描述**: 可视化圣经地理和历史，增强理解。

**实现思路**:
1. 集成Mapbox GL或Leaflet地图库
2. 创建 `BibleLocation`、`BibleEvent` 数据模型
3. 经文阅读时自动识别地名并标注
4. 新增"时间线"独立页面

**关键文件**:
- `prisma/schema.prisma` - 新模型定义
- `components/bible/MapPanel.tsx` - 地图面板组件
- `components/bible/Timeline.tsx` - 时间线组件
- `app/timeline/page.tsx` - 时间线页面
- `lib/bible-locations.ts` - 地名坐标数据
- `lib/bible-events.ts` - 历史事件数据

**数据模型**:
```prisma
model BibleLocation {
  id          String   @id @default(cuid())
  name        String
  nameZh      String   // 中文名
  coordinates Json     // { lat, lng }
  verses      Json     // 相关经文引用列表
  description String?
}

model BibleEvent {
  id          String   @id @default(cuid())
  name        String
  nameZh      String
  yearBc      Int?     // 公元前年份
  yearAd      Int?     // 公元后年份
  locationId  String?
  verses      Json
  description String?
}
```

**预估工作量**: 4周

     │ 后续扩展（可选）                                                    │
     │                                                                     │
     │ 1. 预计算数据: 创建 scripts/seed-cross-references.ts                │
     │ 导入公开的串珠数据                                                  │
     │ 2. AI 增强: 添加 AI 生成的关联说明                                  │
     │ 3. 缓存优化: 将常用串珠数据缓存到 Redis                             │
     │ 4. 移动端适配: 在 Expo 应用中实现相同功能

---

### 2.3 智能灵修日记（中优先级）

**功能描述**: 记录灵修心得，AI分析情绪趋势。

**实现思路**:
1. 扩展 `Note` 模型，添加 `mood` 和 `journalType` 字段
2. 创建 `/api/journal` 端点
3. AI情绪分析生成月度灵修报告
4. 在Dashboard展示情绪趋势图表

**关键文件**:
- `prisma/schema.prisma` - 扩展Note模型
- `app/api/journal/route.ts` - 日记API
- `components/bible/JournalTab.tsx` - 日记组件
- `components/bible/MoodChart.tsx` - 情绪图表

**数据模型扩展**:
```prisma
model Note {
  // ... 现有字段
  mood        Int?     // 1-5 情绪评分
  journalType String?  // gratitude, prayer, reflection, confession
  tags        Json?    // 标签列表
}
```

**预估工作量**: 2周

---

### 2.4 离线阅读增强（高优先级）

**功能描述**: 移动端完整离线体验，包括经文、高亮、笔记。

**实现思路**:
1. 使用IndexedDB/WebSQL存储经文数据
2. 实现增量同步机制（基于时间戳）
3. 离线AI模式（可选小型本地模型）
4. 优化PWA体验和Service Worker

**关键文件**:
- `app-mobile/packages/core/src/storage/offline-db.ts` - 离线存储
- `app-mobile/packages/core/src/sync/incremental-sync.ts` - 增量同步
- `components/providers/SyncProvider.tsx` - 同步逻辑优化
- `public/sw.js` - Service Worker优化

**技术方案**:
```typescript
// 增量同步接口
interface SyncPayload {
  lastSyncTime: number;
  highlights: Highlight[];
  notes: Note[];
  planProgress: PlanProgress[];
}

// 离线检测
const isOnline = () => navigator.onLine;
const syncWhenOnline = debounce(syncAll, 5000);
```

**预估工作量**: 3周

---

### 2.5 家庭/小组读经挑战（中优先级）

**功能描述**: 增强教会系统，支持读经挑战和竞赛。

**实现思路**:
1. 扩展 `GroupPlan` 模型，添加挑战模式字段
2. 创建排行榜和成就系统
3. 支持邀请码快速加入小组
4. 添加小组内实时聊天功能

**关键文件**:
- `prisma/schema.prisma` - 扩展模型
- `app/api/church/[id]/challenge/route.ts` - 挑战API
- `components/bible/ChallengeTab.tsx` - 挑战组件
- `components/bible/Leaderboard.tsx` - 排行榜

**数据模型扩展**:
```prisma
model GroupPlan {
  // ... 现有字段
  challengeMode Boolean @default(false)
  startDate     DateTime
  endDate       DateTime?
  rewards       Json?    // 成就奖励配置
}

model ChallengeProgress {
  id          String   @id @default(cuid())
  userId      String
  groupPlanId String
  score       Int      @default(0)
  streak      Int      @default(0)
  completedDays Json   // 完成的日期列表

  user        User     @relation(fields: [userId], references: [id])
  groupPlan   GroupPlan @relation(fields: [groupPlanId], references: [id])
}
```

**预估工作量**: 3周



---

### 2.6 原文词义分析（中优先级）

**功能描述**: 支持希腊文/希伯来文原文分析，展示词义和语法。

**实现思路**:
1. 整合Strong's编号数据
2. 创建原文词典API
3. 点击经文中的词显示原文信息
4. 提供词形变化和用法示例

**关键文件**:
- `lib/strongs-dictionary.ts` - Strong词典数据
- `app/api/lexicon/route.ts` - 词典API
- `components/bible/LexiconPopup.tsx` - 原文弹窗

**预估工作量**: 3周

---

## 三、现有功能优化

### 3.1 AI功能增强

| 优化项 | 描述 | 优先级 | 工作量 |
|--------|------|:------:|--------|
| 上下文记忆 | AI记住用户偏好和历史对话 | 高 | 1周 |
| 多轮对话优化 | 改进对话连贯性，支持追问 | 高 | 1周 |
| 流式响应指示 | 添加生成进度动画 | 中 | 3天 |
| Prompt模板库 | 用户自定义AI提示词 | 中 | 1周 |
| 回答质量评分 | 让用户评价AI回答质量 | 低 | 3天 |

**关键实现**:
```typescript
// store/slices.ts - AISlice扩展
interface ConversationContext {
  preferences: Record<string, string>;  // 用户偏好
  recentTopics: string[];               // 最近讨论主题
  favoriteVerses: VerseRef[];           // 收藏经文
}

// lib/ai-client.ts - 上下文注入
function buildContextPrompt(context: ConversationContext): string {
  return `用户偏好: ${JSON.stringify(context.preferences)}
最近关注的主题: ${context.recentTopics.join(', ')}
请根据这些信息提供更个性化的回答。`;
}
```

**关键文件**:
- `lib/ai-client.ts` - AI客户端工厂
- `store/slices.ts` - AISlice扩展
- `app/api/chat/route.ts` - 对话逻辑

---

### 3.2 搜索体验改进

| 优化项 | 描述 | 优先级 | 工作量 |
|--------|------|:------:|--------|
| 搜索建议 | 输入时显示热门搜索和建议 | 高 | 1周 |
| 搜索历史 | 保存用户搜索历史 | 中 | 3天 |
| 高级筛选 | 按书卷、主题、时间筛选 | 中 | 1周 |
| 结果高亮 | 在搜索结果中高亮匹配词 | 中 | 3天 |
| 语音搜索 | 支持语音输入搜索（移动端） | 低 | 1周 |

**关键实现**:
```typescript
// 搜索建议数据结构
interface SearchSuggestion {
  text: string;
  type: 'history' | 'popular' | 'verse' | 'topic';
  count?: number;  // 热度
}

// 搜索历史模型
model SearchHistory {
  id        String   @id @default(cuid())
  userId    String
  query     String
  type      String   // exact, ai, fuzzy
  timestamp DateTime @default(now())
}
```

**关键文件**:
- `app/api/search/route.ts` - 搜索API优化
- `components/bible/SearchResults.tsx` - 结果展示优化
- `components/bible/SearchSuggestions.tsx` - 建议组件

---

### 3.3 社交功能激活

| 优化项 | 描述 | 优先级 | 工作量 |
|--------|------|:------:|--------|
| 每日经文分享 | 一键分享今日阅读到社区 | 高 | 1周 |
| 灵修打卡分享 | 自动生成打卡图片分享 | 高 | 1周 |
| 互动通知 | 点赞、评论实时通知 | 中 | 1周 |
| 好友推荐 | 基于阅读偏好推荐好友 | 中 | 1周 |
| 小组动态 | 小组内实时动态流 | 中 | 2周 |

**关键实现**:
```typescript
// 自动打卡分享
interface CheckInShare {
  verse: string;        // 今日经文
  streak: number;       // 连续天数
  planName?: string;    // 计划名称
  generatedAt: Date;
}

// 通知系统
model Notification {
  id          String   @id @default(cuid())
  userId      String
  type        String   // like, comment, follow, reminder
  title       String
  content     String
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

**关键文件**:
- `app/api/notifications/route.ts` - 通知API
- `components/bible/CommunityTab.tsx` - 社区优化
- `components/bible/CheckInCard.tsx` - 打卡卡片
- `store/slices.ts` - 通知状态管理

---

### 3.4 记忆系统改进

| 优化项 | 描述 | 优先级 | 工作量 |
|--------|------|:------:|--------|
| 复习提醒 | 推送通知提醒复习 | 高 | 1周 |
| 复习模式多样化 | 填空、选择、听写等方式 | 中 | 2周 |
| 进度可视化 | 记忆曲线图表展示 | 中 | 1周 |
| 批量导入 | 从高亮/笔记批量创建记忆卡 | 中 | 3天 |
| 社交背诵 | 与好友一起背诵经文 | 低 | 2周 |

**关键实现**:
```typescript
// 复习模式
type ReviewMode = 'flip' | 'fill-blank' | 'multiple-choice' | 'dictation';

// 记忆卡片扩展
model MemoryCard {
  // ... 现有字段
  reviewMode ReviewMode @default('flip')
  hint       String?    // 提示文字
  audioUrl   String?    // 听写音频
}

// 复习提醒推送
async function scheduleReviewReminder(userId: string) {
  const dueCards = await prisma.memoryCard.findMany({
    where: { userId, nextReview: { lte: new Date() } }
  });
  if (dueCards.length > 0) {
    await sendPushNotification(userId, {
      title: '📖 经文复习提醒',
      body: `您有 ${dueCards.length} 节经文待复习`
    });
  }
}
```

**关键文件**:
- `app/api/memory/route.ts` - 记忆API
- `components/bible/MemoryTab.tsx` - 记忆复习UI
- `app-mobile/packages/native/src/notifications/` - 推送通知

---

## 四、界面优化

### 4.1 视觉设计

| 优化项 | 描述 | 工作量 |
|--------|------|--------|
| 设计Token系统 | 统一颜色、间距、阴影变量 | 2周 |
| 深色模式优化 | 改进深色配色方案，增加对比度 | 1周 |
| 动画系统 | 统一过渡动画和微交互效果 | 1周 |
| 图标系统 | 统一图标风格（Lucide图标） | 3天 |
| 响应式优化 | 完善各断点布局（sm/md/lg/xl） | 1周 |

**设计Token示例**:
```css
/* app/globals.css */
:root {
  /* 颜色 */
  --color-primary: #2563eb;
  --color-primary-dark: #1d4ed8;
  --color-secondary: #64748b;
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-border: #e2e8f0;

  /* 间距 */
  --spacing-unit: 8px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* 过渡 */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
}

/* 深色模式 */
.dark {
  --color-background: #0f172a;
  --color-surface: #1e293b;
  --color-border: #334155;
}
```

**关键文件**:
- `app/globals.css` - 设计Token定义
- `tailwind.config.ts` - Tailwind主题配置
- `components/ui/*` - 基础UI组件

---

### 4.2 移动端体验

| 优化项 | 描述 | 工作量 |
|--------|------|--------|
| 单手操作优化 | 按钮位置和大小优化，适合单手操作 | 1周 |
| PWA优化 | 添加到主屏幕体验优化 | 1周 |
| 骨架屏 | 加载时显示骨架屏，提升感知速度 | 3天 |

**关键文件**:
- `app-mobile/app/(tabs)/_layout.tsx` - Tab布局
- `app-mobile/app/(tabs)/*.tsx` - 各Tab页面
- `components/ui/Skeleton.tsx` - 骨架屏组件

---

### 4.3 交互体验提升

| 优化项 | 描述 | 工作量 |
|--------|------|--------|
| 快捷键系统 | 完善键盘快捷键（桌面端） | 3天 |
| 手势导航增强 | 添加更多手势操作 | 1周 |
| 加载状态优化 | 全局加载指示器和骨架屏 | 1周 |
| 错误处理优化 | 友好的错误提示和恢复机制 | 1周 |
| 新用户引导 | 首次使用的功能引导流程 | 1周 |
| 帮助系统 | 内置帮助文档和FAQ | 1周 |

---

## 五、技术架构优化

### 5.1 性能提升

| 优化项 | 描述 | 优先级 | 工作量 |
|--------|------|:------:|--------|
| 数据库索引优化 | 为高频查询添加索引 | 高 | 1周 |
| API响应缓存 | Redis缓存热门数据 | 高 | 2周 |
| 前端代码分割 | 减少首屏加载时间 | 高 | 1周 |
| 图片优化 | WebP格式、懒加载 | 中 | 1周 |
| 向量搜索优化 | pgvector索引优化 | 中 | 2周 |

**关键SQL优化**:
```sql
-- 添加关键索引
CREATE INDEX idx_bible_verse_book_chapter ON bible_verses (bookId, chapter);
CREATE INDEX idx_bible_verse_embedding ON bible_verses
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_highlight_user_book ON highlights (userId, bookId, chapter);
CREATE INDEX idx_activity_user_date ON activity_logs (userId, date);
CREATE INDEX idx_memory_next_review ON memory_cards (userId, nextReview);

-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM bible_verses WHERE bookId = 'gen' AND chapter = 1;
```

**Redis缓存策略**:
```typescript
// lib/cache.ts
const CACHE_TTL = {
  bible: 3600,      // 经文缓存1小时
  search: 300,      // 搜索结果5分钟
  user: 60,         // 用户数据1分钟
  popular: 86400,   // 热门数据1天
};

async function getCached<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}
```

---

### 5.2 可维护性

| 优化项 | 描述 | 工作量 |
|--------|------|--------|
| 单元测试 | 核心功能单元测试覆盖 | 3周 |
| E2E测试 | 关键流程自动化测试 | 2周 |
| API文档完善 | OpenAPI规范文档更新 | 1周 |
| 错误监控 | Sentry集成错误追踪 | 3天 |
| 日志系统 | 结构化日志记录 | 1周 |
| CI/CD优化 | 自动化测试和部署流程 | 1周 |

---

### 5.3 扩展性

| 优化项 | 描述 | 优先级 | 工作量 |
|--------|------|:------:|--------|
| AI服务拆分 | AI服务独立部署，支持水平扩展 | 中 | 4周 |
| 消息队列 | 异步任务处理（邮件、推送） | 中 | 2周 |
| CDN部署 | 静态资源CDN加速 | 中 | 1周 |
| 多语言i18n | 国际化框架完善 | 中 | 2周 |
| 插件系统 | 支持第三方插件扩展 | 低 | 4周 |

---

## 六、实施路线图

### Phase 1: 核心体验优化（1-2月）

**目标**: 提升现有功能质量，夯实基础

#### 功能深化
- [ ] AI上下文记忆和多轮对话优化
- [ ] 搜索建议和历史功能
- [ ] 记忆系统复习提醒

#### 移动端优先
- [ ] 移动端底部标签页美化，更易操作
- [ ] 离线阅读增强
- [ ] 单手操作优化

#### 技术基建
- [ ] 性能优化（数据库索引、Redis缓存）
- [ ] 设计Token系统建立
- [ ] 错误监控集成（Sentry）

**预期成果**: 用户基础体验提升30%，首屏加载时间减少50%

---

### Phase 2: 功能增强（2-3月）

**目标**: 增强社区和灵修体验

#### YouVersion风格功能
- [ ] 每日经文AI自动推送
- [ ] 灵修打卡分享（自动生成图片）
- [ ] 读经计划进度社交化
- [ ] 好友动态流优化

#### 灵修深度
- [ ] 灵修日记与情绪追踪
- [ ] AI祷告生成增强
- [ ] 智能灵修推荐

**预期成果**: 社交活跃度提升，日活用户增长

---

### Phase 3: 高级功能（3-4月）

**目标**: Logos级研经能力

#### 研经工具
- [ ] 经文串珠系统（核心功能）
- [ ] 原文词义分析（希腊文/希伯来文）
- [ ] 主题词研究面板
- [ ] AI讲章助手

#### 可视化
- [ ] 圣经地图与时间线
- [ ] 主题网络图

**预期成果**: 传道人/神学生用户增长，研经功能差异化

---

### Phase 4: 协作与生态（4-5月）

**目标**: 强化社区协作能力

#### 小组功能
- [ ] 家庭/小组读经挑战
- [ ] 小组排行榜和成就
- [ ] 小组聊天功能
- [ ] 邀请码快速加入

#### 生态完善
- [ ] 多语言支持（i18n）
- [ ] 插件系统设计
- [ ] PWA完整体验
- [ ] 开放API完善

**预期成果**: 家庭/小组用户增长，形成社区效应

---

## 七、关键文件清单

### 需要修改的核心文件

| 文件 | 用途 | 优先级 |
|------|------|:------:|
| `prisma/schema.prisma` | 新增数据模型 | 高 |
| `store/slices.ts` | 状态管理扩展 | 高 |
| `lib/ai-client.ts` | AI功能增强 | 高 |
| `components/bible/Reader.tsx` | 串珠、地图集成 | 高 |
| `app/api/search/route.ts` | 搜索优化 | 高 |
| `components/bible/AISidebar.tsx` | AI对话优化 | 中 |
| `app-mobile/app/(tabs)/_layout.tsx` | 移动端导航 | 中 |
| `app/globals.css` | 设计Token | 中 |

### 需要新增的文件

| 文件 | 用途 |
|------|------|
| `app/api/cross-reference/route.ts` | 串珠API |
| `app/api/journal/route.ts` | 日记API |
| `app/api/notifications/route.ts` | 通知API |
| `app/api/lexicon/route.ts` | 原文词典API |
| `app/api/church/[id]/challenge/route.ts` | 挑战API |
| `components/bible/CrossRefPanel.tsx` | 串珠面板 |
| `components/bible/MapPanel.tsx` | 地图面板 |
| `components/bible/Timeline.tsx` | 时间线组件 |
| `components/bible/JournalTab.tsx` | 日记组件 |
| `components/bible/MemoryTab.tsx` | 记忆复习 |
| `components/bible/ChallengeTab.tsx` | 挑战组件 |
| `components/bible/LexiconPopup.tsx` | 原文弹窗 |
| `lib/bible-locations.ts` | 地名数据 |
| `lib/bible-events.ts` | 历史事件数据 |
| `lib/strongs-dictionary.ts` | Strong词典 |
| `lib/cache.ts` | Redis缓存 |

---

## 八、验证方案

### 功能验证清单

1. **AI功能**: 测试多轮对话连贯性，验证上下文记忆
2. **搜索功能**: 测试搜索建议和历史记录准确性
3. **串珠系统**: 验证经文关联准确性和响应速度
4. **记忆系统**: 测试复习提醒和不同复习模式
5. **移动端**: 在真机上测试离线功能
6. **社交功能**: 测试分享和通知推送

### 性能验证指标

```bash
# 数据库查询性能
EXPLAIN ANALYZE SELECT * FROM bible_verses WHERE bookId = 'gen' AND chapter = 1;
# 目标: < 10ms

# API响应时间
curl -w "Time: %{time_total}s\n" -o /dev/null -s http://localhost:3000/api/bible?book=gen&chapter=1
# 目标: < 100ms

# 前端性能
npm run build && npm run start
# Lighthouse: Performance > 90
```

### 自动化测试

```bash
# 单元测试
npm run test

# E2E测试
npm run test:e2e

# 覆盖率目标: > 70%
```

---

## 九、总结

本升级计划从用户体验、功能丰富度、技术架构三个维度全面规划了Scripture AI的发展方向。

**核心原则**:
1. **深化而非广化**: 优先完善现有功能，再扩展新功能
2. **用户价值导向**: 每个新功能都需回答"这能帮用户做什么"
3. **技术驱动体验**: 利用AI和向量搜索能力创造独特价值
4. **移动优先**: 考虑到用户使用场景，移动端体验至关重要
5. **全覆盖策略**: 同时服务普通信徒、传道人、家庭小组三类用户

**建议**:
- 按Phase顺序逐步实施
- 每个Phase完成后进行用户反馈收集
- 根据反馈调整后续计划优先级
- 保持技术债务清理与功能开发平衡

---

**Made with ❤️ for Disciple.**