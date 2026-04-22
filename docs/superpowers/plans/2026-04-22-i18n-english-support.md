# i18n English Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-language support (zh/en) to the Bible reading app with full linkage: UI text, Bible version, and AI response language all switch together.

**Architecture:** Self-built lightweight i18n system using Zustand LocaleSlice + translation dictionaries in `lib/i18n/`. No external i18n library. No route structure changes. Language switch is instant via Zustand state change.

**Tech Stack:** Next.js App Router, Zustand, TypeScript, Prisma

---

## File Structure

### New Files
- `lib/i18n/index.ts` — `t()` function, `useTranslation()` hook, `LocaleProvider`
- `lib/i18n/zh.ts` — Chinese translation dictionary
- `lib/i18n/en.ts` — English translation dictionary
- `store/slices/localeSlice.ts` — Zustand LocaleSlice

### Modified Files
- `store/slices.ts` — Import and compose LocaleSlice
- `store/types.ts` — Add LocaleSlice type
- `store/useBibleStore.ts` — No change (slices auto-composed)
- `lib/constants.ts` — Add `nameEn`, `categoryEn`, `introEn` to BIBLE_BOOKS; dual-language prompts
- `lib/plans.ts` — Add `titleEn`, `descriptionEn`, `tagsEn` to plans
- `lib/i18n.ts` — Delete (replaced by `lib/i18n/`)
- `prisma/schema.prisma` — Add `locale` field to UserSetting
- `app/api/chat/main/route.ts` — Accept `locale` param, select prompt by locale
- `app/api/chat/tutor/route.ts` — Same
- `app/api/chat/devotional/route.ts` — Same
- `app/api/chat/prayer/route.ts` — Same
- `app/api/chat/sermon/route.ts` — Same
- `app/api/chat/study-guide/route.ts` — Same
- `app/api/search/route.ts` — Use locale-aware version
- `app/api/parse-verse/route.ts` — Use locale-aware version
- `app/page.tsx` — Replace hardcoded Chinese strings with `t()`, add language switch to settings
- `components/bible/Reader.tsx` — Locale-aware primary version, translated strings
- `components/bible/Sidebar.tsx` — Translated book names, categories, UI strings
- `components/bible/PlanTab.tsx` — Translated plan titles, descriptions, UI strings
- `components/bible/AISidebar.tsx` — Translated UI strings, pass locale to API
- `components/bible/FloatingMenu.tsx` — Translated menu items
- `components/bible/TabContentRenderer.tsx` — Translated tab labels
- `TODO.md` — Document deferred pages

---

## Task 1: Create Translation Infrastructure

**Files:**
- Create: `lib/i18n/zh.ts`
- Create: `lib/i18n/en.ts`
- Create: `lib/i18n/index.ts`
- Delete: `lib/i18n.ts`

- [ ] **Step 1: Create `lib/i18n/zh.ts` with Chinese translations**

Extract all hardcoded Chinese strings from core components into a structured dictionary. Group by feature module:

```typescript
// lib/i18n/zh.ts
export const zh = {
  common: {
    retry: '重试',
    loading: '加载中...',
    search: '搜索',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    save: '保存',
    edit: '编辑',
    close: '关闭',
    send: '发送',
    copy: '复制',
    share: '分享',
    more: '更多',
    back: '返回',
    next: '下一步',
    prev: '上一步',
    done: '完成',
    error: '出错了',
    noData: '暂无数据',
  },
  tabs: {
    read: '阅读',
    plan: '计划',
    ai: 'AI',
    insights: '洞察',
    bookmarks: '书签',
    history: '历史',
    dashboard: '数据',
    crossref: '串珠',
    group: '小组',
    atlas: '地图',
    theme: '主题',
  },
  reader: {
    noContent: '此章节暂无经文内容',
    aiInterpret: 'AI 解读此节经文',
    chapterSummary: '阅读第 {chapter} 章精意',
    prevChapter: '上一章',
    nextChapter: '下一章',
    bilingual: '双语对照',
    darkMode: '深色模式',
    fontSize: '字号',
    copyVerse: '复制经文',
    shareVerse: '分享经文',
    highlight: '高亮',
    note: '笔记',
    aiChat: 'AI 对话',
    tts: '朗读',
  },
  sidebar: {
    title: '圣经目录',
    searchPlaceholder: '搜索卷名拼音或汉字...',
    oldTestament: '旧约全书',
    newTestament: '新约全书',
    chapters: '章',
  },
  plan: {
    title: '读经计划',
    myPlans: '我的计划',
    allPlans: '全部计划',
    continueReading: '继续今日阅读',
    startPlan: '开始计划',
    day: '第 {day} 天',
    completed: '已完成',
    streak: '连续 {count} 天',
    noPlans: '暂无读经计划',
    createPlan: '创建计划',
    deletePlan: '删除计划',
    todayTask: '今日任务',
    readChapter: '阅读 {book} 第 {chapter} 章',
    stepRead: '阅读',
    stepReflect: '反思',
    stepPray: '祷告',
  },
  ai: {
    title: 'AI 助手',
    placeholder: '输入你的问题...',
    thinking: '思考中...',
    newChat: '新对话',
    customPrompt: '自定义提示',
    savedInsights: '保存的洞察',
    noMessages: '开始一段新的对话',
    tutor: '经文导师',
    devotional: '灵修',
    prayer: '祷告',
    sermon: '讲道',
    studyGuide: '研读指南',
    deepExegesis: '深度解读',
    theologicalContext: '神学背景',
    lifeApplication: '生活应用',
    crossReference: '经文串珠',
  },
  floatingMenu: {
    copy: '复制',
    highlight: '高亮',
    note: '笔记',
    share: '分享',
    aiInterpret: 'AI 解读',
    tts: '朗读',
  },
  settings: {
    title: '设置',
    language: '语言',
    chinese: '中文',
    english: 'English',
    bilingual: '双语对照',
    darkMode: '深色模式',
    fontSize: '字号',
    apiConfig: 'API 配置',
    logout: '退出登录',
    login: '登录',
  },
  search: {
    placeholder: '搜索经文...',
    results: '搜索结果',
    noResults: '未找到相关经文',
  },
} as const

export type Translations = typeof zh
```

