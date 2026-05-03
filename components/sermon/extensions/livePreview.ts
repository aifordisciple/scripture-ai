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

function getNodeLineRange(state: EditorState, from: number, to: number): { from: number; to: number } {
  const startLine = state.doc.lineAt(from);
  const endLine = state.doc.lineAt(to);
  return { from: startLine.from, to: endLine.to };
}

function isCursorInRange(view: EditorView, from: number, to: number): boolean {
  for (const range of view.state.selection.ranges) {
    if (range.from >= from && range.from <= to) return true;
    if (range.to >= from && range.to <= to) return true;
    if (range.from <= from && range.to >= to) return true;
  }
  return false;
}

function getNodeText(state: EditorState, from: number, to: number): string {
  return state.doc.sliceString(from, to);
}

function buildLivePreviewDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const state = view.state;

  syntaxTree(state).iterate({
    enter(node) {
      const lineText = state.doc.lineAt(node.from).text;
      if (lineText.startsWith('```verse:') || lineText.startsWith('```section:')) {
        return false;
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
