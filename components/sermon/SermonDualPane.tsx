'use client'

import { useCallback } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useResizablePane } from '@/hooks/use-resizable-pane'
import { CompactReader } from './CompactReader'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

interface SermonDualPaneProps {
  /** Content for the right pane (sermon editor) */
  children: React.ReactNode
}

export function SermonDualPane({ children }: SermonDualPaneProps) {
  const sermonSplitBook = useBibleStore((s) => s.sermonSplitBook)
  const sermonSplitChapter = useBibleStore((s) => s.sermonSplitChapter)
  const sermonSplitRatio = useBibleStore((s) => s.sermonSplitRatio)
  const setSermonSplitRatio = useBibleStore((s) => s.setSermonSplitRatio)
  const setSermonSplitBook = useBibleStore((s) => s.setSermonSplitBook)
  const setSermonSplitChapter = useBibleStore((s) => s.setSermonSplitChapter)

  const {
    ratio,
    isDragging,
    onDividerMouseDown,
    onDividerTouchStart,
    onDividerDoubleClick,
    containerRef,
  } = useResizablePane({
    defaultRatio: 0.4,
    minRatio: 0.25,
    maxRatio: 0.65,
    persistedRatio: sermonSplitRatio,
    onRatioChange: setSermonSplitRatio,
  })

  const handleNavigate = useCallback((book: string, chapter: string) => {
    setSermonSplitBook(book)
    setSermonSplitChapter(chapter)
  }, [setSermonSplitBook, setSermonSplitChapter])

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden">
      {/* Left pane: Compact Bible Reader */}
      <div
        className="h-full overflow-hidden border-r border-black/[0.04] dark:border-white/[0.06] shrink-0"
        style={{ width: `${ratio * 100}%` }}
      >
        <CompactReader
          book={sermonSplitBook}
          chapter={sermonSplitChapter}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Divider */}
      <div
        className={cn(
          'w-1.5 shrink-0 cursor-col-resize flex items-center justify-center group relative z-10 transition-colors',
          isDragging
            ? 'bg-primary/30'
            : 'bg-black/[0.04] dark:bg-white/[0.06] hover:bg-primary/20'
        )}
        onMouseDown={onDividerMouseDown}
        onTouchStart={onDividerTouchStart}
        onDoubleClick={onDividerDoubleClick}
        title="双击恢复默认比例"
      >
        <GripVertical
          className={cn(
            'w-3 h-3 transition-colors',
            isDragging
              ? 'text-primary'
              : 'text-muted-foreground/30 group-hover:text-primary/60'
          )}
        />
      </div>

      {/* Right pane: Sermon Editor */}
      <div
        className="h-full overflow-hidden flex-1 min-w-0"
      >
        {children}
      </div>
    </div>
  )
}
