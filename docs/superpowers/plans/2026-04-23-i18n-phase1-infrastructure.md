# i18n Enhancement — Phase 1: Infrastructure & Bug Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all Bible version/language bugs and establish correct version management infrastructure so that locale switching correctly drives Bible version selection, TTS, search, and API responses.

**Architecture:** Extend the existing Zustand localeSlice with a `bibleVersion` field (defaulting from locale but overridable). Add version constants. Fix 4 broken API routes. Rename `showEnglish` → `showDualVersion` across the entire codebase. Make `layout.tsx` metadata locale-aware.

**Tech Stack:** Next.js 16, TypeScript, Zustand, Prisma

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `store/types.ts` | Add `bibleVersion`/`setBibleVersion` to LocaleSlice; rename `showEnglish`/`toggleEnglish` → `showDualVersion`/`toggleDualVersion` in ReaderSlice |
| Modify | `store/slices/localeSlice.ts` | Add `bibleVersion` field with auto-default from locale; add `setBibleVersion` |
| Modify | `store/slices/readerSlice.ts` | Rename `showEnglish` → `showDualVersion`, `toggleEnglish` → `toggleDualVersion` |
| Modify | `store/slices.ts` | Same rename in the inline reader slice; add `bibleVersion` sync in `setAllUserData` |
| Modify | `store/useBibleStore.ts` | No structural change (slices compose automatically) |
| Modify | `lib/constants.ts` | Add `BIBLE_VERSIONS` and `DEFAULT_VERSION` constants |
| Modify | `app/api/bible/[bookId]/[chapter]/[verse]/route.ts` | Accept `version` query param instead of hardcoding CUV |
| Modify | `app/api/versions/route.ts` | Remove `prisma.bibleVersion` query, return `BIBLE_VERSIONS` constant |
| Modify | `app/api/versions/import/route.ts` | Remove `prisma.bibleVersion` references, use direct verse operations |
| Modify | `app/api/search/route.ts` | Use `bookId`+`chapter`+`verse` for AI search matching instead of `bookName` |
| Modify | `hooks/use-bible-data.ts` | Use `bibleVersion` from store for TTS instead of hardcoded CUV; i18n error message |
| Modify | `app/layout.tsx` | Dynamic `<html lang>` and locale-aware metadata |
| Modify | `app/page.tsx` | Rename `showEnglish`/`toggleEnglish` → `showDualVersion`/`toggleDualVersion`; add version override UI |
| Modify | `components/bible/Reader.tsx` | Rename `showEnglish` → `showDualVersion`; use `bibleVersion` from store for `primaryVersion` |
| Modify | `components/providers/SyncProvider.tsx` | Rename `showEnglish` → `showDualVersion` |
| Modify | `components/skeletons/ReaderSkeleton.tsx` | Rename `showEnglish` → `showDualVersion` |
| Modify | `app/api/user/locale/route.ts` | Also persist `bibleVersion` alongside locale |
| Modify | `prisma/schema.prisma` | Add `bibleVersion` field to `UserSetting` model |

---

### Task 1: Add `bibleVersion` to LocaleSlice types and implementation

**Files:**
- Modify: `store/types.ts:463-466`
- Modify: `store/slices/localeSlice.ts:1-29`

- [ ] **Step 1: Update LocaleSlice interface in `store/types.ts`**

Change lines 463-466 from:

```typescript
export interface LocaleSlice {
  locale: 'zh' | 'en';
  setLocale: (locale: 'zh' | 'en') => void;
}
```

To:

```typescript
export interface LocaleSlice {
  locale: 'zh' | 'en';
  bibleVersion: 'CUV' | 'KJV';
  setLocale: (locale: 'zh' | 'en') => void;
  setBibleVersion: (version: 'CUV' | 'KJV') => void;
}
```

- [ ] **Step 2: Update localeSlice implementation in `store/slices/localeSlice.ts`**

Replace the entire file with:

