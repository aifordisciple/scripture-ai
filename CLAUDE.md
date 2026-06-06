# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI读** is a Bible reading & devotional web application with AI-powered verse interpretation, TTS voice reading, highlights, notes, and reading plans. Chinese-first UI with CUV/KJV bilingual support.

## Commands

```bash
# Development
npm run dev              # Development server (port 3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint check

# Database
npx prisma generate      # Generate Prisma client
npx prisma db push      # Push schema to database

# Seed Bible data
node scripts/seed_full.js      # Seed CUV Bible (Chinese)
node scripts/seed_full_kjv.js  # Seed KJV Bible (English)

# Docker
docker-compose up -d --build   # Build and start containers
docker-compose exec web sh    # Shell into container
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- **UI Components**: Radix UI, Lucide React, Framer Motion
- **State Management**: Zustand with Redux-like slices pattern
- **Database**: Prisma ORM with PostgreSQL (pgvector for embeddings)
- **Auth**: NextAuth.js v5 (Credentials provider only)
- **AI**: OpenAI SDK / DeepSeek / Ollama support
- **TTS**: Python edge-tts
- **Mobile**: Expo (React Native) in `app-mobile/`

### Directory Structure

```
app/                     # Next.js App Router
├── api/                 # API routes (40+ endpoints)
│   ├── chat/           # AI chat: main, tutor, devotional, prayer, sermon, study-guide
│   ├── highlight/     # Highlight CRUD
│   ├── note/          # Note CRUD
│   ├── tts/           # Text-to-speech
│   ├── atlas/         # Bible map/timeline data
│   ├── theme/         # Theme graph endpoints
│   └── ...            # Friends, posts, church, memory, etc.
└── page.tsx            # Main reading page

components/
├── bible/              # Core reading components
│   ├── Reader.tsx      # Verse rendering (~400 lines)
│   ├── AISidebar.tsx  # AI chat interface (~600 lines)
│   ├── MagicBall.tsx  # Floating action button
│   ├── PlanTab.tsx    # Reading plan UI (~600 lines)
│   └── ShareCard.tsx # Verse image generator (~700 lines)
├── atlas/              # Bible map and timeline components
├── theme/              # Theme graph network components
├── ui/                 # Radix UI primitives
└── auth/               # Auth components

store/
├── slices.ts           # Zustand slices (8 slices: UI, Reader, AI, UserData, Sync, Group, Atlas, ThemeGraph)
├── useBibleStore.ts    # Main store export
└── types.ts            # TypeScript types

lib/
├── auth.ts             # NextAuth configuration
├── prisma.ts           # Prisma singleton
├── constants.ts        # BIBLE_BOOKS, prompts
└── plans.ts            # Reading plan definitions

hooks/                  # Custom React hooks
├── use-audio-player.ts # Audio playback
├── use-bible-search.ts # Bible verse search
└── ...

