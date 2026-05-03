# Sermon Markdown Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Tiptap WYSIWYG sermon editor with a CodeMirror 6-based Markdown editor featuring Obsidian-like seamless live preview, auto-save, and undo/redo.

**Architecture:** CodeMirror 6 handles editing with custom extensions for verse/section fenced blocks and cursor-aware live preview decorations. Markdown is stored directly in the database (replacing Tiptap JSON). A migration utility converts existing content on load.

**Tech Stack:** CodeMirror 6, @uiw/react-codemirror, react-markdown, remark-gfm, rehype

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `components/sermon/CodeMirrorEditor.tsx` | CodeMirror 6 React wrapper with all extensions |
| `components/sermon/EditorToolbar.tsx` | Formatting toolbar with undo/redo and Markdown actions |
| `components/sermon/extensions/verseBlock.ts` | CodeMirror extension: syntax highlighting + preview for `verse` fenced blocks |
| `components/sermon/extensions/sectionBlock.ts` | CodeMirror extension: syntax highlighting + preview for `section` fenced blocks |
| `components/sermon/extensions/livePreview.ts` | CodeMirror extension: cursor-aware WidgetDecoration for inline Markdown rendering |
| `components/sermon/extensions/theme.ts` | CodeMirror custom theme matching the app's dark/light mode |
| `lib/tiptap-to-markdown.ts` | Tiptap JSON → Markdown converter for migration |
| `lib/sermon-markdown.ts` | Markdown utility: parse verse/section blocks, generate excerpts |

### Modified Files

| File | Change |
|------|--------|
| `components/sermon/SermonEditor.tsx` | Replace Tiptap with CodeMirrorEditor + EditorToolbar |
| `components/sermon/SermonEditorContext.tsx` | Update content type from Tiptap JSON to Markdown string |
| `components/sermon/SermonEditorHeader.tsx` | Update save status to work with Markdown content |
| `components/sermon/SermonAIPanel.tsx` | Update AI insert to use Markdown syntax instead of Tiptap commands |
| `store/slices/sermonSlice.ts` | Update content field handling for Markdown strings |
| `store/types.ts` | Update SermonSlice type for Markdown content |
| `app/api/sermon/route.ts` | Accept Markdown content in PUT, add Tiptap JSON → Markdown conversion on load |
| `package.json` | Add CodeMirror packages, remove Tiptap packages |

### Deleted Files

| File | Reason |
|------|--------|
| (none - Tiptap code is inline in SermonEditor.tsx, not separate files) | |

---

## Task 1: Install CodeMirror Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
cd /opt/data1/public/software/systools/bibleAI/scripture-ai
npm install @uiw/react-codemirror @codemirror/lang-markdown @codemirror/language-data @codemirror/commands @codemirror/autocomplete @codemirror/search
```

- [ ] **Step 2: Remove Tiptap packages**

```bash
npm uninstall @tiptap/react @tiptap/starter-kit @tiptap/pm @tiptap/extension-placeholder @tiptap/extension-highlight
```

- [ ] **Step 3: Verify build still works (expect type errors in SermonEditor - that's OK)**

```bash
npm run build 2>&1 | head -50
```

Expected: Build may fail due to missing Tiptap imports in SermonEditor.tsx - this is expected and will be fixed in later tasks.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add CodeMirror 6 deps, remove Tiptap deps"
```

---

## Task 2: Create Tiptap JSON → Markdown Converter

**Files:**
- Create: `lib/tiptap-to-markdown.ts`
- Create: `lib/sermon-markdown.ts`

This task creates the migration utility first, so we can test it independently before touching the editor.

- [ ] **Step 1: Create `lib/sermon-markdown.ts` - Markdown utility functions**

```typescript
/**
 * Sermon Markdown utilities
 * Handles parsing and generating sermon-specific Markdown syntax
 */

/** Verse block parsed from ```verse:Reference ... ``` */
export interface VerseBlock {
  type: 'verse';
  reference: string;
  text: string;
}

/** Section block parsed from ```section:type ... ``` */
export interface SectionBlock {
  type: 'section';
  sectionType: string;
  content: string;
}

export type SermonBlock = VerseBlock | SectionBlock;

/** Section types for sermon sections */
export const SECTION_TYPES = [
  'introduction',
  'main_point',
  'sub_point',
  'illustration',
  'application',
  'conclusion',
  'prayer',
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

/** Generate a verse fenced block */
export function generateVerseBlock(reference: string, text: string): string {
  return `\`\`\`verse:${reference}\n${text}\n\`\`\``;
}

/** Generate a section fenced block */
export function generateSectionBlock(sectionType: SectionType, content: string): string {
  return `\`\`\`section:${sectionType}\n${content}\n\`\`\``;
}

/** Parse a verse fenced block, returns null if not a verse block */
export function parseVerseBlock(line: string): { reference: string } | null {
  const match = line.match(/^```verse:(.+)$/);
  if (!match) return null;
  return { reference: match[1].trim() };
}

/** Parse a section fenced block, returns null if not a section block */
export function parseSectionBlock(line: string): { sectionType: string } | null {
  const match = line.match(/^```section:(.+)$/);
  if (!match) return null;
  return { sectionType: match[1].trim() };
}

