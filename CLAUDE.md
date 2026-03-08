# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Scripture AI** is a Bible reading & devotional web application with AI-powered verse interpretation, TTS voice reading, highlights, notes, and reading plans. Chinese-first UI with CUV/KJV bilingual support.

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
├── api/                 # API routes (36+ endpoints)
│   ├── chat/           # AI chat: main, tutor, devotional, prayer, sermon, study-guide
│   ├── highlight/     # Highlight CRUD
│   ├── note/          # Note CRUD
│   ├── tts/           # Text-to-speech
│   └── ...            # Friends, posts, church, memory, etc.
└── page.tsx            # Main reading page

components/
├── bible/              # Core reading components
│   ├── Reader.tsx      # Verse rendering (~400 lines)
│   ├── AISidebar.tsx  # AI chat interface (~600 lines)
│   ├── MagicBall.tsx  # Floating action button
│   ├── PlanTab.tsx    # Reading plan UI (~600 lines)
│   └── ShareCard.tsx # Verse image generator (~700 lines)
├── ui/                 # Radix UI primitives
└── auth/               # Auth components

store/
├── slices.ts           # Zustand slices (UI, Reader, AI, UserData, Sync)
├── useBibleStore.ts    # Main store export
└── types.ts            # TypeScript types

lib/
├── auth.ts             # NextAuth configuration
├── prisma.ts           # Prisma singleton
├── constants.ts        # BIBLE_BOOKS, prompts
└── plans.ts            # Reading plan definitions
```

### Key Patterns

1. **Zustand with Slices**: `store/slices.ts` uses Redux-like slices (`createUISlice`, `createReaderSlice`, etc.) instead of vanilla Zustand
2. **API Routes**: All data access via `app/api/*/route.ts` - never call Prisma directly from components
3. **Dynamic Imports**: Heavy components use `next/dynamic` with `{ ssr: false }`
4. **--webpack Flag**: Build scripts include `--webpack` flag (non-standard Next.js)

### State Management

The Zustand store has 5 slices:
- **UISlice**: Sidebar, tabs, modals, share
- **ReaderSlice**: Font size, dark mode, tabs, chapter navigation
- **AISlice**: AI sidebar state, generation status
- **UserDataSlice**: Highlights, notes, reading plans, streaks, badges, API config
- **SyncSlice**: Cloud sync state

### Data Models (Prisma)

20+ models including: User, BibleVerse, Highlight, Note, ReadingPlan, Post, Comment, Church, Memory, etc.

## Important Conventions

- Use path alias `@/` for all imports
- `"use client"` directive for client components
- Components: PascalCase (`Reader.tsx`)
- Hooks: kebab-case (`use-audio-player.ts`)
- API routes: lowercase (`app/api/chat/route.ts`)
- No `as any` or `@ts-ignore` - strict TypeScript

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth secret key |
| `AI_PROVIDER` | `openai`, `deepseek`, or `ollama` |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_BASE_URL` | Custom API endpoint |
| `DEEPSEEK_API_KEY` | DeepSeek API key (optional) |

## Mobile App

Expo-based React Native app in `app-mobile/` directory. Build APK with:
```bash
cd app-mobile
npm run prebuild
cd android
./gradlew assembleDebug
```

APK location: `app-mobile/android/app/build/outputs/apk/debug/app-debug.apk`