- [ ] **Step 2: Create `lib/i18n/en.ts` with English translations**

Mirror the exact same structure as `zh.ts`:

```typescript
// lib/i18n/en.ts
import type { Translations } from './zh'

export const en: Translations = {
  common: {
    retry: 'Retry',
    loading: 'Loading...',
    search: 'Search',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    save: 'Save',
    edit: 'Edit',
    close: 'Close',
    send: 'Send',
    copy: 'Copy',
    share: 'Share',
    more: 'More',
    back: 'Back',
    next: 'Next',
    prev: 'Previous',
    done: 'Done',
    error: 'Error',
    noData: 'No data',
  },
  tabs: {
    read: 'Read',
    plan: 'Plans',
    ai: 'AI',
    insights: 'Insights',
    bookmarks: 'Bookmarks',
    history: 'History',
    dashboard: 'Stats',
    crossref: 'Cross Ref',
    group: 'Group',
    atlas: 'Atlas',
    theme: 'Themes',
  },
  reader: {
    noContent: 'No content available for this chapter',
    aiInterpret: 'AI interpret this verse',
    chapterSummary: 'Read Chapter {chapter} Summary',
    prevChapter: 'Previous',
    nextChapter: 'Next',
    bilingual: 'Bilingual',
    darkMode: 'Dark Mode',
    fontSize: 'Font Size',
    copyVerse: 'Copy Verse',
    shareVerse: 'Share Verse',
    highlight: 'Highlight',
    note: 'Note',
    aiChat: 'AI Chat',
    tts: 'Read Aloud',
  },
  sidebar: {
    title: 'Bible Books',
    searchPlaceholder: 'Search book name...',
    oldTestament: 'Old Testament',
    newTestament: 'New Testament',
    chapters: 'ch.',
  },
  plan: {
    title: 'Reading Plans',
    myPlans: 'My Plans',
    allPlans: 'All Plans',
    continueReading: 'Continue Reading',
    startPlan: 'Start Plan',
    day: 'Day {day}',
    completed: 'Completed',
    streak: '{count} day streak',
    noPlans: 'No reading plans',
    createPlan: 'Create Plan',
    deletePlan: 'Delete Plan',
    todayTask: "Today's Task",
    readChapter: 'Read {book} Chapter {chapter}',
    stepRead: 'Read',
    stepReflect: 'Reflect',
    stepPray: 'Pray',
  },
  ai: {
    title: 'AI Assistant',
    placeholder: 'Ask a question...',
    thinking: 'Thinking...',
    newChat: 'New Chat',
    customPrompt: 'Custom Prompt',
    savedInsights: 'Saved Insights',
    noMessages: 'Start a new conversation',
    tutor: 'Verse Tutor',
    devotional: 'Devotional',
    prayer: 'Prayer',
    sermon: 'Sermon',
    studyGuide: 'Study Guide',
    deepExegesis: 'Deep Exegesis',
    theologicalContext: 'Theological Context',
    lifeApplication: 'Life Application',
    crossReference: 'Cross Reference',
  },
  floatingMenu: {
    copy: 'Copy',
    highlight: 'Highlight',
    note: 'Note',
    share: 'Share',
    aiInterpret: 'AI Interpret',
    tts: 'Read Aloud',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    chinese: '中文',
    english: 'English',
    bilingual: 'Bilingual',
    darkMode: 'Dark Mode',
    fontSize: 'Font Size',
    apiConfig: 'API Config',
    logout: 'Log Out',
    login: 'Log In',
  },
  search: {
    placeholder: 'Search verses...',
    results: 'Search Results',
    noResults: 'No verses found',
  },
}
```

- [ ] **Step 3: Create `lib/i18n/index.ts` with `t()` function and `useTranslation()` hook**

