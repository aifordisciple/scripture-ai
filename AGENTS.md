# Scripture AI - Project Knowledge Base

**Generated:** 2026-02-28
**Commit:** ce797c9
**Branch:** main

## OVERVIEW

Bible reading & devotional web app with AI-powered verse interpretation, TTS, highlights, notes, and reading plans. Chinese-first UI with CUV/KJV bilingual support.

**Stack:** Next.js 16 (App Router) | TypeScript | Tailwind CSS 4 | Prisma + PostgreSQL (pgvector) | NextAuth.js | Zustand | Radix UI

## STRUCTURE

```
scripture-ai/
├── app/                 # Next.js routes + 16 API endpoints
├── components/
│   ├── bible/           # Core reading UI (Reader, AISidebar, MagicBall, PlanTab)
│   ├── ui/              # Radix UI primitives (button, dialog, slider, tabs)
│   ├── auth/            # AuthDialog, UserMenu
│   └── providers/       # AuthProvider, SyncProvider
├── store/               # Zustand state (sliced pattern: UI, Reader, AI, UserData, Sync)
├── hooks/               # use-audio-player, use-bible-data, use-swipe-navigation
├── lib/                 # prisma client, auth config, constants (BIBLE_BOOKS, prompts)
├── prisma/              # schema.prisma (User, BibleVerse, Highlight, Note, etc.)
├── scripts/             # Seed scripts (seed_full.js, seed_full_kjv.js)
├── data/                # Bible JSON (ChiUn.json, KJV.json) - large files
└── public/              # Fonts, icons, manifest.json
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add/modify reading UI | `components/bible/Reader.tsx` | Main verse display component |
| AI chat features | `components/bible/AISidebar.tsx`, `app/api/chat/` | OpenAI SDK integration |
| Reading plans | `components/bible/PlanTab.tsx`, `lib/plans.ts` | Multi-plan with daily devotionals |
| State management | `store/slices.ts`, `store/types.ts` | Zustand with Redux-like slices |
| Add API endpoint | `app/api/[route]/route.ts` | Standard Next.js App Router |
| Auth flows | `lib/auth.ts`, `components/auth/` | NextAuth.js v5, credentials only |
| Database schema | `prisma/schema.prisma` | Prisma + pgvector for embeddings |
| Bible data | `lib/constants.ts` (BIBLE_BOOKS), `data/` | Book metadata + full text JSON |
| TTS | `app/api/tts/route.ts`, `hooks/use-audio-player.ts` | Python edge-tts backend |
| Highlights/Notes | `app/api/highlight/`, `app/api/note/` | CRUD with user sync |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `useBibleStore` | Store | `store/useBibleStore.ts` | Global state (tabs, settings, user data) |
| `Reader` | Component | `components/bible/Reader.tsx` | Verse rendering, selection, highlights |
| `AISidebar` | Component | `components/bible/AISidebar.tsx` | AI chat interface (~600 lines) |
| `MagicBall` | Component | `components/bible/MagicBall.tsx` | Floating action button, quick actions |
| `PlanTab` | Component | `components/bible/PlanTab.tsx` | Reading plan UI (~600 lines) |
| `ShareCard` | Component | `components/bible/ShareCard.tsx` | Verse image generation (~700 lines) |
| `Sidebar` | Component | `components/bible/Sidebar.tsx` | Book/chapter navigation |
| `AuthProvider` | Provider | `components/providers/AuthProvider.tsx` | NextAuth session wrapper |
| `SyncProvider` | Provider | `components/providers/SyncProvider.tsx` | Background data sync |
| `prisma` | Client | `lib/prisma.ts` | Prisma singleton |
| `auth` | Config | `lib/auth.ts` | NextAuth configuration |
| `BIBLE_BOOKS` | Const | `lib/constants.ts` | Book metadata (66 books with chapters) |
| `SYSTEM_PROMPT` | Const | `lib/constants.ts` | AI theologian system prompt |

## CONVENTIONS

**Non-standard patterns used:**

1. **Zustand with Redux slices** - `store/slices.ts` uses `createSlice`-like pattern instead of vanilla Zustand
2. **Dynamic imports for code splitting** - Heavy components loaded via `next/dynamic` with `{ ssr: false }`
3. **Chinese mirrors in Docker** - Aliyun mirrors for npm, Alpine, PyPI (region-specific)
4. **`--webpack` flag** - Custom flag in build scripts (non-standard Next.js)
5. **Tab-based navigation** - Multi-tab reader system (read, search, dashboard, highlights, notes, plans)
6. **Bilingual Bible data** - CUV (Chinese) + KJV (English) stored as JSON in `/data`

**Naming:**
- Components: PascalCase (`Reader.tsx`, `AISidebar.tsx`)
- Hooks: kebab-case (`use-audio-player.ts`)
- API routes: lowercase (`app/api/chat/route.ts`)
- Store: camelCase (`useBibleStore.ts`)

## ANTI-PATTERNS (THIS PROJECT)

- **No `@ts-ignore` or `as any`** - Strict TypeScript enabled
- **No hardcoded secrets** - Use `.env` for DATABASE_URL, AUTH_SECRET, OPENAI_API_KEY
- **No direct Prisma calls in components** - Use API routes
- **No Bible data in bundle** - Large JSON files fetched via API

## COMMANDS

```bash
# Development & Build
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database

