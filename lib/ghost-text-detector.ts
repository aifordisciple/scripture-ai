/**
 * ghost-text-detector — Context-aware ghost text type detection
 *
 * Analyzes the editor content and cursor position to determine
 * what type of ghost text suggestion would be most helpful.
 *
 * Inspired by:
 * - Cursor: context-aware inline completions
 * - Sudowrite: Story Engine beat-aware suggestions
 * - Notion AI: position-aware AI suggestions
 */

export type GhostTextType = 'continue' | 'illustration' | 'application' | 'transition' | 'prayer'

export interface GhostTextContext {
  /** Full document content */
  content: string
  /** Cursor position (character offset) */
  cursorPosition: number
  /** Current flow stage */
  flowStage?: string
  /** Whether the cursor is at the end of a section (before next ## heading) */
  isAtSectionEnd?: boolean
  /** Whether the cursor is at the start of a section (right after ## heading) */
  isAtSectionStart?: boolean
  /** The current section title (nearest ## above cursor) */
  currentSectionTitle?: string
  /** The next section title (nearest ## below cursor) */
  nextSectionTitle?: string
  /** Number of sentences in the current paragraph */
  currentParagraphSentences?: number
  /** Whether the current paragraph has an illustration/example */
  hasIllustration?: boolean
  /** Whether the current paragraph has application points */
  hasApplication?: boolean
}

/**
 * Detect the optimal ghost text type based on writing context.
 *
 * Rules:
 * - At section start → 'continue' (introductory content)
 * - At section end with next section → 'transition' (bridge to next section)
 * - After illustration/example, no application → 'application' (apply the truth)
 * - In conclusion section → 'prayer' (closing prayer)
 * - Thin paragraph (<3 sentences), no illustration → 'illustration' (add vivid example)
 * - Default → 'continue' (keep writing)
 */
export function detectGhostTextType(ctx: GhostTextContext): GhostTextType {
  const {
    currentSectionTitle,
    nextSectionTitle,
    isAtSectionEnd,
    isAtSectionStart,
    currentParagraphSentences = 0,
    hasIllustration = false,
    hasApplication = false,
    flowStage,
  } = ctx

  // In polish/done stage, don't auto-suggest
  if (flowStage === 'done') return 'continue'

  // At section end with a next section → suggest transition
  if (isAtSectionEnd && nextSectionTitle) {
    return 'transition'
  }

  // In conclusion section → suggest prayer
  const sectionTitle = (currentSectionTitle || '').toLowerCase()
  const isConclusionSection = sectionTitle.includes('结论') ||
    sectionTitle.includes('conclusion') ||
    sectionTitle.includes('总结') ||
    sectionTitle.includes('summary') ||
    sectionTitle.includes('结语') ||
    sectionTitle.includes('closing')

  if (isConclusionSection && isAtSectionEnd) {
    return 'prayer'
  }

  // After illustration but no application → suggest application
  if (hasIllustration && !hasApplication) {
    return 'application'
  }

  // Thin paragraph without illustration → suggest illustration
  if (currentParagraphSentences > 0 && currentParagraphSentences < 3 && !hasIllustration) {
    return 'illustration'
  }

  // At section start → continue (introductory content)
  if (isAtSectionStart) {
    return 'continue'
  }

  // Default: continue writing
  return 'continue'
}

/**
 * Analyze the editor content at a cursor position to build a GhostTextContext.
 */
export function analyzeGhostTextContext(
  content: string,
  cursorPosition: number,
  flowStage?: string,
): GhostTextContext {
  const textBeforeCursor = content.slice(0, cursorPosition)
  const textAfterCursor = content.slice(cursorPosition)

  // Find current section (nearest ## above cursor)
  const headingBeforeMatch = textBeforeCursor.match(/##\s+([^\n]+)(?:\n[^\n]*)*$/)
  const currentSectionTitle = headingBeforeMatch?.[1]?.trim()

  // Find next section (nearest ## below cursor)
  const headingAfterMatch = textAfterCursor.match(/^##\s+([^\n]+)/)
  const nextSectionTitle = headingAfterMatch?.[1]?.trim()

  // Check if cursor is at section end (before next ## heading)
  const isAtSectionEnd = textAfterCursor.trimStart().startsWith('##')

  // Check if cursor is at section start (right after ## heading line)
  const lastNewlineBefore = textBeforeCursor.lastIndexOf('\n')
  const currentLine = textBeforeCursor.slice(lastNewlineBefore + 1)
  const isAtSectionStart = /^##\s+/.test(currentLine) || currentLine.trim() === ''

  // Count sentences in current paragraph
  const paragraphStart = Math.max(
    textBeforeCursor.lastIndexOf('\n\n'),
    textBeforeCursor.lastIndexOf('\n## '),
  )
  const currentParagraph = textBeforeCursor.slice(paragraphStart + 1)
  const currentParagraphSentences = (currentParagraph.match(/[。！？.!?]/g) || []).length

  // Detect illustration/example in current paragraph
  const hasIllustration = /例[如证]|比如|illustrat|for example|imagine|picture/i.test(currentParagraph)

  // Detect application in current paragraph
  const hasApplication = /应用|实践|apply|practic|how (?:can|should|do)|let us/i.test(currentParagraph)

  return {
    content,
    cursorPosition,
    flowStage,
    isAtSectionEnd,
    isAtSectionStart,
    currentSectionTitle,
    nextSectionTitle,
    currentParagraphSentences,
    hasIllustration,
    hasApplication,
  }
}
