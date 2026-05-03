/**
 * CodeMirror extension for Obsidian-like seamless live preview
 *
 * Behavior: When the cursor is NOT on a line, that line's Markdown
 * is hidden and replaced with a rendered preview widget. When the
 * cursor enters that line, the preview is removed and raw Markdown
 * is shown for editing.
 *
 * This works at the LINE level (like Obsidian), not block level.
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

// ─── Preview Widgets ─────────────────────────────────────────────

class HeadingPreviewWidget extends WidgetType {
  constructor(readonly level: number, readonly text: string) {
    super();
  }
  toDOM(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cm-livepreview-heading';
    wrap.setAttribute('contenteditable', 'false');
    const sizes: Record<number, string> = {
      1: '1.75em', 2: '1.45em', 3: '1.2em', 4: '1.05em', 5: '0.95em', 6: '0.9em',
    };
    wrap.style.cssText = `
      font-size: ${sizes[this.level] || '1em'};
      font-weight: 700;
      margin: 0.5em 0 0.25em;
      line-height: 1.35;
      cursor: text;
      color: inherit;
    `;
    wrap.textContent = this.text;
    return wrap;
  }
  eq(other: HeadingPreviewWidget) {
    return this.level === other.level && this.text === other.text;
  }
  ignoreEvent() { return false; }
}

class HrPreviewWidget extends WidgetType {
  toDOM(): HTMLElement {
    const el = document.createElement('hr');
    el.setAttribute('contenteditable', 'false');
    el.style.cssText = 'border:none;border-top:1px solid #d1d5db;margin:14px 0;cursor:text;';
    return el;
  }
  eq() { return true; }
  ignoreEvent() { return false; }
}

class BlockquotePreviewWidget extends WidgetType {
  constructor(readonly text: string) { super(); }
  toDOM(): HTMLElement {
    const el = document.createElement('blockquote');
    el.setAttribute('contenteditable', 'false');
    el.style.cssText = `
      border-left:3px solid #6b7280;padding-left:12px;margin:4px 0;
      color:#6b7280;font-style:italic;cursor:text;
    `;
    el.textContent = this.text;
    return el;
  }
  eq(other: BlockquotePreviewWidget) { return this.text === other.text; }
  ignoreEvent() { return false; }
}

class ParagraphPreviewWidget extends WidgetType {
  constructor(readonly text: string) { super(); }
  toDOM(): HTMLElement {
    const el = document.createElement('p');
    el.setAttribute('contenteditable', 'false');
    el.style.cssText = 'margin:0.4em 0;cursor:text;';
    // Render inline formatting
    el.innerHTML = renderInlineMarkdown(this.text);
    return el;
  }
  eq(other: ParagraphPreviewWidget) { return this.text === other.text; }
  ignoreEvent() { return false; }
}

class ListItemPreviewWidget extends WidgetType {
  constructor(readonly text: string, readonly ordered: boolean, readonly index: number) { super(); }
  toDOM(): HTMLElement {
    const el = document.createElement('div');
    el.setAttribute('contenteditable', 'false');
    el.style.cssText = 'margin:0.15em 0 0.15em 1.5em;cursor:text;';
    const marker = this.ordered ? `${this.index}. ` : '• ';
    el.innerHTML = `<span style="margin-right:0.3em">${marker}</span>${renderInlineMarkdown(this.text)}`;
    return el;
  }
  eq(other: ListItemPreviewWidget) { return this.text === other.text && this.ordered === other.ordered && this.index === other.index; }
  ignoreEvent() { return false; }
}

class FencedBlockPreviewWidget extends WidgetType {
  constructor(readonly label: string, readonly content: string, readonly color: string, readonly icon: string) { super(); }
  toDOM(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.setAttribute('contenteditable', 'false');
    wrap.style.cssText = `
      border-left:3px solid ${this.color};border-radius:4px;
      padding:8px 12px;margin:4px 0;cursor:text;
      background:${this.color}11;
    `;
    const header = document.createElement('div');
    header.style.cssText = `font-weight:600;font-size:0.85em;margin-bottom:4px;color:${this.color};`;
    header.textContent = `${this.icon} ${this.label}`;
    const body = document.createElement('div');
    body.style.cssText = 'line-height:1.6;white-space:pre-wrap;';
    body.textContent = this.content;
    wrap.appendChild(header);
    wrap.appendChild(body);
    return wrap;
  }
  eq(other: FencedBlockPreviewWidget) {
    return this.label === other.label && this.content === other.content && this.color === other.color;
  }
  ignoreEvent() { return false; }
}

// ─── Inline Markdown Renderer (simple, no DOM dependency) ────────

function renderInlineMarkdown(text: string): string {
  let html = escapeHtml(text);
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:3px;font-size:0.9em">$1</code>');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a style="color:#3b82f6;text-decoration:underline" href="$2">$1</a>');
  return html;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Line Classification ─────────────────────────────────────────

type LineKind =
  | { type: 'heading'; level: number; text: string }
  | { type: 'hr' }
  | { type: 'blockquote'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bulletItem'; text: string }
  | { type: 'orderedItem'; text: string; index: number }
  | { type: 'fencedStart'; label: string; color: string; icon: string }
  | { type: 'fencedContent'; label: string; color: string; icon: string }
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

function classifyLine(text: string, _lineNum: number, state: EditorState, lineFrom: number): LineKind {
  const trimmed = text.trim();

  if (trimmed === '') return { type: 'empty' };

  // Heading: # H1, ## H2, etc.
  const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch) {
    return { type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() };
  }

  // Horizontal rule: --- or *** or ___
  if (/^[-*_]{3,}\s*$/.test(trimmed)) {
    return { type: 'hr' };
  }

  // Blockquote: > text
  if (/^>\s?/.test(trimmed)) {
    return { type: 'blockquote', text: trimmed.replace(/^>\s?/, '') };
  }

  // Bullet list: - text or * text or + text
  const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
  if (bulletMatch) {
    return { type: 'bulletItem', text: bulletMatch[1] };
  }

  // Ordered list: 1. text
  const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
  if (orderedMatch) {
    return { type: 'orderedItem', text: orderedMatch[2], index: parseInt(orderedMatch[1]) };
  }

  // Fenced block start: ```verse:Ref or ```section:type
  const verseMatch = trimmed.match(/^```verse:(.+)$/);
  if (verseMatch) {
    return { type: 'fencedStart', label: verseMatch[1].trim(), color: '#3b82f6', icon: '📖' };
  }

  const sectionMatch = trimmed.match(/^```section:(.+)$/);
  if (sectionMatch) {
    const sType = sectionMatch[1].trim();
    const info = SECTION_COLORS[sType] || { color: '#8b5cf6', label: sType };
    return { type: 'fencedStart', label: info.label, color: info.color, icon: '📑' };
  }

  // Fenced block end: ```
  if (trimmed === '```') {
    return { type: 'fencedEnd' };
  }

  // Regular paragraph
  return { type: 'paragraph', text: trimmed };
}

// ─── Decoration Builder ──────────────────────────────────────────

/** Get the set of line numbers that the cursor is on */
function getActiveLines(view: EditorView): Set<number> {
  const lines = new Set<number>();
  for (const sel of view.state.selection.ranges) {
    const startLine = view.state.doc.lineAt(sel.from).number;
    const endLine = view.state.doc.lineAt(sel.to).number;
    for (let i = startLine; i <= endLine; i++) {
      lines.add(i);
    }
  }
  return lines;
}

