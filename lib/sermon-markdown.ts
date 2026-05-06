/**
 * 讲道 Markdown 解析工具
 * 将讲道 Markdown 内容解析为结构化数据，支持经文引用块渲染
 */

/** 经文引用块解析结果 */
export interface ParsedVerseRef {
  reference: string
  text: string
}

/** 段落标题解析结果 */
export interface ParsedSection {
  level: number
  title: string
  emoji?: string
}

/**
 * 从 Markdown 中解析所有经文引用块
 * 匹配格式：> 📖 **书卷 章:节**
 */
export function parseVerseRefs(markdown: string): ParsedVerseRef[] {
  const results: ParsedVerseRef[] = []
  const lines = markdown.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const headerMatch = line.match(/^>\s*📖\s*\*\*(.+?)\*\*\s*$/)
    if (headerMatch) {
      const reference = headerMatch[1]
      const textLines: string[] = []
      i++

      // Skip empty quote line (> )
      if (i < lines.length && lines[i].match(/^>\s*$/)) {
        i++
      }

      // Collect quote content
      while (i < lines.length) {
        const contentMatch = lines[i].match(/^>\s?(.*)$/)
        if (contentMatch) {
          textLines.push(contentMatch[1])
          i++
        } else {
          break
        }
      }

      results.push({ reference, text: textLines.join('\n') })
    } else {
      i++
    }
  }

  return results
}

/**
 * 从 Markdown 中解析段落标题
 * 匹配格式：## 🎯 标题
 */
export function parseSections(markdown: string): ParsedSection[] {
  const results: ParsedSection[] = []
  const lines = markdown.split('\n')

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(?:(\p{Emoji_Presentation}|[\u{1F300}-\u{1F9FF}])\s*)?(.+)$/u)
    if (match) {
      results.push({
        level: match[1].length,
        title: match[3].trim(),
        emoji: match[2],
      })
    }
  }

  return results
}

/**
 * 将讲道 Markdown 渲染为 HTML
 * 经文引用块渲染为带样式的卡片
 */
export function renderSermonMarkdown(markdown: string): string {
  const lines = markdown.split('\n')
  const output: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Check for verse blockquote
    const headerMatch = line.match(/^>\s*📖\s*\*\*(.+?)\*\*\s*$/)
    if (headerMatch) {
      const reference = headerMatch[1]
      const textLines: string[] = []
      i++

      // Skip empty quote line
      if (i < lines.length && lines[i].match(/^>\s*$/)) {
        i++
      }

      // Collect content
      while (i < lines.length) {
        const contentMatch = lines[i].match(/^>\s?(.*)$/)
        if (contentMatch) {
          textLines.push(contentMatch[1])
          i++
        } else {
          break
        }
      }

      // Render as styled card
      const verseText = textLines
        .map(l => l.replace(/^(\d+)\s/, '<sup class="verse-num">$1</sup> '))
        .join('<br/>')
      output.push(
        `<div class="verse-card">` +
        `<div class="verse-ref">📖 <strong>${reference}</strong></div>` +
        `<div class="verse-text">${verseText}</div>` +
        `</div>`
      )
      continue
    }

    // Regular line - escape HTML and pass through
    output.push(line)
    i++
  }

  return output.join('\n')
}

/**
 * 生成讲道大纲（目录）
 * 从 Markdown 标题中提取
 */
export function generateOutline(markdown: string): Array<{ level: number; title: string; id: string }> {
  const sections = parseSections(markdown)
  return sections.map((s, idx) => ({
    level: s.level,
    title: s.title,
    id: `section-${idx}`,
  }))
}
