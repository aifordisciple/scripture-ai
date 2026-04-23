# i18n 多语言支持升级实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有自建 i18n 系统上增加完整的英文 locale 支持，实现语言-版本联动、P0/P1 组件翻译、服务器同步。

**Architecture:** 渐进式升级现有 i18n 基础设施——拆分字典为模块化文件、提取全局 resolveDualLang 工具函数、增强 locale slice 支持浏览器检测和服务器同步、逐组件替换硬编码中文为 t() 调用、Reader.tsx 实现版本联动逻辑。

**Tech Stack:** Next.js 16 App Router, TypeScript, Zustand, Prisma, 自建 i18n (t() + useTranslation)

---

## File Structure

### 新建文件
- `lib/i18n/types.ts` — Translations 类型定义
- `lib/i18n/zh/common.ts` — 中文通用翻译
- `lib/i18n/zh/reader.ts` — 中文阅读器翻译
- `lib/i18n/zh/ai.ts` — 中文 AI 聊天翻译
- `lib/i18n/zh/plan.ts` — 中文读经计划翻译
- `lib/i18n/zh/settings.ts` — 中文设置翻译
- `lib/i18n/zh/search.ts` — 中文搜索翻译
- `lib/i18n/zh/auth.ts` — 中文登录注册翻译
- `lib/i18n/zh/group.ts` — 中文群组翻译
- `lib/i18n/zh/atlas.ts` — 中文地图翻译
- `lib/i18n/zh/index.ts` — 中文合并导出
- `lib/i18n/en/common.ts` — 英文通用翻译
- `lib/i18n/en/reader.ts` — 英文阅读器翻译
- `lib/i18n/en/ai.ts` — 英文 AI 聊天翻译
- `lib/i18n/en/plan.ts` — 英文读经计划翻译
- `lib/i18n/en/settings.ts` — 英文设置翻译
- `lib/i18n/en/search.ts` — 英文搜索翻译
- `lib/i18n/en/auth.ts` — 英文登录注册翻译
- `lib/i18n/en/group.ts` — 英文群组翻译
- `lib/i18n/en/atlas.ts` — 英文地图翻译
- `lib/i18n/en/index.ts` — 英文合并导出
- `app/api/user/locale/route.ts` — Locale API 端点

### 修改文件
- `lib/i18n/index.ts` — 添加 resolveDualLang，更新 t() 和 useTranslation
- `lib/i18n/zh.ts` — 删除（迁移到模块化文件）
- `lib/i18n/en.ts` — 删除（迁移到模块化文件）
- `store/slices/localeSlice.ts` — 增强浏览器检测 + 服务器同步
- `store/types.ts` — 更新 LocaleSlice 类型
- `lib/constants.ts` — 更新 getBookDisplayName 等函数接受 locale 参数
- `lib/plans.ts` — 添加 titleEn/descriptionEn/tagsEn 字段
- `components/bible/Reader.tsx` — 版本联动 + 翻译
- `components/bible/AISidebar.tsx` — 翻译
- `components/bible/PlanTab.tsx` — 翻译
- `components/bible/FloatingMenu.tsx` — 翻译
- `components/bible/Sidebar.tsx` — 翻译
- `components/bible/QuickPrompts.tsx` — 使用全局 resolveDualLang
- `components/bible/ShareCard.tsx` — 翻译
- `components/bible/HighlightsTab.tsx` — 翻译
- `components/bible/SearchResults.tsx` — 翻译
- `components/bible/BookPicker.tsx` — 翻译
- `components/group/GroupTab.tsx` — 翻译
- `components/settings/ApiSettingsDialog.tsx` — 翻译
- `components/settings/SyncSettings.tsx` — 翻译
- `components/settings/NotificationSettings.tsx` — 翻译
- `components/auth/UserMenu.tsx` — 翻译
- `components/onboarding/` — 翻译
- `app/page.tsx` — TabList 翻译
- `app/api/search/route.ts` — locale 感知

---

## Task 1: 拆分字典文件为模块化结构

**Files:**
- Create: `lib/i18n/types.ts`
- Create: `lib/i18n/zh/common.ts`, `lib/i18n/zh/reader.ts`, `lib/i18n/zh/ai.ts`, `lib/i18n/zh/plan.ts`, `lib/i18n/zh/settings.ts`, `lib/i18n/zh/search.ts`, `lib/i18n/zh/auth.ts`, `lib/i18n/zh/group.ts`, `lib/i18n/zh/atlas.ts`, `lib/i18n/zh/index.ts`
- Create: `lib/i18n/en/common.ts`, `lib/i18n/en/reader.ts`, `lib/i18n/en/ai.ts`, `lib/i18n/en/plan.ts`, `lib/i18n/en/settings.ts`, `lib/i18n/en/search.ts`, `lib/i18n/en/auth.ts`, `lib/i18n/en/group.ts`, `lib/i18n/en/atlas.ts`, `lib/i18n/en/index.ts`
- Modify: `lib/i18n/index.ts` — 更新导入路径

