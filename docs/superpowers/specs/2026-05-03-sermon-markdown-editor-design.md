# Sermon Editor Upgrade: Obsidian-like Markdown Editor

**Date**: 2026-05-03
**Status**: Approved

## Overview

Upgrade the sermon editor from a Tiptap WYSIWYG editor to an Obsidian-like Markdown editor with seamless live preview, auto-save, and undo/redo. The new editor uses CodeMirror 6 as the editing engine with inline Markdown rendering via decorations.

## Requirements

1. **Obsidian-like editing**: Seamless live preview where Markdown renders inline, with raw source revealed on cursor focus
2. **Auto-save**: Debounced save (1500ms) with visual status indicator
3. **Undo/Redo**: CodeMirror built-in history with toolbar buttons and keyboard shortcuts
4. **Custom blocks**: Bible verse blocks and sermon section headings as fenced code blocks
5. **Data migration**: Convert existing Tiptap JSON content to Markdown storage

## Architecture

### Stack

- **Editor**: CodeMirror 6 (`@codemirror/view`, `@codemirror/state`, `@codemirror/lang-markdown`, etc.)
- **Markdown rendering**: `react-markdown` + `remark-gfm` (already in project)
- **React integration**: `@uiw/react-codemirror` for React wrapper
- **Custom syntax**: CodeMirror extensions for `verse` and `section` fenced blocks

### Component Structure

```
components/sermon/
├── CodeMirrorEditor.tsx      # Replaces TipTapEditor.tsx
├── EditorToolbar.tsx          # Replaces TipTapMenuBar.tsx
├── extensions/
│   ├── verseBlock.ts          # CodeMirror extension for ```verse blocks
│   ├── sectionBlock.ts        # CodeMirror extension for ```section blocks
│   └── livePreview.ts         # Cursor-aware decoration extension
├── SermonEditor.tsx           # Updated orchestrator (unchanged layout)
├── SermonEditorContext.tsx    # Updated context (Markdown content)
├── SermonEditorHeader.tsx     # Updated header (save status)
└── ... (other components unchanged)
```

### Data Flow

```
User types → CodeMirror onChange → debounce 1500ms →
  update Zustand store → API PUT /api/sermon/[id]/save →
  PostgreSQL (content field stores Markdown string)
