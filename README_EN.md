[中文](README.md) | **English**

# AI读 (AI Read) - Your Smart Devotional Companion

**AI读** is a modern open-source Bible reading and devotional web application. It combines traditional scripture reading with cutting-edge AI technology, helping users understand scripture more deeply through intelligent interpretation, voice reading, note-taking, and personalized settings.

---

## Features

### Immersive Reading Experience
- Bilingual reading (CUV Chinese Union Version / KJV English)
- Responsive layout for mobile and desktop (PWA)
- Customizable font size, line spacing, dark/light mode
- Multi-tab navigation (Read, Search, Dashboard, Highlights, Notes, Plans, Cross-references, Theme Graph, Bookmarks, Favorites, etc.)
- Gesture support (swipe left, right, up)
- Keyboard shortcuts

### AI-Powered Assistance
- **AI Verse Interpretation**: Select a verse for background, exegesis, and modern application
- **AI Tutor**: Socratic-style Q&A for deeper thinking
- **Chapter Summary**: One-click theological summary of an entire chapter
- **Smart Search**: Exact search, AI semantic recommendation, vector fuzzy search (pgvector)
- **AI Prayer Generation**: Generate prayers based on scripture inspiration
- **AI Devotional Guide**: Auto-generate daily devotional content in reading plans
- **AI Study Guide**: Generate small group discussion questions
- **AI Sermon Outline**: Generate sermon key points from scripture
- **Custom Prompts**: Create and manage custom quick questions
- **AI Style Settings**: Adjust detail level, depth, tone
- **Session Management**: Multi-session switching, history, auto-generated titles
- **Insight Collection**: Save brilliant points from AI responses