- [ ] **Step 1: 创建 Translations 类型定义**

创建 `lib/i18n/types.ts`：

```typescript
export type Translations = Record<string, string>;
```

- [ ] **Step 2: 创建中文模块文件**

将现有 `lib/i18n/zh.ts` 中的键按模块拆分。先读取现有 `zh.ts` 全部内容，然后按以下分类创建各模块文件。

`lib/i18n/zh/common.ts` — 通用标签、按钮、操作：
```typescript
import { Translations } from '../types';

export const common: Translations = {
  // 通用操作
  'common.confirm': '确认',
  'common.cancel': '取消',
  'common.save': '保存',
  'common.delete': '删除',
  'common.edit': '编辑',
  'common.close': '关闭',
  'common.loading': '加载中...',
  'common.error': '出错了',
  'common.retry': '重试',
  'common.success': '成功',
  'common.copy': '复制',
  'common.copied': '已复制',
  'common.share': '分享',
  'common.back': '返回',
  'common.next': '下一步',
  'common.previous': '上一步',
  'common.done': '完成',
  'common.more': '更多',
  'common.search': '搜索',
  'common.noResults': '没有找到结果',
  'common.language': '语言',
  'common.chinese': '中文',
  'common.english': 'English',

  // Tab 标签
  'tabs.dashboard': '数据看板',
  'tabs.highlights': '我的高亮',
  'tabs.plans': '读经计划',
  'tabs.ai': 'AI 助手',
  'tabs.group': '教会',
  'tabs.atlas': '圣经地图',
  'tabs.theme': '主题网络',
  'tabs.memory': '记忆卡',
  'tabs.settings': '设置',
};
```

`lib/i18n/zh/reader.ts` — 阅读器相关：
```typescript
import { Translations } from '../types';

export const reader: Translations = {
  'reader.chapter': '第{chapter}章',
  'reader.verse': '第{verse}节',
  'reader.showEnglish': '中/英',
  'reader.showChinese': '中',
  'reader.showBilingual': '中/英',
  'reader.fontSize': '字体大小',
  'reader.darkMode': '深色模式',
  'reader.highlight': '高亮',
  'reader.note': '笔记',
  'reader.bookmark': '书签',
  'reader.previousChapter': '上一章',
  'reader.nextChapter': '下一章',
  'reader.oldTestament': '旧约',
  'reader.newTestament': '新约',
  'reader.selectBook': '选择书卷',
  'reader.selectChapter': '选择章节',
};
```

`lib/i18n/zh/ai.ts` — AI 聊天相关：
```typescript
import { Translations } from '../types';

export const ai: Translations = {
  'ai.title': 'AI 助手',
  'ai.placeholder': '输入你的问题...',
  'ai.send': '发送',
  'ai.regenerate': '重新生成',
  'ai.copy': '复制',
  'ai.thinking': '思考中...',
  'ai.error': '生成失败，请重试',
  'ai.newChat': '新对话',
  'ai.history': '历史记录',
  'ai.clearHistory': '清除历史',
  'ai.customPrompt': '自定义提示词',
  'ai.savePrompt': '保存提示词',
  'ai.deletePrompt': '删除提示词',
  'ai.savedInsights': '收藏洞察',
  'ai.tutor': '经文导师',
  'ai.devotional': '灵修',
  'ai.prayer': '祷告',
  'ai.sermon': '讲道',
  'ai.studyGuide': '研读指南',
  'ai.chat': '自由对话',
};
```

`lib/i18n/zh/plan.ts` — 读经计划：
```typescript
import { Translations } from '../types';

export const plan: Translations = {
  'plan.title': '读经计划',
  'plan.myPlans': '我的计划',
  'plan.allPlans': '全部计划',
  'plan.startPlan': '开始计划',
  'plan.continuePlan': '继续计划',
  'plan.completed': '已完成',
  'plan.day': '第{day}天',
  'plan.step': '步骤 {step}',
  'plan.progress': '进度',
  'plan.streak': '连续天数',
  'plan.checkIn': '打卡',
  'plan.checkedIn': '已打卡',
  'plan.readStep': '阅读',
  'plan.reflectStep': '反思',
  'plan.prayStep': '祷告',
  'plan.memorizeStep': '背诵',
  'plan.noPlans': '暂无读经计划',
  'plan.joinPlan': '加入计划',
};
```

