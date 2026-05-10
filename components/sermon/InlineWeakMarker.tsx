'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { Sparkles, Loader2 } from 'lucide-react'

interface WeakParagraph {
  /** Start offset of the weak paragraph */
  start: number
  /** End offset */
  end: number
  /** The paragraph text */
  text: string
  /** Reason why it's weak */
  reasonZh: string
  reasonEn: string
  /** Suggested action */
  actionZh: string
  actionEn: string
}

/**
 * Detect weak paragraphs in sermon content.
 *
 * A paragraph is "weak" if:
 * - Less than 3 sentences (thin content)
 * - No illustration/example keywords
 * - No application keywords
 * - Not a heading line (## or ###)
 */
function detectWeakParagraphs(content: string, locale: string): WeakParagraph[] {
  const paragraphs: WeakParagraph[] = []
  const lines = content.split('\n')
  let offset = 0

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip headings, empty lines, and very short lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('>') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      offset += line.length + 1
      continue
    }

    // Count sentences
    const sentenceCount = (trimmed.match(/[。！？.!?]/g) || []).length

    // Check for illustration keywords
    const hasIllustration = /例[如证]|比如|illustrat|for example|imagine|picture/i.test(trimmed)

    // Check for application keywords
    const hasApplication = /应用|实践|apply|practic|how (?:can|should|do)|let us/i.test(trimmed)

    // Weak if: thin (<3 sentences) and missing illustration or application
    if (sentenceCount > 0 && sentenceCount < 3 && !hasIllustration && !hasApplication) {
      paragraphs.push({
        start: offset,
        end: offset + line.length,
        text: trimmed,
        reasonZh: sentenceCount < 2 ? '内容过于简短' : '缺乏例证或应用',
        reasonEn: sentenceCount < 2 ? 'Content too thin' : 'Missing illustration or application',
        actionZh: sentenceCount < 2 ? '扩写' : '添加例证',
        actionEn: sentenceCount < 2 ? 'Expand' : 'Add illustration',
      })
    }

    offset += line.length + 1
  }

  return paragraphs
}

interface InlineWeakMarkerProps {
  /** The editor container ref for positioning */
  editorContainerRef: React.RefObject<HTMLDivElement | null>
  /** Callback to expand a weak paragraph */
  onExpand: (paragraphText: string, action: string) => void
  /** Current content */
  content: string
}

/**
 * InlineWeakMarker — Marks thin/weak paragraphs in the editor with expand chips
 *
 * Replaces the standalone DescribePanel. Weak paragraphs are detected
 * automatically and shown with inline "expand" or "add illustration" chips.
 *
 * Inspired by: Google Docs suggestion chips, Grammarly inline suggestions
 */
export function InlineWeakMarker({ editorContainerRef, onExpand, content }: InlineWeakMarkerProps) {
  const { locale } = useBibleStore()
  const [weakParagraphs, setWeakParagraphs] = useState<WeakParagraph[]>([])
  const [expandingIdx, setExpandingIdx] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect weak paragraphs with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const weak = detectWeakParagraphs(content, locale)
      setWeakParagraphs(weak.slice(0, 5)) // Limit to top 5 to avoid clutter
    }, 800)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [content, locale])

  const handleExpand = useCallback((idx: number, paragraph: WeakParagraph) => {
    setExpandingIdx(idx)
    const action = paragraph.actionZh === '扩写' ? 'expand' : 'add-example'
    onExpand(paragraph.text, action)
    setTimeout(() => setExpandingIdx(null), 2000)
  }, [onExpand])

  if (weakParagraphs.length === 0) return null

  return (
    <div className="absolute bottom-12 left-4 right-4 z-30 pointer-events-none">
      <div className="flex flex-wrap gap-1.5 pointer-events-auto">
        {weakParagraphs.map((wp, idx) => {
          const isExpanding = expandingIdx === idx
          const label = locale === 'en' ? wp.actionEn : wp.actionZh
          const reason = locale === 'en' ? wp.reasonEn : wp.reasonZh

          return (
            <button
              key={`${wp.start}-${idx}`}
              onClick={() => handleExpand(idx, wp)}
              disabled={isExpanding}
              className="
                inline-flex items-center gap-1 px-2 py-1 rounded-full
                text-[10px] font-medium
                bg-amber-50 dark:bg-amber-900/20
                text-amber-700 dark:text-amber-400
                border border-amber-200 dark:border-amber-800/40
                hover:bg-amber-100 dark:hover:bg-amber-900/30
                transition-colors duration-150
                disabled:opacity-50
                shadow-sm
              "
              title={reason}
            >
              {isExpanding ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Sparkles size={10} />
              )}
              <span>{label}</span>
              <span className="text-amber-500/50 dark:text-amber-500/40">·</span>
              <span className="text-amber-600/60 dark:text-amber-500/50 text-[9px]">{reason}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