```typescript
// lib/i18n/index.ts
import { zh } from './zh'
import { en } from './en'
import type { Translations } from './zh'
import { useBibleStore } from '@/store/useBibleStore'

export type Locale = 'zh' | 'en'

const translations: Record<Locale, Translations> = { zh, en }

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : undefined
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  )
}

export function t(key: string, params?: Record<string, string | number>): string {
  const locale = useBibleStore.getState().locale
  const dict = translations[locale] || translations.zh
  const value = getNestedValue(dict as unknown as Record<string, unknown>, key)
  if (!value) return key
  return interpolate(value, params)
}

export function useTranslation() {
  const locale = useBibleStore((state) => state.locale)
  return {
    t,
    locale,
  }
}

export type { Translations }
```

- [ ] **Step 4: Delete old `lib/i18n.ts`**

Delete the existing skeleton file that is not used by any component.

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/ lib/i18n.ts
git commit -m "feat: add i18n translation infrastructure with zh/en dictionaries"
```

---

## Task 2: Add LocaleSlice to Zustand Store

**Files:**
- Create: `store/slices/localeSlice.ts`
- Modify: `store/slices.ts`
- Modify: `store/types.ts`

- [ ] **Step 1: Create `store/slices/localeSlice.ts`**

```typescript
// store/slices/localeSlice.ts
import type { StateCreator } from 'zustand'
import type { LocaleSlice, StoreState } from '../types'

export const createLocaleSlice: StateCreator<StoreState, [], [], LocaleSlice> = (set) => ({
  locale: (typeof window !== 'undefined' && localStorage.getItem('locale') as 'zh' | 'en') || 'zh',
  setLocale: (locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale)
    }
    set({ locale })
  },
})
```

- [ ] **Step 2: Add `LocaleSlice` type to `store/types.ts`**

Add to the types file:

```typescript
export interface LocaleSlice {
  locale: 'zh' | 'en'
  setLocale: (locale: 'zh' | 'en') => void
}
```

And add `LocaleSlice` to the `StoreState` type intersection.

- [ ] **Step 3: Import and compose `LocaleSlice` in `store/slices.ts`**

Add the import at the top:
```typescript
import { createLocaleSlice } from './localeSlice'
```

Add `createLocaleSlice` to the slice composition (following the existing pattern of `createUISlice`, `createReaderSlice`, etc.).

- [ ] **Step 4: Verify the store compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No type errors related to LocaleSlice

- [ ] **Step 5: Commit**

```bash
git add store/slices/localeSlice.ts store/slices.ts store/types.ts
git commit -m "feat: add LocaleSlice to Zustand store"
```

---

## Task 3: Add `locale` Field to Database Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `locale` field to `UserSetting` model**

In `prisma/schema.prisma`, find the `UserSetting` model and add:

```prisma
model UserSetting {
  // ... existing fields
  locale String? // 'zh' | 'en', null = default Chinese
}
```

- [ ] **Step 2: Push schema to database**

Run: `npx prisma db push`
Expected: Schema synced successfully

- [ ] **Step 3: Generate Prisma client**

Run: `npx prisma generate`
Expected: Prisma client generated

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add locale field to UserSetting model"
```

---

## Task 4: Extend BIBLE_BOOKS with English Names

**Files:**
- Modify: `lib/constants.ts`

- [ ] **Step 1: Add `nameEn`, `categoryEn`, `introEn` to each book in BIBLE_BOOKS**

The current `BIBLE_BOOKS` array has objects like:
```typescript
{ id: 'Gen', name: '创世记', chapters: 50, category: '律法书', intro: '...' }
```

Change to:
```typescript
{ id: 'Gen', name: '创世记', nameEn: 'Genesis', chapters: 50, category: '律法书', categoryEn: 'Law', intro: '...', introEn: 'The book of beginnings...' }
```

All 66 books need the three new fields. Here are the English values:

**Old Testament (律法书 / Law):**
| id | nameEn | categoryEn |
|----|--------|-----------|
| Gen | Genesis | Law |
| Exod | Exodus | Law |
| Lev | Leviticus | Law |
| Num | Numbers | Law |
| Deut | Deuteronomy | Law |

**Old Testament (历史书 / History):**
| id | nameEn | categoryEn |
|----|--------|-----------|
| Josh | Joshua | History |
| Judg | Judges | History |
| Ruth | Ruth | History |
| 1Sam | 1 Samuel | History |
| 2Sam | 2 Samuel | History |
| 1Kgs | 1 Kings | History |
| 2Kgs | 2 Kings | History |
| 1Chr | 1 Chronicles | History |
| 2Chr | 2 Chronicles | History |
| Ezra | Ezra | History |
| Neh | Nehemiah | History |
| Esth | Esther | History |

**Old Testament (诗歌智慧书 / Poetry & Wisdom):**
| id | nameEn | categoryEn |
|----|--------|-----------|
| Job | Job | Poetry & Wisdom |
| Ps | Psalms | Poetry & Wisdom |
| Prov | Proverbs | Poetry & Wisdom |
| Eccl | Ecclesiastes | Poetry & Wisdom |
| Song | Song of Solomon | Poetry & Wisdom |