`lib/i18n/zh/settings.ts` — 设置面板：
```typescript
import { Translations } from '../types';

export const settings: Translations = {
  'settings.title': '设置',
  'settings.account': '账户',
  'settings.appearance': '外观',
  'settings.language': '语言',
  'settings.apiConfig': 'API 配置',
  'settings.apiKey': 'API 密钥',
  'settings.apiKeyPlaceholder': '输入 API 密钥',
  'settings.baseUrl': 'API 地址',
  'settings.model': '模型',
  'settings.sync': '同步',
  'settings.syncEnabled': '启用云同步',
  'settings.lastSync': '上次同步',
  'settings.syncNow': '立即同步',
  'settings.notifications': '通知',
  'settings.reminder': '读经提醒',
  'settings.reminderTime': '提醒时间',
  'settings.logout': '退出登录',
  'settings.login': '登录',
  'settings.register': '注册',
};
```

`lib/i18n/zh/search.ts` — 搜索：
```typescript
import { Translations } from '../types';

export const search: Translations = {
  'search.placeholder': '搜索经文...',
  'search.results': '搜索结果',
  'search.noResults': '未找到相关经文',
  'search.searching': '搜索中...',
  'search.recent': '最近搜索',
  'search.clearRecent': '清除最近搜索',
  'search.verseCount': '{count}节经文',
};
```

`lib/i18n/zh/auth.ts` — 登录注册：
```typescript
import { Translations } from '../types';

export const auth: Translations = {
  'auth.login': '登录',
  'auth.register': '注册',
  'auth.username': '用户名',
  'auth.password': '密码',
  'auth.confirmPassword': '确认密码',
  'auth.email': '邮箱',
  'auth.loginSuccess': '登录成功',
  'auth.registerSuccess': '注册成功',
  'auth.logout': '退出登录',
  'auth.loginRequired': '请先登录',
  'auth.invalidCredentials': '用户名或密码错误',
};
```

`lib/i18n/zh/group.ts` — 群组/教会：
```typescript
import { Translations } from '../types';

export const group: Translations = {
  'group.title': '教会',
  'group.myChurch': '我的教会',
  'group.joinChurch': '加入教会',
  'group.createChurch': '创建教会',
  'group.members': '成员',
  'group.plan': '读经计划',
  'group.progress': '进度',
  'group.inviteCode': '邀请码',
  'group.noChurch': '暂未加入教会',
};
```

`lib/i18n/zh/atlas.ts` — 地图/时间线：
```typescript
import { Translations } from '../types';

export const atlas: Translations = {
  'atlas.title': '圣经地图',
  'atlas.timeline': '时间线',
  'atlas.journeys': '旅程',
  'atlas.locations': '地点',
  'atlas.events': '事件',
  'atlas.selectJourney': '选择旅程',
};
```

`lib/i18n/zh/index.ts` — 合并导出：
```typescript
import { common } from './common';
import { reader } from './reader';
import { ai } from './ai';
import { plan } from './plan';
import { settings } from './settings';
import { search } from './search';
import { auth } from './auth';
import { group } from './group';
import { atlas } from './atlas';

export const zh = {
  ...common,
  ...reader,
  ...ai,
  ...plan,
  ...settings,
  ...search,
  ...auth,
  ...group,
  ...atlas,
};
```

- [ ] **Step 3: 创建英文模块文件**

每个英文模块文件与中文对应，键名完全一致。以 `lib/i18n/en/common.ts` 为例：

```typescript
import { Translations } from '../types';

export const common: Translations = {
  'common.confirm': 'Confirm',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.close': 'Close',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.retry': 'Retry',
  'common.success': 'Success',
  'common.copy': 'Copy',
  'common.copied': 'Copied',
  'common.share': 'Share',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.previous': 'Previous',
  'common.done': 'Done',
  'common.more': 'More',
  'common.search': 'Search',
  'common.noResults': 'No results found',
  'common.language': 'Language',
  'common.chinese': '中文',
  'common.english': 'English',

  'tabs.dashboard': 'Dashboard',
  'tabs.highlights': 'Highlights',
  'tabs.plans': 'Reading Plans',
  'tabs.ai': 'AI Assistant',
  'tabs.group': 'Church',
  'tabs.atlas': 'Bible Atlas',
  'tabs.theme': 'Theme Network',
  'tabs.memory': 'Memory Cards',
  'tabs.settings': 'Settings',
};
```

其余英文模块文件按相同模式创建，所有键名与中文对应。`lib/i18n/en/index.ts` 结构与中文版相同。

- [ ] **Step 4: 更新 lib/i18n/index.ts**

```typescript
import { zh } from './zh';
import { en } from './en';
import { useStore } from '@/store/useBibleStore';

export type Locale = 'zh' | 'en';

export const dictionaries: Record<Locale, Record<string, string>> = { zh, en };

export function t(key: string, locale?: Locale): string {
  const loc = locale || 'zh';
  return dictionaries[loc]?.[key] || key;
}

export function useTranslation() {
  const locale = useStore((s) => s.locale);
  return (key: string) => t(key, locale);
}

export function resolveDualLang(v: { zh: string; en: string } | string, locale: Locale): string {
  return typeof v === 'string' ? v : (v[locale] || v.zh);
}
```

