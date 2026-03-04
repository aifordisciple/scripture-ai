# Components/Bible - Bible Reading UI

**Parent:** [../../AGENTS.md](../../AGENTS.md)

## OVERVIEW

Core Bible reading interface components. 19 files, 4 large (>500 lines). Handles verse display, AI chat, reading plans, highlights, notes, and sharing.

## STRUCTURE

```
components/bible/
├── Reader.tsx          # Main verse display (~480 lines)
├── AISidebar.tsx       # AI chat interface (~600 lines)
├── PlanTab.tsx         # Reading plan management (~600 lines)
├── ShareCard.tsx       # Verse image generation (~700 lines)
├── MagicBall.tsx       # Floating action button
├── Sidebar.tsx         # Book/chapter navigation
├── DashboardTab.tsx    # Stats & reading history
├── HighlightsTab.tsx   # User highlights list
├── NotesTab.tsx        # User notes list
├── NoteEditor.tsx      # Note editing modal
├── SearchDialog.tsx    # Search interface
├── SearchResults.tsx   # Search results display
├── FloatingMenu.tsx    # Verse selection menu
├── HeaderPlayer.tsx    # Audio player controls
├── AudioButton.tsx     # TTS toggle
├── BibleHeatmap.tsx    # Reading heatmap visualization
├── DashboardDialog.tsx # Dashboard modal
├── PlanDailyFlow.tsx   # Daily plan flow UI
└── BadgePopup.tsx      # Achievement notifications
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Modify verse rendering | `Reader.tsx` | Displays verses, handles selection, shows highlights |
| Add AI features | `AISidebar.tsx` | Chat UI, prompt shortcuts, verse context |
| Reading plans | `PlanTab.tsx`, `PlanDailyFlow.tsx` | Plan selection, daily progress, devotional flow |
| Share functionality | `ShareCard.tsx` | Image generation with html-to-image |
| Navigation | `Sidebar.tsx` | Book/chapter tree, search trigger |
| User data tabs | `HighlightsTab.tsx`, `NotesTab.tsx` | Lists of saved content |

## CONVENTIONS

- **Dynamic imports** - Most components use `next/dynamic` with `{ ssr: false }`
- **Zustand hooks** - All use `useBibleStore()` for state
- **Tailwind styling** - Utility classes with `cn()` helper for conditionals
- **Framer Motion** - Animations via `framer-motion` library
- **Chinese-first UI** - All labels in Chinese, some bilingual support

## ANTI-PATTERNS

- **No inline styles** - Use Tailwind classes only
- **No direct API calls** - Use hooks or store actions
- **No hardcoded Bible data** - Fetch via `use-bible-data.ts` hook
