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
import { EditorState, Extension, Range } from '@codemirror/state';

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

function buildVerseDecorations(view: EditorView): DecorationSet {
  const blocks = findVerseBlocks(view.state);
  const decorations: Range<Decoration>[] = [];

  for (const block of blocks) {
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

export function verseBlockExtension(): Extension {
  return [verseBlockPlugin];
}