- [ ] **Step 5: 删除旧字典文件**

删除 `lib/i18n/zh.ts` 和 `lib/i18n/en.ts`（已被模块化文件替代）。

- [ ] **Step 6: 验证构建**

Run: `cd /opt/data1/public/software/systools/bibleAI/scripture-ai && docker-compose down && docker-compose up -d --build`
Expected: 构建成功，无 TypeScript 错误

- [ ] **Step 7: 提交**

```bash
git add lib/i18n/
git commit -m "refactor: 拆分i18n字典为模块化文件结构"
```

---

## Task 2: 增强 Locale Slice — 浏览器检测 + 服务器同步

**Files:**
- Modify: `store/slices/localeSlice.ts`
- Modify: `store/types.ts`
- Create: `app/api/user/locale/route.ts`

- [ ] **Step 1: 更新 LocaleSlice 类型**

在 `store/types.ts` 中，确保 LocaleSlice 类型包含：

```typescript
export interface LocaleSlice {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}
```

- [ ] **Step 2: 增强 localeSlice 浏览器检测**

更新 `store/slices/localeSlice.ts`：

```typescript
import { StateCreator } from 'zustand';
import type { LocaleSlice } from '../types';

type Locale = 'zh' | 'en';

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'zh';
  const saved = localStorage.getItem('locale');
  if (saved === 'zh' || saved === 'en') return saved as Locale;
  const browserLang = navigator.language?.toLowerCase() || '';
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
}

export const createLocaleSlice: StateCreator<LocaleSlice> = (set) => ({
  locale: detectLocale(),
  setLocale: (locale: Locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
    }
    set({ locale });
    // 异步同步到服务器（不阻塞 UI）
    fetch('/api/user/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    }).catch(() => {}); // 静默失败
  },
});
```

- [ ] **Step 3: 创建 Locale API 端点**

创建 `app/api/user/locale/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ locale: null });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { settings: true },
  });

  return NextResponse.json({ locale: user?.settings?.locale || null });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { locale } = await request.json();
  if (locale !== 'zh' && locale !== 'en') {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await prisma.userSetting.upsert({
    where: { userId: user.id },
    update: { locale },
    create: { userId: user.id, locale },
  });

  return NextResponse.json({ locale });
}
```

- [ ] **Step 4: 验证构建**

Run: `cd /opt/data1/public/software/systools/bibleAI/scripture-ai && docker-compose down && docker-compose up -d --build`
Expected: 构建成功

- [ ] **Step 5: 提交**

```bash
git add store/slices/localeSlice.ts store/types.ts app/api/user/locale/
git commit -m "feat: 增强locale slice支持浏览器检测和服务器同步"
```

---

## Task 3: 提取全局 resolveDualLang + 更新 constants.ts

**Files:**
- Modify: `lib/constants.ts` — 更新 getBookDisplayName 等
- Modify: `components/bible/QuickPrompts.tsx` — 使用全局 resolveDualLang
- Modify: `components/bible/Reader.tsx` — 使用全局 resolveDualLang

- [ ] **Step 1: 更新 lib/constants.ts 中的 helper 函数**

找到 `getBookDisplayName` 函数，添加 locale 参数：

```typescript
import type { Locale } from './i18n';

// 更新现有函数签名
export function getBookDisplayName(bookId: number, locale: Locale = 'zh'): string {
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  if (!book) return '';
  return locale === 'en' ? (book.nameEn || book.name) : book.name;
}

export function getBookCategory(bookId: number, locale: Locale = 'zh'): string {
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  if (!book) return '';
  return locale === 'en' ? (book.categoryEn || book.category) : book.category;
}

export function getBookIntro(bookId: number, locale: Locale = 'zh'): string {
  const book = BIBLE_BOOKS.find(b => b.id === bookId);
  if (!book) return '';
  return locale === 'en' ? (book.introEn || book.intro) : book.intro;
}
```

注意：检查 `getBookDisplayName` 的所有调用点，确保添加 locale 参数。调用点可能包括 Reader.tsx、BookPicker.tsx、SearchResults.tsx 等。对于未传 locale 的调用，默认值 'zh' 保持向后兼容。

- [ ] **Step 2: 更新 QuickPrompts.tsx**

找到 QuickPrompts.tsx 中的内联 `resolve` 函数，替换为导入 `resolveDualLang`：

```typescript
// 删除内联 resolve 函数
// 旧代码类似：
// const resolve = (v: DualLangString | string) => typeof v === 'string' ? v : v[locale]

// 新代码：
import { resolveDualLang } from '@/lib/i18n';
// 使用处改为：
// resolve(someValue) → resolveDualLang(someValue, locale)
```

- [ ] **Step 3: 更新 Reader.tsx**