/** Generate excerpt from Markdown content (first ~200 chars of plain text) */
export function generateExcerpt(markdown: string, maxLength: number = 200): string {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, '') // remove fenced blocks
    .replace(/#{1,6}\s+/g, '')       // remove headings
    .replace(/\*\*|__|_|\*|~~/g, '') // remove emphasis
    .replace(/>\s+/g, '')             // remove blockquotes
    .replace(/[-*+]\s+/g, '')         // remove list markers
    .replace(/\d+\.\s+/g, '')         // remove ordered list markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links to text
    .replace(/\n{2,}/g, ' ')          // double newlines to space
    .replace(/\n/g, ' ')              // single newlines to space
    .trim();

  if (plainText.length <= maxLength) return plainText;
  return plainText.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

/** Check if content is Tiptap JSON (starts with '{') */
export function isTiptapJson(content: string): boolean {
  return content.trimStart().startsWith('{');
}
```

- [ ] **Step 2: Create `lib/tiptap-to-markdown.ts` - Tiptap JSON converter**

```typescript
/**
 * Tiptap JSON → Markdown converter
 * Converts Tiptap ProseMirror JSON to sermon Markdown format
 */

import { generateVerseBlock, generateSectionBlock } from './sermon-markdown';

interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

interface TiptapDoc {
  type: string;
  content?: TiptapNode[];
}

/** Convert a Tiptap JSON document to Markdown string */
export function tiptapToMarkdown(json: string | TiptapDoc): string {
  let doc: TiptapDoc;
  if (typeof json === 'string') {
    try {
      doc = JSON.parse(json);
    } catch {
      return json; // Not valid JSON, return as-is
    }
  } else {
    doc = json;
  }

  if (!doc.content) return '';
  return doc.content.map(node => convertNode(node)).join('\n\n');
}

/** Convert a single Tiptap node to Markdown */
function convertNode(node: TiptapNode, indent: number = 0): string {
  switch (node.type) {
    case 'doc':
      return node.content ? node.content.map(n => convertNode(n)).join('\n\n') : '';

    case 'heading': {
      const level = (node.attrs?.level as number) || 1;
      const text = extractText(node);
      return `${'#'.repeat(level)} ${text}`;
    }

    case 'paragraph': {
      const text = convertInlineContent(node);
      return text || '';
    }

    case 'bulletList': {
      return node.content
        ? node.content.map(n => convertNode(n, indent)).join('\n')
        : '';
    }

    case 'orderedList': {
      return node.content
        ? node.content.map((n, i) => convertListItem(n, i + 1, indent)).join('\n')
        : '';
    }

    case 'listItem': {
      return convertListItem(node, undefined, indent);
    }

    case 'blockquote': {
      const text = node.content
        ? node.content.map(n => convertNode(n)).join('\n')
        : '';
      return text.split('\n').map(l => `> ${l}`).join('\n');
    }

    case 'horizontalRule':
      return '---';

    case 'verseBlock': {
      const reference = (node.attrs?.reference as string) || '';
      const text = (node.attrs?.text as string) || extractText(node);
      return generateVerseBlock(reference, text);
    }

    case 'sectionHeading': {
      const sectionType = (node.attrs?.sectionType as string) || 'introduction';
      const text = extractText(node);
      return generateSectionBlock(sectionType as any, text);
    }

    case 'codeBlock': {
      const language = (node.attrs?.language as string) || '';
      const text = extractText(node);
      return `\`\`\`${language}\n${text}\n\`\`\``;
    }

    case 'hardBreak':
      return '  \n';

    default:
      // Unknown block node - try to extract text
      if (node.content) {
        return node.content.map(n => convertNode(n, indent)).join('\n\n');
      }
      return extractText(node);
  }
}

/** Convert inline content (paragraph with marks) */
function convertInlineContent(node: TiptapNode): string {
  if (!node.content) return '';

  return node.content.map(inlineNode => {
    if (inlineNode.type === 'text' && inlineNode.text) {
      let text = inlineNode.text;
      if (inlineNode.marks) {
        for (const mark of inlineNode.marks) {
          switch (mark.type) {
            case 'bold':
              text = `**${text}**`;
              break;
            case 'italic':
              text = `*${text}*`;
              break;
            case 'strike':
              text = `~~${text}~~`;
              break;
            case 'code':
              text = `\`${text}\``;
              break;
            case 'link':
              text = `[${text}](${mark.attrs?.href || ''})`;
              break;
            case 'highlight': {
              const color = mark.attrs?.color as string;
              if (color) {
                text = `==${text}==`;
              }
              break;
            }
          }
        }
      }
      return text;
    }
    if (inlineNode.type === 'hardBreak') return '  \n';
    return '';
  }).join('');
}

/** Extract plain text from a node tree */
function extractText(node: TiptapNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(n => extractText(n)).join('');
}

/** Convert a list item to Markdown */
function convertListItem(node: TiptapNode, number?: number, indent: number = 0): string {
  const prefix = '  '.repeat(indent);
  const text = node.content
    ? node.content
        .filter(n => n.type !== 'bulletList' && n.type !== 'orderedList')
        .map(n => convertNode(n))
        .join(' ')
    : '';

  // Check for nested lists
  const nestedLists = node.content?.filter(
    n => n.type === 'bulletList' || n.type === 'orderedList'
  );

  let result = number
    ? `${prefix}${number}. ${text}`
    : `${prefix}- ${text}`;

  if (nestedLists) {
    for (const nested of nestedLists) {
      result += '\n' + convertNode(nested, indent + 1);
    }
  }

  return result;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/tiptap-to-markdown.ts lib/sermon-markdown.ts
git commit -m "feat: add Tiptap JSON to Markdown converter and sermon Markdown utilities"
```

---

## Task 3: Create CodeMirror Custom Theme

**Files:**
- Create: `components/sermon/extensions/theme.ts`

- [ ] **Step 1: Create the CodeMirror theme matching the app's style**

```typescript
/**
 * CodeMirror theme for sermon editor
 * Matches the app's dark/light mode styling
 */
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';

export const sermonEditorTheme = (isDark: boolean): Extension => {
  const baseTheme = EditorView.theme({
    '&': {
      fontSize: '15px',
      lineHeight: '1.7',
      height: '100%',
    },
    '.cm-content': {
      padding: '16px 0',
      fontFamily: '"Noto Serif SC", "Noto Serif", Georgia, serif',
      caretColor: isDark ? '#93c5fd' : '#3b82f6',
    },
    '.cm-cursor': {
      borderLeftColor: isDark ? '#93c5fd' : '#3b82f6',
      borderLeftWidth: '2px',
    },
    '.cm-activeLine': {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
    },
    '.cm-selectionBackground': {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15) !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.2) !important',
    },
    '.cm-gutters': {
      backgroundColor: isDark ? '#1e1e2e' : '#fafafa',
      color: isDark ? '#6b7280' : '#9ca3af',
      border: 'none',
      paddingRight: '8px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      fontSize: '12px',
      minWidth: '2.5em',
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: 'inherit',
    },
    // Verse block styling
    '.cm-verse-block': {
      backgroundColor: isDark ? 'rgba(147, 197, 253, 0.08)' : 'rgba(219, 234, 254, 0.5)',
      borderLeft: `3px solid ${isDark ? '#3b82f6' : '#60a5fa'}`,
      borderRadius: '4px',
      padding: '8px 12px',
      margin: '4px 0',
    },
    // Section block styling
    '.cm-section-block': {
      backgroundColor: isDark ? 'rgba(167, 139, 250, 0.08)' : 'rgba(237, 233, 254, 0.5)',
      borderLeft: `3px solid ${isDark ? '#8b5cf6' : '#a78bfa'}`,
      borderRadius: '4px',
      padding: '8px 12px',
      margin: '4px 0',
    },
    // Preview widget styling
    '.cm-preview-widget': {
      cursor: 'text',
      transition: 'opacity 0.15s ease',
    },
    '.cm-preview-widget:hover': {
      opacity: '0.85',
    },
    // Toolbar button styling
    '.cm-toolbar': {
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      padding: '4px 8px',
      borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
    },
  });

  const darkHighlightStyle = isDark
    ? EditorView.baseTheme({
        '.cm-content': { color: '#e5e7eb' },
        '.tok-heading': { color: '#93c5fd', fontWeight: '700' },
        '.tok-heading1': { fontSize: '1.6em' },
        '.tok-heading2': { fontSize: '1.3em' },
        '.tok-heading3': { fontSize: '1.1em' },
        '.tok-strong': { color: '#f9fafb', fontWeight: '700' },
        '.tok-emphasis': { color: '#c4b5fd', fontStyle: 'italic' },
        '.tok-strikethrough': { textDecoration: 'line-through', color: '#6b7280' },
        '.tok-link': { color: '#60a5fa', textDecoration: 'underline' },
        '.tok-url': { color: '#60a5fa' },
        '.tok-string': { color: '#86efac' },
        '.tok-meta': { color: '#fbbf24' },
        '.tok-comment': { color: '#6b7280' },
        '.tok-keyword': { color: '#f472b6' },
        '.tok-number': { color: '#fb923c' },
        '.tok-processingInstruction': { color: '#fbbf24' },
      })
    : EditorView.baseTheme({
        '.cm-content': { color: '#1f2937' },
        '.tok-heading': { color: '#1d4ed8', fontWeight: '700' },
        '.tok-heading1': { fontSize: '1.6em' },
        '.tok-heading2': { fontSize: '1.3em' },
        '.tok-heading3': { fontSize: '1.1em' },
        '.tok-strong': { color: '#111827', fontWeight: '700' },
        '.tok-emphasis': { color: '#6d28d9', fontStyle: 'italic' },
        '.tok-strikethrough': { textDecoration: 'line-through', color: '#9ca3af' },
        '.tok-link': { color: '#2563eb', textDecoration: 'underline' },
        '.tok-url': { color: '#2563eb' },
        '.tok-string': { color: '#15803d' },
        '.tok-meta': { color: '#b45309' },
        '.tok-comment': { color: '#9ca3af' },
        '.tok-keyword': { color: '#be185d' },
        '.tok-number': { color: '#c2410c' },
        '.tok-processingInstruction': { color: '#b45309' },
      });

  return [baseTheme, darkHighlightStyle];
};
```

- [ ] **Step 2: Commit**

```bash
git add components/sermon/extensions/theme.ts
git commit -m "feat: add CodeMirror theme for sermon editor"
```

---

## Task 4: Create Verse Block Extension

**Files:**
- Create: `components/sermon/extensions/verseBlock.ts`

- [ ] **Step 1: Create the verse block CodeMirror extension**

This extension provides:
- Syntax highlighting for `verse` fenced blocks
- A WidgetDecoration that renders verse blocks as styled cards when the cursor is outside the block

```typescript
/**
 * CodeMirror extension for ```verse:Reference ... ``` blocks
 * Provides syntax highlighting and preview rendering
 */
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { EditorState, Range } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

