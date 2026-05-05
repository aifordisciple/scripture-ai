# Apple HIG 全面 UI 升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the dual dark mode systems, eliminate the dual color vocabulary, and upgrade all core components and Admin pages to pure Apple HIG visual standards.

**Architecture:** Phase 1 creates a centralized ThemeProvider and unifies Shadcn/Apple color tokens. Phase 2 upgrades the 5 core Bible components (Header, Sidebar, Reader, AISidebar, MagicBall). Phase 3 upgrades Admin layout and all 6 Admin pages with a shared ResponsiveTable component.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS 4, Zustand, Radix UI, Framer Motion

---

## Phase 1: 基础架构统一

### Task 1: Create ThemeProvider

**Files:**
- Create: `components/providers/ThemeProvider.tsx`
- Modify: `app/layout.tsx:130-158` (add ThemeProvider to provider tree)

- [ ] **Step 1: Create ThemeProvider with context, hook, and DOM sync**

```tsx
// components/providers/ThemeProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState((prev) => (prev === "dark" ? "light" : "dark")), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
```

- [ ] **Step 2: Add ThemeProvider to app/layout.tsx provider tree**

In `app/layout.tsx`, insert `ThemeProvider` between `AuthProvider` and `ToastProvider`:

```tsx
<AuthProvider>
  <ThemeProvider>
    <ToastProvider>
      {children}
      <SyncProvider />
      <BadgePopup />
      <AnalyticsTracker />
    </ToastProvider>
  </ThemeProvider>
</AuthProvider>
```

Add the import at the top: `import { ThemeProvider } from "@/components/providers/ThemeProvider";`

- [ ] **Step 3: Commit**

```bash
git add components/providers/ThemeProvider.tsx app/layout.tsx
git commit -m "feat: add centralized ThemeProvider with useTheme hook"
```

---

### Task 2: Migrate main app dark mode to ThemeProvider

**Files:**
- Modify: `app/page.tsx:148,224-227` (replace Zustand dark mode sync with ThemeProvider)
- Modify: `store/slices.ts:114-115` (keep isDarkMode as derived state, add sync action)

- [ ] **Step 1: Replace the dark mode useEffect in app/page.tsx**

Remove the existing useEffect at lines 224-227:
```tsx
// REMOVE this:
useEffect(() => {
  if (isDarkMode) { document.documentElement.classList.add('dark'); }
  else { document.documentElement.classList.remove('dark'); }
}, [isDarkMode]);
```

Replace with ThemeProvider sync. Add import at top:
```tsx
import { useTheme } from "@/components/providers/ThemeProvider";
```

Add a new useEffect that syncs Zustand's `isDarkMode` to the ThemeProvider (one-way: Zustand → ThemeProvider):
```tsx
const { setTheme } = useTheme();

useEffect(() => {
  setTheme(isDarkMode ? "dark" : "light");
}, [isDarkMode, setTheme]);
```

- [ ] **Step 2: Update toggleDarkMode callers to also sync**

Find all `toggleDarkMode` callers in `app/page.tsx` (mobile settings sheet ~line 400, desktop settings dropdown ~line 606). They already call `toggleDarkMode()` from Zustand, which flips `isDarkMode`, which triggers the useEffect above. No changes needed to the callers themselves.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "refactor: migrate main app dark mode to ThemeProvider"
```

---

### Task 3: Migrate Admin dark mode to ThemeProvider

**Files:**
- Modify: `components/admin/AdminLayout.tsx:40-57,170-181` (replace independent dark mode with useTheme)

- [ ] **Step 1: Replace AdminLayout's independent dark mode state**

Remove the independent state and effects at lines 40-57:
```tsx
// REMOVE all of this:
const [darkMode, setDarkMode] = useState(false);

useEffect(() => {
  const saved = localStorage.getItem("admin-dark-mode");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = saved ? saved === "true" : prefersDark;
  setDarkMode(isDark);
  document.documentElement.classList.toggle("dark", isDark);
}, []);

const toggleDarkMode = useCallback(() => {
  setDarkMode((prev) => {
    const next = !prev;
    localStorage.setItem("admin-dark-mode", String(next));
    document.documentElement.classList.toggle("dark", next);
    return next;
  });
}, []);
```

Replace with ThemeProvider:
```tsx
import { useTheme } from "@/components/providers/ThemeProvider";