```typescript
import type { StateCreator } from 'zustand';
import type { StoreState, LocaleSlice } from '../types';

type Locale = 'zh' | 'en';
type BibleVersion = 'CUV' | 'KJV';

const DEFAULT_VERSION: Record<Locale, BibleVersion> = {
  zh: 'CUV',
  en: 'KJV',
};

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'zh';
  const saved = localStorage.getItem('locale');
  if (saved === 'zh' || saved === 'en') return saved as Locale;
  const browserLang = navigator.language?.toLowerCase() || '';
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
}

function detectBibleVersion(locale: Locale): BibleVersion {
  if (typeof window === 'undefined') return DEFAULT_VERSION[locale];
  const saved = localStorage.getItem('bibleVersion');
  if (saved === 'CUV' || saved === 'KJV') return saved as BibleVersion;
  return DEFAULT_VERSION[locale];
}

export const createLocaleSlice: StateCreator<StoreState, [], [], LocaleSlice> = (set, get) => ({
  locale: detectLocale(),
  bibleVersion: detectBibleVersion(detectLocale()),
  setLocale: (locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
    }
    // Auto-set bibleVersion to default for new locale unless user has overridden
    const currentVersion = get().bibleVersion;
    const defaultVersion = DEFAULT_VERSION[locale];
    const newVersion = currentVersion === DEFAULT_VERSION[get().locale] ? defaultVersion : currentVersion;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bibleVersion', newVersion);
    }
    set({ locale, bibleVersion: newVersion });
    // Async sync to server (non-blocking)
    fetch('/api/user/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale, bibleVersion: newVersion }),
    }).catch(() => {});
  },
  setBibleVersion: (version) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bibleVersion', version);
    }
    set({ bibleVersion: version });
    // Async sync to server (non-blocking)
    fetch('/api/user/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: get().locale, bibleVersion: version }),
    }).catch(() => {});
  },
});
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: May have errors from other files not yet updated — that's OK for now. The types and slice themselves should be consistent.

- [ ] **Step 4: Commit**

```bash
git add store/types.ts store/slices/localeSlice.ts
git commit -m "feat: add bibleVersion to LocaleSlice with auto-default from locale"
```

---

### Task 2: Rename `showEnglish` → `showDualVersion` across store

**Files:**
- Modify: `store/types.ts:266-267`
- Modify: `store/slices/readerSlice.ts:15-16`
- Modify: `store/slices.ts:110-111`

- [ ] **Step 1: Update ReaderSlice interface in `store/types.ts`**

Change lines 266-267 from:

```typescript
  showEnglish: boolean;
  toggleEnglish: () => void;
```

To:

```typescript
  showDualVersion: boolean;
  toggleDualVersion: () => void;
```

- [ ] **Step 2: Update readerSlice implementation in `store/slices/readerSlice.ts`**

Change lines 15-16 from:

```typescript
  showEnglish: false,
  toggleEnglish: () => set((state) => ({ showEnglish: !state.showEnglish })),
```

To:

```typescript
  showDualVersion: false,
  toggleDualVersion: () => set((state) => ({ showDualVersion: !state.showDualVersion })),
```

- [ ] **Step 3: Update inline reader slice in `store/slices.ts`**

Change lines 110-111 from:

```typescript
  showEnglish: false,
  toggleEnglish: () => set((state) => ({ showEnglish: !state.showEnglish })),
```

To:

```typescript
  showDualVersion: false,
  toggleDualVersion: () => set((state) => ({ showDualVersion: !state.showDualVersion })),
```

Also in `store/slices.ts`, find the line that reads `updates.showEnglish = data.settings.showEnglish;` (around line 420) and change to:

```typescript
updates.showDualVersion = data.settings.showEnglish;
```

This preserves backward compatibility with the server-side `showEnglish` field name.

- [ ] **Step 4: Commit**

```bash
git add store/types.ts store/slices/readerSlice.ts store/slices.ts
git commit -m "refactor: rename showEnglish to showDualVersion in store types and slices"
```

---

### Task 3: Rename `showEnglish` → `showDualVersion` in all components

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/bible/Reader.tsx`
- Modify: `components/providers/SyncProvider.tsx`
- Modify: `components/skeletons/ReaderSkeleton.tsx`