/** Widget that renders a verse block as a styled card */
class VersePreviewWidget extends WidgetType {
  constructor(readonly reference: string, readonly text: string) {
    super();
  }

  toDOM(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'cm-verse-block cm-preview-widget';
    container.setAttribute('contenteditable', 'false');

    const header = document.createElement('div');
    header.style.cssText = 'font-weight:600; font-size:0.85em; margin-bottom:4px; color:#3b82f6;';
    header.textContent = `\uD83D\uDCD6 ${this.reference}`;

    const text = document.createElement('div');
    text.style.cssText = 'font-style:italic; line-height:1.6;';
    text.textContent = this.text;

    container.appendChild(header);
    container.appendChild(text);
    return container;
  }

  eq(other: VersePreviewWidget): boolean {
    return this.reference === other.reference && this.text === other.text;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

/** Find all verse fenced blocks and their line ranges */
function findVerseBlocks(state: EditorState): { from: number; to: number; reference: string; text: string }[] {
  const blocks: { from: number; to: number; reference: string; text: string }[] = [];
  const doc = state.doc;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const match = line.text.match(/^```verse:(.+)$/);
    if (!match) continue;

    const reference = match[1].trim();
    const textLines: string[] = [];

    let endLine = i + 1;
    while (endLine <= doc.lines) {
      const endLineText = doc.line(endLine).text;
      if (endLineText.trim() === '```') break;
      textLines.push(endLineText);
      endLine++;
    }

    const from = line.from;
    const to = endLine <= doc.lines ? doc.line(endLine).to : doc.line(doc.lines).to;
    const text = textLines.join('\n');

    blocks.push({ from, to, reference, text });
    i = endLine; // skip past the block
  }

  return blocks;
}

/** Check if cursor is inside a given range */
function isCursorInRange(view: EditorView, from: number, to: number): boolean {
  for (const range of view.state.selection.ranges) {
    if (range.from >= from && range.from <= to) return true;
    if (range.to >= from && range.to <= to) return true;
    if (range.from <= from && range.to >= to) return true;
  }
  return false;
}

/** Build decorations for verse blocks */
function buildVerseDecorations(view: EditorView): DecorationSet {
  const blocks = findVerseBlocks(view.state);
  const decorations: Range<Decoration>[] = [];

  for (const block of blocks) {
    // Only show preview if cursor is NOT inside the block
    if (!isCursorInRange(view, block.from, block.to)) {
      const widget = Decoration.replace({
        widget: new VersePreviewWidget(block.reference, block.text),
        block: true,
      });
      decorations.push(widget.range(block.from, block.to));
    }
  }

  return Decoration.set(decorations, true);
}

/** View plugin that updates verse block decorations */
const verseBlockPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildVerseDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildVerseDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);