// Inside component:
const { theme, toggleTheme } = useTheme();
const darkMode = theme === "dark";
```

- [ ] **Step 2: Update the dark mode toggle button in the header**

At lines 170-181, the `onClick={toggleDarkMode}` becomes `onClick={toggleTheme}`. No other changes needed — the button already uses `darkMode` for icon switching which is now derived from `theme`.

- [ ] **Step 3: Commit**

```bash
git add components/admin/AdminLayout.tsx
git commit -m "refactor: migrate Admin dark mode to centralized ThemeProvider"
```

---

### Task 4: Unify Shadcn color variables to Apple token aliases

**Files:**
- Modify: `app/globals.css:82-280` (replace Shadcn hex values with Apple token var() references)

- [ ] **Step 1: Replace :root Shadcn variables with Apple token aliases**

In `app/globals.css`, replace the `:root` block's Shadcn semantic variables. Currently they use raw hex values that duplicate Apple tokens. Replace with `var()` references:

```css
:root {
  /* Apple Design Tokens (source of truth) */
  --apple-primary: #0066cc;
  --apple-primary-focus: #0071e3;
  --apple-primary-on-dark: #2997ff;
  --apple-ink: #1d1d1f;
  --apple-ink-muted-80: #333333;
  --apple-ink-muted-48: #7a7a7a;
  --apple-divider-soft: #f0f0f0;
  --apple-hairline: #e0e0e0;
  --apple-canvas: #ffffff;
  --apple-parchment: #f5f5f7;
  --apple-pearl: #fafafc;
  --apple-tile-1: #272729;
  --apple-tile-2: #2a2a2c;
  --apple-tile-3: #252527;
  --apple-surface-black: #000000;
  --apple-chip-translucent: #d2d2d7;
  --apple-product-shadow: rgba(0, 0, 0, 0.22) 3px 5px 30px;
  --apple-on-dark: #ffffff;
  --apple-body-on-dark: #ffffff;
  --apple-body-muted: #cccccc;

  /* Shadcn semantic tokens → Apple token aliases */
  --background: var(--apple-parchment);
  --foreground: var(--apple-ink);
  --card: var(--apple-canvas);
  --card-foreground: var(--apple-ink);
  --popover: var(--apple-canvas);
  --popover-foreground: var(--apple-ink);
  --primary: var(--apple-primary);
  --primary-foreground: var(--apple-on-dark);
  --secondary: var(--apple-pearl);
  --secondary-foreground: var(--apple-ink-muted-80);
  --muted: var(--apple-parchment);
  --muted-foreground: var(--apple-ink-muted-48);
  --accent: var(--apple-parchment);
  --accent-foreground: var(--apple-ink);
  --destructive: #cc0000;
  --destructive-foreground: #ffffff;
  --border: var(--apple-hairline);
  --input: var(--apple-hairline);
  --ring: var(--apple-primary-focus);

  /* Chart colors */
  --chart-1: var(--apple-primary);
  --chart-2: var(--apple-primary-on-dark);
  --chart-3: var(--apple-ink-muted-48);
  --chart-4: var(--apple-ink-muted-80);
  --chart-5: var(--apple-ink);

  /* Sidebar tokens → Apple aliases */
  --sidebar: var(--apple-parchment);
  --sidebar-foreground: var(--apple-ink);
  --sidebar-primary: var(--apple-primary);
  --sidebar-primary-foreground: var(--apple-on-dark);
  --sidebar-accent: var(--apple-pearl);
  --sidebar-accent-foreground: var(--apple-ink);
  --sidebar-border: var(--apple-hairline);
  --sidebar-ring: var(--apple-primary);

  /* Glass tokens */
  --glass-bg-light: rgba(245, 245, 247, 0.8);
  --glass-bg-dark: rgba(39, 39, 41, 0.8);
  --glass-blur: blur(20px);
  --glass-saturate: saturate(180%);

  /* Typography, spacing, shadows, etc. remain unchanged */
  /* ... (keep all existing non-color tokens) ... */
}
```

- [ ] **Step 2: Replace .dark Shadcn variables with Apple token aliases**

```css
.dark {
  /* Apple dark overrides */
  --apple-ink-muted-80: #cccccc;
  --apple-ink-muted-48: #999999;
  --apple-divider-soft: #3a3a3c;
  --apple-hairline: #3a3a3c;
  --apple-canvas: #2a2a2c;
  --apple-parchment: #272729;
  --apple-pearl: #252527;
  --apple-chip-translucent: #636366;
  --apple-on-dark: #ffffff;
  --apple-body-on-dark: #ffffff;
  --apple-body-muted: #cccccc;

  /* Shadcn semantic tokens → Apple dark aliases */
  --background: var(--apple-parchment);
  --foreground: var(--apple-on-dark);
  --card: var(--apple-canvas);
  --card-foreground: var(--apple-on-dark);
  --popover: var(--apple-canvas);
  --popover-foreground: var(--apple-on-dark);
  --primary: var(--apple-primary-on-dark);
  --primary-foreground: var(--apple-on-dark);
  --secondary: var(--apple-canvas);
  --secondary-foreground: var(--apple-body-muted);
  --muted: var(--apple-canvas);
  --muted-foreground: #999999;
  --accent: var(--apple-canvas);
  --accent-foreground: var(--apple-body-muted);
  --destructive: #ff4444;
  --destructive-foreground: #ffffff;
  --border: #3a3a3c;
  --input: #3a3a3c;
  --ring: var(--apple-primary-on-dark);

  /* Chart colors */
  --chart-1: var(--apple-primary-on-dark);
  --chart-2: var(--apple-primary);
  --chart-3: #999999;
  --chart-4: var(--apple-body-muted);
  --chart-5: var(--apple-on-dark);

  /* Sidebar tokens → Apple dark aliases */
  --sidebar: var(--apple-parchment);
  --sidebar-foreground: var(--apple-on-dark);
  --sidebar-primary: var(--apple-primary-on-dark);
  --sidebar-primary-foreground: var(--apple-on-dark);
  --sidebar-accent: var(--apple-canvas);
  --sidebar-accent-foreground: var(--apple-body-muted);
  --sidebar-border: #3a3a3c;
  --sidebar-ring: var(--apple-primary-on-dark);

  /* Glass tokens */
  --glass-bg-light: rgba(39, 39, 41, 0.8);
  --glass-bg-dark: rgba(39, 39, 41, 0.8);
}
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "refactor: unify Shadcn color variables as Apple token aliases"
```

---

### Task 5: Verify Phase 1 — build and visual check

**Files:** None (verification only)

- [ ] **Step 1: Build and verify**

```bash
docker-compose down && docker-compose up -d --build
```

Expected: Build succeeds, no errors. Main app loads with correct light/dark mode. Admin panel loads with correct light/dark mode. Both share the same theme state when navigating between them.

- [ ] **Step 2: Test dark mode toggle**

- Toggle dark mode in main app → verify `document.documentElement` has `dark` class
- Navigate to `/admin` → verify dark mode persists (same class on root)
- Toggle dark mode in admin → verify it affects the same `dark` class
- Navigate back to main app → verify dark mode persists

- [ ] **Step 3: Test prefers-color-scheme**

- Clear localStorage `theme` key
- Set system to dark mode
- Reload page → verify app starts in dark mode

- [ ] **Step 4: Commit if any fixes needed, otherwise proceed**

---

## Phase 2: 核心组件 Apple HIG 升级

### Task 6: Upgrade main page Header to Apple dual-layer navigation

**Files:**
- Modify: `app/page.tsx:507-749` (header bar, tab list, mobile tab bar)

- [ ] **Step 1: Replace the single glassmorphism header with Apple dual-layer nav**

Replace the current header (h-11 glass-nav) at line 512 with two layers:

**Global Nav (44px):**
```tsx
{/* Global Nav — Apple style */}
<div className={cn(
  "absolute top-0 left-0 right-0 z-30 transition-transform duration-300 ease-in-out pointer-events-none",
  isNavVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
)}>
  <div className="h-11 bg-apple-surface-black text-white flex items-center justify-between px-4 md:px-6 pointer-events-auto">
    {/* Left: Logo */}
    <div className="flex items-center gap-2">
      <button
        className="md:hidden text-white/80 hover:text-white rounded-full h-9 w-9 flex items-center justify-center active:scale-95"
        onClick={() => /* toggle mobile sidebar */}
      >
        <Menu className="w-4 h-4" />
      </button>
      <span className="text-xs font-regular tracking-tight select-none">AI读</span>
    </div>

    {/* Center: Search (desktop) */}
    <button className="hidden md:flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 px-4 py-1.5 text-xs text-white/70 active:scale-95 transition-colors">
      <Search className="w-3.5 h-3.5" />
      <span>搜索</span>
    </button>

    {/* Right: User + Settings */}
    <div className="flex items-center gap-1">
      <UserMenu />
    </div>
  </div>

  {/* Sub Nav Frosted — Apple style */}
  <div className="h-[52px] bg-[var(--glass-bg-light)] dark:bg-[var(--glass-bg-dark)] backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-border flex items-center justify-between px-4 md:px-6 pointer-events-auto">
    {/* Left: Book/Chapter name (mobile) or Sidebar toggle (desktop) */}
    <div className="flex items-center gap-2 min-w-0">
      <button
        className="hidden md:flex rounded-full text-foreground/60 hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 h-9 w-9 items-center justify-center"
        onClick={() => /* toggle desktop sidebar */}
      >
        <PanelLeft className="w-4 h-4" />
      </button>
      {/* Mobile: book/chapter picker */}
      <button
        className="md:hidden inline-flex items-center font-semibold text-[21px] tracking-[0.231px] text-foreground active:scale-95 truncate"
        onClick={() => /* toggle book picker */}
      >
        {currentBookName} {currentChapter}
      </button>
    </div>

    {/* Center: Tab pills (desktop only) */}
    <div className="hidden md:flex flex-1 items-center overflow-hidden mx-4 mask-linear-fade pl-2 min-w-0">
      {/* TabList component — existing tab rendering logic */}
    </div>

    {/* Right: Primary action */}
    <div className="flex items-center gap-2 shrink-0">
      <button
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-white text-[17px] font-regular tracking-[-0.374px] active:scale-95 transition-transform"
        onClick={() => /* toggle AI sidebar */}
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">AI</span>
      </button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Update mobile bottom tab bar to Apple frosted style**

