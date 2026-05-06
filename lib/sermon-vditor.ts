/**
 * Vditor 工具函数
 * 提供讲道编辑器的 vditor 配置、经文卡片 Markdown 生成、内容解析
 */

import type { IOptions } from 'vditor'

/** 经文引用块解析结果 */
export interface ParsedVerseBlock {
  reference: string
  text: string
}

/**
 * 生成经文引用块 Markdown
 * 格式：> 📖 **创世记 1:1-3**
 *       >
 *       > 起初神创造天地。
 */
export function generateVerseMarkdown(reference: string, text: string): string {
  const lines = text.split('\n')
  const quotedLines = lines.map(line => `> ${line}`).join('\n')
  return `> 📖 **${reference}**\n>\n${quotedLines}`
}

/**
 * 生成段落标题 Markdown
 * 使用带 emoji 的标题格式
 */
export function generateSectionMarkdown(sectionType: string, label: string): string {
  const emojiMap: Record<string, string> = {
    introduction: '🎯',
    main_point: '💡',
    sub_point: '📌',
    illustration: '📖',
    application: '🔧',
    conclusion: '✅',
    prayer: '🙏',
  }
  const emoji = emojiMap[sectionType] || '📝'
  return `\n## ${emoji} ${label}\n`
}

/**
 * 从 Markdown 内容中解析所有经文引用块
 * 匹配格式：> 📖 **书卷 章:节**
 */
export function parseVerseBlocks(markdown: string): ParsedVerseBlock[] {
  const results: ParsedVerseBlock[] = []
  const lines = markdown.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    // 匹配经文引用块起始行：> 📖 **创世记 1:1**
    const headerMatch = line.match(/^>\s*📖\s*\*\*(.+?)\*\*\s*$/)
    if (headerMatch) {
      const reference = headerMatch[1]
      const textLines: string[] = []
      i++ // 跳过标题行

      // 跳过空引用行 (> )
      if (i < lines.length && lines[i].match(/^>\s*$/)) {
        i++
      }

      // 收集引用块内容
      while (i < lines.length) {
        const contentMatch = lines[i].match(/^>\s?(.*)$/)
        if (contentMatch) {
          textLines.push(contentMatch[1])
          i++
        } else {
          break
        }
      }

      results.push({
        reference,
        text: textLines.join('\n'),
      })
    } else {
      i++
    }
  }

  return results
}

/**
 * 创建 vditor 初始化配置
 */
export function createVditorOptions(options: {
  isDark: boolean
  initialValue?: string
  onAfterInit?: () => void
  onInput?: (markdown: string) => void
  onSave?: () => void
}): IOptions {
  const { isDark, initialValue, onAfterInit, onInput, onSave } = options

  return {
    mode: 'ir',
    theme: isDark ? 'dark' : 'classic',
    icon: 'ant',
    lang: 'zh_CN',
    placeholder: '开始撰写讲道...',
    height: 'auto',
    minHeight: 300,
    value: initialValue || '',
    toolbar: [
      'headings',
      'bold',
      'italic',
      'strike',
      '|',
      'list',
      'ordered-list',
      'check',
      '|',
      'quote',
      'code',
      'inline-code',
      '|',
      'link',
      'table',
      '|',
      'undo',
      'redo',
      '|',
      'fullscreen',
      'edit-mode',
    ],
    toolbarConfig: {
      pin: true,
    },
    counter: {
      enable: true,
      type: 'text',
    },
    cache: {
      enable: false,
    },
    preview: {
      markdown: {
        paragraphBeginningSpace: true,
        autoSpace: true,
        fixTermTypo: true,
      },
      theme: {
        current: isDark ? 'dark' : 'light',
      },
      hljs: {
        style: isDark ? 'dracula' : 'github',
        enable: true,
      },
    },
    hint: {
      parse: false,
      emoji: {},
    },
    after() {
      onAfterInit?.()
    },
    input(value: string) {
      onInput?.(value)
    },
    keydown(event: KeyboardEvent) {
      // Cmd+S / Ctrl+S 保存
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault()
        onSave?.()
      }
    },
  }
}

/** 段落类型定义 */
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

export const SECTION_LABELS: Record<SectionType, string> = {
  introduction: '引言',
  main_point: '要点',
  sub_point: '分点',
  illustration: '例证',
  application: '应用',
  conclusion: '结论',
  prayer: '祷告',
}