/** Export the verse block extension */
export function verseBlockExtension(): Extension {
  return [verseBlockPlugin];
}

// Need Extension import
import { Extension } from '@codemirror/state';
```

- [ ] **Step 2: Commit**

```bash
git add components/sermon/extensions/verseBlock.ts
git commit -m "feat: add CodeMirror verse block extension with preview"
```

---

## Task 5: Create Section Block Extension

**Files:**
- Create: `components/sermon/extensions/sectionBlock.ts`

- [ ] **Step 1: Create the section block CodeMirror extension**

Similar to verse blocks but for `section:type` fenced blocks. Renders as colored section headings when cursor is outside.

```typescript
/**
 * CodeMirror extension for ```section:type ... ``` blocks
 * Provides syntax highlighting and preview rendering for sermon sections
 */
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { EditorState, Extension, Range } from '@codemirror/state';

const SECTION_LABELS: Record<string, string> = {
  introduction: '引言',
  main_point: '要点',
  sub_point: '分点',
  illustration: '例证',
  application: '应用',
  conclusion: '结论',
  prayer: '祷告',
};

const SECTION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  introduction: { bg: 'rgba(59,130,246,0.08)', border: '#3b82f6', text: '#3b82f6' },
  main_point:   { bg: 'rgba(16,185,129,0.08)', border: '#10b981', text: '#10b981' },
  sub_point:    { bg: 'rgba(245,158,11,0.08)', border: '#f59e0b', text: '#f59e0b' },
  illustration: { bg: 'rgba(236,72,153,0.08)', border: '#ec4899', text: '#ec4899' },
  application:  { bg: 'rgba(139,92,246,0.08)', border: '#8b5cf6', text: '#8b5cf6' },
  conclusion:   { bg: 'rgba(239,68,68,0.08)',  border: '#ef4444', text: '#ef4444' },
  prayer:       { bg: 'rgba(217,119,6,0.08)',  border: '#d97706', text: '#d97706' },
};

/** Widget that renders a section block as a styled heading */
class SectionPreviewWidget extends WidgetType {
  constructor(readonly sectionType: string, readonly content: string) {
    super();
  }

  toDOM(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'cm-section-block cm-preview-widget';
    container.setAttribute('contenteditable', 'false');

    const colors = SECTION_COLORS[this.sectionType] || SECTION_COLORS.introduction;
    const label = SECTION_LABELS[this.sectionType] || this.sectionType;

    const header = document.createElement('div');
    header.style.cssText = `
      font-weight: 600; font-size: 0.8em; text-transform: uppercase;
      letter-spacing: 0.05em; margin-bottom: 6px;
      color: ${colors.text};
    `;
    header.textContent = `\u2501\u2501 ${label} \u2501\u2501`;

    const content = document.createElement('div');
    content.style.cssText = 'line-height: 1.6; white-space: pre-wrap;';
    content.textContent = this.content;

    container.appendChild(header);
    container.appendChild(content);
    return container;
  }