app-mobile/             # Expo React Native mobile app
```

### Key Patterns

1. **Zustand with Slices**: `store/slices.ts` uses Redux-like slices (`createUISlice`, `createReaderSlice`, etc.) instead of vanilla Zustand
2. **API Routes**: All data access via `app/api/*/route.ts` - never call Prisma directly from components
3. **Dynamic Imports**: Heavy components use `next/dynamic` with `{ ssr: false }`
4. **--webpack Flag**: Build scripts include `--webpack` flag (non-standard Next.js)

### State Management

The Zustand store has 8 slices:
- **UISlice**: Sidebar, tabs, modals, share
- **ReaderSlice**: Font size, dark mode, tabs, chapter navigation
- **AISlice**: AI sidebar, generation, queue, sessions, custom prompts, insights
- **UserDataSlice**: Highlights, notes, reading plans, streaks, badges, API config
- **SyncSlice**: Cloud sync state
- **GroupSlice**: Church/group reading plan context and progress
- **AtlasSlice**: Bible map locations, timeline, journeys
- **ThemeGraphSlice**: Thematic network graph data

### Data Models (Prisma)

35+ models organized in categories:
- **Core**: User, BibleVerse, Highlight, Note, ScriptureCard, Interaction
- **Settings**: UserSetting, Reminder, NotificationToken
- **AI**: ChatSession, ChatMessage, CustomPrompt, SavedInsight
- **Memory**: MemoryCard, ReviewLog (Ebbinghaus SM-2 algorithm)
- **Social**: Church, ChurchMember, InviteCode, GroupPlan, GroupPlanProgress
- **Atlas**: BibleLocation, BibleEvent, BibleJourney (map/timeline features)
- **Themes**: BibleTheme, ThemeVerseLink, ThemeConnection
- **Gamification**: Badge, LeaderboardEntry, GroupBadge
- **Notifications**: Notification, Like, Comment

### Advanced Patterns

**AI Request Queue System**
The AISlice manages AI requests in a queue to prevent concurrent API calls:
- `enqueueAI()` - Add request to queue or start immediately if idle
- `cancelAIRequest()` - Cancel current or queued request
- `completeCurrentRequest()` - Mark done and auto-start next

**Reading Plan Flow Context**
Used for step-by-step plan execution with `readingPlanContext`:
- Contains `{ planId, day, stepIndex, steps[] }`
- `advancePlanStep()` - Move to next step, auto-check-in

**Group Plan Flow Context**
Similar to reading plan but for church groups with `groupPlanContext`:
- Contains `{ churchId, planId, day, stepIndex, steps[] }`
- Syncs progress via `/api/church/[id]/plan/[planId]/progress`

## Important Conventions

- Use path alias `@/` for all imports
- `"use client"` directive for client components
- Components: PascalCase (`Reader.tsx`)
- Hooks: kebab-case (`use-audio-player.ts`)
- API routes: lowercase (`app/api/chat/route.ts`)
- No `as any` or `@ts-ignore` - strict TypeScript
- After code changes, run `docker-compose up -d --build` to redeploy

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth secret key |
| `AI_PROVIDER` | `openai`, `deepseek`, or `ollama` |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_BASE_URL` | Custom API endpoint |
| `DEEPSEEK_API_KEY` | DeepSeek API key (optional) |

---

# 经验积累系统（docs/experience.md）

### 一、读取规则 — 何时查阅

**必须读取**（强制，任务开始前）：
- 修复任何 bug 或异常行为之前
- 处理报错信息、类型错误、运行时崩溃之前
- 接触你不熟悉的模块/服务/第三方库之前

**按需读取**（判断后执行）：
- 实现新功能时，若涉及已有业务逻辑的交叉点（如认证、数据库事务、缓存策略）
- 重构代码时，若改动范围覆盖曾出现过问题的模块
- 遇到"这个应该能工作，但就是不行"的直觉时

**无需读取**：
- 纯新文件、无依赖的独立工具函数
- 文档/注释/格式化等不涉及逻辑的任务

**查阅方式**：
- 用任务关键词（技术栈、模块名、错误类型）在文件中搜索匹配条目
- 命中时，在回复开头列出"⚠️ 相关历史经验：[条目标题]"，并说明如何规避

---

### 二、写入规则 — 何时总结

**必须写入**（任何一项成立即触发）：
- 修复了一个花费超过 10 分钟定位的 bug
- 遇到了与直觉/文档相悖的行为（库的 bug、框架的隐藏限制、环境差异）
- 同一类问题第二次出现（说明上次未沉淀或沉淀不到位）
- 调试过程中尝试了错误方向，走了弯路
- 解决了一个跨模块、跨层级的复杂联动问题

**无需写入**：
- 简单笔误（变量名拼错、括号不匹配等）
- 已有完全匹配条目，且该条目经验法则未失效
- 纯逻辑推导类问题，无环境/工具/框架的特殊行为

---

### 三、写入格式规范

每条经验追加到 `docs/experience.md` 末尾，格式如下：

```
---
## [简短标题，动词开头，≤15字]

- **日期**：YYYY-MM-DD
- **标签**：#技术栈 #模块名 #问题类型（如 #React #useEffect #闭包陷阱）
- **场景**：[1-2句，描述在做什么时触发了问题，包含关键上下文]
- **现象**：[具体报错信息或异常行为，优先粘贴原始错误，不要意译]
- **根因**：[准确的技术原因，说清楚"为什么会这样"，不要只写"变量未初始化"]
- **解法**：[最终修复方式，附关键代码片段（≤10行）]
- **经验法则**：[下次遇到类似情况应该首先检查什么，写成可执行的检查项]
- **反模式**（可选）：[曾经错误尝试的方向及其失败原因，避免他人重蹈]
```

**写入质量要求**：
- 根因必须解释"机制"，不能只写"没有处理 null"，要写"该函数在 X 状态下返回 undefined，而调用方未做 guard，导致后续链式调用崩溃"
- 经验法则必须可操作，格式优先用"当...时，先检查..."或"避免在...场景下使用..."
- 标签是检索的关键，至少包含：技术栈标签 + 问题类型标签

---

### 四、维护规则

- 条目数量超过 **50 条**时，对文件进行一次归档整理：将旧条目按标签分组，合并重复，提炼为更通用的原则
- 发现某条经验法则**已过时**（如升级框架版本后问题消失），在该条目末尾注明 `[已过时，原因：...]`，不直接删除
- 不允许在任务中途写入草稿，只在任务**完全完成且验证通过后**写入，确保记录的是有效解法

---

# 核心开发与部署工作流规范

你当前运行在一个由 Git 进行版本控制，并使用 Docker Compose 进行服务编排的 Mac 服务器项目中。对于收到的任何开发任务，你必须严格遵循以下步骤：

1. **执行开发**：完成用户要求的代码编写或编辑任务。
2. **状态验证**：每次代码修改完成后，你必须先执行`docker-compose down && docker-compose up -d`重启docker服务，如有报错则返回进行修复。
3. **自动部署**：上一步状态验证通过后，你必须调用项目根目录下的 `./auto_deploy.sh` 脚本来完成后续动作。
   - 必须使用 `-s` 参数传递简要的修改总结（如 "feat: 增加用户登录接口"）。
   - 必须使用 `-d` 参数传递详细的修改说明（Comments），解释修改了哪些逻辑及原因。
   - 示例命令：`./auto_deploy.sh -s "fix: 修复数据库连接超时" -d "调整了 db_config.js 中的 timeout 参数，从 3000ms 增加到 5000ms，以适应当前网络环境。"`，注意：该脚本已内置 `git add .`、`git commit`的完整逻辑，你只需调用该脚本并传入准确的参数即可。
