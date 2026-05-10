'use client'

import { useState, useCallback } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { CompactReader } from './CompactReader'
import { SermonEditor } from './SermonEditor'

/**
 * SermonDualPane — Side-by-side Bible reader + Sermon editor
 *
 * Left: CompactReader for reading scripture
 * Right: SermonEditor for writing the sermon
 */
export function SermonDualPane() {
  const { currentBook, currentChapter } = useBibleStore()
  const [splitBook, setSplitBook] = useState(currentBook || '创世记')
  const [splitChapter, setSplitChapter] = useState(currentChapter || 1)

  const handleNavigate = useCallback((book: string, chapter: number) => {
    setSplitBook(book)
    setSplitChapter(chapter)
  }, [])

  return (
    <div className="flex-1 flex min-h-0">
      {/* Left: Bible Reader */}
      <div className="w-[45%] border-r border-border dark:border-white/[0.06] overflow-y-auto">
        <CompactReader
          book={splitBook}
          chapter={splitChapter}
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
