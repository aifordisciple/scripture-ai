# Multi-language (i18n) Enhancement Design

**Date:** 2026-04-23
**Status:** Approved
**Approach:** Incremental improvement on existing custom i18n system (Plan A)

## Problem Statement

The scripture-ai app has a custom i18n system (`lib/i18n/`) with zh/en translation files and `useTranslation` hook, but significant gaps remain:

1. **~15+ components still have hardcoded Chinese text** (DashboardDialog, ReadingHistoryTab, BookmarksTab, InsightsTab, ThemeGraphTab, VirtualizedMessageList, CheckInCard, OfflineIndicator, NotificationCenter, KeyboardShortcutsDialog, all group/* components, etc.)
2. **Bible version is rigidly tied to locale** — zh→CUV only, en→KJV only, no override possible
3. **`BibleVersion` Prisma model is missing** — `/api/versions` and `/api/versions/import` reference a non-existent model
4. **Single verse API hardcodes CUV** — `/api/bible/[bookId]/[chapter]/[verse]` always returns CUV
5. **bookName inconsistency** — CUV rows store Chinese names ("创世记"), KJV rows store English ("Genesis"), breaking English search
6. **TTS hardcodes CUV** — speech always uses CUV verses regardless of locale
7. **`showEnglish` is misleadingly named** — it toggles secondary version display, not specifically English
8. **app/layout.tsx hardcodes Chinese metadata** — `<html lang="zh-CN">` and all SEO metadata are Chinese-only
9. **lib/ utility files have hardcoded Chinese** — group-badges.ts, bible-periods.ts, errors/chat-errors.ts, plans.ts, email.ts, cross-reference-ai.ts

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Version-language binding | Keep binding, allow override | zh→CUV, en→KJV by default, but users can override in settings |
| i18n scope | Core UI first | P0/P1 components prioritized; admin and P2 deferred |
| Server-side i18n | API parameterization | API routes accept `locale` param, return language-appropriate responses |
| Deployment strategy | 3 phases | Infrastructure → Component i18n → Server i18n; each phase independently deployable |
| i18n framework | Keep custom system | Existing system works well; no need for third-party library |

## Phase 1: Infrastructure & Bug Fixes (~15 files)

### 1.1 Store Layer Changes

**localeSlice — add `bibleVersion` field:**

```typescript
interface LocaleSlice {
  locale: 'zh' | 'en'
  bibleVersion: 'CUV' | 'KJV'  // NEW
  setLocale: (locale: 'zh' | 'en') => void
  setBibleVersion: (version: 'CUV | 'KJV') => void  // NEW
}
```

- `setLocale()` auto-sets `bibleVersion` to default (zh→CUV, en→KJV)
- `setBibleVersion()` allows user override without changing locale
- Both persist to localStorage and sync to server

**ReaderSlice — rename `showEnglish` → `showDualVersion`:**

- More accurate: shows the secondary version (not necessarily English)
- Update all references across components

### 1.2 Version Constants

Add to `lib/constants.ts`:

```typescript
export const BIBLE_VERSIONS = {
  CUV: { code: 'CUV', name: '和合本', nameEn: 'Chinese Union Version', language: 'zh' },
  KJV: { code: 'KJV', name: 'King James Version', nameEn: 'King James Version', language: 'en' },
} as const

export const DEFAULT_VERSION: Record<'zh' | 'en', 'CUV' | 'KJV'> = {
  zh: 'CUV',
  en: 'KJV',
}
```

### 1.3 API Fixes

| API | Current Issue | Fix |
|-----|--------------|-----|
| `/api/bible/[bookId]/[chapter]/[verse]` | Hardcodes `version: 'CUV'` | Accept `version` query param, default from locale |
| `/api/versions` | Queries non-existent `BibleVersion` model | Return `BIBLE_VERSIONS` constant directly |
| `/api/versions/import` | References non-existent `BibleVersion` model | Mark as deprecated or remove |
| `/api/search` | AI search uses Chinese book names, KJV rows have English `bookName` | Use `bookId` + `chapter` + `verse` for Prisma queries instead of `bookName`; AI prompt returns structured `{bookId, chapter, verse}` objects |

### 1.4 TTS Fix

`hooks/use-bible-data.ts` line 38: change `version === 'CUV'` to use `bibleVersion` from store.

### 1.5 layout.tsx Dynamic Metadata

- `<html lang="zh-CN">` → read locale from store/cookie
- `metadata` (title, description, keywords) → return zh or en based on locale
- JSON-LD structured data → locale-aware

### 1.6 Prisma Schema Cleanup

Remove or fix `BibleVersion` model references in API routes that query it.

### Verification Criteria

- [ ] Switching locale correctly switches primary Bible version
- [ ] TTS reads from the correct version
- [ ] Search works in both zh and en
- [ ] No regression in existing functionality

## Phase 2: Core Component i18n Completion (~20 files)

### 2.1 New Translation Namespace Files

```
lib/i18n/zh/
  bookmarks.ts     # Bookmarks tab
  insights.ts      # Saved insights / favorites
  network.ts       # Network status / offline
  shortcuts.ts     # Keyboard shortcuts
  themeGraph.ts    # Thematic network graph
  dashboard.ts     # Dashboard / data export

lib/i18n/en/
  bookmarks.ts
  insights.ts
  network.ts
  shortcuts.ts
  themeGraph.ts
  dashboard.ts
```

### 2.2 Extended Existing Namespaces

- `reader.ts` — add readingHistory, audio, notes keys
- `ai.ts` — add VirtualizedMessageList text keys
- `plan.ts` — add checkIn keys
- `common.ts` — add notification, feedback keys

### 2.3 Component Priority

**P0 — Core reading experience (must complete):**

| Component | Hardcoded Chinese (~count) | Namespace |
|-----------|---------------------------|-----------|
| `VirtualizedMessageList.tsx` | ~20 | `ai` (existing) |
| `Reader.tsx` | ~5 | `reader` (existing) |
| `AudioButton.tsx` | ~3 | `reader` (existing) |
| `use-bible-data.ts` | ~2 | `reader` (existing) |

**P1 — Auxiliary features (should complete):**

| Component | Hardcoded Chinese (~count) | Namespace |
|-----------|---------------------------|-----------|
| `ReadingHistoryTab.tsx` | ~15 | `reader` (extend) |
| `BookmarksTab.tsx` | ~10 | `bookmarks` (new) |
| `InsightsTab.tsx` | ~12 | `insights` (new) |
| `CheckInCard.tsx` | ~8 | `plan` (extend) |
| `OfflineIndicator.tsx` | ~10 | `network` (new) |
| `KeyboardShortcutsDialog.tsx` | ~15 | `shortcuts` (new) |
| `NotificationCenter.tsx` | ~8 | `common` (extend) |
| `NotesTab.tsx` | ~3 | `reader` (extend) |

**P2 — Secondary features (defer if needed):**

| Component | Hardcoded Chinese (~count) | Namespace |
|-----------|---------------------------|-----------|
| `ThemeGraphTab.tsx` | ~12 | `themeGraph` (new) |
| `DashboardDialog.tsx` / `DashboardTab.tsx` | ~10 | `dashboard` (new) |
| `FeedbackDialog.tsx` | ~3 | `common` (extend) |
| `group/*` components | ~30+ | `group` (extend) |
| `ShareCard.tsx` | ~5 | `shareCard` (existing) |

### 2.4 Component Refactoring Pattern

```typescript
// Before
<span>暂无阅读记录</span>

// After
const { t } = useTranslation()
<span>{t('reader.noReadingHistory')}</span>
```

For non-React contexts (hooks, utility functions):

```typescript
// Before
throw new Error('加载章节失败')

// After
import { t } from '@/lib/i18n'
throw new Error(t('reader.loadChapterFailed'))
```

### 2.5 Time Relative Formatting

`ReadingHistoryTab` and `NotificationCenter` have Chinese time formats ("X秒前", "X分钟前"). Use interpolation:

```typescript
// zh
{ timeAgoSeconds: '{count}秒前', timeAgoMinutes: '{count}分钟前', ... }

// en
{ timeAgoSeconds: '{count}s ago', timeAgoMinutes: '{count}min ago', ... }
```

### 2.6 Version Override UI

Add a version selector in settings that allows overriding the default version:

- When locale=zh, default is CUV, but user can switch to KJV
- When locale=en, default is KJV, but user can switch to CUV
- Selection persists via `bibleVersion` in localeSlice

### Verification Criteria

- [ ] Switching to English shows English text for all P0/P1 components
- [ ] Switching back to Chinese shows Chinese text
- [ ] No remaining hardcoded Chinese in P0/P1 scope
- [ ] Version override works correctly

## Phase 3: Server-side i18n & AI Refinement (~10 files)

### 3.1 API Route Locale Parameterization

| API | Issue | Fix |
|-----|-------|-----|
| `/api/chat/devotional` | `readingsStr` always uses Chinese format ("创世记 1章") | Use `getBookDisplayName()` based on locale |
| `/api/bible/[bookId]/[chapter]/[verse]` | Hardcodes CUV | Accept `version` param (already fixed in Phase 1) |
| `/api/search` | AI search prompt hardcodes Chinese book names | Adjust search strategy by locale |

### 3.2 AI Prompt Quality Review

- Ensure English prompts are idiomatic, not just literal translations of Chinese
- AI response language should match locale (English locale → English AI responses)
- Verse reference format: zh uses "创世记1:1", en uses "Genesis 1:1"

### 3.3 lib/ Utility File Refactoring

| File | Hardcoded Content | Fix |
|------|-------------------|-----|
| `lib/group-badges.ts` | Badge names and descriptions | Convert to `DualLangString` structure |
| `lib/bible-periods.ts` | Period names and descriptions | Convert to `DualLangString` structure |
| `lib/errors/chat-errors.ts` | Error messages | Accept locale parameter |
| `lib/plans.ts` | Plan titles and descriptions | Already `DualLangString`, verify completeness |
| `lib/email.ts` | Email templates | Accept locale parameter |
| `lib/cross-reference-ai.ts` | Relationship type labels | Convert to `DualLangString` |

### 3.4 Error Message Pattern

```typescript
// Before
throw new ChatError('无法加载对话历史')

// After
const ERROR_MESSAGES = {
  loadHistoryFailed: { zh: '无法加载对话历史', en: 'Failed to load conversation history' }
} as const

function getErrorMessage(key: string, locale: 'zh' | 'en'): string {
  return ERROR_MESSAGES[key]?.[locale] ?? ERROR_MESSAGES[key]?.zh ?? key
}
```

### 3.5 P2 Components (if time permits)

Complete i18n for ThemeGraphTab, DashboardDialog, FeedbackDialog, and group/* components.

### Verification Criteria

- [ ] English locale produces English AI responses
- [ ] Error messages display in the correct language
- [ ] Devotional, prayer, and other features work in English
- [ ] lib/ utility files return locale-appropriate text

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking existing functionality | Each phase is independently deployable; test thoroughly before proceeding |
| Missing translation keys | TypeScript type system ensures zh/en have identical key structures |
| Performance impact from larger translation files | Translation files are small TypeScript modules; tree-shaking applies |
| AI prompt quality in English | Review and refine English prompts with native speaker input |
| `showEnglish` rename breaking references | Global search and replace with careful verification |