  eq(other: SectionPreviewWidget): boolean {
    return this.sectionType === other.sectionType && this.content === other.content;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

/** Find all section fenced blocks */
function findSectionBlocks(state: EditorState): { from: number; to: number; sectionType: string; content: string }[] {
  const blocks: { from: number; to: number; sectionType: string; content: string }[] = [];
  const doc = state.doc;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const match = line.text.match(/^```section:(.+)$/);
    if (!match) continue;

    const sectionType = match[1].trim();
    const contentLines: string[] = [];

    let endLine = i + 1;
    while (endLine <= doc.lines) {
      const endLineText = doc.line(endLine).text;
      if (endLineText.trim() === '```') break;
      contentLines.push(endLineText);
      endLine++;
    }

    const from = line.from;
    const to = endLine <= doc.lines ? doc.line(endLine).to : doc.line(doc.lines).to;
    const content = contentLines.join('\n');

    blocks.push({ from, to, sectionType, content });
    i = endLine;
  }

  return blocks;
}

/** Check if cursor is inside a given range */
function isCursorInRange(view: EditorView, from: number, to: number): boolean {
  for (const range of view.state.selection.ranges) {
    if (range.from >= from && range.from <= to) return true;
    if (range.to >= from && range.to <= to) return true;
    if (range.from <= from && range.to >= to) return true;
  }
  return false;
}

/** Build decorations for section blocks */
function buildSectionDecorations(view: EditorView): DecorationSet {
  const blocks = findSectionBlocks(view.state);
  const decorations: Range<Decoration>[] = [];

  for (const block of blocks) {
    if (!isCursorInRange(view, block.from, block.to)) {
      const widget = Decoration.replace({
        widget: new SectionPreviewWidget(block.sectionType, block.content),
        block: true,
      });
      decorations.push(widget.range(block.from, block.to));
    }
  }

  return Decoration.set(decorations, true);
}

/** View plugin that updates section block decorations */
const sectionBlockPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildSectionDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildSectionDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);