找到 Reader.tsx 中的内联 `resolveDual` 函数，替换为导入 `resolveDualLang`：

```typescript
// 删除内联 resolveDual 函数
// 旧代码类似：
// const resolveDual = (v: DualLangString | string) => typeof v === 'string' ? v : (v[locale] || v.zh)

// 新代码：
import { resolveDualLang } from '@/lib/i18n';
// 使用处改为：
// resolveDual(someValue) → resolveDualLang(someValue, locale)
```

- [ ] **Step 4: 验证构建**

Run: `cd /opt/data1/public/software/systools/bibleAI/scripture-ai && docker-compose down && docker-compose up -d --build`
Expected: 构建成功

- [ ] **Step 5: 提交**

```bash
git add lib/constants.ts components/bible/QuickPrompts.tsx components/bible/Reader.tsx
git commit -m "refactor: 提取全局resolveDualLang并更新constants helper函数"
```

---

## Task 4: Reader.tsx 版本联动逻辑

**Files:**
- Modify: `components/bible/Reader.tsx`

- [ ] **Step 1: 添加版本联动计算属性**

在 Reader.tsx 组件中，找到版本相关的逻辑。添加计算属性：

```typescript
const locale = useStore((s) => s.locale);
const setLocale = useStore((s) => s.setLocale);
const showEnglish = useStore((s) => s.showEnglish);
const setShowEnglish = useStore((s) => s.setShowEnglish);

// 版本联动：根据 locale 决定主版本和次要版本
const primaryVersion = locale === 'en' ? 'KJV' : 'CUV';
const secondaryVersion = locale === 'en' ? 'CUV' : 'KJV';
```

- [ ] **Step 2: 更新经文渲染逻辑**

找到 Reader.tsx 中所有使用硬编码 `'CUV'` 作为主版本的地方，替换为 `primaryVersion`：

- 主版本经文获取：`version: 'CUV'` → `version: primaryVersion`
- 次要版本经文获取：`version: 'KJV'` → `version: secondaryVersion`
- 章节标题显示：使用 `getBookDisplayName(bookId, locale)` 替代 `getBookDisplayName(bookId)`

- [ ] **Step 3: 更新双语对照按钮标签**

找到显示 "中/英" 的按钮，根据 locale 动态显示：

```typescript
// 旧代码：硬编码 "中/英"
// 新代码：
const bilingualLabel = locale === 'en'
  ? (showEnglish ? 'En/Zh' : 'En')
  : (showEnglish ? '中/英' : '中');
```

- [ ] **Step 4: 切换 locale 时的版本联动**

在 `setLocale` 调用处，添加版本联动逻辑。找到语言切换组件（可能在 Sidebar 或设置面板中），确保切换时：

```typescript
const handleLocaleChange = (newLocale: Locale) => {
  if (newLocale === 'en' && !showEnglish) {
    setShowEnglish(true); // 切换到英文时自动开启双语对照
  }
  setLocale(newLocale);
};
```

- [ ] **Step 5: 验证构建**

Run: `cd /opt/data1/public/software/systools/bibleAI/scripture-ai && docker-compose down && docker-compose up -d --build`
Expected: 构建成功，手动验证：切换到英文 locale 后 KJV 成为主版本

- [ ] **Step 6: 提交**

```bash
git add components/bible/Reader.tsx
git commit -m "feat: Reader版本联动-locale切换自动切换主版本"
```

---

## Task 5: 搜索 API locale 感知

**Files:**
- Modify: `app/api/search/route.ts`

- [ ] **Step 1: 更新搜索 API 接受 locale 参数**

找到 `app/api/search/route.ts` 中硬编码 `version: 'CUV'` 的查询，修改为：

```typescript
// 从请求参数中获取 locale
const { query, locale = 'zh' } = await request.json();

// 根据 locale 决定搜索版本
const searchVersion = locale === 'en' ? 'KJV' : 'CUV';

// 在查询中使用
const results = await prisma.bibleVerse.findMany({
  where: {
    version: searchVersion,
    // ... 其他查询条件
  },
});
```

- [ ] **Step 2: 更新前端搜索调用**

找到前端调用搜索 API 的地方（可能在 `hooks/use-bible-search.ts` 或 `components/bible/SearchResults.tsx` 中），确保传递 locale 参数：

```typescript
const locale = useStore((s) => s.locale);

// 在 fetch 调用中添加 locale
const response = await fetch('/api/search', {
  method: 'POST',
  body: JSON.stringify({ query, locale }),
});
```

- [ ] **Step 3: 验证构建**

Run: `cd /opt/data1/public/software/systools/bibleAI/scripture-ai && docker-compose down && docker-compose up -d --build`
Expected: 构建成功

- [ ] **Step 4: 提交**