At lines 746-749, update the mobile tab bar:
```tsx
<div className={cn(
  "md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--glass-bg-light)] dark:bg-[var(--glass-bg-dark)] backdrop-blur-[20px] backdrop-saturate-[180%] border-t border-border flex items-center px-2 z-50 pb-safe transition-transform duration-300 ease-in-out",
  isNavVisible ? "translate-y-0" : "translate-y-full"
)}>
  {/* Tab pills — existing tab rendering logic */}
</div>
```

- [ ] **Step 3: Adjust scroll container top padding**

The header is now 44px + 52px = 96px on desktop. Update the scroll container padding:
```tsx
className="flex-1 overflow-y-auto scroll-smooth pt-24 md:pt-[104px] pb-4 relative z-0"
```

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: upgrade main page header to Apple dual-layer navigation"
```

---

### Task 7: Upgrade Sidebar to Apple Book Browser

**Files:**
- Modify: `components/bible/Sidebar.tsx:162-247` (header, search, book list, chapter grid, bottom)

- [ ] **Step 1: Upgrade header to Apple sub-nav frosted style**

Replace the header at line 162:
```tsx
<div className="pt-6 pb-4 px-4 shrink-0 bg-[var(--glass-bg-light)] dark:bg-[var(--glass-bg-dark)] backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-border z-10 sticky top-0">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-1.5 bg-primary/10 rounded-lg">
      <BookOpen className="w-5 h-5 text-primary" />
    </div>
    <h2 className="text-[21px] font-semibold tracking-[0.231px] text-foreground select-none">圣经</h2>
  </div>
  {/* Search input */}
