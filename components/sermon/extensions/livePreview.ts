/**
 * CodeMirror extension for Obsidian-like seamless live preview
 *
 * Behavior: When the cursor is NOT on a line, that line's Markdown
 * is hidden and replaced with a rendered preview widget. When the
 * cursor enters that line, the preview is removed and raw Markdown
 * is shown for editing.
 *
 * IMPORTANT: CodeMirror 6 forbids:
 *   - Block decorations (block:true) in ViewPlugin
 *   - Replace decorations that cross line breaks in ViewPlugin
 *
 * Strategy: Use Decoration.replace({ widget }) per-line to atomically
 * replace line content with a preview widget. line.from to line.to
 * does NOT include the line break, so each replace stays within one line.
 * Fenced blocks: first line gets replace+widget, remaining lines get
 * plain replace to hide content.
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

// ─── Preview Widgets (all inline <span>, inherit editor lineHeight) ────────

class HeadingPreviewWidget extends WidgetType {
  constructor(readonly level: number, readonly text: string) { super(); }
  toDOM(): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'cm-livepreview-heading';
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
    el.className = 'cm-livepreview-hr';
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
    el.className = 'cm-livepreview-blockquote';
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
    el.className = 'cm-livepreview-paragraph';
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
    el.className = 'cm-livepreview-listitem';
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
  constructor(readonly label: string, readonly content: string, readonly color: string, readonly icon: string) { super(); }
  toDOM(): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'cm-livepreview-fenced';
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
    return this.label === other.label && this.content === other.content && this.color === other.color;
  }
  ignoreEvent() { return false; }
}

// ─── Inline Markdown Renderer (simple, no DOM dependency) ────────

function renderInlineMarkdown(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  html = html.replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:3px;font-size:0.9em">$1</code>');
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

  const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch) {
    return { type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() };
  }

  if (/^[-*_]{3,}\s*$/.test(trimmed)) {
    return { type: 'hr' };
  }

  if (/^>\s?/.test(trimmed)) {
    return { type: 'blockquote', text: trimmed.replace(/^>\s?/, '') };
  }

  const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
  if (bulletMatch) {
    return { type: 'bulletItem', text: bulletMatch[1] };
  }

  const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
  if (orderedMatch) {
    return { type: 'orderedItem', text: orderedMatch[2], index: parseInt(orderedMatch[1]) };
  }

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

  if (trimmed === '```') {
    return { type: 'fencedEnd' };
  }

  return { type: 'paragraph', text: trimmed };
}

// ─── Decoration Builder ──────────────────────────────────────────

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

interface FencedState {
  active: boolean;
  label: string;
  color: string;
  icon: string;
  contentLines: string[];
  startLineNum: number;
}

/**
 * Replace a single line's content with a preview widget.
 * Uses Decoration.replace({ widget }) to atomically replace the line
 * content with the widget. line.from to line.to does NOT include the
 * line break character, so this stays within one line.
 */
function replaceLineWithWidget(
  decorations: Range<Decoration>[],
  lineFrom: number,
  lineTo: number,
  widget: WidgetType,
): void {
  decorations.push(
    Decoration.replace({ widget }).range(lineFrom, lineTo)
  );
}

/**
 * Decorate a fenced block: replace the first line with a preview widget,
 * and replace each subsequent line with empty content to hide it.
 * Each Decoration.replace stays within its own line (no cross-line).
 */
function decorateFencedBlock(
  decorations: Range<Decoration>[],
  view: EditorView,
  startLineNum: number,
  endLineNum: number,
  widget: WidgetType,
): void {
  const doc = view.state.doc;

  // First line: replace with preview widget
  const startLine = doc.line(startLineNum);
  decorations.push(
    Decoration.replace({ widget }).range(startLine.from, startLine.to)
  );

  // Remaining lines (including the closing ```): replace with empty
  for (let i = startLineNum + 1; i <= endLineNum; i++) {
    const line = doc.line(i);
    decorations.push(
      Decoration.replace({ inclusive: true }).range(line.from, line.to)
    );
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const state = view.state;
  const doc = state.doc;
  const activeLines = getActiveLines(view);

  let fenced: FencedState | null = null;

  try {
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const isActive = activeLines.has(i);

      // Inside a fenced block
      if (fenced) {
        fenced.contentLines.push(line.text);
        if (line.text.trim() === '```') {
          // End of fenced block
          const endLineNum = i;
          if (!isActive && !activeLines.has(fenced.startLineNum)) {
            const content = fenced.contentLines.slice(0, -1).join('\n');
            decorateFencedBlock(
              decorations,
              view,
              fenced.startLineNum,
              endLineNum,
              new FencedBlockPreviewWidget(fenced.label, content, fenced.color, fenced.icon),
            );
          }
          fenced = null;
        }
        continue;
      }

      const kind = classifyLine(line.text, i, state, line.from);

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

      if (isActive) continue;

      switch (kind.type) {
        case 'heading':
          replaceLineWithWidget(
            decorations, line.from, line.to,
            new HeadingPreviewWidget(kind.level, kind.text),
          );
          break;
        case 'hr':
          replaceLineWithWidget(
            decorations, line.from, line.to,
            new HrPreviewWidget(),
          );
          break;
        case 'blockquote':
          replaceLineWithWidget(
            decorations, line.from, line.to,
            new BlockquotePreviewWidget(kind.text),
          );
          break;
        case 'paragraph':
          if (!kind.text) continue;
          replaceLineWithWidget(
            decorations, line.from, line.to,
            new ParagraphPreviewWidget(kind.text),
          );
          break;
        case 'bulletItem':
          replaceLineWithWidget(
            decorations, line.from, line.to,
            new ListItemPreviewWidget(kind.text, false, 0),
          );
          break;
        case 'orderedItem':
          replaceLineWithWidget(
            decorations, line.from, line.to,
            new ListItemPreviewWidget(kind.text, true, kind.index),
          );
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