```bash
git add app/api/search/route.ts hooks/use-bible-search.ts components/bible/SearchResults.tsx
git commit -m "feat: 搜索API支持locale感知版本选择"
```

---

## Task 6: 读经计划双语数据

**Files:**
- Modify: `lib/plans.ts`

- [ ] **Step 1: 扩展计划数据结构**

在 `lib/plans.ts` 中，为每个计划对象添加 `titleEn`、`descriptionEn`、`tagsEn` 字段，为每个 step 添加 `titleEn`、`descriptionEn` 字段。

示例（以现有计划结构为基础）：

```typescript
// 旧结构
{
  id: 'bible-in-one-year',
  title: '一年通读圣经',
  description: '一年内通读整本圣经',
  tags: ['通读', '全年'],
  steps: [
    { title: '阅读', description: '阅读今日经文', type: 'read' },
  ],
}

// 新结构
{
  id: 'bible-in-one-year',
  title: '一年通读圣经',
  titleEn: 'Bible in One Year',
  description: '一年内通读整本圣经',
  descriptionEn: 'Read through the entire Bible in one year',
  tags: ['通读', '全年'],
  tagsEn: ['Full Read', 'Yearly'],
  steps: [
    { title: '阅读', titleEn: 'Read', description: '阅读今日经文', descriptionEn: 'Read today\'s scripture', type: 'read' },
  ],
}
```

对所有计划对象执行相同操作。

- [ ] **Step 2: 更新 PlanTab.tsx 中的显示逻辑**

在 `components/bible/PlanTab.tsx` 中，找到显示计划标题、描述、标签的地方，根据 locale 选择字段：

```typescript
const locale = useStore((s) => s.locale);

// 显示计划标题
const planTitle = locale === 'en' ? (plan.titleEn || plan.title) : plan.title;
const planDesc = locale === 'en' ? (plan.descriptionEn || plan.description) : plan.description;
const planTags = locale === 'en' ? (plan.tagsEn || plan.tags) : plan.tags;

// step 标题
const stepTitle = locale === 'en' ? (step.titleEn || step.title) : step.title;
const stepDesc = locale === 'en' ? (step.descriptionEn || step.description) : step.description;
```

- [ ] **Step 3: 验证构建**

Run: `cd /opt/data1/public/software/systools/bibleAI/scripture-ai && docker-compose down && docker-compose up -d --build`
Expected: 构建成功

- [ ] **Step 4: 提交**

```bash
git add lib/plans.ts components/bible/PlanTab.tsx
git commit -m "feat: 读经计划添加英文翻译数据"
```

---

## Task 7: P0 组件翻译 — AISidebar

**Files:**
- Modify: `components/bible/AISidebar.tsx`

- [ ] **Step 1: 在 AISidebar 中引入 useTranslation**

在文件顶部添加：

```typescript
import { useTranslation } from '@/lib/i18n';
```

在组件函数体内添加：

```typescript
const t = useTranslation();
```

- [ ] **Step 2: 替换硬编码中文**

逐一替换 AISidebar.tsx 中的硬编码中文字符串。每个替换模式：

```typescript
// 旧：'AI 助手'
// 新：t('ai.title')

// 旧：'输入你的问题...'
// 新：t('ai.placeholder')

// 旧：'发送'
// 新：t('ai.send')

// 旧：'重新生成'
// 新：t('ai.regenerate')

// 旧：'思考中...'
// 新：t('ai.thinking')

// 旧：'生成失败，请重试'
// 新：t('ai.error')

// 旧：'新对话'
// 新：t('ai.newChat')

// 旧：'历史记录'
// 新：t('ai.history')

// 旧：'清除历史'
// 新：t('ai.clearHistory')

// 旧：'自定义提示词'
// 新：t('ai.customPrompt')

// 旧：'收藏洞察'
// 新：t('ai.savedInsights')
```

注意：只替换用户可见的 UI 字符串，不替换注释或 console.log 中的字符串。如果发现字典中缺少的键，在对应的 zh/ 和 en/ 模块文件中添加。

- [ ] **Step 3: 验证构建**

Run: `cd /opt/data1/public/software/systools/bibleAI/scripture-ai && docker-compose down && docker-compose up -d --build`
Expected: 构建成功

- [ ] **Step 4: 提交**

```bash
git add components/bible/AISidebar.tsx lib/i18n/
git commit -m "feat: AISidebar组件i18n翻译"
```

---

## Task 8: P0 组件翻译 — PlanTab

**Files:**
- Modify: `components/bible/PlanTab.tsx`

- [ ] **Step 1: 引入 useTranslation 并替换硬编码中文**

同 Task 7 的模式。PlanTab 中的关键字符串：

```typescript
// '读经计划' → t('plan.title')
// '我的计划' → t('plan.myPlans')
// '全部计划' → t('plan.allPlans')
// '开始计划' → t('plan.startPlan')
// '继续计划' → t('plan.continuePlan')
// '已完成' → t('plan.completed')
// '打卡' → t('plan.checkIn')
// '已打卡' → t('plan.checkedIn')
// '暂无读经计划' → t('plan.noPlans')
```

