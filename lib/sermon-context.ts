/**
 * 讲章全文上下文构建
 * 为 AI 操作提供全文感知的上下文摘要，确保风格一致性和结构感知
 */

/** 讲章全文上下文（注入到每次 AI 调用的 system message） */
export interface SermonContext {
  /** 讲章主题/标题 */
  theme: string
  /** 经文引用 */
  scriptureRef: string
  /** 大纲摘要（各标题一行，保持结构感知） */
  outlineSummary: string
  /** 当前段落对应的大纲标题 */
  currentSectionTitle: string
  /** 上一段末尾 200 字（过渡衔接） */
  previousSection: string
  /** 下一段开头 200 字（前瞻衔接） */
  nextSection: string
  /** 全文字数 */
  totalWordCount: number
  /** 目标字数（根据体裁推算） */
  targetWordCount: number
  /** 讲道体裁 */
  style: string
  /** 当前流程阶段 */
  flowStage: string
  /** 讲道者声音描述（P2 阶段实现，当前为空） */
  voiceProfile?: string
}

/** 体裁对应的目标字数范围 */
const STYLE_TARGET_WORDS: Record<string, number> = {
  EXPOSITORY: 3000,
  TOPICAL: 2500,
  NARRATIVE: 2000,
  FREE: 2500,
}

/**
 * 从 Markdown 内容中提取大纲摘要
 * 提取所有 ## 和 ### 标题行，保持层级缩进
 */
function extractOutlineSummary(content: string): string {
  const lines = content.split('\n')
  const headings: string[] = []

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/)
    const h3Match = line.match(/^###\s+(.+)/)
    const h1Match = line.match(/^#\s+(.+)/)

    if (h1Match) {
      headings.push(h1Match[1].trim())
    } else if (h2Match) {
      headings.push(`  ${h2Match[1].trim()}`)
    } else if (h3Match) {
      headings.push(`    ${h3Match[1].trim()}`)
    }
  }

  return headings.join('\n')
}

/**
 * 将内容按 ## 标题拆分为段落
 * 返回段落数组，每个段落包含标题和内容
 */
function splitSections(content: string): Array<{ title: string; content: string }> {
  const lines = content.split('\n')
  const sections: Array<{ title: string; content: string }> = []
  let currentTitle = ''
  let currentContent: string[] = []

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (currentTitle || currentContent.length > 0) {
        sections.push({
          title: currentTitle,
          content: currentContent.join('\n').trim(),
        })
      }
      currentTitle = line.replace(/^##\s+/, '').trim()
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }

  // 最后一个段落
  if (currentTitle || currentContent.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentContent.join('\n').trim(),
    })
  }

  return sections
}

/**
 * 根据光标位置找到当前所在的段落
 */
function findCurrentSection(
  sections: Array<{ title: string; content: string }>,
  cursorPosition: number,
  fullContent: string
): { sectionIndex: number; sectionTitle: string } {
  let charCount = 0

  for (let i = 0; i < sections.length; i++) {
    const sectionText = sections[i].title
      ? `## ${sections[i].title}\n${sections[i].content}`
      : sections[i].content
    charCount += sectionText.length + 1 // +1 for newline

    if (charCount >= cursorPosition) {
      return { sectionIndex: i, sectionTitle: sections[i].title }
    }
  }

  // 默认返回最后一个段落
  const lastSection = sections[sections.length - 1]
  return {
    sectionIndex: sections.length - 1,
    sectionTitle: lastSection?.title ?? '',
  }
}

/**
 * 截取文本到指定字符数，在句子边界处截断
 */
function truncateAtSentence(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text

  const truncated = text.slice(0, maxChars)
  // 在最后一个句号/问号/感叹号处截断
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('？'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('?'),
    truncated.lastIndexOf('!')
  )

  if (lastSentenceEnd > maxChars * 0.5) {
    return truncated.slice(0, lastSentenceEnd + 1)
  }
  return truncated
}

/**
 * 构建讲章全文上下文
 *
 * @param fullContent - 讲章完整 Markdown 内容
 * @param cursorPosition - 光标在全文中的位置（字符偏移）
 * @param options - 可选的元信息
 * @returns SermonContext 上下文对象
 */
export function buildSermonContext(
  fullContent: string,
  cursorPosition: number,
  options: {
    title?: string
    verseRefs?: string
    style?: string
    flowStage?: string
    voiceProfile?: string
  } = {}
): SermonContext {
  const sections = splitSections(fullContent)
  const { sectionIndex, sectionTitle } = findCurrentSection(sections, cursorPosition, fullContent)
  const outlineSummary = extractOutlineSummary(fullContent)
  const totalWordCount = fullContent.length
  const targetWordCount = STYLE_TARGET_WORDS[options.style ?? 'FREE'] ?? 2500

  // 上一段末尾 200 字
  const prevSection = sectionIndex > 0 ? sections[sectionIndex - 1] : null
  const previousSection = prevSection
    ? truncateAtSentence(prevSection.content, 200)
    : ''

  // 下一段开头 200 字
  const nextSection = sectionIndex < sections.length - 1 ? sections[sectionIndex + 1] : null
  const nextSectionText = nextSection
    ? truncateAtSentence(nextSection.content, 200)
    : ''

  return {
    theme: options.title ?? '',
    scriptureRef: options.verseRefs ?? '',
    outlineSummary,
    currentSectionTitle: sectionTitle,
    previousSection,
    nextSection: nextSectionText,
    totalWordCount,
    targetWordCount,
    style: options.style ?? 'FREE',
    flowStage: options.flowStage ?? 'draft',
    voiceProfile: options.voiceProfile,
  }
}

/**
 * 将 SermonContext 序列化为 AI system message 文本
 * 控制在约 800 token（中文约 400 字）
 */
export function serializeContext(context: SermonContext): string {
  const parts: string[] = []

  if (context.theme) {
    parts.push(`【主题】${context.theme}`)
  }

  if (context.scriptureRef) {
    parts.push(`【经文】${context.scriptureRef}`)
  }

  if (context.style) {
    const styleMap: Record<string, string> = {
      EXPOSITORY: '释经式',
      TOPICAL: '主题式',
      NARRATIVE: '叙事式',
      FREE: '自由式',
    }
    parts.push(`【体裁】${styleMap[context.style] ?? context.style}`)
  }

  if (context.outlineSummary) {
    parts.push(`【大纲】\n${context.outlineSummary}`)
  }

  if (context.currentSectionTitle) {
    parts.push(`【当前段落】${context.currentSectionTitle}`)
  }

  if (context.previousSection) {
    parts.push(`【前段末尾】...${context.previousSection}`)
  }

  if (context.nextSection) {
    parts.push(`【下段开头】${context.nextSection}...`)
  }

  parts.push(`【进度】${context.totalWordCount}/${context.targetWordCount}字，阶段：${context.flowStage}`)

  if (context.voiceProfile) {
    parts.push(`【声音风格】${context.voiceProfile}`)
  }

  return parts.join('\n')
}