- [ ] **Step 1: Update `app/page.tsx`**

Replace all occurrences:
- `showEnglish, toggleEnglish` → `showDualVersion, toggleDualVersion`
- `showEnglish` → `showDualVersion` (in all conditional checks)
- `toggleEnglish()` → `toggleDualVersion()`
- `!showEnglish` → `!showDualVersion`

Specific locations:
- Line 145: `showEnglish, toggleEnglish,` → `showDualVersion, toggleDualVersion,`
- Line 436: `showEnglish ? "default" : "secondary"` → `showDualVersion ? "default" : "secondary"`
- Line 436: `onClick={toggleEnglish}` → `onClick={toggleDualVersion}`
- Line 437: `showEnglish ? t('settings.enabled')` → `showDualVersion ? t('settings.enabled')`
- Line 455: `if (!showEnglish) toggleEnglish();` → `if (!showDualVersion) toggleDualVersion();`
- Line 662: `showEnglish ? "secondary" : "ghost"` → `showDualVersion ? "secondary" : "ghost"`
- Line 662: `onClick={toggleEnglish}` → `onClick={toggleDualVersion}`
- Line 663: `showEnglish ? (locale === 'zh' ?` → `showDualVersion ? (locale === 'zh' ?`
- Line 663: `(locale === 'zh' ? t('settings.chinese') : "En")` stays the same
- Line 670: `if (newLocale === 'en' && !showEnglish) toggleEnglish();` → `if (newLocale === 'en' && !showDualVersion) toggleDualVersion();`

- [ ] **Step 2: Update `components/bible/Reader.tsx`**

- Line 65: `showEnglish` → `showDualVersion` in the destructuring
- Line 397: `{showEnglish && altVerse && (` → `{showDualVersion && altVerse && (`

- [ ] **Step 3: Update `components/providers/SyncProvider.tsx`**

- Line 13: `showEnglish,` → `showDualVersion,` in the destructuring
- Line 75: `showEnglish,` → `showDualVersion,` in the JSON body
- Line 126: `showEnglish,` → `showDualVersion,` in the dependency array

- [ ] **Step 4: Update `components/skeletons/ReaderSkeleton.tsx`**

Replace all `showEnglish` with `showDualVersion` and `toggleEnglish` with `toggleDualVersion` throughout the file.

- [ ] **Step 5: Verify build compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to `showEnglish` or `showDualVersion`. Other errors from incomplete tasks are OK.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/bible/Reader.tsx components/providers/SyncProvider.tsx components/skeletons/ReaderSkeleton.tsx
git commit -m "refactor: rename showEnglish to showDualVersion in all components"
```

---

### Task 4: Add `BIBLE_VERSIONS` and `DEFAULT_VERSION` constants

**Files:**
- Modify: `lib/constants.ts`

- [ ] **Step 1: Add version constants after the DualLangString type definitions (after line 15)**

Insert after line 15:

```typescript
// Bible version constants
export const BIBLE_VERSIONS = {
  CUV: { code: 'CUV', name: '和合本', nameEn: 'Chinese Union Version', language: 'zh' as const, isDefault: true },
  KJV: { code: 'KJV', name: 'King James Version', nameEn: 'King James Version', language: 'en' as const, isDefault: false },
} as const;

export const DEFAULT_VERSION: Record<'zh' | 'en', 'CUV' | 'KJV'> = {
  zh: 'CUV',
  en: 'KJV',
};

export type BibleVersionCode = 'CUV' | 'KJV';
```

- [ ] **Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: add BIBLE_VERSIONS and DEFAULT_VERSION constants"
```

---

### Task 5: Fix single verse API to accept `version` param