**Old Testament (大先知书 / Major Prophets):**
| id | nameEn | categoryEn |
|----|--------|-----------|
| Isa | Isaiah | Major Prophets |
| Jer | Jeremiah | Major Prophets |
| Lam | Lamentations | Major Prophets |
| Ezek | Ezekiel | Major Prophets |
| Dan | Daniel | Major Prophets |

**Old Testament (小先知书 / Minor Prophets):**
| id | nameEn | categoryEn |
|----|--------|-----------|
| Hos | Hosea | Minor Prophets |
| Joel | Joel | Minor Prophets |
| Amos | Amos | Minor Prophets |
| Obad | Obadiah | Minor Prophets |
| Jon | Jonah | Minor Prophets |
| Mic | Micah | Minor Prophets |
| Nah | Nahum | Minor Prophets |
| Hab | Habakkuk | Minor Prophets |
| Zeph | Zephaniah | Minor Prophets |
| Hag | Haggai | Minor Prophets |
| Zech | Zechariah | Minor Prophets |
| Mal | Malachi | Minor Prophets |

**New Testament (福音书 / Gospels):**
| id | nameEn | categoryEn |
|----|--------|-----------|
| Matt | Matthew | Gospels |
| Mark | Mark | Gospels |
| Luke | Luke | Gospels |
| John | John | Gospels |

**New Testament (教会历史 / Church History):**
| id | nameEn | categoryEn |
|----|--------|-----------|
| Acts | Acts | Church History |

**New Testament (保罗书信 / Pauline Epistles):**
| id | nameEn | categoryEn |
|----|--------|-----------|
| Rom | Romans | Pauline Epistles |
| 1Cor | 1 Corinthians | Pauline Epistles |
| 2Cor | 2 Corinthians | Pauline Epistles |
| Gal | Galatians | Pauline Epistles |
| Eph | Ephesians | Pauline Epistles |
| Phil | Philippians | Pauline Epistles |
| Col | Colossians | Pauline Epistles |
| 1Thess | 1 Thessalonians | Pauline Epistles |
| 2Thess | 2 Thessalonians | Pauline Epistles |
| 1Tim | 1 Timothy | Pauline Epistles |
| 2Tim | 2 Timothy | Pauline Epistles |
| Titus | Titus | Pauline Epistles |
| Phlm | Philemon | Pauline Epistles |

**New Testament (普通书信 / General Epistles):**
| id | nameEn | categoryEn |
|----|--------|-----------|
| Heb | Hebrews | General Epistles |
| Jas | James | General Epistles |
| 1Pet | 1 Peter | General Epistles |
| 2Pet | 2 Peter | General Epistles |
| 1John | 1 John | General Epistles |
| 2John | 2 John | General Epistles |
| 3John | 3 John | General Epistles |
| Jude | Jude | General Epistles |

**New Testament (预言 / Prophecy):**
| id | nameEn | categoryEn |
|----|--------|-----------|
| Rev | Revelation | Prophecy |

For `introEn`, write a brief 1-2 sentence English introduction for each book (e.g., `"The book of beginnings, describing creation, the fall, and God's covenant with Abraham."`).

- [ ] **Step 2: Add helper function `getBookDisplayName`**

Add to `lib/constants.ts`:

```typescript
export function getBookDisplayName(bookId: string, locale: 'zh' | 'en'): string {
  const book = BIBLE_BOOKS.find(b => b.id === bookId)
  if (!book) return bookId
  return locale === 'en' ? book.nameEn : book.name
}

export function getBookCategory(bookId: string, locale: 'zh' | 'en'): string {
  const book = BIBLE_BOOKS.find(b => b.id === bookId)
  if (!book) return ''
  return locale === 'en' ? book.categoryEn : book.category
}
```

- [ ] **Step 3: Verify no existing code breaks**

The existing `name`, `category`, `intro` fields are unchanged. All existing code referencing them continues to work. Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: add English names, categories, and intros to BIBLE_BOOKS"
```

---

## Task 5: Dual-Language AI Prompts

**Files:**
- Modify: `lib/constants.ts`

- [ ] **Step 1: Convert all prompt constants to dual-language objects**

The current prompts are Chinese strings. Convert each to `{ zh: string, en: string }` format.

**SYSTEM_PROMPT** (currently `export const SYSTEM_PROMPT = '...'`):
```typescript
export const SYSTEM_PROMPT = {
  zh: `你是一位精通圣经的AI助手...`,  // existing Chinese text unchanged
  en: `You are an AI assistant well-versed in the Bible...`,  // new English version
}
```

**TUTOR_PROMPT**:
```typescript
export const TUTOR_PROMPT = {
  zh: `你是一位圣经导师...`,
  en: `You are a Bible tutor...`,
}
```

**DEVOTIONAL_PROMPT**:
```typescript
export const DEVOTIONAL_PROMPT = {
  zh: `你是一位灵修导师...`,
  en: `You are a devotional guide...`,
}
```

**PRAYER_PROMPT**:
```typescript
export const PRAYER_PROMPT = {
  zh: `你是一位祷告伙伴...`,
  en: `You are a prayer companion...`,
}
```

**SERMON_PROMPT**:
```typescript
export const SERMON_PROMPT = {
  zh: `你是一位讲道助手...`,
  en: `You are a sermon assistant...`,
}
```

**STUDY_GUIDE_PROMPT**:
```typescript
export const STUDY_GUIDE_PROMPT = {
  zh: `你是一位圣经研读指南...`,
  en: `You are a Bible study guide...`,
}
```

**CHAPTER_SUMMARY_PROMPT**:
```typescript
export const CHAPTER_SUMMARY_PROMPT = {
  zh: `请简要总结...`,
  en: `Please briefly summarize...`,
}
```

**THEOLOGICAL_PROMPTS** (currently array of `{ label, prompt }`):
```typescript
export const THEOLOGICAL_PROMPTS = [
  { label: { zh: '深度解读', en: 'Deep Exegesis' }, prompt: { zh: '...', en: '...' } },
  { label: { zh: '神学背景', en: 'Theological Context' }, prompt: { zh: '...', en: '...' } },
  { label: { zh: '生活应用', en: 'Life Application' }, prompt: { zh: '...', en: '...' } },
  { label: { zh: '经文串珠', en: 'Cross Reference' }, prompt: { zh: '...', en: '...' } },
]
```

- [ ] **Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: convert AI prompts to dual-language format"
```