- [ ] **Step 2: 验证构建**

Run: `cd /opt/data1/public/software/systools/bibleAI/scripture-ai && docker-compose down && docker-compose up -d --build`
Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add components/bible/PlanTab.tsx lib/i18n/
git commit -m "feat: PlanTab组件i18n翻译"
```

---

## Task 9: P0 组件翻译 — FloatingMenu + Sidebar + Reader

**Files:**
- Modify: `components/bible/FloatingMenu.tsx`
- Modify: `components/bible/Sidebar.tsx`
- Modify: `components/bible/Reader.tsx`

- [ ] **Step 1: FloatingMenu 翻译**

引入 `useTranslation`，替换所有硬编码中文。FloatingMenu 中的菜单项标签需要翻译。

- [ ] **Step 2: Sidebar 翻译**

引入 `useTranslation`，替换所有硬编码中文。Sidebar 中的标签和按钮需要翻译。

- [ ] **Step 3: Reader 翻译**

引入 `useTranslation`，替换所有硬编码中文。Reader 中的操作按钮和提示文字需要翻译。

- [ ] **Step 4: 验证构建**

Run: `cd /opt/data1/public/software/systools/bibleAI/scripture-ai && docker-compose down && docker-compose up -d --build`
Expected: 构建成功

- [ ] **Step 5: 提交**

```bash
git add components/bible/FloatingMenu.tsx components/bible/Sidebar.tsx components/bible/Reader.tsx lib/i18n/
git commit -m "feat: FloatingMenu/Sidebar/Reader组件i18n翻译"
```

---

## Task 10: page.tsx TabList 翻译

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: 引入 useTranslation 并翻译 TabList**

在 page.tsx 中引入 `useTranslation`，将 TabList 中的硬编码标签替换为 `t()` 调用：

```typescript
// 旧：'📊 数据看板'
// 新：`📊 ${t('tabs.dashboard')}`

// 旧：'🖍️ 我的高亮'
// 新：`🖍️ ${t('tabs.highlights')}`

// 旧：'📖 读经计划'
// 新：`📖 ${t('tabs.plans')}`

// 旧：'🤖 AI 助手'
// 新：`🤖 ${t('tabs.ai')}`

// 旧：'⛪ 教会'
// 新：`⛪ ${t('tabs.group')}`

// 旧：'🗺️ 圣经地图'
// 新：`🗺️ ${t('tabs.atlas')}`

// 旧：'🌐 主题网络'
// 新：`🌐 ${t('tabs.theme')}`

// 旧：'🧠 记忆卡'
// 新：`🧠 ${t('tabs.memory')}`

// 旧：'⚙️ 设置'
// 新：`⚙️ ${t('tabs.settings')}`
```

- [ ] **Step 2: 验证构建**

Run: `cd /opt/data1/public/software/systools/bibleAI/scripture-ai && docker-compose down && docker-compose up -d --build`
Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add app/page.tsx lib/i18n/
git commit -m "feat: page.tsx TabList i18n翻译"
```

---

## Task 11: P1 组件翻译 — 第一批

**Files:**
- Modify: `components/bible/HighlightsTab.tsx`
- Modify: `components/bible/SearchResults.tsx`
- Modify: `components/bible/BookPicker.tsx`
- Modify: `components/bible/ShareCard.tsx`

- [ ] **Step 1: HighlightsTab 翻译**

引入 `useTranslation`，替换硬编码中文。高亮颜色名称和操作按钮。

- [ ] **Step 2: SearchResults 翻译**

引入 `useTranslation`，替换硬编码中文。搜索提示和结果标签。

- [ ] **Step 3: BookPicker 翻译**

引入 `useTranslation`，替换硬编码中文。旧约/新约标签、书卷分类。使用 `getBookCategory(bookId, locale)` 替代硬编码分类名。

- [ ] **Step 4: ShareCard 翻译**

引入 `useTranslation`，替换硬编码中文。分享模板和装饰文字。注意 ShareCard 中的 Canvas 绘制文字也需要根据 locale 选择。

- [ ] **Step 5: 验证构建**

Run: `cd /opt/data1/public/software/systools/bibleAI/scripture-ai && docker-compose down && docker-compose up -d --build`
Expected: 构建成功

- [ ] **Step 6: 提交**

```bash
git add components/bible/HighlightsTab.tsx components/bible/SearchResults.tsx components/bible/BookPicker.tsx components/bible/ShareCard.tsx lib/i18n/
git commit -m "feat: P1第一批组件i18n翻译(HighlightsTab/SearchResults/BookPicker/ShareCard)"
```

---

## Task 12: P1 组件翻译 — 第二批