**Files:**
- Modify: `app/api/bible/[bookId]/[chapter]/[verse]/route.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
// app/api/bible/[bookId]/[chapter]/[verse]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_VERSION } from '@/lib/constants';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookId: string; chapter: string; verse: string }> }
) {
  try {
    const { bookId, chapter, verse } = await params;
    const chapterNum = parseInt(chapter);
    const verseNum = parseInt(verse);

    if (isNaN(chapterNum) || isNaN(verseNum)) {
      return NextResponse.json({ error: 'Invalid chapter or verse number' }, { status: 400 });
    }

    // Accept version from query param, default based on locale
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get('locale') || 'zh') as 'zh' | 'en';
    const version = (searchParams.get('version') || DEFAULT_VERSION[locale]) as 'CUV' | 'KJV';

    const verseData = await prisma.bibleVerse.findFirst({
      where: {
        bookId: bookId.toUpperCase(),
        chapter: chapterNum,
        verse: verseNum,
        version,
      },
      select: {
        id: true,
        bookId: true,
        bookName: true,
        chapter: true,
        verse: true,
        content: true,
      },
    });

    if (!verseData) {
      return NextResponse.json({ error: 'Verse not found' }, { status: 404 });
    }

    return NextResponse.json(verseData);
  } catch (error) {
    console.error('Error fetching verse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/bible/[bookId]/[chapter]/[verse]/route.ts
git commit -m "fix: single verse API accepts version param instead of hardcoding CUV"
```

---

### Task 6: Fix `/api/versions` to return constants instead of querying non-existent model

**Files:**
- Modify: `app/api/versions/route.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
// app/api/versions/route.ts
// Bible versions API - returns available Bible versions from constants

import { NextResponse } from 'next/server';
import { BIBLE_VERSIONS } from '@/lib/constants';

// GET /api/versions - List available Bible versions
export async function GET() {
  return NextResponse.json({
    versions: Object.values(BIBLE_VERSIONS)
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/versions/route.ts
git commit -m "fix: versions API returns BIBLE_VERSIONS constant instead of querying non-existent model"
```

---

### Task 7: Fix `/api/versions/import` to remove non-existent model references

**Files:**
- Modify: `app/api/versions/import/route.ts`

- [ ] **Step 1: Replace the entire file**

Remove all `prisma.bibleVersion` calls. The import endpoint still works for creating verse rows — just skip the BibleVersion metadata record:

```typescript
// app/api/versions/import/route.ts
// Bible version import API - Import custom Bible versions

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/versions/import - Import Bible version from JSON
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const code = formData.get('code') as string;
    const name = formData.get('name') as string;
    const language = formData.get('language') as string || 'zh';

    if (!file || !code || !name) {
      return NextResponse.json({
        error: 'Missing required fields: file, code, name'
      }, { status: 400 });
    }

    // Read file content
    const text = await file.text();
    let bibleData: Array<{
      book: string;
      bookId: string;
      chapter: number;
      verse: number;
      content: string;
    }>;

    try {
      bibleData = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    // Validate structure
    if (!Array.isArray(bibleData) || bibleData.length === 0) {
      return NextResponse.json({ error: 'Invalid Bible data format' }, { status: 400 });
    }

    const firstVerse = bibleData[0];
    if (!firstVerse.book || !firstVerse.chapter || !firstVerse.verse || !firstVerse.content) {
      return NextResponse.json({
        error: 'Invalid verse structure. Required: book, chapter, verse, content'
      }, { status: 400 });
    }

    // Check if version already has verses
    const existingCount = await prisma.bibleVerse.count({
      where: { version: code },
    });

    if (existingCount > 0) {
      return NextResponse.json({
        error: `Version ${code} already exists. Delete it first or use a different code.`
      }, { status: 409 });
    }

    // Prepare verses for bulk insert
    const verses = bibleData.map((v) => ({
      bookId: v.bookId || v.book,
      bookName: v.book,
      chapter: v.chapter,
      verse: v.verse,
      content: v.content,
      version: code,
    }));

    // Insert verses in batches
    const BATCH_SIZE = 1000;
    for (let i = 0; i < verses.length; i += BATCH_SIZE) {
      const batch = verses.slice(i, i + BATCH_SIZE);
      await prisma.bibleVerse.createMany({
        data: batch,
      });
    }

    return NextResponse.json({
      success: true,
      version: {
        code,
        name,
        verseCount: verses.length,
      },
    });
  } catch (error) {
    console.error('Import version error:', error);
    return NextResponse.json({ error: 'Failed to import version' }, { status: 500 });
  }
}

// DELETE /api/versions/import - Delete Bible version
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing version code' }, { status: 400 });
    }

    // Prevent deleting built-in versions
    if (code === 'CUV' || code === 'KJV') {
      return NextResponse.json({
        error: 'Cannot delete built-in version'
      }, { status: 403 });
    }

    // Delete verses
    const deleted = await prisma.bibleVerse.deleteMany({
      where: { version: code },
    });

    return NextResponse.json({ success: true, deletedCount: deleted.count });
  } catch (error) {
    console.error('Delete version error:', error);
    return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/versions/import/route.ts
git commit -m "fix: remove BibleVersion model references from versions import API"
```