```

## Seamless Live Preview

### Mechanism

Uses CodeMirror's **WidgetDecoration** system:

1. A `StateField` tracks the cursor position and identifies the "active block"
2. A `DecorationSet` is computed from the document: each block that is NOT the active block gets a WidgetDecoration that replaces the source with rendered HTML
3. When the cursor enters a block, its decoration is removed, revealing the raw Markdown source
4. Transitions use CSS animations for smoothness

### Rendering Pipeline

```
Markdown source → remark parser → rehype → styled HTML → CodeMirror WidgetDecoration
```

### Custom Block Rendering

**Verse blocks** render as styled cards:
```
┌─────────────────────────────┐
│ 📖 John 3:16                │
│ For God so loved the world, │
│ that he gave his only...    │
└─────────────────────────────┘
```

**Section blocks** render as colored headings:
```
━━ Introduction ━━━━━━━━━━━━━━
```

## Custom Markdown Syntax

### Verse Blocks

````markdown
```verse:John 3:16
For God so loved the world, that he gave his only begotten Son...
```
````

### Section Blocks

````markdown
```section:introduction
## Introduction
Begin with a powerful opening...
```
````

Section types: `introduction`, `main_point`, `sub_point`, `illustration`, `application`, `conclusion`, `prayer`

## Auto-Save

- **Debounce**: 1500ms after last keystroke
- **Trigger**: CodeMirror `onChange` event
- **Flow**: `onChange → debounce → update Zustand store → API PUT /api/sermon/[id]/save`
- **Visual indicator**: Header shows "Saving..." / "Saved" / "Error"
- **Conflict handling**: Optimistic concurrency via version check (existing mechanism)
- **Undo interaction**: Auto-save does NOT clear undo history

## Undo/Redo

- **Engine**: CodeMirror 6 built-in `history` extension
- **Keyboard shortcuts**: `Ctrl+Z`/`Cmd+Z` (undo), `Ctrl+Shift+Z`/`Cmd+Shift+Z` (redo)
- **Toolbar buttons**: Undo/Redo icons, disabled when history is empty
- **Config**: `newGroupDelay: 500ms`, `minDepth: 100`

## Toolbar

Layout (left to right):
- **Undo / Redo** buttons
- **Separator**
- **Formatting**: Bold, Italic, Strikethrough, H1, H2, H3
- **Separator**
- **Lists**: Bullet List, Ordered List, Blockquote
- **Separator**
- **Insert**: Verse Block, Section Heading, Horizontal Rule
- **Separator**
- **Mode toggle**: Source mode / Live preview mode

## Data Migration

### One-time Migration Script

`scripts/migrate_sermons_to_markdown.ts`:
1. Fetch all sermons from DB
2. For each sermon with Tiptap JSON content (starts with `{`):
   - Create a `SermonVersion` snapshot (safety net)
   - Convert Tiptap JSON → Markdown using custom serializer
   - Handle custom nodes: VerseBlock → `verse` fenced blocks, SectionHeading → `section` fenced blocks
   - Update `content` field with Markdown string
3. Log conversion results

### On-load Fallback

In the editor component:
- If loaded content starts with `{` (Tiptap JSON), convert on-the-fly to Markdown
- Log a warning for monitoring
- This handles edge cases the migration script misses

### API Changes

- **Save endpoint**: Accepts Markdown strings (no longer Tiptap JSON)
- **Export endpoint**: Reads Markdown directly (simpler conversion)
- **Excerpt generation**: First ~200 chars of plain text from Markdown

## Packages to Add

```json
{
  "@uiw/react-codemirror": "^4.x",
  "@codemirror/lang-markdown": "^6.x",
  "@codemirror/language-data": "^6.x",
  "@codemirror/commands": "^6.x",
  "@codemirror/autocomplete": "^6.x",
  "@codemirror/search": "^6.x",
  "remark": "^15.x",
  "rehype": "^13.x"
}
```

Note: `@uiw/react-codemirror` bundles `@codemirror/view`, `@codemirror/state`, and other core packages.

## Packages to Remove

```json
{
  "@tiptap/react": "removed",
  "@tiptap/starter-kit": "removed",
  "@tiptap/pm": "removed",
  "@tiptap/extension-placeholder": "removed"
}
```

Note: Keep `react-markdown` and `remark-gfm` (already in project, used elsewhere).

## Files to Create

- `components/sermon/CodeMirrorEditor.tsx`
- `components/sermon/EditorToolbar.tsx`
- `components/sermon/extensions/verseBlock.ts`
- `components/sermon/extensions/sectionBlock.ts`
- `components/sermon/extensions/livePreview.ts`
- `scripts/migrate_sermons_to_markdown.ts`
- `lib/tiptap-to-markdown.ts` (migration serializer)

## Files to Modify

- `components/sermon/SermonEditor.tsx` - Replace TipTapEditor with CodeMirrorEditor
- `components/sermon/SermonEditorContext.tsx` - Update content type handling
- `components/sermon/SermonEditorHeader.tsx` - Update save status logic
- `store/slices.ts` - Update AISlice content handling
- `app/api/sermon/[id]/save/route.ts` - Accept Markdown content
- `app/api/sermon/[id]/export/route.ts` - Read Markdown directly
- `package.json` - Add/remove packages

## Files to Delete

- `components/sermon/TipTapEditor.tsx`
- `components/sermon/TipTapMenuBar.tsx`
- `components/sermon/extensions/VerseBlock.ts` (Tiptap extension)
- `components/sermon/extensions/SectionHeading.ts` (Tiptap extension)

## Testing

- Unit tests for Tiptap JSON → Markdown converter
- Unit tests for custom syntax parsing (verse/section blocks)
- Integration test for auto-save flow
- Integration test for undo/redo behavior
- E2E test for creating and editing a sermon
