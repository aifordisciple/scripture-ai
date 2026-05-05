/**
 * Milkdown plugin for verse blocks (```verse:Reference ... ```)
 *
 * Defines a ProseMirror node schema, remark parser/serializer,
 * and a NodeView that renders a styled verse card.
 */
import { $nodeSchema, $command, $view } from '@milkdown/utils'
import type { NodeViewConstructor } from '@milkdown/prose/view'
import type { Node as ProseNode, NodeType } from '@milkdown/prose/model'
import type { EditorView } from '@milkdown/prose/view'
import type { Ctx } from '@milkdown/ctx'

// ─── Schema ───────────────────────────────────────────────────────

export const verseBlockSchema = $nodeSchema('verse_block', () => ({
  content: 'text*',
  group: 'block',
  marks: '',
  defining: true,
  code: true,
  attrs: {
    reference: { default: '', validate: 'string' },
  },
  parseDom: [
    {
      tag: 'div[data-verse]',
      getAttrs: (dom: HTMLElement | string) => {
        if (!(dom instanceof HTMLElement)) return false
        return { reference: dom.dataset.verse || '' }
      },
    },
  ],
  toDom: (node: ProseNode) => ['div', { 'data-verse': node.attrs.reference }, 0],
  parseMarkdown: {
    match: (node: any) => node.type === 'code' && typeof node.meta === 'string' && node.meta.startsWith('verse:'),
    runner: (state: any, node: any, type: NodeType) => {
      const meta = (node.meta as string) || ''
      const reference = meta.replace(/^verse:/, '')
      const value = (node.value as string) || ''
      state.openNode(type, { reference })
      if (value) state.addText(value)
      state.closeNode()
    },
  },
  toMarkdown: {
    match: (node: ProseNode) => node.type.name === 'verse_block',
    runner: (state: any, node: ProseNode) => {
      const text = node.content.firstChild?.text || ''
      state.addNode('code', undefined, text, {
        meta: `verse:${node.attrs.reference}`,
      })
    },
  },
}))

// ─── Insert Command ───────────────────────────────────────────────

export const insertVerseBlockCommand = $command(
  'InsertVerseBlock',
  (ctx) =>
    ((attrs: { reference: string; text?: string }) =>
    (state: any, dispatch?: any, view?: any) => {
      const type = verseBlockSchema.type(ctx)
      const { reference, text = '' } = attrs
      const node = type.create({ reference }, text ? state.schema.text(text) : undefined)
      if (!node) return false
      if (dispatch) {
        const tr = state.tr.replaceSelectionWith(node)
        dispatch(tr)
      }
      return true
    }) as any
)

// ─── NodeView (renders styled verse card) ────────────────────────

class VerseBlockView {
  dom: HTMLElement
  contentDOM: HTMLElement
  node: ProseNode
  view: EditorView
  getPos: () => number | undefined

  constructor(node: ProseNode, view: EditorView, getPos: () => number | undefined) {
    this.node = node
    this.view = view
    this.getPos = getPos
    this.dom = this.createDom()
    this.contentDOM = this.dom.querySelector('.verse-content')!
  }

  private createDom(): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'sermon-verse-card'
    wrap.dataset.verse = this.node.attrs.reference

    const header = document.createElement('div')
    header.className = 'sermon-verse-card-header'
    const refIcon = document.createElement('span')
    refIcon.className = 'sermon-verse-icon'
    refIcon.textContent = '📖'
    const refText = document.createElement('span')
    refText.className = 'sermon-verse-ref'
    refText.textContent = this.node.attrs.reference
    header.appendChild(refIcon)
    header.appendChild(refText)

    const body = document.createElement('div')
    body.className = 'sermon-verse-card-body verse-content'

    wrap.appendChild(header)
    wrap.appendChild(body)
    return wrap
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false
    this.node = node
    this.dom.dataset.verse = node.attrs.reference
    const refEl = this.dom.querySelector('.sermon-verse-ref')
    if (refEl) refEl.textContent = node.attrs.reference
    return true
  }

  selectNode() { this.dom.classList.add('ProseMirror-selectednode') }
  deselectNode() { this.dom.classList.remove('ProseMirror-selectednode') }
  stopEvent() { return true }
  ignoreMutation() { return true }
  destroy() { this.dom.remove() }
}

export const verseBlockView = $view(verseBlockSchema.node, (ctx: Ctx): NodeViewConstructor => {
  return (node, view, getPos) => new VerseBlockView(node, view, getPos) as any
})