---

## Task 6: Extend Reading Plans with English Data

**Files:**
- Modify: `lib/plans.ts`

- [ ] **Step 1: Add `titleEn`, `descriptionEn`, `tagsEn` to each plan**

The current `ReadingPlan` interface and data need English fields. Extend the interface:

```typescript
export interface ReadingPlan {
  id: string
  title: string
  titleEn: string       // NEW
  description: string
  descriptionEn: string  // NEW
  tags: string[]
  tagsEn: string[]       // NEW
  // ... rest unchanged
}
```

Add English values for each plan. For example:
- `title: '创世记精读'` → `titleEn: 'Genesis In-Depth'`
- `description: '逐章阅读创世记...'` → `descriptionEn: 'Read Genesis chapter by chapter...'`
- `tags: ['旧约', '律法书']` → `tagsEn: ['Old Testament', 'Law']`

- [ ] **Step 2: Add helper function**

```typescript
export function getPlanTitle(plan: ReadingPlan, locale: 'zh' | 'en'): string {
  return locale === 'en' ? plan.titleEn : plan.title
}

export function getPlanDescription(plan: ReadingPlan, locale: 'zh' | 'en'): string {
  return locale === 'en' ? plan.descriptionEn : plan.description
}

export function getPlanTags(plan: ReadingPlan, locale: 'zh' | 'en'): string[] {
  return locale === 'en' ? plan.tagsEn : plan.tags
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/plans.ts
git commit -m "feat: add English titles, descriptions, and tags to reading plans"
```

---

## Task 7: Update API Routes for Locale-Aware Prompts

**Files:**
- Modify: `app/api/chat/main/route.ts`
- Modify: `app/api/chat/tutor/route.ts`
- Modify: `app/api/chat/devotional/route.ts`
- Modify: `app/api/chat/prayer/route.ts`
- Modify: `app/api/chat/sermon/route.ts`
- Modify: `app/api/chat/study-guide/route.ts`
- Modify: `app/api/search/route.ts`
- Modify: `app/api/parse-verse/route.ts`

- [ ] **Step 1: Update `/api/chat/main/route.ts`**

Find where the request body is destructured and add `locale`:
```typescript
// Before:
const { message, sessionId, ... } = await request.json()

// After:
const { message, sessionId, locale = 'zh', ... } = await request.json()
```

Find where `SYSTEM_PROMPT` is used and select by locale:
```typescript
// Before:
const systemPrompt = SYSTEM_PROMPT

// After:
const systemPrompt = SYSTEM_PROMPT[locale as 'zh' | 'en'] || SYSTEM_PROMPT.zh
```

Do the same for `CHAPTER_SUMMARY_PROMPT` and `THEOLOGICAL_PROMPTS` if used in this route.

- [ ] **Step 2: Update `/api/chat/tutor/route.ts`**

Same pattern: add `locale` to destructured body, use `TUTOR_PROMPT[locale]` instead of `TUTOR_PROMPT`.

- [ ] **Step 3: Update `/api/chat/devotional/route.ts`**

Same pattern with `DEVOTIONAL_PROMPT`.

- [ ] **Step 4: Update `/api/chat/prayer/route.ts`**

Same pattern with `PRAYER_PROMPT`.

- [ ] **Step 5: Update `/api/chat/sermon/route.ts`**

Same pattern with `SERMON_PROMPT`.

- [ ] **Step 6: Update `/api/chat/study-guide/route.ts`**

Same pattern with `STUDY_GUIDE_PROMPT`.

- [ ] **Step 7: Update `/api/search/route.ts`**

Find where `version` is used (likely hardcoded `'CUV'`). Make it locale-aware:
```typescript
// Before:
const version = 'CUV'

// After:
const searchVersion = locale === 'en' ? 'KJV' : 'CUV'
```