### Bible Atlas & Timeline
- **Interactive Map**: Biblical geographic locations on an interactive map
- **Timeline**: Browse biblical events chronologically
- **Journey Replay**: Animate character journeys (e.g., Paul's missionary journeys)
- **AI Geo-Extraction**: AI automatically extracts geographic info from verses
- **Verse-Location Links**: View all verses related to a location

### Theme Graph
- **Theme Network**: Visualize connections between biblical themes
- **Theme-Verse Links**: View scripture coverage of a theme
- **Theme Connections**: Show reference, parallel, prophecy relationships between themes

### Cross-References
- **Verse Connections**: View thematic, reference, parallel, prophecy, illustration links
- **AI Cross-References**: AI discovers deep connections between verses

### Memory System
- **Ebbinghaus Method**: Smart review system based on SM-2 algorithm
- **Memory Cards**: Add important verses to memory bank
- **Smart Review Reminders**: Schedule reviews based on memory curve

### Text-to-Speech (TTS)
- High-quality Edge-TTS voice synthesis
- Multiple voice selection
- Auto-play next chapter
- Lock screen playback support (Media Session API on mobile)
- Multi-language support (Mandarin, Cantonese, English, etc.)
- Speed control (0.5x - 2x)

### Personal Devotional System
- **Highlights**: Multi-color marking (yellow, green, blue, red), batch operations
- **Devotional Notes**: Record spiritual reflections anytime
- **Bookmarks**: Quick-mark and jump to frequently used chapters
- **Reading History**: Auto-track reading trajectory
- **Data Sync**: Settings, highlights, and notes sync across devices after login
- **Reading Plans**: Built-in plan templates, custom plans, daily task flow guidance

### Social Features
- **Friends**: Search, add, remove friends
- **Direct Messages**: Real-time one-on-one messaging
- **Community Feed**: Share devotional reflections
- **Post Interactions**: Like, comment
- **Privacy Settings**: Control DM permissions, online status, profile visibility

### Church/Group System
- **Church Management**: Create and manage church groups
- **Group Reading Plans**: Track collective progress, challenge mode
- **Member Management**: Owner/Admin/Member roles
- **Group Chat**: Real-time chat within groups, scripture sharing
- **Announcements**: Pinned announcement publishing
- **Invite Codes**: Join church via invite code
- **Leaderboard**: Group reading progress ranking
- **Behind-Member Alerts**: Auto-identify members falling behind
- **Group Badges**: Achievement system for motivation
- **Shared Notes**: Note sharing within groups

### Sermon Management
- **Sermon Editor**: Create, edit, organize sermons
- **Folder Organization**: Archive sermons by topic/series
- **Sermon Templates**: Built-in sermon structure templates
- **AI Sermon Assistant**: Generate sermon outlines from scripture

### Desktop App (Tauri)
- **Cross-platform**: Tauri v2 (Windows/macOS/Linux)
- **Command Palette**: Cmd+P quick navigation
- **Offline Download**: Download Bible to local, read without internet
- **Print Preview**: Scripture printing support
- **Auto Update**: Automatic update detection
- **Custom Title Bar**: Native window experience

### Dashboard
- Reading heatmap visualization
- Streak flame counter
- Badge system (7-day, 30-day achievements, etc.)
- Reading progress statistics
- Data export (TSV format)

### Verse Sharing
- Beautiful verse card generation (10+ layout templates)
- AI-generated card themes
- Custom background, font, color
- One-click save or share to social media

### Notifications & Reminders
- Reading reminders (custom time)
- Push notifications (mobile)
- System announcements
- Friend activity notifications

### Admin Panel
- User management (mute, role change, broadcast messages)
- Church/group management
- Feedback handling
- System announcement management
- Operation log audit
- Statistics (PV/UV, DAU trends)

### Open Platform
- **API Keys**: Developer API access
- **OpenAPI Docs**: Complete API documentation (`/api/docs`)
- **Multi-language**: Chinese, English

### Onboarding
- 5-step guide (Welcome → Read → AI → Plan → Group)
- Skippable, resettable

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | Next.js 16 (App Router, Webpack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI / Lucide React / Framer Motion |
| ORM | Prisma |
| Database | PostgreSQL + pgvector (production) |
| Auth | NextAuth.js v5 (Credentials) |
| State Management | Zustand (10 Redux-style slices) |
| AI Integration | OpenAI SDK / DeepSeek / Ollama |
| TTS | Python edge-tts |
| Desktop | Tauri v2 (Rust + React + Vite) |
| Testing | Vitest |

---

## Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.local .env
# Edit .env with required config (see Environment Variables below)

# 3. Initialize database
npx prisma generate
npx prisma db push

# 4. Seed Bible data
node scripts/seed_full.js      # CUV Chinese Union Version (required)
node scripts/seed_full_kjv.js  # KJV English (optional)

# 5. Seed map/timeline data (optional)
node scripts/seed_events.ts
node scripts/seed_journeys.ts
node scripts/seed_themes_extended.js
node scripts/seed_theme_verses.js
node scripts/seed_theme_connections.js

# 6. Start dev server
npm run dev
```

### Docker Deployment (Production)

```bash
# Build and start
docker-compose up -d --build

# First run: initialize data
docker-compose exec web npx prisma db push
docker-compose exec web node scripts/seed_full.js
```

### Docker Dev Mode

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Desktop App Development

```bash
cd apps/desktop
npm install
npm run tauri:dev     # Dev mode
npm run tauri:build   # Build installer
```

---

## New Server Deployment Guide

Complete steps to deploy scripture-ai to a fresh server.

### Prerequisites

| Item | Requirement |
|------|-------------|
| OS | Linux (Ubuntu 22.04+ recommended) or macOS |
| Docker | Docker Engine 20.10+ |
| Docker Compose | v2+ |
| Git | Any version |
| Disk | >= 5GB (images + database + Bible data) |
| RAM | >= 2GB |
| Network | Access to GitHub and Docker Hub (configure mirror acceleration in China) |

### 1. Clone Repository

```bash
git clone git@github.com:aifordisciple/scripture-ai.git
cd scripture-ai
```

### 2. Configure Environment Variables

```bash
cp .env .env.local
```

Edit `.env.local` and **verify each variable**:

**Required (service won't start without these):**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/scripture_db` |
| `AUTH_SECRET` | NextAuth encryption key | Generate with `openssl rand -base64 32`, must be unique per server |
| `NEXTAUTH_URL` | Server external URL | `http://YOUR_IP:3000` or `https://your.domain` |
| `AUTH_TRUST_HOST` | Trust non-localhost hosts | Must be `true` for non-local deployments |

**AI Configuration (choose one):**

| Option | Variables | Description |
|--------|-----------|-------------|
| Cloud API (recommended) | `AI_PROVIDER=cloud`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OLLAMA_MODEL` | Use cloud models |
| Ollama local | `AI_PROVIDER=ollama`, `OPENAI_BASE_URL=http://host.docker.internal:11434/v1`, `OLLAMA_MODEL` | Local model deployment |
| DeepSeek | `AI_PROVIDER=deepseek`, `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL` (optional) | DeepSeek API |

**Docker Compose variable override:**

The `environment` field in `docker-compose.yml` **overrides** same-named variables in `.env.local`. Inside containers, `DATABASE_URL` host must be `db` (Docker service name), not `localhost`.

### 3. Start Docker Containers

```bash
docker-compose up -d --build
```

Verify container status:

```bash
docker-compose ps
# Expected: web = Up, db = Up (healthy)

docker-compose logs web --tail=30
# Expected: see "Ready in XXXms"
```

### 4. Initialize Database Schema

**Cannot be skipped** — all API requests will return 500 without this.

```bash
docker-compose exec web npx prisma db push
```

Verify tables created:

```bash
docker-compose exec db psql -U user -d scripture_db -c "\dt"
# Should list 50+ tables
```

### 5. Seed Bible Data

**Required** — homepage will be empty without this.

```bash
# Seed CUV Chinese Union Version — required
docker-compose exec web node scripts/seed_full.js

# Seed KJV English — for bilingual support
docker-compose exec web node scripts/seed_full_kjv.js
```

Verify data imported:

```bash
docker-compose exec db psql -U user -d scripture_db -c "SELECT COUNT(*) FROM bible_verses;"
# CUV: ~31102 verses, KJV: ~31102 verses
```

**Optional data seeding:**

```bash
# Bible map/timeline/theme data
docker-compose exec web node scripts/seed_events.js
docker-compose exec web node scripts/seed_journeys.js
docker-compose exec web node scripts/seed_themes_extended.js
docker-compose exec web node scripts/seed_theme_verses.js
docker-compose exec web node scripts/seed_theme_connections.js

# Verse embeddings (requires host Ollama + bge-m3 model)
ollama pull bge-m3
docker-compose exec web npx tsx scripts/generate-embeddings.ts
```

### 6. Create Admin Account

**Option A: Via registration API**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password","name":"Admin"}'
```

**Option B: Via Prisma Studio**

```bash
docker-compose exec web npx prisma studio
# Visit http://localhost:5555 in browser, manually add record in User table
# For password field, use bcrypt hash:
docker-compose exec web node -e "
  const bcrypt = require('bcryptjs');
  console.log(bcrypt.hashSync('your_password', 10));
"
```

Set admin role:

```bash
docker-compose exec db psql -U user -d scripture_db -c \
  "UPDATE \"User\" SET role='admin' WHERE email='admin@example.com';"
```

### 7. Verify Deployment

```bash
# Page accessible
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200

# Sync endpoint returns 401 (not logged in) not 500
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/user/sync
# Expected: 401

# Bible data exists
curl -s http://localhost:3000/api/bible?bookId=Gen&chapter=1 | head -c 200
# Expected: JSON data with verse content

# Database connection OK
docker-compose exec db psql -U user -d scripture_db -c "SELECT 1;"
# Expected: returns 1
```

### 8. Production Optimization (Optional)

**Nginx reverse proxy + HTTPS:**

```nginx
server {
    listen 443 ssl;
    server_name your.domain;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

After configuring, update `.env.local`: `NEXTAUTH_URL=https://your.domain`, `AUTH_TRUST_HOST=true`.

**Docker Compose security:** Remove `ports: "5432:5432"` (don't expose DB port externally), add `logging` config to prevent log bloat.

### Migrate from Old Server

```bash
# Old server: export database
docker-compose exec db pg_dump -U user scripture_db > backup.sql

# New server: import database (after running prisma db push)
cat backup.sql | docker-compose exec -T db psql -U user scripture_db

# Re-sync Prisma client after import
docker-compose exec web npx prisma generate
```

> After importing old data, no need to run seed scripts — Bible verses are already in backup.sql.

### Troubleshooting

| Symptom | Cause | Solution |
|---------|-------|----------|
| `/api/user/sync` returns 500 | Database tables not created | `docker-compose exec web npx prisma db push` |
| Sync error after login `SyntaxError` | AUTH_SECRET differs from old env | Clear browser cookies, re-login |
| Empty homepage, no verses | Seed scripts not run | `docker-compose exec web node scripts/seed_full.js` |
| AI features not working | AI_PROVIDER/API Key not configured | Check AI variables in `.env.local` |
| Database connection failed | DATABASE_URL host is not `db` | Use Docker service name `db`, not `localhost` |
| TTS not working | Missing edge-tts in container | Rebuild with `docker-compose up --build` |
| Container exits immediately | Missing required vars in `.env.local` | Verify AUTH_SECRET, DATABASE_URL are set |
| pgvector extension missing | Using plain PostgreSQL image | Must use `pgvector/pgvector:pg16` image |
| Vector search not working | Embedding data not generated | Run `generate-embeddings.ts` script |
| Port conflict | 3000/5432 already in use | Modify `docker-compose.yml` port mappings |

### Deployment Checklist

- [ ] `docker-compose ps` shows web and db both Up/healthy
- [ ] `curl localhost:3000` returns 200
- [ ] `curl localhost:3000/api/user/sync` returns 401 (not 500)
- [ ] `bible_verses` table has data (CUV ~31102 rows)
- [ ] Registration/login works
- [ ] No sync errors after login
- [ ] AI chat works
- [ ] TTS voice reading works
- [ ] Highlights/notes can be saved
- [ ] Reading plans can be created and advanced

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection | `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | NextAuth secret key | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Server external URL | `http://IP:3000` or `https://domain` |
| `AUTH_TRUST_HOST` | Trust non-localhost | Set to `true` for non-local deployments |
| `AI_PROVIDER` | AI provider | `openai` / `deepseek` / `ollama` / `cloud` |
| `OPENAI_API_KEY` | OpenAI API Key | `sk-...` |
| `OPENAI_BASE_URL` | API endpoint | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Model name | `gpt-4o-mini` |
| `DEEPSEEK_API_KEY` | DeepSeek Key | (optional) |
| `DEEPSEEK_BASE_URL` | DeepSeek endpoint | (optional) |
| `OLLAMA_BASE_URL` | Ollama endpoint | `http://localhost:11434/v1` |
| `OLLAMA_MODEL` | Ollama model | `qwen2.5:latest` |
| `EMBEDDING_BASE_URL` | Embedding model endpoint | `http://host.docker.internal:11434/v1` |
| `IMAGE_EMBEDDING_MODEL` | Embedding model name | `bge-m3` |
| `SMTP_HOST` | Mail server | (optional, silently skipped if not configured) |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | (optional) |
| `SMTP_PASS` | SMTP password | (optional) |

---

## Project Structure

```
scripture-ai/
├── app/                        # Next.js App Router
│   ├── api/                   # API routes (96 route files, 36 endpoint dirs)
│   │   ├── admin/            # Admin panel
│   │   ├── ai/               # AI utilities
│   │   ├── atlas/            # Bible map/timeline
│   │   ├── chat/             # AI chat (12 routes)
│   │   ├── church/           # Church/group (21 routes)
│   │   ├── sermon/           # Sermon management
│   │   ├── user/             # User data
│   │   └── ...               # bible, search, highlight, note, tts, dm, etc.
│   ├── admin/                 # Admin panel pages
│   ├── dashboard/             # Dashboard page
│   ├── settings/prompts/      # Custom prompt management
│   ├── desktop-login/         # Desktop app login
│   ├── layout.tsx            # Root layout (Auth/Sync/Badge/Analytics)
│   ├── page.tsx              # Main reading page
│   └── sitemap.ts            # Dynamic sitemap
│
├── apps/                       # Desktop application
│   └── desktop/               # Tauri v2 desktop app
│       ├── src-tauri/         # Rust backend
│       └── src/               # React + Vite frontend
│
├── packages/                   # Shared libraries
│   ├── core/                  # Core business logic
│   ├── ui/                    # Shared UI utilities
│   └── native/                # Native capability abstractions
│
├── components/                 # React components (169 files)
│   ├── bible/                 # Core reading components (61 files)
│   ├── atlas/                 # Bible map components
│   ├── group/                 # Group feature components (22 files)
│   ├── sermon/                # Sermon management components (18 files)
│   ├── mindmap/               # Mind map
│   ├── onboarding/            # Onboarding guide
│   ├── admin/                 # Admin panel components
│   ├── auth/                  # Auth components
│   ├── common/                # Common components
│   ├── dm/                    # Direct message components
│   ├── feedback/              # Feedback components
│   ├── providers/             # Context Providers
│   ├── pwa/                   # PWA install guide
│   ├── settings/              # Settings components
│   ├── skeletons/             # Loading skeletons
│   └── ui/                    # Radix UI primitives
│
├── store/                      # Zustand state management (10 slices)
│   ├── slices.ts              # Main slice implementations (8)
│   ├── slices/                # Standalone slice files
│   │   ├── localeSlice.ts     # Locale slice
│   │   ├── readerSlice.ts     # Reader slice
│   │   └── sermonSlice.ts     # Sermon slice
│   ├── useBibleStore.ts       # Main store export
│   └── types.ts               # TypeScript type definitions
│
├── hooks/                      # Custom hooks
│   ├── use-audio-player.ts    # Audio playback
│   ├── use-bible-data.ts      # Bible data
│   ├── use-bible-search.ts    # Verse search
│   ├── use-media-query.ts     # Responsive layout
│   ├── use-offline-cache.ts   # Offline cache
│   ├── use-pwa-install.ts     # PWA install
│   ├── use-realtime.ts        # Real-time updates
│   ├── use-swipe-navigation.ts # Gesture navigation
│   └── use-verse-menu.ts      # Verse menu
│
├── lib/                        # Utility libraries
│   ├── auth.ts                # NextAuth config
│   ├── prisma.ts              # Database client
│   ├── constants.ts           # Constants (BIBLE_BOOKS, prompts)
│   ├── plans.ts               # Reading plan definitions
│   ├── ai-client.ts           # AI client
│   ├── ai-context-builder.ts  # AI context builder
│   ├── cross-reference-ai.ts  # Cross-reference AI
│   ├── i18n/                  # Internationalization
│   ├── admin.ts               # Admin utilities
│   ├── api-auth.ts            # API auth
│   ├── cache.ts               # Cache
│   ├── rate-limit.ts          # Rate limiting
│   ├── sse-manager.ts         # SSE manager
│   ├── email.ts               # Email service
│   ├── group-badges.ts        # Group badges
│   ├── notification-service.ts # Notification service
│   ├── memory-reminder-service.ts # Memory reminder
│   ├── verse-preloader-service.ts # Verse preloader
│   ├── animation-presets.ts   # Animation presets
│   ├── bible-periods.ts       # Bible periods
│   └── utils.ts               # General utilities
│
├── prisma/
│   └── schema.prisma          # Database models (52 models, 8 enums)
│
├── scripts/                    # Data scripts
│   ├── seed_full.js           # CUV Bible data
│   ├── seed_full_kjv.js       # KJV Bible data
│   ├── seed_events.ts         # Bible events data
│   ├── seed_journeys.ts       # Journey data
│   ├── seed_themes_extended.js # Theme data (extended)
│   ├── seed_theme_verses.js   # Theme-verse links
│   ├── seed_theme_connections.js # Theme connections
│   ├── generate-embeddings.ts # Embedding generation
│   └── tts.py                 # TTS voice script
│
├── docker-compose.yml          # Production Docker config
├── docker-compose.dev.yml      # Dev Docker config
├── Dockerfile                  # Multi-stage build (5 stages)
├── auto_deploy.sh              # Auto deploy script
└── package.json                # Project config
```

---

## Architecture

### State Management (Zustand 10 Slices)

| Slice | Responsibility | Key State |
|-------|---------------|-----------|
| **UISlice** | UI control | Sidebar, modals, share, onboarding |
| **ReaderSlice** | Reader | Font size, dark mode, tabs, chapter navigation |
| **AISlice** | AI features | Sessions, queue, mode, style settings, insights |
| **UserDataSlice** | User data | Highlights, notes, plans, bookmarks, history |
| **SyncSlice** | Data sync | Sync mode, status, errors |
| **GroupSlice** | Group features | Group plan context, progress |
| **AtlasSlice** | Bible map | Map center/zoom, timeline, journeys |
| **DMSlice** | Direct messages | Conversation list, messages, unread count |
| **LocaleSlice** | Language | locale (zh/en), bibleVersion (CUV/KJV) |
| **SermonSlice** | Sermon | Sermons, folders, templates |

### Data Models (Prisma 52 Models, 8 Enums)

| Category | Models |
|----------|--------|
| **Core** | User, BibleVerse, Highlight, Note, ScriptureCard, Interaction |
| **Settings** | UserSetting, Reminder, NotificationToken, PrivacySettings |
| **AI** | ChatSession, ChatMessage, CustomPrompt, SavedInsight |
| **Memory** | MemoryCard, ReviewLog (SM-2 algorithm) |
| **Social** | Friend, DirectMessage, Feedback |
| **Church** | Church, ChurchMember, InviteCode, GroupPlan, GroupPlanProgress |
| **Church Extended** | GroupChatMessage, GroupAnnouncement, GroupCheckInActivity, GroupBadge, GroupChatReadStatus, LeaderboardEntry |
| **Sermon** | Sermon, SermonFolder, SermonTemplate |
| **Atlas** | BibleLocation, BibleVerseLocation, BibleEvent, BibleJourney, JourneyStop |
| **Themes** | BibleTheme, ThemeVerseLink, ThemeConnection |
| **System** | ApiKey, ActivityLog, AdminLog, SystemAnnouncement, PageView, VerseConnection, Notification, Like, Comment, Badge, PlanProgress |

### Advanced Patterns

**AI Request Queue System**
AISlice manages a request queue to prevent concurrent API calls:
- `enqueueAI()` - Add to queue or execute immediately
- `cancelAIRequest()` - Cancel current or queued request
- `completeCurrentRequest()` - Complete current request, auto-start next

**Reading Plan Flow Context**
For step-by-step plan execution, contains `{ planId, day, stepIndex, steps[] }`:
- `advancePlanStep()` - Advance to next step, auto check-in
- `catchUpPlan()` - Catch up on behind progress

**Group Plan Flow Context**
Similar to reading plan but for church groups, contains `{ churchId, planId, planName, day, stepIndex, steps[] }`:
- Syncs progress via `/api/church/[id]/plan/[planId]/progress`
- `toggleGroupTaskCompleted()` - Async complete task and sync to server

**Data Persistence**
- Zustand store uses `zustand/middleware` persist to localStorage
- Excludes transient state (AI sessions, generation flags, sync errors, map/DM state)
- Cloud sync via `/api/user/sync` after login

---

## API Endpoints (96 route files, 36 endpoint directories)

### Bible Core
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bible` | GET | Get verses (book, chapter, version) |
| `/api/bible/[bookId]/[chapter]/[verse]` | GET | Get single verse |
| `/api/search` | GET/POST | Search verses (exact/AI/vector modes) |
| `/api/versions` | GET | Bible version list |
| `/api/versions/import` | POST/DELETE | Import/delete Bible version |
| `/api/cross-reference` | POST | Cross-reference query |
| `/api/parse-verse` | POST | Verse reference parsing |

### AI Chat (12 routes)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Main chat (streaming response) |
| `/api/chat/tutor` | POST | Socratic tutor |
| `/api/chat/devotional` | POST | Devotional guide generation |
| `/api/chat/prayer` | POST | Prayer generation |
| `/api/chat/sermon` | POST | Sermon outline generation |
| `/api/chat/study-guide` | POST | Study guide generation |
| `/api/chat/plan` | POST | Custom reading plan |
| `/api/chat/verse` | GET | AI verse interpretation |
| `/api/chat/message` | POST/PATCH | Message management |
| `/api/chat/session` | GET/POST/PATCH/DELETE | Session management |
| `/api/chat/session/generate-title` | POST | Auto-generate session title |
| `/api/chat/history` | GET/DELETE | Chat history management |

### Bible Atlas (6 routes)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/atlas/locations` | GET/POST | Geographic location data |
| `/api/atlas/events` | GET/POST | Biblical event data |
| `/api/atlas/journeys` | GET/POST | Journey data |
| `/api/atlas/ai-extract` | POST | AI geo-extraction |
| `/api/atlas/verse-locations` | GET/POST | Verse-location links |
| `/api/atlas/cache-verse-locations` | POST | Cache verse-location links |

### User Data (8 routes)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/highlight` | GET/POST | Highlight management |
| `/api/highlight/batch` | GET/POST | Batch highlight operations |
| `/api/note` | POST | Note management |
| `/api/user/sync` | GET/POST | Full data sync |
| `/api/user/settings` | GET/POST | User settings (incl. API config) |
| `/api/user/dashboard` | GET | Dashboard statistics |
| `/api/user/api-keys` | GET/POST/DELETE | API key management |
| `/api/user/privacy` | GET/PUT | Privacy settings |
| `/api/user/role` | GET/PUT | User role |
| `/api/user/locale` | GET/POST | Language preference |
| `/api/user/onboarding` | GET/POST/DELETE | Onboarding state |

### Social Features
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/friends` | GET/POST/DELETE/PATCH | Friends system |
| `/api/dm` | GET/POST/PUT/DELETE | Direct messages |
| `/api/posts` | GET/POST/DELETE | Community posts |
| `/api/posts/like` | POST/DELETE | Like |
| `/api/posts/comment` | GET/POST | Comment |
| `/api/member/[userId]` | GET | User profile |

### Church System (21 routes)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/church` | GET/POST | Church list/create |
| `/api/church/join-by-invite` | POST | Join by invite code |
| `/api/church/unread-count` | GET | Unread message count |
| `/api/church/[id]` | GET/POST | Church detail/update |
| `/api/church/[id]/stats` | GET | Church statistics |
| `/api/church/[id]/activity` | GET/POST | Activity feed |
| `/api/church/[id]/chat` | GET/POST/PUT | Group chat |
| `/api/church/[id]/notes` | GET/POST | Shared notes |
| `/api/church/[id]/like` | GET/POST | Like |
| `/api/church/[id]/comment` | GET/POST/DELETE | Comment |
| `/api/church/[id]/invite` | GET/POST/DELETE | Invite code management |
| `/api/church/[id]/announcement` | GET/POST/PUT/DELETE | Announcement management |
| `/api/church/[id]/remind` | POST | Remind members |
| `/api/church/[id]/behind-members` | GET | Behind members |
| `/api/church/[id]/badges` | GET/POST | Group badges |
| `/api/church/[id]/badges/check` | POST | Check badges |
| `/api/church/[id]/plan` | GET/POST/PUT/DELETE | Group plan |
| `/api/church/[id]/plan/ai-create` | POST | AI create plan |
| `/api/church/[id]/plan/[planId]/leaderboard` | GET | Leaderboard |
| `/api/church/[id]/plan/[planId]/devotional` | GET/POST | Devotional content |
| `/api/church/[id]/plan/[planId]/progress` | GET/POST | Progress tracking |

### Memory & Reminders
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/memory` | GET/POST/PUT/DELETE | Memory cards (SM-2 algorithm) |
| `/api/reminder` | GET/POST/DELETE | Reading reminders |

### AI Utilities & Tools
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tts` | POST | Text-to-speech |
| `/api/card-theme` | POST | AI card theme generation |
| `/api/card-image` | POST | Card image generation |
| `/api/insights` | GET/POST/PUT/DELETE | AI insight collection |
| `/api/prompts` | GET/POST/PATCH/DELETE | Custom prompts |
| `/api/theme` | GET | Theme graph data |
| `/api/proxy` | GET | Resource proxy (with cache) |
| `/api/docs` | GET | OpenAPI documentation |
| `/api/sync/offline` | POST | Offline data sync |

### Sermon Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sermon` | GET/POST/PUT/DELETE | Sermon management |
| `/api/sermon/folders` | GET/POST | Sermon folders |

### Admin Panel (6 routes)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/stats` | GET | System statistics |
| `/api/admin/users` | GET/PUT | User management |
| `/api/admin/churches` | GET | Church management |
| `/api/admin/logs` | GET | Operation logs |
| `/api/admin/messages` | GET/POST | Broadcast messages |
| `/api/admin/messages/batch` | POST | Batch messages |
| `/api/admin/announcements` | GET/POST/PUT/DELETE | System announcements |

### Other
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth authentication |
| `/api/register` | POST | User registration |
| `/api/analytics` | GET/POST | Analytics |
| `/api/announcements` | GET | Announcement query |
| `/api/events` | GET | Event query |
| `/api/notification` | GET/POST/PUT/DELETE | Notification management |
| `/api/feedback` | GET/POST/PUT/DELETE | User feedback |
| `/api/feedback/batch` | POST | Batch feedback |

---

## Development Guide

### Code Conventions

- TypeScript strict mode
- ESLint check: `npm run lint`
- Tailwind CSS for component styling
- No `@ts-ignore` or `as any`
- Path alias `@/` for imports
- `"use client"` directive for client components
- Component files: PascalCase (`Reader.tsx`)
- Hook files: kebab-case (`use-audio-player.ts`)
- API routes: lowercase (`app/api/chat/route.ts`)

### Deployment Workflow

```bash
# 1. After code changes, restart Docker to verify
docker-compose down && docker-compose up -d --build

# 2. After verification, auto-deploy
./auto_deploy.sh -s "feat: feature description" -d "detailed change description"
```

### Running Tests

```bash
npm run test           # Run tests (watch mode)
npm run test:run       # Single run
npm run test:coverage  # With coverage
```

---

## FAQ

**Q: How to switch AI provider?**
A: Two ways: 1) Configure in user settings (higher priority); 2) Set `AI_PROVIDER` env var. Priority: user settings > env var default.

**Q: How to add a new Bible version?**
A: Use `/api/versions/import` endpoint. Data format reference: `scripts/seed_full.js`.

**Q: How to build the desktop app?**
A: `cd apps/desktop && npm install && npm run tauri:build`

**Q: How to migrate data?**
A: Use `/api/user/sync` endpoint: `GET` to export full user data, `POST` to import (merges with existing data).

**Q: How to configure local AI?**
A: Install Ollama, run `ollama pull qwen2.5`, set `OLLAMA_BASE_URL=http://localhost:11434/v1` and `OLLAMA_MODEL=qwen2.5`.

---

## Contributing

Issues and Pull Requests are welcome!

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Submit a Pull Request

---

## License

- This project's open-source code is under MIT License
- Bible texts (CUV, KJV) are copyrighted by their respective translators/publishers
- Please ensure compliance with relevant copyright regulations
