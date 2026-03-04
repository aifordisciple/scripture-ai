# Store - Zustand State Management

**Parent:** [../AGENTS.md](../AGENTS.md)

## OVERVIEW

Zustand store with Redux-like slice pattern. Manages global state for UI, reader, AI, user data, and sync. Persisted to localStorage.

## STRUCTURE

```
store/
├── useBibleStore.ts    # Main store export (slices composition)
├── types.ts            # TypeScript interfaces (~205 lines)
└── slices.ts           # Slice implementations (~400 lines)
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Add new state | `slices.ts`, `types.ts` | Create slice + add to types |
| Modify UI state | `slices.ts` → `createUISlice` | Sidebar, modals, tabs |
| Modify reader state | `slices.ts` → `createReaderSlice` | Font, dark mode, tabs |
| Modify AI state | `slices.ts` → `createAISlice` | Chat open, generating |
| Modify user data | `slices.ts` → `createUserDataSlice` | Highlights, notes, plans |
| Modify sync | `slices.ts` → `createSyncSlice` | Sync mode, status |

## SLICES

| Slice | Key State |
|-------|-----------|
| `UISlice` | `isAuthOpen`, `isSidebarOpen`, `isShareOpen`, `sidebarWidth` |
| `ReaderSlice` | `fontSize`, `lineHeight`, `isDarkMode`, `tabs`, `activeTabId` |
| `AISlice` | `isAiOpen`, `isAiGenerating`, `aiRequestTrigger` |
| `UserDataSlice` | `highlights`, `notes`, `interactions`, `activePlans`, `streakCount` |
| `SyncSlice` | `syncMode`, `lastSyncTime`, `isSyncing`, `syncError` |

## CONVENTIONS

- **Slice pattern** - Each slice returns `{ state, actions }` merged in main store
- **Persistence** - Uses `zustand/middleware` persist with localStorage
- **Partialize** - Some state excluded from persistence (transient UI state)
- **Path alias** - Import via `@/store/useBibleStore`

## ANTI-PATTERNS

- **No direct localStorage access** - Use store actions
- **No async in setters** - Handle async in components or API
- **No circular imports** - Slices should not import from components
