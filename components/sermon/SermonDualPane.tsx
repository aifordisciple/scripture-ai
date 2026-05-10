'use client'

import { useCallback } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { CompactReader } from './CompactReader'
import { SermonEditor } from './SermonEditor'

/**
 * SermonDualPane — Side-by-side Bible reader + Sermon editor
 *
 * Left: CompactReader for reading scripture (uses sermonSplitBook/sermonSplitChapter)
 * Right: SermonEditor for writing the sermon
 */
export function SermonDualPane() {
  const sermonSplitBook = useBibleStore((s) => s.sermonSplitBook)
  const sermonSplitChapter = useBibleStore((s) => s.sermonSplitChapter)
  const setSermonSplitBook = useBibleStore((s) => s.setSermonSplitBook)
  const setSermonSplitChapter = useBibleStore((s) => s.setSermonSplitChapter)

  const handleNavigate = useCallback((book: string, chapter: string) => {
    setSermonSplitBook(book)
    setSermonSplitChapter(chapter)
  }, [setSermonSplitBook, setSermonSplitChapter])

  return (
    <div className="flex-1 flex min-h-0">
      {/* Left: Bible Reader */}
      <div className="w-[45%] border-r border-border dark:border-white/[0.06] overflow-y-auto">
        <CompactReader
          book={sermonSplitBook}
          chapter={sermonSplitChapter}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Right: Sermon Editor */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <SermonEditor />
      </div>
    </div>
  )
}