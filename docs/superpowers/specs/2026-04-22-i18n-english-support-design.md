# Multi-Language Support Design (zh + en)

**Date**: 2026-04-22
**Scope**: Core i18n infrastructure + English language support
**Approach**: Self-built lightweight i18n (no external library)

## Requirements

- Language switch affects: UI text, Bible version, AI response language (full联动)
- Default language: Chinese (zero impact on existing users)
- Language switch entry: Settings panel dropdown
- User data (highlights, notes, bookmarks) is language-agnostic, not switched with locale
- CUV is default version for Chinese, KJV is default version for English
- Core pages translated first; secondary pages deferred to TODO.md

## Architecture

### 1. Locale State Management (Zustand LocaleSlice)

```typescript
// store/slices/localeSlice.ts
type Locale = 'zh' | 'en'

interface LocaleSlice {
  locale: Locale
  setLocale: (locale: Locale) => void
}
```

**Persistence**:
- Unauthenticated: `localStorage` key `locale`
- Authenticated: `UserSetting.locale` field in database (new column)
- Default: `'zh'`

**Linkage on locale change**:
- `zh` → primary Bible version = CUV, `showEnglish` controls KJV display
- `en` → primary Bible version = KJV, `showEnglish` controls CUV display
- `showEnglish` field name preserved in store (no rename to avoid wide refactoring); only UI label changes from "中英对照" to "双语对照" / "Bilingual"

### 2. Translation System

**File structure**:
```
lib/
├── i18n/
│   ├── index.ts    # t() function, useTranslation hook
│   ├── zh.ts       # Chinese translations (nested object)
│   └── en.ts       # English translations (same structure)
```

**Translation file format**: Nested objects grouped by feature module:
```typescript
// lib/i18n/zh.ts
export const zh = {
  common: { retry: '重试', loading: '加载中...' },
  reader: { noContent: '此章节暂无经文内容', aiInterpret: 'AI 解读此节经文' },
  sidebar: { title: '圣经目录', oldTestament: '旧约全书' },
  // ...
}
```

**`t()` function**: Reads locale from Zustand store, supports `{variable}` interpolation:
```typescript
export function t(key: string, params?: Record<string, string | number>): string
```

**`useTranslation()` hook**: Reactive version for components, triggers re-render on locale change:
```typescript
export function useTranslation(): { t, locale }
```

**Translation coverage (priority order)**:
1. Reader — verse display, navigation, AI buttons
2. Sidebar — book list, search
3. PlanTab — reading plans
4. AISidebar — AI chat interface
5. FloatingMenu — verse action menu
6. Settings — settings panel (including language switch entry)
7. page.tsx — tab labels, search bar

**Deferred pages** (documented in TODO.md):
- DashboardTab, CrossRefTab, GroupTab, AtlasPanel, InsightsTab, BookmarksTab, ReadingHistoryTab, ThemeGraphTab

### 3. BIBLE_BOOKS Bilingual Data

**Extended interface** (backward compatible):
```typescript
interface BibleBook {
  id: string           // "Gen" (unchanged)
  name: string         // "创世记" (unchanged, backward compatible)
  nameEn: string       // "Genesis" (NEW)
  chapters: number     // (unchanged)
  category: string     // "律法书" (unchanged)
  categoryEn: string   // "Law" (NEW)
  intro: string        // Chinese intro (unchanged)
  introEn: string      // English intro (NEW)
}
```

**Display logic**:
- `zh`: uses `name`, `category`, `intro`
- `en`: uses `nameEn`, `categoryEn`, `introEn`

**Database `BibleVerse.bookName`**: No migration. Continues storing Chinese names as data identifier. English display uses `BIBLE_BOOKS` id → nameEn mapping.

**Affected components**: Sidebar.tsx, Reader.tsx, PlanTab.tsx, API routes using getBookName()

### 4. AI Language Linkage

**System prompts**: Dual-language in `lib/constants.ts`:
```typescript
export const SYSTEM_PROMPT = { zh: '你是...', en: 'You are...' }
export const TUTOR_PROMPT = { zh: '你是...', en: 'You are...' }
// Same for: DEVOTIONAL_PROMPT, PRAYER_PROMPT, SERMON_PROMPT, STUDY_GUIDE_PROMPT
export const THEOLOGICAL_PROMPTS = [
  { label: { zh: '深度解读', en: 'Deep Exegesis' }, prompt: { zh: '...', en: '...' } },
  // ...
]
```

**API routes**: Accept `locale` parameter from request body:
```typescript
const { message, locale = 'zh' } = await request.json()
const systemPrompt = SYSTEM_PROMPT[locale] || SYSTEM_PROMPT.zh
```

**Frontend**: `AISlice.enqueueAI()` automatically attaches current `locale` to request body.

**Affected API routes**:
- `/api/chat/main/route.ts`
- `/api/chat/tutor/route.ts`
- `/api/chat/devotional/route.ts`
- `/api/chat/prayer/route.ts`
- `/api/chat/sermon/route.ts`
- `/api/chat/study-guide/route.ts`
- `/api/search/route.ts`
- `/api/parse-verse/route.ts`

### 5. Reader Component Bilingual Mode

**Primary/secondary version by locale**:

| locale | Primary version | Secondary version (when showBilingual=true) |
|--------|----------------|---------------------------------------------|
| `zh`   | CUV            | KJV                                         |
| `en`   | KJV            | CUV                                         |

**Reader.tsx changes**:
- `primaryVersion = locale === 'en' ? 'KJV' : 'CUV'`
- `secondaryVersion = locale === 'en' ? 'CUV' : 'KJV'`
- Chapter title uses localized book name
- Navigation buttons ("上一章"/"下一章") via `t()`
- "中英对照" setting label → "双语对照" / "Bilingual" (field name `showEnglish` unchanged in store)

**Search API**: `version` parameter follows locale instead of hardcoded `'CUV'`.

### 6. Settings Panel Language Switch

**UI**: Dropdown in existing settings panel:
```
语言 / Language    [中文 ▾]
```
Options: `中文` / `English`

**Behavior**: Instant effect on switch, no page reload. Settings panel itself also switches language.

**Database schema change**:
```prisma
model UserSetting {
  // ... existing fields
  locale String?  // 'zh' | 'en', null = default Chinese
}
```

### 7. Reading Plans Bilingual

**Plan interface extension**:
```typescript
interface ReadingPlan {
  id: string
  title: string        // Chinese (unchanged)
  titleEn: string      // English (NEW)
  description: string  // Chinese (unchanged)
  descriptionEn: string // English (NEW)
  tags: string[]       // Chinese tags
  tagsEn: string[]     // English tags (NEW)
  // ... rest unchanged
}
```

**Display**: PlanTab uses `locale` to select title/description/tags.

### 8. Non-Breaking Guarantees

- Default locale is `'zh'` — all existing behavior preserved
- `BIBLE_BOOKS.name` unchanged — all existing code referencing it works
- `showEnglish` toggle preserved — just relabeled
- Database `bookName` field unchanged — no data migration
- API routes default `locale='zh'` — backward compatible
- No route structure changes — no `[locale]` segment
- Existing `lib/i18n.ts` replaced by new `lib/i18n/` directory

## TODO (Deferred)

The following pages will remain in Chinese and are tracked in TODO.md:
- DashboardTab (数据看板)
- CrossRefTab (经文串珠)
- GroupTab (小组读经)
- AtlasPanel (圣经地图)
- InsightsTab (AI 洞察)
- BookmarksTab (书签)
- ReadingHistoryTab (阅读历史)
- ThemeGraphTab (主题网络)