---

### Task 8: Fix search API to use `bookId` matching instead of `bookName`

**Files:**
- Modify: `app/api/search/route.ts`

- [ ] **Step 1: Update AI search prompt and matching logic**

The key changes in both the POST and GET handlers:

1. Change the AI prompt to return `bookId` instead of `bookName`
2. Change the Prisma query to match on `bookId` + `chapter` + `verse` instead of `bookName` + `chapter` + `verse`
3. Make the AI prompt locale-aware (use English book names for en locale)

For the **POST handler** (lines 36-93), replace the AI search section:

Change the system prompt (lines 44-61) to be locale-aware. Replace:

```typescript
system: `你是一位精通《圣经》的属灵导师。根据用户的查询，推荐最贴切的真实经文，并给出有深度的属灵洞见。

【重要】直接返回 JSON 对象，不要有任何思考过程、解释或 Markdown 标记。

JSON 格式：
{
  "summary": "一段温暖、有逻辑、触动人心的属灵总结（150-300字），帮助用户理解这些经文如何回应他的处境",
  "verses": [
    { "bookName": "创世记", "chapter": 1, "verse": 1 },
    { "bookName": "诗篇", "chapter": 23, "verse": 1 }
  ]
}

要求：
- summary 要有温度，像一位理解你的牧者在说话
- 推荐 15-30 节最相关的经文
- 必须使用中文书卷名（如：创世记、诗篇、马太福音、启示录等）
- 章和节必须是真实存在的数字`,
```

With locale-aware prompt:

```typescript
system: locale === 'en'
  ? `You are a wise biblical scholar. Based on the user's query, recommend the most relevant real Bible verses and provide deep spiritual insights.

【IMPORTANT】Return a JSON object directly, without any thinking process, explanation, or Markdown markers.

JSON format:
{
  "summary": "A warm, logical, and touching spiritual summary (150-300 words) helping the user understand how these verses speak to their situation",
  "verses": [
    { "bookId": "Gen", "chapter": 1, "verse": 1 },
    { "bookId": "Psa", "chapter": 23, "verse": 1 }
  ]
}

Requirements:
- summary should be warm, like a caring pastor speaking to you
- Recommend 15-30 most relevant verses
- bookId must be the standard English abbreviation (e.g., Gen, Exo, Lev, Num, Deu, Jos, Jdg, Rut, 1Sa, 2Sa, 1Ki, 2Ki, 1Ch, 2Ch, Ezr, Neh, Est, Job, Psa, Pro, Ecc, Sgs, Isa, Jer, Lam, Eze, Dan, Hos, Joe, Amo, Oba, Jon, Mic, Nah, Hab, Zep, Hag, Zec, Mal, Mat, Mar, Luk, Joh, Act, Rom, 1Co, 2Co, Gal, Eph, Php, Col, 1Th, 2Th, 1Ti, 2Ti, Tit, Phm, Heb, Jas, 1Pe, 2Pe, 1Jo, 2Jo, 3Jo, Jud, Rev)
- Chapter and verse must be real numbers`
  : `你是一位精通《圣经》的属灵导师。根据用户的查询，推荐最贴切的真实经文，并给出有深度的属灵洞见。

【重要】直接返回 JSON 对象，不要有任何思考过程、解释或 Markdown 标记。

