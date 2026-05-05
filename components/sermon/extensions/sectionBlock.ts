/**
 * Milkdown plugin for section blocks (```section:type ... ```)
 *
 * Defines a ProseMirror node schema, remark parser/serializer,
 * and a NodeView that renders a styled section card.
 */
import { $nodeSchema, $command, $view } from '@milkdown/utils'
import type { NodeViewConstructor } from '@milkdown/prose/view'
import type { Node as ProseNode, NodeType } from '@milkdown/prose/model'
import type { EditorView } from '@milkdown/prose/view'
import type { Ctx } from '@milkdown/ctx'

// ─── Section type definitions ────────────────────────────────────

export const SECTION_TYPES = [
  'introduction',
  'main_point',
  'sub_point',
  'illustration',
  'application',
  'conclusion',
  'prayer',
] as const

export type SectionType = (typeof SECTION_TYPES)[number]

export const SECTION_COLORS: Record<string, { color: string; label: string }> = {
  introduction: { color: '#3b82f6', label: '引言' },
  main_point: { color: '#10b981', label: '要点' },
  sub_point: { color: '#f59e0b', label: '分点' },
  illustration: { color: '#ec4899', label: '例证' },
  application: { color: '#8b5cf6', label: '应用' },
  conclusion: { color: '#ef4444', label: '结论' },
  prayer: { color: '#d97706', label: '祷告' },
}

// ─── Schema ───────────────────────────────────────────────────────

export const sectionBlockSchema = $nodeSchema('section_block', () => ({
  content: 'text*',
  group: 'block',
  marks: '',
  defining: true,
  code: true,
  attrs: {
    sectionType: { default: 'introduction', validate: 'string' },
  },
  parseDom: [
    {
      tag: 'div[data-section]',
      getAttrs: (dom: HTMLElement | string) => {
        if (!(dom instanceof HTMLElement)) return false
        return { sectionType: dom.dataset.section || 'introduction' }
      },
    },
  ],
  toDom: (node: ProseNode) => ['div', { 'data-section': node.attrs.sectionType }, 0],
  parseMarkdown: {
    match: (node: any) => node.type === 'code' && typeof node.meta === 'string' && node.meta.startsWith('section:'),
    runner: (state: any, node: any, type: NodeType) => {
      const meta = (node.meta as string) || ''
      const sectionType = meta.replace(/^section:/, '')
      const value = (node.value as string) || ''
      state.openNode(type, { sectionType })
      if (value) state.addText(value)
      state.closeNode()
    },
  },
  toMarkdown: {
    match: (node: ProseNode) => node.type.name === 'section_block',
    runner: (state: any, node: ProseNode) => {
      const text = node.content.firstChild?.text || ''
      state.addNode('code', undefined, text, {
        meta: `section:${node.attrs.sectionType}`,
      })
    },
  },
}))

// ─── Insert Command ───────────────────────────────────────────────

export const insertSectionBlockCommand = $command(
  'InsertSectionBlock',
  (ctx) =>
    ((attrs: { sectionType: string; text?: string }) =>
    (state: any, dispatch?: any, view?: any) => {
      const type = sectionBlockSchema.type(ctx)
      const { sectionType, text = '' } = attrs
      const node = type.create({ sectionType }, text ? state.schema.text(text) : undefined)
      if (!node) return false
      if (dispatch) {
        const tr = state.tr.replaceSelectionWith(node)
        dispatch(tr)
      }
      return true
    }) as any
)

// ─── NodeView (renders styled section card) ──────────────────────

class SectionBlockView {
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
    this.contentDOM = this.dom.querySelector('.section-content')!
  }

  private createDom(): HTMLElement {
    const sectionType = this.node.attrs.sectionType || 'introduction'
    const info = SECTION_COLORS[sectionType] || { color: '#8b5cf6', label: sectionType }

    const wrap = document.createElement('div')
    wrap.className = 'sermon-section-card'
    wrap.dataset.section = sectionType
    wrap.style.borderLeftColor = info.color

    const header = document.createElement('div')
    header.className = 'sermon-section-card-header'
    header.style.color = info.color
    header.textContent = `📑 ${info.label}`

    const body = document.createElement('div')
    body.className = 'sermon-section-card-body section-content'

    wrap.appendChild(header)
    wrap.appendChild(body)
    return wrap
  }

  update(node: ProseNode) {
    if (node.type !== this.node.type) return false
    this.node = node
    const sectionType = node.attrs.sectionType || 'introduction'
    const info = SECTION_COLORS[sectionType] || { color: '#8b5cf6', label: sectionType }
    this.dom.dataset.section = sectionType
    this.dom.style.borderLeftColor = info.color
    const header = this.dom.querySelector('.sermon-section-card-header') as HTMLElement | null
    if (header) {
      header.style.color = info.color
      header.textContent = `📑 ${info.label}`
    }
    return true
  }

  selectNode() { this.dom.classList.add('ProseMirror-selectednode') }
  deselectNode() { this.dom.classList.remove('ProseMirror-selectednode') }
  stopEvent() { return true }
  ignoreMutation() { return true }
  destroy() { this.dom.remove() }
}

export const sectionBlockView = $view(sectionBlockSchema.node, (ctx: Ctx): NodeViewConstructor => {
  return (node, view, getPos) => new SectionBlockView(node, view, getPos) as any
})