</div>
```

- [ ] **Step 2: Upgrade search input to Apple search-input style**

Replace the search input at line 177:
```tsx
<input
  type="text"
  placeholder="搜索书卷..."
  className="w-full bg-secondary dark:bg-apple-tile-3 text-foreground text-[17px] font-regular tracking-[-0.374px] leading-[1.47] rounded-full pl-10 pr-10 py-2.5 border-none focus:outline-none focus:ring-2 focus:ring-primary/30 h-[44px] transition-all placeholder:text-muted-foreground"
/>
```

- [ ] **Step 3: Upgrade book list items to Apple typography**

Replace book item button at lines 103-108:
```tsx
<button
  className={cn(
    "flex items-center justify-between w-full px-4 py-3 rounded-2xl transition-all duration-300 text-[17px] font-regular tracking-[-0.374px] leading-[1.47] min-h-[44px]",
    isActiveBook
      ? "bg-primary/10 text-primary font-semibold"
      : "text-foreground/80 hover:bg-secondary hover:text-foreground"
  )}
>
```

- [ ] **Step 4: Upgrade chapter grid to Apple configurator-option-chip style**

Replace chapter grid container at line 130:
```tsx
<div className="grid grid-cols-5 gap-2 p-3 bg-secondary dark:bg-apple-tile-3 rounded-apple-lg mx-1 border border-border">
```

Replace chapter button at lines 137-142:
```tsx
<button
  className={cn(
    "aspect-square flex items-center justify-center rounded-full text-[14px] font-regular tracking-[-0.224px] transition-all duration-300 min-h-[44px] min-w-[44px]",
    isActiveChapter
      ? "bg-primary text-white font-semibold"
      : "bg-card text-foreground/80 hover:bg-secondary active:scale-95 border border-border"
  )}
>
```

- [ ] **Step 5: Upgrade testament section dividers to Apple caption-strong**

Replace divider at lines 83-88:
```tsx
<div className="flex items-center gap-2 px-6 mb-3">
  <div className="h-[1px] flex-1 bg-border" />
  <span className="text-[14px] font-semibold tracking-[-0.224px] text-muted-foreground uppercase">{title}</span>
  <span className="text-[12px] font-regular tracking-[-0.12px] text-muted-foreground">{count}</span>
  <div className="h-[1px] flex-1 bg-border" />
</div>
```

- [ ] **Step 6: Commit**

```bash
git add components/bible/Sidebar.tsx
git commit -m "feat: upgrade Sidebar to Apple Book Browser style"
```

---

### Task 8: Upgrade Reader to Apple typography

**Files:**
- Modify: `components/bible/Reader.tsx:27-32,355-359,315,458,381-397,440-443` (highlights, heading, nav buttons, verse layout, summary button)

- [ ] **Step 1: Upgrade chapter heading to Apple display-md**

Replace heading at lines 355-359:
```tsx
<h2 className="text-[34px] font-semibold tracking-[-0.374px] leading-[1.47] text-foreground select-none text-center">
  {bookName} {chapter}
</h2>
```

- [ ] **Step 2: Upgrade verse number to Apple caption style**

Replace verse number at line 388:
```tsx
<span className={cn(
  "font-sans font-regular mr-4 select-none shrink-0 mt-[0.3em] transition-opacity duration-300 text-[14px] tracking-[-0.224px] leading-[1.43]",
  isSelected ? "text-primary opacity-100" : "text-muted-foreground group-hover/verse:text-foreground/70"
)}>
```

- [ ] **Step 3: Upgrade navigation buttons to Apple button-icon-circular**

Replace nav button at lines 315, 458:
```tsx
<button
  className="bg-[var(--apple-chip-translucent)]/64 dark:bg-white/10 p-[10px] rounded-full text-foreground hover:text-foreground active:scale-95 transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
>
  <ChevronLeft className="w-5 h-5" />
</button>
```

- [ ] **Step 4: Upgrade chapter summary button to Apple pill button**

Replace summary button at lines 440-443:
```tsx
<button
  className={cn(
    "group inline-flex items-center gap-2.5 px-[22px] py-[11px] rounded-full",
    "bg-primary hover:bg-apple-focus text-white font-regular text-[17px] tracking-[-0.374px]",
    "transition-all duration-300 active:scale-95"
  )}