JSON 格式：
{
  "summary": "一段温暖、有逻辑、触动人心的属灵总结（150-300字），帮助用户理解这些经文如何回应他的处境",
  "verses": [
    { "bookId": "Gen", "chapter": 1, "verse": 1 },
    { "bookId": "Psa", "chapter": 23, "verse": 1 }
  ]
}

要求：
- summary 要有温度，像一位理解你的牧者在说话
- 推荐 15-30 节最相关的经文
- bookId 必须是标准英文缩写（如：Gen, Psa, Mat, Rev 等）
- 章和节必须是真实存在的数字`,
```

Change the matching logic (lines 83-91) from:

```typescript
const orConditions = verses.map((v: any) => ({
    bookName: v.bookName, chapter: v.chapter, verse: v.verse, version: searchVersion
}));

const results = await prisma.bibleVerse.findMany({ where: { OR: orConditions } });

const sortedResults = verses.map((v: any) =>
   results.find(r => r.bookName === v.bookName && r.chapter === v.chapter && r.verse === v.verse)
).filter(Boolean);
```

To:

```typescript
const orConditions = verses.map((v: any) => ({
    bookId: (v.bookId || '').toUpperCase(), chapter: v.chapter, verse: v.verse, version: searchVersion
})).filter((v: any) => v.bookId);

const results = orConditions.length > 0
  ? await prisma.bibleVerse.findMany({ where: { OR: orConditions } })
  : [];

const sortedResults = verses.map((v: any) =>
   results.find(r => r.bookId === (v.bookId || '').toUpperCase() && r.chapter === v.chapter && r.verse === v.verse)
).filter(Boolean);
```

Apply the **exact same changes** to the GET handler (lines 126-230) — it has duplicate AI search logic.

- [ ] **Step 2: Commit**

```bash
git add app/api/search/route.ts
git commit -m "fix: search API uses bookId matching and locale-aware AI prompts"
```

---

### Task 9: Fix TTS to use `bibleVersion` from store

**Files:**
- Modify: `hooks/use-bible-data.ts`

- [ ] **Step 1: Update TTS verse filtering and error message**

Change line 22 from:

```typescript
const { clearSelection, setChapterSpeechText } = useBibleStore();
```

To:

```typescript
const { clearSelection, setChapterSpeechText, bibleVersion } = useBibleStore();
```

Change lines 37-38 from:

```typescript
const fullText = versesJson.data
    .filter((v: Verse) => v.version === 'CUV')
```

To:

```typescript
const fullText = versesJson.data
    .filter((v: Verse) => v.version === bibleVersion)
```

Change line 48 from:

```typescript
setError("加载章节失败，请检查网络连接");
```

To:

```typescript
const locale = useBibleStore.getState().locale;
setError(locale === 'en' ? 'Failed to load chapter. Please check your network connection.' : '加载章节失败，请检查网络连接');
```

- [ ] **Step 2: Commit**

```bash
git add hooks/use-bible-data.ts
git commit -m "fix: TTS uses bibleVersion from store instead of hardcoded CUV"
```

---

### Task 10: Make `layout.tsx` locale-aware

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace the entire file with locale-aware version**

Since `layout.tsx` is a server component, we cannot use Zustand directly. Instead, we'll use a client component wrapper for the `<html lang>` attribute, and provide both zh and en metadata.