# Seeding
node scripts/seed_full.js      # Seed CUV Bible (Chinese)
node scripts/seed_full_kjv.js  # Seed KJV Bible (English)

# Testing (no test framework currently configured)
# To add tests: npm install -D vitest @vitest/ui
```

## CODE STYLE

### TypeScript
- **Strict mode enabled** - No `any`, no `@ts-ignore`, no type assertions
- Use explicit types for function parameters and return values
- Use `interface` for objects, `type` for unions/aliases
- Prefer `null` over `undefined` for optional values

### Imports
- Use path alias `@/` for all imports (configured in tsconfig.json)
- Order: external libs → internal components → hooks → utils → types
- Use named exports, avoid default exports except for Next.js pages
```typescript
// Good
import { useState } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { cn } from "@/lib/utils";

// Avoid
import React, { useState } from "react";
```

### Naming
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Reader.tsx`, `AISidebar.tsx` |
| Hooks | kebab-case | `use-audio-player.ts` |
| API routes | lowercase | `app/api/chat/route.ts` |
| Store | camelCase | `useBibleStore.ts` |
| Types/Interfaces | PascalCase | `ReaderSlice`, `Verse` |
| Constants | PascalCase | `BIBLE_BOOKS`, `HIGHLIGHT_COLORS` |

### Component Patterns
- Use `"use client"` directive for client components
- Use `next/dynamic` with `{ ssr: false }` for heavy components
- Destructure props with explicit types in interface
```typescript
interface ReaderProps {
  initialBook: string;
  initialChapter: string;
}

export function Reader({ initialBook, initialChapter }: ReaderProps) {
  // ...
}
```

### Styling
- Use Tailwind CSS with utility classes
- Use `cn()` helper for conditional classes: `cn("base-class", condition && "conditional-class")`
- Dark mode via `dark:` prefix and `isDarkMode` from store

### Error Handling
- Use try/catch with async/await for API calls
- Return typed responses from API routes
- Display user-friendly error messages in Chinese
```typescript
try {
  const result = await fetch('/api/endpoint');
  if (!result.ok) throw new Error('Failed to fetch');
  return result.json();
} catch (error) {
  console.error(error);
  return { error: '操作失败，请稍后重试' };
}
```

### State Management
- Use Zustand with Redux-like slices in `store/slices.ts`
- Each slice: `createXxxSlice: StateCreator<StoreState, [], [], XxxSlice>`
- Access store via `useBibleStore()` hook
- Use `useBibleStore.getState()` for direct access (avoid in render)

### API Routes
- Use Next.js App Router: `app/api/[route]/route.ts`
- Return `Response.json()` with proper status codes
- Validate input with Zod schemas

## NOTES

- **Database:** SQLite for dev, PostgreSQL with pgvector for production
- **Auth:** Credentials only (email/password), no OAuth providers
- **PWA:** Enabled via `@ducanh2912/next-pwa`, manifest in `/public`
- **TTS:** Requires Python + edge-tts (`pip install edge-tts`)
- **Docker:** Multi-stage build, standalone output mode
- **No CI/CD:** Manual deployment only (no GitHub Actions)
- **No tests:** Currently no test framework configured

## 核心开发与部署工作流规范

你当前运行在一个由 Git 进行版本控制，并使用 Docker Compose 进行服务编排的 Mac 服务器项目中。对于收到的任何开发任务，你必须严格遵循以下步骤：


1. **执行开发**：完成用户要求的代码编写或编辑任务。
2. **状态验证**：代码修改完成后，如有必要可运行 `git status` 或测试命令确认状态。
3. **自动部署**：你必须调用项目根目录下的 `./auto_deploy.sh` 脚本来完成后续动作。
   - 必须使用 `-s` 参数传递简要的修改总结（如 "feat: 增加用户登录接口"）。
   - 必须使用 `-d` 参数传递详细的修改说明（Comments），解释修改了哪些逻辑及原因。
   - 示例命令：`./auto_deploy.sh -s "fix: 修复数据库连接超时" -d "调整了 db_config.js 中的 timeout 参数，从 3000ms 增加到 5000ms，以适应当前网络环境。"`，注意：该脚本已内置 `git add .`、`git commit` 以及 `docker-compose down && docker-compose up -d --build` 的完整逻辑，你只需调用该脚本并传入准确的参数即可。