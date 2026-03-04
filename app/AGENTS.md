# App - Next.js App Router

**Parent:** [../AGENTS.md](../AGENTS.md)

## OVERVIEW

Next.js 16 App Router directory. Contains pages, layouts, and 16 API endpoints. Entry point for all routes.

## STRUCTURE

```
app/
├── layout.tsx          # Root layout (providers, metadata)
├── page.tsx            # Main reader page (~512 lines)
├── loading.tsx         # Loading state
├── globals.css         # Global styles
├── dashboard/
│   └── page.tsx        # Dashboard page
└── api/
    ├── auth/[...nextauth]/route.ts  # NextAuth handlers
    ├── bible/route.ts               # Bible verse API
    ├── chat/
    │   ├── route.ts                 # Main AI chat
    │   ├── devotional/route.ts      # Devotional generation
    │   ├── prayer/route.ts          # Prayer generation
    │   ├── plan/route.ts            # Plan AI features
    │   └── history/route.ts         # Chat history
    ├── highlight/route.ts           # Highlight CRUD
    ├── note/route.ts                # Note CRUD
    ├── search/route.ts              # Bible search
    ├── tts/route.ts                 # Text-to-speech
    ├── register/route.ts            # User registration
    ├── proxy/route.ts               # API proxy
    ├── card-image/route.tsx         # OG image generation
    ├── card-theme/route.ts          # Card themes
    └── user/
        ├── sync/route.ts            # Data sync
        └── settings/route.ts        # User settings
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new API endpoint | `app/api/[name]/route.ts` | Standard Next.js App Router |
| Modify root layout | `app/layout.tsx` | Providers, metadata, dark mode |
| Main page logic | `app/page.tsx` | Tab system, keyboard shortcuts, audio |
| AI endpoints | `app/api/chat/` | OpenAI SDK integration |
| Auth endpoints | `app/api/auth/`, `app/api/register/` | NextAuth + registration |
| User data sync | `app/api/user/sync/` | Highlights, notes, settings sync |

## CONVENTIONS

- **Route handlers** - Export `GET`, `POST`, etc. from `route.ts`
- **Authentication** - Use `auth()` from `lib/auth.ts` for protected routes
- **Error responses** - Return `{ error: "message" }` with appropriate status
- **Prisma access** - Import from `@/lib/prisma`, never direct

## ANTI-PATTERNS

- **No server components in API routes** - All route.ts files are server-side
- **No direct database calls from pages** - Use API routes
- **No client-side auth checks** - Use `AuthProvider` wrapper