/** Track fenced block state across lines */
interface FencedState {
  active: boolean;
  label: string;
  color: string;
  icon: string;
  contentLines: string[];
  startLineNum: number;
}

function buildDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const state = view.state;
  const doc = state.doc;
  const activeLines = getActiveLines(view);

  let fenced: FencedState | null = null;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const isActive = activeLines.has(i);

    // Inside a fenced block
    if (fenced) {
      fenced.contentLines.push(line.text);
      if (line.text.trim() === '```') {
        // End of fenced block
        if (!isActive && !activeLines.has(fenced.startLineNum)) {
          // Replace entire fenced block with preview widget
          const content = fenced.contentLines.slice(0, -1).join('\n'); // exclude closing ```
          const widget = Decoration.replace({
            widget: new FencedBlockPreviewWidget(fenced.label, content, fenced.color, fenced.icon),
            block: true,
            inclusive: true,
          });
          decorations.push(widget.range(
            doc.line(fenced.startLineNum).from,
            line.to
          ));
        }
        fenced = null;
      }
      continue;
    }

    // Not inside a fenced block
    const kind = classifyLine(line.text, i, state, line.from);

    // Start of a fenced block?
    if (kind.type === 'fencedStart') {
      fenced = {
        active: true,
        label: kind.label,
        color: kind.color,
        icon: kind.icon,
        contentLines: [line.text],
        startLineNum: i,
      };
      continue;
    }

    // If cursor is on this line, show raw Markdown (no decoration)
    if (isActive) continue;

    // Apply preview decoration based on line kind
    switch (kind.type) {
      case 'heading': {
        const widget = Decoration.replace({
          widget: new HeadingPreviewWidget(kind.level, kind.text),
          block: true,
          inclusive: true,
        });
        decorations.push(widget.range(line.from, line.to));
        break;
      }
      case 'hr': {
        const widget = Decoration.replace({
          widget: new HrPreviewWidget(),
          block: true,
          inclusive: true,
        });
        decorations.push(widget.range(line.from, line.to));
        break;
      }
      case 'blockquote': {
        const widget = Decoration.replace({
          widget: new BlockquotePreviewWidget(kind.text),
          block: true,
          inclusive: true,
        });
        decorations.push(widget.range(line.from, line.to));
        break;
      }
      case 'paragraph': {
        const widget = Decoration.replace({
          widget: new ParagraphPreviewWidget(kind.text),
          block: true,
          inclusive: true,
        });
        decorations.push(widget.range(line.from, line.to));
        break;
      }
      case 'bulletItem': {
        const widget = Decoration.replace({
          widget: new ListItemPreviewWidget(kind.text, false, 0),
          block: true,
          inclusive: true,
        });
        decorations.push(widget.range(line.from, line.to));
        break;
      }
      case 'orderedItem': {
        const widget = Decoration.replace({
          widget: new ListItemPreviewWidget(kind.text, true, kind.index),
          block: true,
          inclusive: true,
        });
        decorations.push(widget.range(line.from, line.to));
        break;
      }
      // empty, other, fencedEnd — no decoration
    }
  }

  return Decoration.set(decorations, true);
}

// ─── View Plugin ─────────────────────────────────────────────────

const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);

export function livePreviewExtension(): Extension {
  return [livePreviewPlugin];
}
