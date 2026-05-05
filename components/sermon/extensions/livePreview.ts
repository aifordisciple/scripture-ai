/**
 * CodeMirror extension for Obsidian-like seamless live preview
 *
 * Strategy: Use Decoration.line to add a CSS class to preview lines,
 * Decoration.widget to insert preview content, and CSS to hide the
 * raw markdown text within those lines. This avoids all issues with
 * Decoration.replace crossing line breaks in ViewPlugin.
 */
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { Extension, Range } from '@codemirror/state';

// ─── Preview Widgets (all inline <span>, inherit editor lineHeight) ────────

class HeadingPreviewWidget extends WidgetType {
  constructor(readonly level: number, readonly text: string) { super(); }
  toDOM(): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'cm-preview-widget';
    wrap.setAttribute('contenteditable', 'false');
    const weights: Record<number, number> = { 1: 700, 2: 700, 3: 600, 4: 600, 5: 500, 6: 500 };
    const sizes: Record<number, string> = {
      1: '1.4em', 2: '1.2em', 3: '1.05em', 4: '1em', 5: '0.95em', 6: '0.9em',
    };
    wrap.style.cssText = `font-size:${sizes[this.level] || '1em'};font-weight:${weights[this.level] || 600};cursor:text;color:inherit;`;
    wrap.textContent = this.text;
    return wrap;
  }
  eq(other: HeadingPreviewWidget) { return this.level === other.level && this.text === other.text; }
  ignoreEvent() { return false; }
}

class HrPreviewWidget extends WidgetType {
  toDOM(): HTMLElement {
    const el = document.createElement('span');
    el.className = 'cm-preview-widget';
    el.setAttribute('contenteditable', 'false');
    el.style.cssText = 'display:inline-block;width:100%;border-top:1px solid #d1d5db;vertical-align:middle;cursor:text;';
    return el;
  }
  eq() { return true; }
  ignoreEvent() { return false; }
}

class BlockquotePreviewWidget extends WidgetType {
  constructor(readonly text: string) { super(); }
  toDOM(): HTMLElement {
    const el = document.createElement('span');
    el.className = 'cm-preview-widget';
    el.setAttribute('contenteditable', 'false');
    el.style.cssText = 'border-left:3px solid #6b7280;padding-left:12px;color:#6b7280;font-style:italic;cursor:text;';
    el.textContent = this.text;
    return el;
  }
  eq(other: BlockquotePreviewWidget) { return this.text === other.text; }
  ignoreEvent() { return false; }
}

class ParagraphPreviewWidget extends WidgetType {
  constructor(readonly text: string) { super(); }
  toDOM(): HTMLElement {
    const el = document.createElement('span');
    el.className = 'cm-preview-widget';
    el.setAttribute('contenteditable', 'false');
    el.style.cssText = 'cursor:text;';
    el.innerHTML = renderInlineMarkdown(this.text);
    return el;
  }
  eq(other: ParagraphPreviewWidget) { return this.text === other.text; }
  ignoreEvent() { return false; }
}

class ListItemPreviewWidget extends WidgetType {
  constructor(readonly text: string, readonly ordered: boolean, readonly index: number) { super(); }
  toDOM(): HTMLElement {
    const el = document.createElement('span');
    el.className = 'cm-preview-widget';
    el.setAttribute('contenteditable', 'false');
    el.style.cssText = 'padding-left:1.5em;cursor:text;';
    const marker = this.ordered ? `${this.index}. ` : '• ';
    el.innerHTML = `<span style="margin-right:0.3em">${marker}</span>${renderInlineMarkdown(this.text)}`;
    return el;
  }
  eq(other: ListItemPreviewWidget) { return this.text === other.text && this.ordered === other.ordered && this.index === other.index; }
  ignoreEvent() { return false; }
}

class FencedBlockPreviewWidget extends WidgetType {
  constructor(readonly label: string, readonly content: string, readonly color: string, readonly icon: string, readonly isVerse: boolean = false) { super(); }
  toDOM(): HTMLElement {
    if (this.isVerse) {
      return this.createVerseCard();
    }
    return this.createSectionCard();
  }

  private createVerseCard(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-preview-widget cm-verse-card';
    wrap.setAttribute('contenteditable', 'false');

    // Verse reference header
    const header = document.createElement('div');
    header.className = 'cm-verse-card-header';
    const refIcon = document.createElement('span');
    refIcon.style.cssText = 'font-size:0.9em;margin-right:4px;';
    refIcon.textContent = '📖';
    const refText = document.createElement('span');
    refText.style.cssText = 'font-weight:600;font-size:0.85em;';
    refText.textContent = this.label;
    header.appendChild(refIcon);
    header.appendChild(refText);

    // Verse body
    const body = document.createElement('div');
    body.className = 'cm-verse-card-body';
    body.style.cssText = 'white-space:pre-wrap;line-height:1.8;';
    // Parse verse content: split into verse number + text
    const lines = this.content.split('\n');
    for (const line of lines) {
      const verseLine = document.createElement('div');
      verseLine.style.cssText = 'margin-bottom:2px;';
      // Match verse number pattern: starts with digits
      const verseNumMatch = line.match(/^(\d+)\s?(.*)/);
      if (verseNumMatch) {
        const numSpan = document.createElement('sup');
        numSpan.style.cssText = 'color:#3b82f6;font-weight:600;font-size:0.75em;margin-right:2px;vertical-align:super;';
        numSpan.textContent = verseNumMatch[1];
        verseLine.appendChild(numSpan);
        const textNode = document.createTextNode(verseNumMatch[2]);
        verseLine.appendChild(textNode);
      } else {
        verseLine.textContent = line;
      }
      body.appendChild(verseLine);
    }

    wrap.appendChild(header);
    wrap.appendChild(body);
    return wrap;
  }