/** Export the section block extension */
export function sectionBlockExtension(): Extension {
  return [sectionBlockPlugin];
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sermon/extensions/sectionBlock.ts
git commit -m "feat: add CodeMirror section block extension with preview"
```

---

## Task 6: Create Live Preview Extension

**Files:**
- Create: `components/sermon/extensions/livePreview.ts`

This is the core Obsidian-like feature: standard Markdown blocks (headings, paragraphs, lists, blockquotes) are rendered as styled HTML when the cursor is not on them.

- [ ] **Step 1: Create the live preview extension**

```typescript
/**
 * CodeMirror extension for Obsidian-like seamless live preview
 * Renders Markdown blocks as styled HTML when cursor is outside the block
 */
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { EditorState, Extension, Range } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

/** Widget for rendering a heading */
class HeadingWidget extends WidgetType {
  constructor(readonly level: number, readonly text: string) {
    super();
  }

  toDOM(): HTMLElement {
    const el = document.createElement(`h${this.level}` as keyof HTMLElementTagNameMap);
    el.className = 'cm-preview-widget';
    el.textContent = this.text;

    const sizes: Record<number, string> = {
      1: '1.8em', 2: '1.5em', 3: '1.25em', 4: '1.1em', 5: '1em', 6: '0.9em',
    };
    el.style.cssText = `
      font-size: ${sizes[this.level] || '1em'};
      font-weight: 700;
      margin: 0.5em 0 0.3em;
      line-height: 1.3;
      cursor: text;
    `;
    return el;
  }

  eq(other: HeadingWidget): boolean {
    return this.level === other.level && this.text === other.text;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

/** Widget for rendering a blockquote */
class BlockquoteWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  toDOM(): HTMLElement {
    const el = document.createElement('blockquote');
    el.className = 'cm-preview-widget';
    el.style.cssText = `
      border-left: 3px solid #6b7280;
      padding-left: 12px;
      margin: 4px 0;
      color: #6b7280;
      font-style: italic;
      cursor: text;
    `;
    el.textContent = this.text;
    return el;
  }

  eq(other: BlockquoteWidget): boolean {
    return this.text === other.text;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

/** Widget for rendering a horizontal rule */
class HorizontalRuleWidget extends WidgetType {
  toDOM(): HTMLElement {
    const el = document.createElement('hr');
    el.className = 'cm-preview-widget';
    el.style.cssText = 'border: none; border-top: 1px solid #d1d5db; margin: 16px 0; cursor: text;';
    return el;
  }

  eq(): boolean {
    return true;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

/** Get the line range for a syntax tree node */
function getNodeLineRange(state: EditorState, from: number, to: number): { from: number; to: number } {
  const startLine = state.doc.lineAt(from);
  const endLine = state.doc.lineAt(to);
  return { from: startLine.from, to: endLine.to };
}

/** Check if cursor is inside a given range */
function isCursorInRange(view: EditorView, from: number, to: number): boolean {
  for (const range of view.state.selection.ranges) {
    if (range.from >= from && range.from <= to) return true;
    if (range.to >= from && range.to <= to) return true;
    if (range.from <= from && range.to >= to) return true;
  }
  return false;
}

/** Extract plain text from a syntax node */
function getNodeText(state: EditorState, from: number, to: number): string {
  return state.doc.sliceString(from, to);
}

/** Build live preview decorations */
function buildLivePreviewDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const state = view.state;

  syntaxTree(state).iterate({
    enter(node) {
      // Skip verse and section blocks - handled by their own extensions
      const lineText = state.doc.lineAt(node.from).text;
      if (lineText.startsWith('```verse:') || lineText.startsWith('```section:')) {
        return false; // skip children
      }

      switch (node.name) {
        case 'ATXHeading1':
        case 'ATXHeading2':
        case 'ATXHeading3':
        case 'ATXHeading4':
        case 'ATXHeading5':
        case 'ATXHeading6': {
          const level = parseInt(node.name.slice(-1));
          const range = getNodeLineRange(state, node.from, node.to);
          if (!isCursorInRange(view, range.from, range.to)) {
            // Strip the # prefix from the text
            const rawText = getNodeText(state, node.from, node.to);
            const headingText = rawText.replace(/^#{1,6}\s+/, '').trim();
            const widget = Decoration.replace({
              widget: new HeadingWidget(level, headingText),
              block: true,
            });
            decorations.push(widget.range(range.from, range.to));
          }
          break;
        }

        case 'HorizontalRule': {
          const range = getNodeLineRange(state, node.from, node.to);
          if (!isCursorInRange(view, range.from, range.to)) {
            const widget = Decoration.replace({
              widget: new HorizontalRuleWidget(),
              block: true,
            });
            decorations.push(widget.range(range.from, range.to));
          }
          break;
        }
      }
    },
  });

  return Decoration.set(decorations, true);
}

/** View plugin for live preview */
const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildLivePreviewDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildLivePreviewDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);

/** Export the live preview extension */
export function livePreviewExtension(): Extension {
  return [livePreviewPlugin];
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sermon/extensions/livePreview.ts
git commit -m "feat: add CodeMirror live preview extension for headings and blocks"
```

---

## Task 7: Create Editor Toolbar

**Files:**
- Create: `components/sermon/EditorToolbar.tsx`

- [ ] **Step 1: Create the Markdown formatting toolbar**

```tsx
'use client';

import React from 'react';
import { EditorView } from '@codemirror/view';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  BookOpen,
  LayoutTemplate,
  Code,
} from 'lucide-react';
import { undo, redo } from '@codemirror/commands';
import { generateVerseBlock, generateSectionBlock, SECTION_TYPES, SectionType } from '@/lib/sermon-markdown';

interface EditorToolbarProps {
  editorView: EditorView | null;
  isDark: boolean;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: (view: EditorView) => void;
  separator?: boolean;
}

/** Insert text at cursor position, wrapping selection if any */
function insertAtCursor(view: EditorView, before: string, after: string = '') {
  const { from, to } = view.state.selection.main;
  const selectedText = view.state.sliceDoc(from, to);
  const insertion = `${before}${selectedText || '文本'}${after}`;

  view.dispatch({
    changes: { from, to, insert: insertion },
    selection: { anchor: from + before.length, head: from + before.length + (selectedText || '文本').length },
  });
  view.focus();
}

/** Insert a block at the start of a new line after cursor */
function insertBlock(view: EditorView, text: string) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  const insertPos = line.to;
  const prefix = line.text.trim() === '' ? '' : '\n';

  view.dispatch({
    changes: { from: insertPos, insert: `${prefix}${text}\n` },
    selection: { anchor: insertPos + prefix.length + text.length + 1 },
  });
  view.focus();
}

export default function EditorToolbar({ editorView, isDark }: EditorToolbarProps) {
  if (!editorView) return null;

  const buttons: ToolbarButton[] = [
    {
      icon: <Undo2 size={16} />,
      label: '撤回',
      action: (view) => { undo(view); view.focus(); },
    },
    {
      icon: <Redo2 size={16} />,
      label: '重做',
      action: (view) => { redo(view); view.focus(); },
    },
    // Separator
    {
      icon: <Bold size={16} />,
      label: '加粗',
      action: (view) => insertAtCursor(view, '**', '**'),
      separator: true,
    },
    {
      icon: <Italic size={16} />,
      label: '斜体',
      action: (view) => insertAtCursor(view, '*', '*'),
    },
    {
      icon: <Strikethrough size={16} />,
      label: '删除线',
      action: (view) => insertAtCursor(view, '~~', '~~'),
    },
    {
      icon: <Heading1 size={16} />,
      label: '标题1',
      action: (view) => insertBlock(view, '# '),
      separator: true,
    },
    {
      icon: <Heading2 size={16} />,
      label: '标题2',
      action: (view) => insertBlock(view, '## '),
    },
    {
      icon: <Heading3 size={16} />,
      label: '标题3',
      action: (view) => insertBlock(view, '### '),
    },
    {
      icon: <List size={16} />,
      label: '无序列表',
      action: (view) => insertBlock(view, '- '),
      separator: true,
    },
    {
      icon: <ListOrdered size={16} />,
      label: '有序列表',
      action: (view) => insertBlock(view, '1. '),
    },
    {
      icon: <Quote size={16} />,
      label: '引用',
      action: (view) => insertBlock(view, '> '),
    },
    {
      icon: <Minus size={16} />,
      label: '分割线',
      action: (view) => insertBlock(view, '---'),
      separator: true,
    },
    {
      icon: <BookOpen size={16} />,
      label: '经文',
      action: (view) => insertBlock(view, generateVerseBlock('经文引用', '经文内容')),
      separator: true,
    },
    {
      icon: <LayoutTemplate size={16} />,
      label: '段落',
      action: (view) => insertBlock(view, generateSectionBlock('introduction', '段落内容')),
    },
  ];

  return (
    <div
      className="flex items-center gap-0.5 px-2 py-1 border-b flex-shrink-0"
      style={{
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
      }}
    >
      {buttons.map((btn, i) => (
        <React.Fragment key={i}>
          {btn.separator && <div className="w-px h-5 mx-1" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }} />}
          <button
            onClick={() => btn.action(editorView)}
            title={btn.label}
            className="p-1.5 rounded hover:bg-blue-500/10 transition-colors"
            style={{ color: isDark ? '#d1d5db' : '#4b5563' }}
          >
            {btn.icon}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sermon/EditorToolbar.tsx
git commit -m "feat: add Markdown editor toolbar with undo/redo and formatting"
```

---

## Task 8: Create CodeMirror Editor Component

**Files:**
- Create: `components/sermon/CodeMirrorEditor.tsx`

This is the main editor component that replaces the Tiptap editor.

- [ ] **Step 1: Create the CodeMirror editor React component**

```tsx
'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { history, historyKeymap } from '@codemirror/commands';
import { keymap, EditorView as CMEditorView } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';
import { searchKeymap } from '@codemirror/search';
import { verseBlockExtension } from './extensions/verseBlock';
import { sectionBlockExtension } from './extensions/sectionBlock';
import { livePreviewExtension } from './extensions/livePreview';
import { sermonEditorTheme } from './extensions/theme';
import EditorToolbar from './EditorToolbar';

interface CodeMirrorEditorProps {
  content: string;
  onChange: (content: string) => void;
  isDark: boolean;
  onSave: () => void;
}

export default function CodeMirrorEditor({
  content,
  onChange,
  isDark,
  onSave,
}: CodeMirrorEditorProps) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const [editorView, setEditorView] = useState<CMEditorView | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get editor view from ref
  useEffect(() => {
    if (cmRef.current?.view) {
      setEditorView(cmRef.current.view);
    }
  }, [cmRef.current?.view]);

  // Debounced onChange handler
  const handleChange = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange(value);
      }, 300); // Short debounce for UI responsiveness, parent handles save debounce
    },
    [onChange]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Build extensions
  const extensions = React.useMemo(
    () => [
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      history({ newGroupDelay: 500 }),
      verseBlockExtension(),
      sectionBlockExtension(),
      livePreviewExtension(),
      sermonEditorTheme(isDark),
      autocompletion(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        indentWithTab,
        // Cmd/Ctrl+S to save
        {
          key: 'Mod-s',
          run: () => {
            onSave();
            return true;
          },
        },
      ]),
      // Update editorView reference when view changes
      CMEditorView.updateListener.of((update) => {
        if (update.view !== editorView) {
          setEditorView(update.view);
        }
      }),
    ],
    [isDark, onSave, editorView]
  );

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editorView={editorView} isDark={isDark} />
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          ref={cmRef}
          value={content}
          onChange={handleChange}
          extensions={extensions}
          theme={isDark ? 'dark' : 'light'}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
            bracketMatching: true,
            closeBrackets: true,
            indentOnInput: true,
            // Disable built-in features we handle ourselves
            history: false, // We use our own history extension
            search: false,  // We add search keymap manually
            autocompletion: false, // We add our own
          }}
          className="h-full"
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/sermon/CodeMirrorEditor.tsx
git commit -m "feat: add CodeMirror editor component with extensions and toolbar"
```

---

## Task 9: Update SermonEditorContext

**Files:**
- Modify: `components/sermon/SermonEditorContext.tsx`

- [ ] **Step 1: Read the current file**

Read `components/sermon/SermonEditorContext.tsx` to understand the current context structure.

- [ ] **Step 2: Update the context to use Markdown content**

Key changes:
- Replace Tiptap editor instance with CodeMirror content string
- Remove Tiptap-related imports and types
- Add `tiptapToMarkdown` conversion for legacy content on load
- Keep the auto-save logic but adapt it for Markdown strings
- Update `insertContent` to use Markdown syntax instead of Tiptap commands

The context should:
1. Store `content` as a Markdown string
2. On load, check if content is Tiptap JSON (starts with `{`) and convert it
3. Provide `updateContent(markdown: string)` method
4. Provide `insertVerse(reference: string, text: string)` that inserts a verse fenced block
5. Provide `insertSection(type: SectionType, content: string)` that inserts a section fenced block
6. Keep auto-save debounce at 1500ms
7. Keep save status tracking

- [ ] **Step 3: Commit**

```bash
git add components/sermon/SermonEditorContext.tsx
git commit -m "refactor: update SermonEditorContext for Markdown content"
```

---

## Task 10: Update SermonEditor (Replace Tiptap)

**Files:**
- Modify: `components/sermon/SermonEditor.tsx`

This is the main integration task - replacing the Tiptap editor with CodeMirror.

- [ ] **Step 1: Read the current file**

Read `components/sermon/SermonEditor.tsx` (323 lines) to understand the full structure.

- [ ] **Step 2: Replace Tiptap with CodeMirror**

Key changes:
- Remove all Tiptap imports (`useEditor`, `EditorContent`, `StarterKit`, etc.)
- Remove `BubbleMenu` (AI actions will be moved to toolbar or context menu)
- Replace `EditorContent` with `CodeMirrorEditor` component
- Remove `TipTapMenuBar` usage, replace with `EditorToolbar` (already inside CodeMirrorEditor)
- Keep the layout structure (sidebar + editor + AI panel)
- Keep the keyboard shortcut handler (Cmd+S)
- Update the `onSave` callback to save Markdown content
- Remove the `useEffect` that syncs Tiptap content to store
- Add `useEffect` to sync CodeMirror content changes to store

The updated component should:
1. Get `content` (Markdown string) from `SermonEditorContext`
2. Pass `content`, `onChange`, `isDark`, `onSave` to `CodeMirrorEditor`
3. `onChange` updates the context which triggers auto-save
4. Keep the existing layout: sidebar | editor | AI panel

- [ ] **Step 3: Commit**

```bash
git add components/sermon/SermonEditor.tsx
git commit -m "feat: replace Tiptap with CodeMirror Markdown editor"
```

---

## Task 11: Update SermonEditorHeader

**Files:**
- Modify: `components/sermon/SermonEditorHeader.tsx`

- [ ] **Step 1: Read the current file**

Read `components/sermon/SermonEditorHeader.tsx` to understand the current header.

- [ ] **Step 2: Update save status logic**

Key changes:
- Remove any Tiptap-specific save logic
- Ensure save status indicator works with Markdown content
- Keep the existing UI (title, save status, export button, etc.)

- [ ] **Step 3: Commit**

```bash
git add components/sermon/SermonEditorHeader.tsx
git commit -m "refactor: update SermonEditorHeader for Markdown content"
```

---

## Task 12: Update SermonAIPanel

**Files:**
- Modify: `components/sermon/SermonAIPanel.tsx`

- [ ] **Step 1: Read the current file**

Read `components/sermon/SermonAIPanel.tsx` to understand how AI inserts content.

- [ ] **Step 2: Update AI content insertion to use Markdown**

Key changes:
- Replace Tiptap `editor.commands.insertContent()` with Markdown insertion
- When AI generates verse content, insert as `verse` fenced block
- When AI generates section content, insert as `section` fenced block
- When AI generates regular text, insert as plain Markdown
- Use the context's `insertVerse()` and `insertSection()` methods

- [ ] **Step 3: Commit**

```bash
git add components/sermon/SermonAIPanel.tsx
git commit -m "refactor: update AI panel to insert Markdown content"
```

---

## Task 13: Update Sermon Slice and Types

**Files:**
- Modify: `store/slices/sermonSlice.ts`
- Modify: `store/types.ts`

- [ ] **Step 1: Read the current files**

Read both files to understand the current sermon state shape.

- [ ] **Step 2: Update types**

In `store/types.ts`:
- Change the sermon `content` field type comment to indicate it stores Markdown strings
- Add `excerpt` field if not present
- Remove any Tiptap-specific type references

In `store/slices/sermonSlice.ts`:
- Update `setContent` action to accept Markdown strings
- Update `loadSermon` to handle Tiptap JSON → Markdown conversion using `tiptapToMarkdown`
- Update `saveSermon` to send Markdown content to API
- Add `excerpt` generation using `generateExcerpt` from `lib/sermon-markdown.ts`

- [ ] **Step 3: Commit**

```bash
git add store/slices/sermonSlice.ts store/types.ts
git commit -m "refactor: update sermon store for Markdown content"
```

---

## Task 14: Update Sermon API Routes

**Files:**
- Modify: `app/api/sermon/route.ts`

- [ ] **Step 1: Read the current file**

Read `app/api/sermon/route.ts` to understand the current API.

- [ ] **Step 2: Update PUT handler to accept Markdown**

Key changes:
- The `content` field now stores Markdown strings directly (no longer Tiptap JSON)
- When loading a sermon (GET), if content starts with `{` (legacy Tiptap JSON), convert to Markdown using `tiptapToMarkdown`
- When saving a sermon (PUT), store the Markdown string directly
- Generate `excerpt` from Markdown using `generateExcerpt`
- Keep all other fields unchanged

- [ ] **Step 3: Commit**

```bash
git add app/api/sermon/route.ts
git commit -m "refactor: update sermon API for Markdown content storage"
```

---

## Task 15: Update NewSermonDialog

**Files:**
- Modify: `components/sermon/NewSermonDialog.tsx`

- [ ] **Step 1: Read the current file (has uncommitted changes)**

Read `components/sermon/NewSermonDialog.tsx` to see the current state.

- [ ] **Step 2: Update to create sermons with Markdown template**

Key changes:
- Default sermon content should be a Markdown template instead of Tiptap JSON
- Use `generateSectionBlock` for the sermon template sections
- Example template:

```markdown
# 讲章标题

```section:introduction
## 引言

```

```section:main_point
## 要点

```

```section:conclusion
## 结论

```
```

- [ ] **Step 3: Commit**

```bash
git add components/sermon/NewSermonDialog.tsx
git commit -m "refactor: update NewSermonDialog to use Markdown template"
```

---

## Task 16: Build Verification & Docker Deploy

**Files:**
- No new files

- [ ] **Step 1: Run build to check for errors**

```bash
cd /opt/data1/public/software/systools/bibleAI/scripture-ai
npm run build 2>&1 | tail -50
```

- [ ] **Step 2: Fix any build errors**

Address TypeScript errors, missing imports, type mismatches. Common issues:
- Tiptap imports still referenced somewhere
- Type mismatches between Markdown string and old Tiptap JSON types
- Missing CodeMirror type definitions

- [ ] **Step 3: Rebuild and verify**

```bash
npm run build
```

Expected: Clean build with no errors.

- [ ] **Step 4: Docker rebuild and verify**

```bash
docker-compose down && docker-compose up -d --build
```

- [ ] **Step 5: Auto-deploy**

```bash
./auto_deploy.sh -s "feat: 讲章编辑器升级为CodeMirror Markdown编辑器" -d "将Tiptap WYSIWYG编辑器替换为CodeMirror 6 Markdown编辑器，支持Obsidian风格实时预览、自动保存、撤回重做功能。自定义verse和section围栏块语法，支持经文和段落预览渲染。迁移现有Tiptap JSON内容为Markdown格式。"
```

---

## Task 17: Manual Testing Checklist

- [ ] **Step 1: Test creating a new sermon**
  - Open sermon editor
  - Create new sermon via NewSermonDialog
  - Verify Markdown template loads correctly
  - Verify toolbar buttons work (bold, italic, headings, etc.)
  - Verify undo/redo works (Ctrl+Z / Ctrl+Shift+Z)

- [ ] **Step 2: Test live preview**
  - Type a heading (# Title) and move cursor away - verify it renders as styled heading
  - Insert a verse block via toolbar - verify it renders as a card when cursor is elsewhere
  - Insert a section block via toolbar - verify it renders as colored section when cursor is elsewhere
  - Click on a rendered block - verify it reveals raw Markdown for editing

- [ ] **Step 3: Test auto-save**
  - Make changes and wait 1.5 seconds
  - Verify "Saving..." appears then changes to "Saved"
  - Refresh the page - verify content persists

- [ ] **Step 4: Test legacy content migration**
  - Open an existing sermon with Tiptap JSON content
  - Verify it converts to Markdown on load
  - Verify the content is editable and renders correctly

- [ ] **Step 5: Test AI panel integration**
  - Use AI to generate content
  - Verify content is inserted as Markdown
  - Verify verse references are inserted as verse fenced blocks