>
```

- [ ] **Step 5: Commit**

```bash
git add components/bible/Reader.tsx
git commit -m "feat: upgrade Reader to Apple typography and button styles"
```

---

### Task 9: Upgrade AISidebar to Apple conversation UI

**Files:**
- Modify: `components/bible/AISidebar.tsx:673-678,690-693,719-725` (container, header, mode selector)
- Modify: `components/bible/MessageList.tsx:125-130` (message bubbles)
- Modify: `components/bible/AIInputForm.tsx:25-65` (input form)
- Modify: `components/bible/QuickPrompts.tsx:83-137` (quick prompt chips)

- [ ] **Step 1: Upgrade AISidebar header to Apple sub-nav frosted**

Replace header at lines 690-693:
```tsx
<div className={cn(
  "flex items-center justify-between px-4 bg-[var(--glass-bg-light)] dark:bg-[var(--glass-bg-dark)] backdrop-blur-[20px] backdrop-saturate-[180%] flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-b border-border",
  isImmersive ? "h-0 opacity-0 border-none p-0" : "h-[52px] opacity-100 py-3"
)}>
```

- [ ] **Step 2: Upgrade AI mode selector to Apple pearl-capsule buttons**

Replace mode selector button at lines 719-725:
```tsx
<button
  className={cn(
    "flex items-center gap-1 px-3.5 py-2 rounded-apple-md text-[14px] font-regular tracking-[-0.224px] transition-colors min-h-[44px]",
    aiMode === item.mode
      ? "bg-apple-pearl text-foreground font-semibold border border-[var(--apple-divider-soft)]"
      : "text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
  )}
>
```

- [ ] **Step 3: Upgrade user message bubble to Apple pill style**

In `MessageList.tsx`, replace user bubble at lines 127-130:
```tsx
<div className={cn(
  'relative transition-all',
  role === 'user'
    ? 'max-w-[88%] rounded-apple-lg rounded-tr-apple-xs px-4 py-3 bg-primary text-white text-[17px] font-regular tracking-[-0.374px] leading-[1.47]'
    : 'w-full'
)}>
```

- [ ] **Step 4: Upgrade input form to Apple search-input style**

In `AIInputForm.tsx`, replace textarea at line 29:
```tsx
<textarea
  className="flex-1 px-5 py-3 pr-12 border border-[rgba(0,0,0,0.08)] dark:border-[var(--apple-hairline)] rounded-full text-[17px] font-regular tracking-[-0.374px] leading-[1.47] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-secondary dark:bg-card dark:text-foreground focus:bg-card resize-none max-h-32 min-h-[44px]"
/>
```

- [ ] **Step 5: Upgrade quick prompts to Apple configurator chips**

In `QuickPrompts.tsx`, replace chip buttons at lines 114, 124:
```tsx
<button
  className="flex items-center gap-1.5 px-4 py-3 rounded-full text-[14px] font-regular tracking-[-0.224px] border border-border transition-all active:scale-95 bg-card text-foreground/80 whitespace-nowrap shrink-0 hover:bg-accent min-h-[44px]"
>
```

- [ ] **Step 6: Commit**

```bash
git add components/bible/AISidebar.tsx components/bible/MessageList.tsx components/bible/AIInputForm.tsx components/bible/QuickPrompts.tsx
git commit -m "feat: upgrade AISidebar to Apple conversation UI style"
```

---

### Task 10: Simplify MagicBall to Apple icon-circular

**Files:**
- Modify: `components/bible/MagicBall.tsx:609-619` (inner ball circle, state rings)

- [ ] **Step 1: Replace MagicBall visual with Apple icon-circular**

Replace the inner ball circle at lines 609-619:
```tsx
<div
  className={cn(
    "relative w-full h-full rounded-full transition-all duration-300",
    // Apple icon-circular: translucent chip background
    "bg-[var(--apple-chip-translucent)]/64 dark:bg-white/10",
    // State rings — subtle Apple style
    isRepositioning ? "ring-4 ring-primary/30 scale-110" :
    isAiFinishedButUnseen ? "ring-2 ring-primary/40" :
    isQueuePanelOpen ? "ring-2 ring-primary/40" :
    isAiGenerating ? "ring-2 ring-primary/20 animate-pulse" :
    hasQueueContent ? "ring-2 ring-primary/20" :
    isAiOpen ? "ring-2 ring-primary/15" : ""
  )}