- [ ] **Step 8: Update `/api/parse-verse/route.ts`**

If this route uses book names or version-specific logic, add locale awareness similarly.

- [ ] **Step 9: Commit**

```bash
git add app/api/chat/ app/api/search/ app/api/parse-verse/
git commit -m "feat: add locale parameter to all chat and search API routes"
```

---

## Task 8: Update AISlice to Pass Locale

**Files:**
- Modify: `store/slices.ts` (AISlice section)

- [ ] **Step 1: Add `locale` to AI request payloads**

In the AISlice, find the `enqueueAI` function and all places where API calls are made (fetch to `/api/chat/*`). Add `locale: get().locale` to each request body.

For example:
```typescript
// Before:
const response = await fetch('/api/chat/main', {
  method: 'POST',
  body: JSON.stringify({ message, sessionId }),
})

// After:
const response = await fetch('/api/chat/main', {
  method: 'POST',
  body: JSON.stringify({ message, sessionId, locale: get().locale }),
})
```

Apply this to ALL chat API calls in the AISlice (main, tutor, devotional, prayer, sermon, study-guide).

- [ ] **Step 2: Commit**

```bash
git add store/slices.ts
git commit -m "feat: pass locale from AISlice to all chat API requests"
```

---

## Task 9: Update Reader Component for Locale-Aware Bible Version

**Files:**
- Modify: `components/bible/Reader.tsx`

- [ ] **Step 1: Import `useTranslation` and locale helpers**

```typescript
import { useTranslation } from '@/lib/i18n'
import { getBookDisplayName } from '@/lib/constants'
```

- [ ] **Step 2: Determine primary/secondary version based on locale**

Inside the component:
```typescript
const { locale } = useTranslation()
const primaryVersion = locale === 'en' ? 'KJV' : 'CUV'
const secondaryVersion = locale === 'en' ? 'CUV' : 'KJV'
```

- [ ] **Step 3: Update verse rendering to use primaryVersion**

Find where verses are rendered (the main verse display logic). Currently CUV is always primary and KJV is shown when `showEnglish` is true. Swap the logic:
- Primary version (CUV for zh, KJV for en) is always shown
- Secondary version is shown when `showEnglish` is true

- [ ] **Step 4: Replace hardcoded Chinese strings with `t()` calls**

Find and replace all hardcoded Chinese strings in Reader.tsx:
- `'上一章'` → `t('reader.prevChapter')`
- `'下一章'` → `t('reader.nextChapter')`
- `'AI 解读此节经文'` → `t('reader.aiInterpret')`
- `'此章节暂无经文内容'` → `t('reader.noContent')`
- `'阅读第 N 章精意'` → `t('reader.chapterSummary', { chapter: N })`
- `'复制经文'` → `t('reader.copyVerse')`
- `'分享经文'` → `t('reader.shareVerse')`
- `'高亮'` → `t('reader.highlight')`
- `'笔记'` → `t('reader.note')`
- `'AI 对话'` → `t('reader.aiChat')`
- `'朗读'` → `t('reader.tts')`
- `'双语对照'` / `'中英对照'` → `t('settings.bilingual')`
- `'深色模式'` → `t('settings.darkMode')`
- `'字号'` → `t('settings.fontSize')`

- [ ] **Step 5: Update chapter title to use localized book name**

Find where the chapter title is displayed (e.g., `创世记 第1章`). Change to use `getBookDisplayName`:
```typescript
// Before:
`${book.name} 第${chapter}章`

// After:
locale === 'en'
  ? `${getBookDisplayName(book.id, locale)} Chapter ${chapter}`
  : `${getBookDisplayName(book.id, locale)} 第${chapter}章`
```

Or use a translation key with interpolation:
```typescript
t('plan.readChapter', { book: getBookDisplayName(book.id, locale), chapter })
```

- [ ] **Step 6: Commit**

```bash
git add components/bible/Reader.tsx
git commit -m "feat: locale-aware Bible version and translated strings in Reader"
```

---

## Task 10: Update Sidebar Component

**Files:**
- Modify: `components/bible/Sidebar.tsx`

- [ ] **Step 1: Import translation utilities**

```typescript
import { useTranslation } from '@/lib/i18n'
import { getBookDisplayName, getBookCategory } from '@/lib/constants'
```

- [ ] **Step 2: Replace hardcoded Chinese strings**

- `'圣经目录'` → `t('sidebar.title')`
- `'搜索卷名拼音或汉字...'` → `t('sidebar.searchPlaceholder')`
- `'旧约全书'` → `t('sidebar.oldTestament')`
- `'新约全书'` → `t('sidebar.newTestament')`
- `'章'` → `t('sidebar.chapters')`

- [ ] **Step 3: Use localized book names and categories**

Where book names are displayed:
```typescript
// Before:
{book.name}

// After:
{getBookDisplayName(book.id, locale)}
```

Where categories are displayed:
```typescript
// Before:
{book.category}

// After:
{getBookCategory(book.id, locale)}
```

- [ ] **Step 4: Commit**

```bash
git add components/bible/Sidebar.tsx
git commit -m "feat: translated Sidebar with localized book names"
```