```typescript
// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";
import { BadgePopup } from "@/components/bible/BadgePopup";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { ToastProvider } from "@/components/ui/toast";
import { LocaleHtmlWrapper } from "@/components/providers/LocaleHtmlWrapper";

const baseUrl = process.env.NEXTAUTH_URL || 'https://aidu.app';

export const metadata: Metadata = {
  title: {
    default: "AI读 - 你的灵修伴侣",
    template: "%s | AI读",
  },
  description: "AI-powered Bible reading and devotional assistant with bilingual support, TTS, highlights, notes, and reading plans",
  keywords: ["Bible", "Scripture", "AI", "devotional", "CUV", "KJV", "Bible reading", "verse interpretation", "daily reading", "reading plan", "圣经", "读经", "灵修"],
  manifest: "/manifest.json",
  authors: [{ name: "AI读团队" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI读",
    startupImage: [
      "/icon-512x512.png",
    ],
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: "website",
    url: baseUrl,
    siteName: "AI读",
    title: "AI读 - AI-Powered Bible Reading & Devotional Assistant",
    description: "AI-powered Bible reading and devotional assistant with bilingual support, TTS, highlights, notes, and reading plans",
    locale: "zh_CN",
    alternateLocale: ["en_US"],
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "AI读 - AI-Powered Bible Reading Assistant" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI读 - AI-Powered Bible Reading Assistant",
    description: "AI-powered Bible reading and devotional assistant",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "AI读",
    "description": "AI-powered Bible reading and devotional assistant with bilingual support, TTS, highlights, notes, and reading plans",
    "url": baseUrl,
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Web, iOS, Android",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CNY"
    },
    "featureList": [
      "Bilingual reading (CUV/KJV)",
      "AI verse interpretation",
      "Text-to-speech",
      "Reading plans",
      "Highlights & notes",
      "Group reading",
      "Devotional content"
    ]
  };

  return (
    <LocaleHtmlWrapper>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
           {children}
           <SyncProvider />
           <BadgePopup />
           <AnalyticsTracker />
          </ToastProvider>
        </AuthProvider>
      </body>
    </LocaleHtmlWrapper>
  );
}
```

- [ ] **Step 2: Create `LocaleHtmlWrapper` component**

Create `components/providers/LocaleHtmlWrapper.tsx`:

```typescript
"use client";

import { useBibleStore } from "@/store/useBibleStore";

export function LocaleHtmlWrapper({ children }: { children: React.ReactNode }) {
  const locale = useBibleStore((state) => state.locale);
  return (
    <html lang={locale === 'en' ? 'en' : 'zh-CN'} suppressHydrationWarning>
      {children}
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx components/providers/LocaleHtmlWrapper.tsx
git commit -m "feat: dynamic html lang attribute and bilingual metadata in layout"
```

---

### Task 11: Update `Reader.tsx` to use `bibleVersion` from store

**Files:**
- Modify: `components/bible/Reader.tsx:47-48`

- [ ] **Step 1: Replace locale-derived version with store-based version**

Change lines 47-48 from:

```typescript
const primaryVersion = locale === 'en' ? 'KJV' : 'CUV';
const secondaryVersion = locale === 'en' ? 'CUV' : 'KJV';
```

To:

```typescript
const bibleVersion = useBibleStore((state) => state.bibleVersion);
const primaryVersion = bibleVersion;
const secondaryVersion = bibleVersion === 'CUV' ? 'KJV' : 'CUV';
```

- [ ] **Step 2: Commit**

```bash
git add components/bible/Reader.tsx
git commit -m "feat: Reader uses bibleVersion from store for primary/secondary version"
```

---

### Task 12: Update locale API to persist `bibleVersion`

**Files:**
- Modify: `app/api/user/locale/route.ts`
- Modify: `prisma/schema.prisma` (add `bibleVersion` field to UserSetting)

- [ ] **Step 1: Add `bibleVersion` to UserSetting in Prisma schema**

Find the `UserSetting` model in `prisma/schema.prisma` and add:

```prisma
  bibleVersion String @default("CUV")
```

After the existing `locale` field.

- [ ] **Step 2: Run prisma db push**

Run: `npx prisma db push`
Expected: Schema applied successfully.

- [ ] **Step 3: Update locale API route**

