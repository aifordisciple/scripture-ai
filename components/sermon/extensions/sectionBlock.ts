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

function isCursorInRange(view: EditorView, from: number, to: number): boolean {
  for (const range of view.state.selection.ranges) {
    if (range.from >= from && range.from <= to) return true;
    if (range.to >= from && range.to <= to) return true;
    if (range.from <= from && range.to >= to) return true;
  }
  return false;
}

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

export function sectionBlockExtension(): Extension {
  return [sectionBlockPlugin];
}