---

## Task 11: Update PlanTab Component

**Files:**
- Modify: `components/bible/PlanTab.tsx`

- [ ] **Step 1: Import translation utilities and plan helpers**

```typescript
import { useTranslation } from '@/lib/i18n'
import { getPlanTitle, getPlanDescription, getPlanTags } from '@/lib/plans'
import { getBookDisplayName } from '@/lib/constants'
```

- [ ] **Step 2: Replace hardcoded Chinese strings**

- `'读经计划'` → `t('plan.title')`
- `'我的计划'` → `t('plan.myPlans')`
- `'全部计划'` → `t('plan.allPlans')`
- `'继续今日阅读'` → `t('plan.continueReading')`
- `'开始计划'` → `t('plan.startPlan')`
- `'第 N 天'` → `t('plan.day', { day: N })`
- `'已完成'` → `t('plan.completed')`
- `'连续 N 天'` → `t('plan.streak', { count: N })`
- `'暂无读经计划'` → `t('plan.noPlans')`
- `'创建计划'` → `t('plan.createPlan')`
- `'删除计划'` → `t('plan.deletePlan')`
- `'今日任务'` → `t('plan.todayTask')`
- `'阅读'` → `t('plan.stepRead')`
- `'反思'` → `t('plan.stepReflect')`
- `'祷告'` → `t('plan.stepPray')`

- [ ] **Step 3: Use localized plan titles, descriptions, tags**

```typescript
// Before:
{plan.title}

// After:
{getPlanTitle(plan, locale)}
```

Same for `plan.description` → `getPlanDescription(plan, locale)` and `plan.tags` → `getPlanTags(plan, locale)`.

- [ ] **Step 4: Commit**

```bash
git add components/bible/PlanTab.tsx
git commit -m "feat: translated PlanTab with localized plan data"
```

---

## Task 12: Update AISidebar Component

**Files:**
- Modify: `components/bible/AISidebar.tsx`

- [ ] **Step 1: Import translation utilities**

```typescript
import { useTranslation } from '@/lib/i18n'
```

- [ ] **Step 2: Replace hardcoded Chinese strings**

- `'AI 助手'` → `t('ai.title')`
- `'输入你的问题...'` → `t('ai.placeholder')`
- `'思考中...'` → `t('ai.thinking')`
- `'新对话'` → `t('ai.newChat')`
- `'自定义提示'` → `t('ai.customPrompt')`
- `'保存的洞察'` → `t('ai.savedInsights')`
- `'开始一段新的对话'` → `t('ai.noMessages')`
- `'经文导师'` → `t('ai.tutor')`
- `'灵修'` → `t('ai.devotional')`
- `'祷告'` → `t('ai.prayer')`
- `'讲道'` → `t('ai.sermon')`
- `'研读指南'` → `t('ai.studyGuide')`
- `'深度解读'` → `t('ai.deepExegesis')`
- `'神学背景'` → `t('ai.theologicalContext')`
- `'生活应用'` → `t('ai.lifeApplication')`
- `'经文串珠'` → `t('ai.crossReference')`

- [ ] **Step 3: Update THEOLOGICAL_PROMPTS label rendering**

Where THEOLOGICAL_PROMPTS labels are displayed:
```typescript
// Before:
{prompt.label}

// After:
{prompt.label[locale as 'zh' | 'en'] || prompt.label.zh}
```

- [ ] **Step 4: Commit**

```bash
git add components/bible/AISidebar.tsx
git commit -m "feat: translated AISidebar with locale-aware prompt labels"
```

---

## Task 13: Update FloatingMenu Component

**Files:**
- Modify: `components/bible/FloatingMenu.tsx`

- [ ] **Step 1: Import translation utilities**

```typescript
import { useTranslation } from '@/lib/i18n'
```

- [ ] **Step 2: Replace hardcoded Chinese strings**

- `'复制'` → `t('floatingMenu.copy')`
- `'高亮'` → `t('floatingMenu.highlight')`
- `'笔记'` → `t('floatingMenu.note')`
- `'分享'` → `t('floatingMenu.share')`
- `'AI 解读'` → `t('floatingMenu.aiInterpret')`
- `'朗读'` → `t('floatingMenu.tts')`

- [ ] **Step 3: Commit**

```bash
git add components/bible/FloatingMenu.tsx
git commit -m "feat: translated FloatingMenu"
```

---

## Task 14: Update TabContentRenderer and page.tsx