>
  {/* Icon — Apple ink color */}
  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none text-foreground">
    {getIcon()}
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add components/bible/MagicBall.tsx
git commit -m "feat: simplify MagicBall to Apple icon-circular style"
```

---

### Task 11: Verify Phase 2 — build and visual check

**Files:** None (verification only)

- [ ] **Step 1: Build and verify**

```bash
docker-compose down && docker-compose up -d --build
```

Expected: Build succeeds. All 5 core components render with Apple HIG styling in both light and dark modes. Mobile and desktop layouts work correctly.

- [ ] **Step 2: Visual checklist**
- Global Nav: 44px black bar with logo, search, user menu
- Sub Nav: 52px frosted bar with book name, tab pills, AI button
- Sidebar: parchment bg, pill search, Apple typography book list, pill chapter buttons
- Reader: 34px heading, 14px verse numbers, 44px circular nav buttons, pill summary button
- AISidebar: frosted header, pearl-capsule mode selector, pill message bubbles, pill input
- MagicBall: translucent chip bg, ink icon, subtle ring states

- [ ] **Step 3: Commit any fixes, otherwise proceed**

---

## Phase 3: Admin 后台全面升级

### Task 12: Upgrade AdminLayout to Apple dual-layer navigation

**Files:**
- Modify: `components/admin/AdminLayout.tsx:65-187` (full layout restructure)

- [ ] **Step 1: Replace AdminLayout with Apple dual-layer nav + icon rail sidebar**

Replace the entire component structure:

```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Icon Rail Sidebar — Apple style */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-16 lg:w-16 flex flex-col bg-card border-r border-border transition-transform duration-300 ease-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo area */}
        <div className="h-11 flex items-center justify-center border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-apple-sm flex items-center justify-center text-white text-sm font-semibold">AI</div>
            {sidebarOpen && <span className="text-[17px] font-semibold tracking-[-0.374px] text-foreground">管理后台</span>}
          </Link>
          {sidebarOpen && (
            <button className="ml-auto lg:hidden p-2 rounded-full hover:bg-accent" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav items — icon rail */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 min-h-[44px] rounded-apple-md transition-all duration-150 active:scale-95",
                pathname === item.href
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {(sidebarOpen || pathname === item.href) && (
                <span className="text-[14px] font-regular tracking-[-0.224px] truncate">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 min-h-[44px] rounded-apple-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
            <ArrowLeft className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-[14px]">返回主站</span>}
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Nav — Apple style */}
        <div className="h-11 bg-apple-surface-black text-white flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-2">
            <button className="lg:hidden text-white/80 hover:text-white rounded-full h-9 w-9 flex items-center justify-center active:scale-95" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-xs font-regular tracking-tight">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all duration-150" aria-label="切换深色模式">
              {theme === "dark" ? <Sun className="w-5 h-5 text-white/70" /> : <Moon className="w-5 h-5 text-white/70" />}
            </button>
          </div>
        </div>

        {/* Sub Nav Frosted — Apple style */}
        <div className="h-[52px] bg-[var(--glass-bg-light)] dark:bg-[var(--glass-bg-dark)] backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-border flex items-center px-4 lg:px-6 shrink-0">
          <span className="text-[21px] font-semibold tracking-[0.231px] text-foreground">{activePageLabel}</span>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/AdminLayout.tsx
git commit -m "feat: upgrade AdminLayout to Apple dual-layer nav with icon rail"
```

---

### Task 13: Create ResponsiveTable shared component

**Files:**
- Create: `components/admin/ResponsiveTable.tsx`

- [ ] **Step 1: Create ResponsiveTable component**

```tsx
// components/admin/ResponsiveTable.tsx
"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  renderMobile?: (item: T) => ReactNode;
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = "暂无数据",
  onRowClick,
}: ResponsiveTableProps<T>) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-card rounded-apple-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="bg-accent/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-6 py-3 text-left text-[12px] font-semibold tracking-[-0.12px] text-muted-foreground uppercase",
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground text-[17px]">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    className={cn(
                      "transition-colors",
                      onRowClick && "cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-6 py-4 text-[17px] font-regular tracking-[-0.374px]", col.className)}>
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.length === 0 ? (
          <div className="bg-card rounded-apple-lg border border-border p-8 text-center text-muted-foreground text-[17px]">
            {emptyMessage}
          </div>
        ) : (
          data.map((item) => (
            <div
              key={keyExtractor(item)}
              className={cn(
                "bg-card rounded-apple-lg border border-border p-4 min-h-[44px]",
                onRowClick && "cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <div key={col.key}>
                  {col.renderMobile ? col.renderMobile(item) : col.render(item)}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/ResponsiveTable.tsx
git commit -m "feat: add ResponsiveTable shared component for admin pages"
```

---

### Task 14: Upgrade Admin Dashboard to Apple product-tile style

**Files:**
- Modify: `app/admin/page.tsx:107-370` (stats cards, charts, stat items)

- [ ] **Step 1: Upgrade stats cards to Apple store-utility-card style**

Replace StatCard component (lines 321-345):
```tsx
function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-card rounded-apple-lg border border-border p-6 min-h-[44px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-regular tracking-[-0.224px] text-muted-foreground">{label}</p>
          <p className="text-[40px] font-semibold tracking-[0] text-foreground mt-1">{value}</p>
        </div>
        <div className={cn("w-11 h-11 rounded-apple-sm flex items-center justify-center", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Upgrade chart cards to Apple store-utility-card**

Replace chart card containers — change `rounded-lg border border-border p-6` to:
```tsx
<div className="bg-card rounded-apple-lg border border-border p-6">
```

- [ ] **Step 3: Upgrade StatItem to Apple style**

Replace StatItem (lines 348-370):
```tsx
function StatItem({ label, value, variant = "default" }: StatItemProps) {
  return (
    <div className={cn(
      "text-center p-4 rounded-apple-md",
      variant === "default" && "bg-accent",
      variant === "green" && "bg-emerald-50 dark:bg-emerald-900/20",
      variant === "blue" && "bg-primary/5",
      variant === "orange" && "bg-amber-50 dark:bg-amber-900/20",
      variant === "muted" && "bg-secondary"
    )}>
      <p className="text-[32px] font-semibold tracking-[0] text-foreground">{value}</p>
      <p className="text-[14px] font-regular tracking-[-0.224px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: upgrade Admin Dashboard to Apple store-utility-card style"
```

---

### Task 15: Upgrade Admin Users page with ResponsiveTable

**Files:**
- Modify: `app/admin/users/page.tsx:185-462` (search bar, table/cards, pagination, mute dialog)

- [ ] **Step 1: Replace dual rendering with ResponsiveTable**

Replace the desktop table (lines 217-319) and mobile cards (lines 321-400) with:
```tsx
<ResponsiveTable
  data={filteredUsers}
  keyExtractor={(u) => u.id}
  columns={[
    {
      key: "user",
      header: t("admin.user"),
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-full" />
          <div>
            <p className="text-[17px] font-semibold tracking-[-0.374px] text-foreground">{u.name}</p>
            <p className="text-[14px] font-regular tracking-[-0.224px] text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
      renderMobile: (u) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-semibold tracking-[-0.374px] text-foreground truncate">{u.name}</p>
            <p className="text-[14px] font-regular tracking-[-0.224px] text-muted-foreground truncate">{u.email}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {/* Role badge + Muted badge */}
          </div>
        </div>
      ),
    },
    // ... other columns
  ]}
/>
```

- [ ] **Step 2: Upgrade search bar to Apple search-input style**

Replace search input with pill shape:
```tsx
<input
  type="text"
  placeholder={t("admin.searchUsers")}
  className="flex-1 bg-secondary text-foreground text-[17px] font-regular tracking-[-0.374px] rounded-full px-5 py-2.5 border-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px] placeholder:text-muted-foreground"
/>
```

- [ ] **Step 3: Upgrade filter chips to Apple configurator style**

Replace select/filter buttons with pill chips:
```tsx
<button className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-regular tracking-[-0.224px] border border-border bg-card text-foreground/80 hover:bg-accent active:scale-95 transition-all min-h-[44px]">
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/users/page.tsx
git commit -m "feat: upgrade Admin Users page with ResponsiveTable and Apple styles"
```

---

### Task 16: Upgrade Admin Messages page with ResponsiveTable

**Files:**
- Modify: `app/admin/messages/page.tsx:197-583` (tabs, tables, compose modal)

- [ ] **Step 1: Replace dual rendering with ResponsiveTable for Send tab**

Same pattern as Task 15 — replace `hidden md:block` table and `md:hidden` cards with `<ResponsiveTable>`.

- [ ] **Step 2: Replace dual rendering with ResponsiveTable for History tab**

Same replacement pattern.

- [ ] **Step 3: Upgrade compose modal to Apple dialog style**

Replace modal container:
```tsx
<div className="bg-card rounded-apple-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
  {/* Sticky header */}
  <div className="sticky top-0 bg-[var(--glass-bg-light)] dark:bg-[var(--glass-bg-dark)] backdrop-blur-[20px] backdrop-saturate-[180%] px-6 py-4 border-b border-border flex items-center justify-between">
    <h3 className="text-[21px] font-semibold tracking-[0.231px] text-foreground">发送消息</h3>
    <button className="w-11 h-11 rounded-full hover:bg-accent flex items-center justify-center active:scale-95">
      <X className="w-4 h-4" />
    </button>
  </div>
  {/* Form inputs: Apple search-input style */}
  {/* Footer: Apple pill buttons */}
  <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end gap-3">
    <button className="px-[22px] py-[11px] rounded-full border border-primary text-primary text-[17px] font-regular tracking-[-0.374px] active:scale-95 transition-transform">取消</button>
    <button className="px-[22px] py-[11px] rounded-full bg-primary text-white text-[17px] font-regular tracking-[-0.374px] active:scale-95 transition-transform">发送</button>
  </div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/messages/page.tsx
git commit -m "feat: upgrade Admin Messages page with ResponsiveTable and Apple dialog"
```

---

### Task 17: Upgrade Admin Churches page

**Files:**
- Modify: `app/admin/churches/page.tsx:95-213` (search bar, card grid, pagination)

- [ ] **Step 1: Upgrade search bar to Apple search-input style**

Replace search input with pill shape (same as Task 15 Step 2).

- [ ] **Step 2: Upgrade church cards to Apple store-utility-card style**

Replace card:
```tsx
<div className="bg-card rounded-apple-lg border border-border overflow-hidden hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
  <div className="h-2" style={{ backgroundColor: church.themeColor || 'var(--primary)' }} />
  <div className="p-6">
    <div className="flex items-center gap-2 mb-2">
      <h3 className="text-[17px] font-semibold tracking-[-0.374px] text-foreground truncate">{church.name}</h3>
      <Badge variant={church.isPublic ? "info" : "warning"}>{church.isPublic ? "公开" : "私有"}</Badge>
    </div>
    <p className="text-[14px] font-regular tracking-[-0.224px] text-muted-foreground line-clamp-2 mb-3">{church.description}</p>
    <div className="flex items-center gap-4 text-[14px] font-regular tracking-[-0.224px] text-muted-foreground">
      <span>{church.memberCount} 成员</span>
      <span>{church.planCount} 计划</span>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/churches/page.tsx
git commit -m "feat: upgrade Admin Churches page to Apple store-utility-card style"
```

---

### Task 18: Upgrade Admin Announcements page

**Files:**
- Modify: `app/admin/announcements/page.tsx:182-384` (list, form modal)

- [ ] **Step 1: Upgrade announcement cards to Apple style**

Replace card container:
```tsx
<div className={cn(
  "bg-card rounded-apple-lg border border-border p-4 transition-colors min-h-[44px]",
  !announcement.isActive && "opacity-60"
)}>
```

- [ ] **Step 2: Upgrade action buttons to Apple pearl-capsule**

Replace action buttons:
```tsx
<button className="p-2.5 rounded-apple-md min-h-[44px] min-w-[44px] flex items-center justify-center bg-apple-pearl text-ink-muted-80 hover:bg-accent active:scale-95 transition-all">
```

- [ ] **Step 3: Upgrade form modal to Apple dialog style**

Same pattern as Task 16 Step 3 — Apple frosted header, pill inputs, pill buttons.

- [ ] **Step 4: Commit**

```bash
git add app/admin/announcements/page.tsx
git commit -m "feat: upgrade Admin Announcements page to Apple style"
```

---

### Task 19: Upgrade Admin Feedback page

**Files:**
- Modify: `components/admin/FeedbackAdminPanel.tsx:233-529` (stats, filters, list, detail modal)

- [ ] **Step 1: Upgrade stats cards to Apple style**

Replace stats card grid (lines 233-249):
```tsx
<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
  {stats.map((stat) => (
    <div key={stat.key} className="bg-card rounded-apple-lg border border-border p-4 min-h-[44px]">
      <p className="text-[32px] font-semibold tracking-[0] text-foreground">{stat.value}</p>
      <p className="text-[14px] font-regular tracking-[-0.224px] text-muted-foreground">{stat.label}</p>
    </div>
  ))}
</div>
```

- [ ] **Step 2: Upgrade filter bar to Apple search-input + pill chips**

Same pattern as Task 15 Steps 2-3.

- [ ] **Step 3: Upgrade detail modal to Apple dialog style**

Same pattern as Task 16 Step 3.

- [ ] **Step 4: Commit**

```bash
git add components/admin/FeedbackAdminPanel.tsx
git commit -m "feat: upgrade Admin Feedback panel to Apple style"
```

---

### Task 20: Upgrade Admin Settings page with ResponsiveTable

**Files:**
- Modify: `app/admin/settings/page.tsx:131-250` (filter bar, table, pagination)

- [ ] **Step 1: Add mobile card fallback with ResponsiveTable**

This page currently has NO mobile fallback. Replace the raw table with ResponsiveTable, providing `renderMobile` for each column that shows key info in a stacked card layout.

- [ ] **Step 2: Upgrade filter bar to Apple pill chips**

Replace the non-responsive `flex gap-4` filter bar with responsive `flex flex-col sm:flex-row gap-3` + pill chip buttons.

- [ ] **Step 3: Commit**

```bash
git add app/admin/settings/page.tsx
git commit -m "feat: upgrade Admin Settings page with ResponsiveTable and mobile support"
```

---

### Task 21: Verify Phase 3 — build and full visual check

**Files:** None (verification only)

- [ ] **Step 1: Build and verify**

```bash
docker-compose down && docker-compose up -d --build
```

Expected: Build succeeds. All Admin pages render with Apple HIG styling. ResponsiveTable works on both desktop and mobile. Dark mode works consistently across main app and admin.

- [ ] **Step 2: Admin visual checklist**
- AdminLayout: 44px black global nav + 52px frosted sub-nav + icon rail sidebar
- Dashboard: Apple store-utility-card stats, rounded-apple-lg chart cards
- Users: ResponsiveTable with pill search + pill filter chips
- Messages: ResponsiveTable + Apple dialog compose modal
- Churches: Apple store-utility-card church cards
- Announcements: Apple cards + pearl-capsule action buttons + Apple dialog
- Feedback: Apple stats cards + pill filters + Apple detail modal
- Settings: ResponsiveTable with mobile card fallback + pill filter chips

- [ ] **Step 3: Cross-cutting checks**
- Dark mode toggle works in both main app and admin
- Mobile responsive: all admin pages work on phone width
- 44px touch targets on all interactive elements
- No visual regressions in main app

- [ ] **Step 4: Final commit if fixes needed**

---

### Task 22: Deploy — run auto_deploy.sh

**Files:** None (deployment only)

- [ ] **Step 1: Run auto_deploy**

```bash
./auto_deploy.sh -s "feat: Apple HIG 全面 UI 升级 — Phase 1-3完成" -d "统一ThemeProvider消除双暗色模式，Shadcn色彩变量映射为Apple token别名，主应用Header升级为Apple双层导航，Sidebar升级为Apple书目浏览器，Reader升级为Apple排版，AISidebar升级为Apple对话界面，MagicBall简化为Apple icon-circular，Admin后台全面升级为Apple HIG风格（双层导航+icon rail侧边栏+ResponsiveTable+store-utility-card统计卡片+pill按钮/输入框），移动端响应式全面支持"
```