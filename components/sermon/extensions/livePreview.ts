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
    const el = document.createElement('div');
    el.className = 'cm-preview-widget';
    el.setAttribute('contenteditable', 'false');

    const sizes: Record<number, string> = {
      1: '1.8em', 2: '1.5em', 3: '1.25em', 4: '1.1em', 5: '1em', 6: '0.9em',
    };
    el.style.cssText = `
      font-size: ${sizes[this.level] || '1em'};
      font-weight: 700;
      margin: 0.6em 0 0.3em;
      line-height: 1.3;
      cursor: text;
    `;
    el.textContent = this.text;
    return el;
  }

  eq(other: HeadingWidget): boolean {
    return this.level === other.level && this.text === other.text;
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

/** Widget for rendering a blockquote */
class BlockquoteWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  toDOM(): HTMLElement {
    const el = document.createElement('blockquote');
    el.className = 'cm-preview-widget';
    el.setAttribute('contenteditable', 'false');
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

/** Check if cursor is inside a given range */
function isCursorInRange(view: EditorView, from: number, to: number): boolean {
  for (const range of view.state.selection.ranges) {
    if (range.from >= from && range.from <= to) return true;
    if (range.to >= from && range.to <= to) return true;
    if (range.from <= from && range.to >= to) return true;
  }
  return false;
}

/** Get heading level from HeaderMark node text (count # chars) */
function getHeadingLevel(text: string): number {
  const match = text.match(/^(#{1,6})\s/);
  return match ? match[1].length : 1;
}

/** Strip heading markers and get clean text */
function getHeadingText(text: string): string {
  return text.replace(/^#{1,6}\s+/, '').trim();
}

/** Build live preview decorations */
function buildLivePreviewDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const state = view.state;
  const doc = state.doc;

  // Track verse/section block ranges to skip
  const skipRanges: { from: number; to: number }[] = [];
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    if (line.text.match(/^```(verse|section):/)) {
      const startFrom = line.from;
      let endLine = i + 1;
      while (endLine <= doc.lines && doc.line(endLine).text.trim() !== '```') {
        endLine++;
      }
      const endTo = endLine <= doc.lines ? doc.line(endLine).to : doc.line(doc.lines).to;
      skipRanges.push({ from: startFrom, to: endTo });
      i = endLine;
    }
  }

  /** Check if position is inside a skip range */
  function isInSkipRange(from: number, to: number): boolean {
    return skipRanges.some(r => from >= r.from && to <= r.to);
  }

  syntaxTree(state).iterate({
    enter(node) {
      // ATXHeading is the node type used by @codemirror/lang-markdown
      if (node.name === 'ATXHeading') {
        const lineFrom = doc.lineAt(node.from).from;
        const lineTo = doc.lineAt(node.to).to;

        if (isInSkipRange(lineFrom, lineTo)) return;

        if (!isCursorInRange(view, lineFrom, lineTo)) {
          const rawText = doc.sliceString(lineFrom, lineTo);
          const level = getHeadingLevel(rawText);
          const headingText = getHeadingText(rawText);

          if (headingText) {
            const widget = Decoration.replace({
              widget: new HeadingWidget(level, headingText),
              block: true,
            });
            decorations.push(widget.range(lineFrom, lineTo));
          }
        }
      }

      if (node.name === 'HorizontalRule') {
        const lineFrom = doc.lineAt(node.from).from;
        const lineTo = doc.lineAt(node.to).to;

        if (isInSkipRange(lineFrom, lineTo)) return;

        if (!isCursorInRange(view, lineFrom, lineTo)) {
          const widget = Decoration.replace({
            widget: new HorizontalRuleWidget(),
            block: true,
          });
          decorations.push(widget.range(lineFrom, lineTo));
        }
      }

      // Blockquote - the node name is "Blockquote"
      if (node.name === 'Blockquote') {
        const lineFrom = doc.lineAt(node.from).from;
        const lineTo = doc.lineAt(node.to).to;

        if (isInSkipRange(lineFrom, lineTo)) return;

        if (!isCursorInRange(view, lineFrom, lineTo)) {
          const rawText = doc.sliceString(lineFrom, lineTo);
          // Strip > markers from each line
          const cleanText = rawText.split('\n').map(l => l.replace(/^>\s?/, '')).join('\n').trim();

          if (cleanText) {
            const widget = Decoration.replace({
              widget: new BlockquoteWidget(cleanText),
              block: true,
            });
            decorations.push(widget.range(lineFrom, lineTo));
          }
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

export function livePreviewExtension(): Extension {
  return [livePreviewPlugin];
}