**Files:**
- Modify: `components/bible/TabContentRenderer.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Update TabContentRenderer tab labels**

Import `useTranslation` and replace hardcoded tab labels:
- `'阅读'` → `t('tabs.read')`
- `'计划'` → `t('tabs.plan')`
- `'AI'` → `t('tabs.ai')`
- `'洞察'` → `t('tabs.insights')`
- `'书签'` → `t('tabs.bookmarks')`
- `'历史'` → `t('tabs.history')`
- `'数据'` → `t('tabs.dashboard')`
- `'串珠'` → `t('tabs.crossref')`
- `'小组'` → `t('tabs.group')`
- `'地图'` → `t('tabs.atlas')`
- `'主题'` → `t('tabs.theme')`

- [ ] **Step 2: Update page.tsx hardcoded strings**

Find and replace all hardcoded Chinese strings in page.tsx:
- Search bar placeholder
- Settings panel labels
- Any other visible Chinese text

Import `useTranslation` and use `t()` for each string.

- [ ] **Step 3: Add language switch dropdown to settings panel**

In the settings section of page.tsx, add a language selector:

```tsx
<div className="flex items-center justify-between">
  <span className="text-sm">{t('settings.language')}</span>
  <select
    value={locale}
    onChange={(e) => setLocale(e.target.value as 'zh' | 'en')}
    className="text-sm bg-transparent border rounded px-2 py-1"
  >
    <option value="zh">{t('settings.chinese')}</option>
    <option value="en">{t('settings.english')}</option>
  </select>
</div>
```

Place this near the top of the settings panel, before the existing settings like dark mode and font size.

- [ ] **Step 4: Commit**

```bash
git add components/bible/TabContentRenderer.tsx app/page.tsx
git commit -m "feat: translated tab labels, page strings, and added language switch"
```

---

## Task 15: Sync Locale with UserSetting (Authenticated Users)

**Files:**
- Modify: `store/slices.ts` (UserDataSlice section)
- Modify: `app/api/user/settings/route.ts` (or equivalent settings API)

- [ ] **Step 1: Update `setLocale` to sync with database when authenticated**

In the LocaleSlice, enhance `setLocale` to also call the settings API when the user is logged in:

```typescript
setLocale: async (locale) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale)
  }
  set({ locale })
  // Sync to database if authenticated
  const state = get()
  if (state.user) {
    try {
      await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      })
    } catch {
      // Silent fail - locale is already saved locally
    }
  }
}
```

- [ ] **Step 2: Load locale from UserSetting on login**

In the UserDataSlice, find where user settings are loaded after authentication. Add locale loading:

```typescript
// After fetching user settings:
if (settings?.locale) {
  get().setLocale(settings.locale)
}
```

- [ ] **Step 3: Update settings API route to accept `locale`**

In the settings API route, add `locale` to the updatable fields:

```typescript
// In the PATCH handler:
const { locale, ...otherFields } = await request.json()
// Include locale in the Prisma update:
await prisma.userSetting.update({
  where: { userId },
  data: { locale, ...otherFields },
})
```

- [ ] **Step 4: Commit**

```bash
git add store/slices.ts app/api/user/settings/
git commit -m "feat: sync locale with UserSetting for authenticated users"
```

---

## Task 16: Create TODO.md for Deferred Pages

**Files:**
- Create: `TODO.md`

- [ ] **Step 1: Write TODO.md**

```markdown
# TODO: i18n Deferred Pages

The following pages still have hardcoded Chinese strings and need translation in a future iteration:

- [ ] DashboardTab (数据看板) - components/bible/DashboardTab.tsx
- [ ] CrossRefTab (经文串珠) - components/bible/CrossRefTab.tsx
- [ ] GroupTab (小组读经) - components/bible/GroupTab.tsx
- [ ] AtlasPanel (圣经地图) - components/atlas/
- [ ] InsightsTab (AI 洞察) - components/bible/InsightsTab.tsx
- [ ] BookmarksTab (书签) - components/bible/BookmarksTab.tsx
- [ ] ReadingHistoryTab (阅读历史) - components/bible/ReadingHistoryTab.tsx
- [ ] ThemeGraphTab (主题网络) - components/theme/

Translation keys for these pages should be added to `lib/i18n/zh.ts` and `lib/i18n/en.ts` when implementing.
```

- [ ] **Step 2: Commit**

```bash
git add TODO.md
git commit -m "docs: add TODO for deferred i18n pages"
```

---

## Task 17: Build Verification and Final Testing

**Files:**
- No new files

- [ ] **Step 1: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Docker rebuild and smoke test**

Run: `docker-compose down && docker-compose up -d --build`
Expected: Container starts successfully

- [ ] **Step 4: Manual smoke test checklist**

- [ ] Default (zh): App loads in Chinese, all existing behavior works
- [ ] Switch to English: Settings → Language → English
- [ ] English mode: UI strings are English, KJV is primary version
- [ ] Bilingual toggle: In English mode, enabling bilingual shows CUV alongside KJV
- [ ] AI chat: In English mode, AI responds in English
- [ ] Switch back to Chinese: All returns to Chinese, CUV is primary
- [ ] Page refresh: Language preference persists (localStorage)
- [ ] Login/logout: Locale syncs with UserSetting

- [ ] **Step 5: Deploy**

```bash
./auto_deploy.sh -s "feat: add i18n English support with full locale linkage" -d "Implemented multi-language support (zh/en). Added LocaleSlice to Zustand store, translation dictionaries, locale-aware Bible version selection, dual-language AI prompts, and language switch in settings panel. CUV is default for Chinese, KJV for English. All core pages translated; secondary pages deferred to TODO.md."
```
