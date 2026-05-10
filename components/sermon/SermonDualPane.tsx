'use client'

import { useBibleStore } from '@/store/useBibleStore'
import { BibleReaderPanel } from '@/components/bible/BibleReaderPanel'
import { SermonEditor } from './SermonEditor'

/**
 * SermonDualPane — Side-by-side Bible reader + Sermon editor
 *
 * Left: BibleReaderPanel for reading scripture
 * Right: SermonEditor for writing the sermon
 */
export function SermonDualPane() {
  const { currentBook, currentChapter, locale } = useBibleStore()

  return (
    <div className="flex-1 flex min-h-0">
      {/* Left: Bible Reader */}
      <div className="w-[45%] border-r border-border dark:border-white/[0.06] overflow-y-auto">
        <BibleReaderPanel />
      </div>

      {/* Right: Sermon Editor */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <SermonEditor />
      </div>
    </div>
  )
}