  private createSectionCard(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-preview-widget cm-section-card';
    wrap.setAttribute('contenteditable', 'false');
    wrap.style.cssText = `border-left:3px solid ${this.color};border-radius:4px;padding:2px 10px;cursor:text;background:${this.color}11;`;
    const header = document.createElement('span');
    header.style.cssText = `font-weight:600;font-size:0.85em;margin-right:6px;color:${this.color};`;
    header.textContent = `${this.icon} ${this.label}`;
    const body = document.createElement('span');
    body.style.cssText = 'white-space:pre-wrap;';
    body.textContent = this.content;
    wrap.appendChild(header);
    wrap.appendChild(body);
    return wrap;
  }

  eq(other: FencedBlockPreviewWidget) {
    return this.label === other.label && this.content === other.content && this.color === other.color && this.icon === other.icon && this.isVerse === other.isVerse;
  }
  ignoreEvent() { return false; }
}

// ─── Inline Markdown Renderer ────────

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Check if a URL is safe for use in an href attribute (prevents javascript: protocol XSS) */
function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('#');
}

function renderInlineMarkdown(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  html = html.replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:3px;font-size:0.9em">$1</code>');
  // Only render links with safe URL schemes to prevent XSS via javascript: protocol
  // Escape URL in href to prevent attribute injection via unescaped quotes
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText: string, url: string) => {
    if (isSafeUrl(url)) {
      return `<a style="color:#3b82f6;text-decoration:underline" href="${escapeHtml(url)}" rel="noopener noreferrer">${linkText}</a>`;
    }
    // For unsafe URLs, just show the text without a link
    return linkText;
  });
  return html;
}

// ─── Line Classification ─────────────────────────────────────────

type LineKind =
  | { type: 'heading'; level: number; text: string }
  | { type: 'hr' }
  | { type: 'blockquote'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bulletItem'; text: string }
  | { type: 'orderedItem'; text: string; index: number }
  | { type: 'fencedStart'; label: string; color: string; icon: string; isVerse: boolean }
  | { type: 'fencedEnd' }
  | { type: 'empty' }
  | { type: 'other' };

const SECTION_COLORS: Record<string, { color: string; label: string }> = {
  introduction: { color: '#3b82f6', label: '引言' },
  main_point:   { color: '#10b981', label: '要点' },
  sub_point:    { color: '#f59e0b', label: '分点' },
  illustration: { color: '#ec4899', label: '例证' },
  application:  { color: '#8b5cf6', label: '应用' },
  conclusion:   { color: '#ef4444', label: '结论' },
  prayer:       { color: '#d97706', label: '祷告' },
};

function classifyLine(text: string): LineKind {
  const trimmed = text.trim();
  if (trimmed === '') return { type: 'empty' };

  const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch) return { type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() };

  if (/^[-*_]{3,}\s*$/.test(trimmed)) return { type: 'hr' };
  if (/^>\s?/.test(trimmed)) return { type: 'blockquote', text: trimmed.replace(/^>\s?/, '') };

  const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
  if (bulletMatch) return { type: 'bulletItem', text: bulletMatch[1] };

  const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
  if (orderedMatch) return { type: 'orderedItem', text: orderedMatch[2], index: parseInt(orderedMatch[1]) };

  const verseMatch = trimmed.match(/^```verse:(.+)$/);
  if (verseMatch) return { type: 'fencedStart', label: verseMatch[1].trim(), color: '#3b82f6', icon: '📖', isVerse: true };

  const sectionMatch = trimmed.match(/^```section:(.+)$/);
  if (sectionMatch) {
    const sType = sectionMatch[1].trim();
    const info = SECTION_COLORS[sType] || { color: '#8b5cf6', label: sType };
    return { type: 'fencedStart', label: info.label, color: info.color, icon: '📑', isVerse: false };
  }

  if (trimmed === '```') return { type: 'fencedEnd' };

  return { type: 'paragraph', text: trimmed };
}

// ─── Decoration Builder ──────────────────────────────────────────

const previewLine = Decoration.line({ class: 'cm-preview-line' });

function getActiveLines(view: EditorView): Set<number> {
  const lines = new Set<number>();
  for (const sel of view.state.selection.ranges) {
    const startLine = view.state.doc.lineAt(sel.from).number;
    const endLine = view.state.doc.lineAt(sel.to).number;
    for (let i = startLine; i <= endLine; i++) lines.add(i);
  }
  return lines;
}