Replace `app/api/user/locale/route.ts` with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ locale: null, bibleVersion: null });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { settings: true },
  });

  return NextResponse.json({
    locale: user?.settings?.locale || null,
    bibleVersion: user?.settings?.bibleVersion || null,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { locale, bibleVersion } = await request.json();
  if (locale !== 'zh' && locale !== 'en') {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }
  if (bibleVersion && bibleVersion !== 'CUV' && bibleVersion !== 'KJV') {
    return NextResponse.json({ error: 'Invalid bibleVersion' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updateData: Record<string, string> = { locale };
  if (bibleVersion) {
    updateData.bibleVersion = bibleVersion;
  }

  await prisma.userSetting.upsert({
    where: { userId: user.id },
    update: updateData,
    create: { userId: user.id, ...updateData },
  });

  return NextResponse.json({ locale, bibleVersion });
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/user/locale/route.ts prisma/schema.prisma
git commit -m "feat: persist bibleVersion alongside locale in UserSetting"
```

---

### Task 13: Add version override UI in settings

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add Bible version selector in mobile settings**

In `app/page.tsx`, after the language selector (around line 462, after the `</div>` that closes the language buttons), add a version selector:

```tsx
<div className="flex items-center justify-between">
  <span className="text-sm text-muted-foreground font-medium">{t('settings.bibleVersion') || (locale === 'en' ? 'Bible Version' : '圣经版本')}</span>
  <div className="flex bg-secondary/50 p-1 rounded-lg">
    <button
      onClick={() => setBibleVersion('CUV')}
      className={cn("px-3 py-1 text-xs rounded-md transition-all", bibleVersion === 'CUV' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
    >
      {locale === 'en' ? 'CUV' : '和合本'}
    </button>
    <button
      onClick={() => setBibleVersion('KJV')}
      className={cn("px-3 py-1 text-xs rounded-md transition-all", bibleVersion === 'KJV' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
    >
      KJV
    </button>
  </div>
</div>
```

Also add `bibleVersion, setBibleVersion` to the `useBibleStore()` destructuring at the top of the component (around line 146).

- [ ] **Step 2: Add version selector in desktop top bar**

After the locale toggle button (around line 673), add a small version indicator:

```tsx
<Button variant="ghost" size="sm" onClick={() => setBibleVersion(bibleVersion === 'CUV' ? 'KJV' : 'CUV')} className="gap-1 text-xs font-bold rounded-full">
  <BookOpenCheck className="h-4 w-4" />{bibleVersion}
</Button>
```

Import `BookOpenCheck` from lucide-react if not already imported.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add Bible version override selector in settings and top bar"
```

---

### Task 14: Add `bibleVersion` translation key to settings namespace

**Files:**
- Modify: `lib/i18n/zh/settings.ts`
- Modify: `lib/i18n/en/settings.ts`

- [ ] **Step 1: Add `bibleVersion` key to zh settings**

Find the settings translation object in `lib/i18n/zh/settings.ts` and add:

```typescript
bibleVersion: '圣经版本',
```

- [ ] **Step 2: Add `bibleVersion` key to en settings**

Find the settings translation object in `lib/i18n/en/settings.ts` and add:

```typescript
bibleVersion: 'Bible Version',
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to translation types.

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/zh/settings.ts lib/i18n/en/settings.ts
git commit -m "feat: add bibleVersion translation key to settings namespace"
```

---

### Task 15: Build verification and Docker restart

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -50`
Expected: No errors. If errors exist, fix them.

- [ ] **Step 2: Run Docker build and restart**

Run: `docker-compose down && docker-compose up -d --build`
Expected: All containers start successfully. If build fails, investigate and fix.

- [ ] **Step 3: Verify the app loads**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
Expected: `200`

- [ ] **Step 4: Run auto_deploy**

```bash
./auto_deploy.sh -s "feat: i18n Phase 1 - infrastructure and bug fixes" -d "Added bibleVersion to LocaleSlice with auto-default from locale. Renamed showEnglish to showDualVersion. Fixed single verse API to accept version param. Fixed versions API to return constants. Fixed search API to use bookId matching. Fixed TTS to use bibleVersion. Made layout.tsx locale-aware. Added version override UI. Persisted bibleVersion to server."
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Every item in Phase 1 of the spec has a corresponding task
- [x] **Placeholder scan:** No TBD, TODO, or "implement later" patterns
- [x] **Type consistency:** `bibleVersion` type is `'CUV' | 'KJV'` everywhere; `showDualVersion`/`toggleDualVersion` naming is consistent
- [x] **No missing tasks:** All `showEnglish` references accounted for; all API fixes covered; layout.tsx covered; TTS covered