**Files:**
- Modify: `components/group/GroupTab.tsx`
- Modify: `components/settings/ApiSettingsDialog.tsx`
- Modify: `components/settings/SyncSettings.tsx`
- Modify: `components/settings/NotificationSettings.tsx`
- Modify: `components/auth/UserMenu.tsx`

- [ ] **Step 1: GroupTab 翻译**

引入 `useTranslation`，替换硬编码中文。

- [ ] **Step 2: ApiSettingsDialog 翻译**

引入 `useTranslation`，替换硬编码中文。API 配置说明和标签。

- [ ] **Step 3: SyncSettings 翻译**

引入 `useTranslation`，替换硬编码中文。同步状态文本。

- [ ] **Step 4: NotificationSettings 翻译**

引入 `useTranslation`，替换硬编码中文。通知标签。

- [ ] **Step 5: UserMenu 翻译**

引入 `useTranslation`，替换硬编码中文。用户菜单项。

- [ ] **Step 6: 验证构建**

Run: `cd /opt/data1/public/software/systools/bibleAI/scripture-ai && docker-compose down && docker-compose up -d --build`
Expected: 构建成功

- [ ] **Step 7: 提交**

```bash
git add components/group/GroupTab.tsx components/settings/ApiSettingsDialog.tsx components/settings/SyncSettings.tsx components/settings/NotificationSettings.tsx components/auth/UserMenu.tsx lib/i18n/
git commit -m "feat: P1第二批组件i18n翻译(GroupTab/Settings/Auth)"
```

---

## Task 13: P1 组件翻译 — Onboarding

**Files:**
- Modify: `components/onboarding/` 下所有文件

- [ ] **Step 1: 翻译 onboarding 组件**

逐一翻译 onboarding 目录下的组件。引入 `useTranslation`，替换硬编码中文引导流程文本。

- [ ] **Step 2: 验证构建**

Run: `cd /opt/data1/public/software/systools/bibleAI/scripture-ai && docker-compose down && docker-compose up -d --build`
Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add components/onboarding/ lib/i18n/
git commit -m "feat: Onboarding组件i18n翻译"
```

---

## Task 14: 字典完整性验证 + 最终测试

**Files:**
- Modify: `lib/i18n/zh/` 和 `lib/i18n/en/` — 补充遗漏的键

- [ ] **Step 1: 检查字典完整性**

运行以下命令对比中英文字典键是否一致：

```bash
cd /opt/data1/public/software/systools/bibleAI/scripture-ai
# 提取所有键并对比
node -e "
const zh = require('./lib/i18n/zh/index.ts');
const en = require('./lib/i18n/en/index.ts');
const zhKeys = Object.keys(zh.zh).sort();
const enKeys = Object.keys(en.en).sort();
const missing = zhKeys.filter(k => !enKeys.includes(k));
const extra = enKeys.filter(k => !zhKeys.includes(k));
if (missing.length) console.log('Missing in en:', missing);
if (extra.length) console.log('Extra in en:', extra);
if (!missing.length && !extra.length) console.log('Keys match!');
"
```

如果有不一致，补充缺失的键。

- [ ] **Step 2: 检查代码中遗漏的硬编码中文**

搜索 P0/P1 组件中是否还有遗漏的硬编码中文：

```bash
cd /opt/data1/public/software/systools/bibleAI/scripture-ai
grep -rn '[\u4e00-\u9fff]' components/bible/AISidebar.tsx components/bible/PlanTab.tsx components/bible/FloatingMenu.tsx components/bible/Sidebar.tsx components/bible/Reader.tsx --include='*.tsx' | grep -v '//' | grep -v 'console'
```

如果有遗漏，添加到字典并替换。

- [ ] **Step 3: 手动验证完整流程**

1. 启动应用，默认中文界面
2. 切换到英文，验证：所有 P0/P1 组件标签变为英文、KJV 成为主版本、搜索使用 KJV
3. 切换回中文，验证：所有标签恢复中文、CUV 成为主版本
4. 刷新页面，验证 locale 持久化（localStorage + 服务器同步）

- [ ] **Step 4: 最终提交**

```bash
git add lib/i18n/
git commit -m "fix: 补充i18n字典遗漏键并验证完整性"
```

---

## Task 15: 自动部署

**Files:**
- 无代码修改

- [ ] **Step 1: 执行自动部署**

```bash
cd /opt/data1/public/software/systools/bibleAI/scripture-ai
./auto_deploy.sh -s "feat: 完成i18n多语言支持升级" -d "实现完整的英文locale支持：1)字典文件模块化拆分 2)浏览器语言自动检测和服务器同步 3)语言-版本联动(zh→CUV主版本,en→KJV主版本) 4)P0+P1组件翻译 5)读经计划双语数据 6)搜索API locale感知 7)全局resolveDualLang工具函数"
```