interface FencedState {
  label: string;
  color: string;
  icon: string;
  isVerse: boolean;
  contentLines: string[];
  startLineNum: number;
}

function buildDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const doc = view.state.doc;
  const activeLines = getActiveLines(view);
  let fenced: FencedState | null = null;

  try {
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const isActive = activeLines.has(i);

      // Inside a fenced block — collect lines until closing ```
      if (fenced) {
        fenced.contentLines.push(line.text);
        if (line.text.trim() === '```') {
          const endLineNum = i;
          if (!isActive && !activeLines.has(fenced.startLineNum)) {
            const content = fenced.contentLines.slice(0, -1).join('\n');
            const widget = new FencedBlockPreviewWidget(fenced.label, content, fenced.color, fenced.icon, fenced.isVerse);
            // Mark all lines as preview lines (CSS hides their text)
            for (let j = fenced.startLineNum; j <= endLineNum; j++) {
              decorations.push(previewLine.range(doc.line(j).from));
            }
            // Insert preview widget at the start of the first line
            const startLine = doc.line(fenced.startLineNum);
            decorations.push(Decoration.widget({ widget, side: -1 }).range(startLine.from));
          }
          fenced = null;
        }
        continue;
      }

      const kind = classifyLine(line.text);

      if (kind.type === 'fencedStart') {
        fenced = {
          label: kind.label,
          color: kind.color,
          icon: kind.icon,
          isVerse: kind.isVerse,
          contentLines: [line.text],
          startLineNum: i,
        };
        continue;
      }

      if (isActive) continue;

      switch (kind.type) {
        case 'heading':
          decorations.push(previewLine.range(line.from));
          decorations.push(Decoration.widget({ widget: new HeadingPreviewWidget(kind.level, kind.text), side: -1 }).range(line.from));
          break;
        case 'hr':
          decorations.push(previewLine.range(line.from));
          decorations.push(Decoration.widget({ widget: new HrPreviewWidget(), side: -1 }).range(line.from));
          break;
        case 'blockquote':
          decorations.push(previewLine.range(line.from));
          decorations.push(Decoration.widget({ widget: new BlockquotePreviewWidget(kind.text), side: -1 }).range(line.from));
          break;
        case 'paragraph':
          if (!kind.text) continue;
          decorations.push(previewLine.range(line.from));
          decorations.push(Decoration.widget({ widget: new ParagraphPreviewWidget(kind.text), side: -1 }).range(line.from));
          break;
        case 'bulletItem':
          decorations.push(previewLine.range(line.from));
          decorations.push(Decoration.widget({ widget: new ListItemPreviewWidget(kind.text, false, 0), side: -1 }).range(line.from));
          break;
        case 'orderedItem':
          decorations.push(previewLine.range(line.from));
          decorations.push(Decoration.widget({ widget: new ListItemPreviewWidget(kind.text, true, kind.index), side: -1 }).range(line.from));
          break;
      }
    }
  } catch (e) {
    console.error('[livePreview] buildDecorations error:', e);
    return Decoration.none;
  }

  return Decoration.set(decorations, true);
}

// ─── View Plugin ─────────────────────────────────────────────────

const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    private rafId: number | null = null;

    constructor(view: EditorView) { this.decorations = buildDecorations(view); }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        // Immediate rebuild for content/viewport changes
        if (this.rafId !== null) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
        this.decorations = buildDecorations(update.view);
      } else if (update.selectionSet) {
        // Debounce selection-only changes to avoid lag on large documents
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(() => {
          this.decorations = buildDecorations(update.view);
          this.rafId = null;
        });
      }
    }
    destroy() {
      if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    }
  },
  { decorations: (v) => v.decorations }
);

// ─── CSS: hide raw text in preview lines, show only widgets ────────

const livePreviewTheme = EditorView.baseTheme({
  // In preview lines, hide raw text by collapsing font and making transparent.
  // Using font-size: 0 + color: transparent is more robust than display: none
  // because CodeMirror's internal DOM structure varies and display:none can
  // break layout calculations. The widget restores its own font/color.
  '.cm-preview-line': {
    fontSize: '0',
    color: 'transparent',
  },
  '.cm-preview-line .cm-preview-widget': {
    fontSize: 'inherit',
    color: 'inherit',
  },
  // Ensure the widget picks up the editor's base font size and color
  // (set on .cm-content by the theme), not the zeroed-out line values
  '.cm-content .cm-preview-line .cm-preview-widget': {
    fontSize: 'var(--cm-font-size, 15px)',
    color: 'var(--cm-text-color, inherit)',
  },
  // Verse card styles
  '.cm-verse-card': {
    margin: '8px 0',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    padding: '0',
    overflow: 'hidden',
    cursor: 'text',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  },
  '.cm-verse-card-header': {
    padding: '6px 14px',
    borderBottom: '1px solid #e2e8f0',
    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    color: '#1e40af',
  },
  '.cm-verse-card-body': {
    padding: '10px 14px',
  },
});

export function livePreviewExtension(): Extension {
  return [livePreviewPlugin, livePreviewTheme];
}
