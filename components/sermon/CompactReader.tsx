'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { cn } from '@/lib/utils'
import { getBookDisplayName, BIBLE_BOOKS } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'
import { useBibleData, type Verse } from '@/hooks/use-bible-data'
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, BookOpenCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookPicker } from '@/components/bible/BookPicker'
import { FloatingMenu } from '@/components/bible/FloatingMenu'
import { useVerseMenu } from '@/hooks/use-verse-menu'

interface CompactReaderProps {
  /** Initial book ID (e.g. 'Gen') */
  book: string
  /** Initial chapter number as string */
  chapter: string
  /** Callback when book/chapter changes (for store sync) */
  onNavigate?: (book: string, chapter: string) => void
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: 'bg-yellow-200 dark:bg-yellow-800/60 text-yellow-900 dark:text-yellow-100',
  green: 'bg-green-200 dark:bg-green-800/60 text-green-900 dark:text-green-100',
  blue: 'bg-blue-200 dark:bg-blue-800/60 text-blue-900 dark:text-blue-100',
  red: 'bg-red-200 dark:bg-red-800/60 text-red-900 dark:text-red-100',
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? '30%' : '-30%', opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? '30%' : '-30%', opacity: 0 }),
}

export function CompactReader({ book: initialBook, chapter: initialChapter, onNavigate }: CompactReaderProps) {
  const { t, locale } = useTranslation()
  const bibleVersion = useBibleStore((s) => s.bibleVersion)
  const { fontSize, lineHeight, showDualVersion, highlights, selectedVerses, clearSelection } = useBibleStore()

  const primaryVersion = bibleVersion
  const secondaryVersion = bibleVersion === 'CUV' ? 'KJV' : 'CUV'

  const [book, setBook] = useState(initialBook)
  const [chapter, setChapter] = useState(initialChapter)
  const [direction, setDirection] = useState(0)
  const [bookPickerOpen, setBookPickerOpen] = useState(false)

  // Sync with external prop changes (e.g. from sermon verse refs)
  useEffect(() => {
    if (initialBook !== book || initialChapter !== chapter) {
      setBook(initialBook)
      setChapter(initialChapter)
    }
  }, [initialBook, initialChapter])

  const handleBookPickerSelect = useCallback((bookId: string, chapterNum: number) => {
    const newChapter = String(chapterNum)
    setBook(bookId)
    setChapter(newChapter)
    setDirection(0)
    onNavigate?.(bookId, newChapter)
  }, [onNavigate])

  const { verses, loading, error, refetch } = useBibleData(book, chapter)
  const { menuPosition, isMenuVisible, setIsMenuVisible, handleVerseClick, handleAIExplain, handleCopy, showAbove } = useVerseMenu(verses)

  // Insert selected verses into the sermon editor
  const handleInsertToSermon = useCallback(() => {
    if (selectedVerses.length === 0) return
    const primaryVersion = locale === 'en' ? 'KJV' : 'CUV'
    const selectedContent = verses
      .filter(v => selectedVerses.includes(v.verse) && v.version === primaryVersion)
      .sort((a, b) => a.verse - b.verse)
      .map(v => `${v.content} (${getBookDisplayName(v.bookId, locale)} ${v.chapter}:${v.verse})`)
      .join('\n')
    if (selectedContent) {
      window.dispatchEvent(new CustomEvent('sermon:insert-content', { detail: { content: `\n> ${selectedContent}\n` } }))
    }
    clearSelection()
    setIsMenuVisible(false)
  }, [selectedVerses, verses, locale, clearSelection, setIsMenuVisible])

  const handleNextChapter = useCallback(() => {
    const currentBookIndex = BIBLE_BOOKS.findIndex(b => b.id === book)
    if (currentBookIndex === -1) return
    const currentBookConfig = BIBLE_BOOKS[currentBookIndex]
    const currentChapterInt = parseInt(chapter)

    if (currentChapterInt < currentBookConfig.chapters) {
      const next = String(currentChapterInt + 1)
      setChapter(next)
      setDirection(1)
      onNavigate?.(book, next)
    } else if (currentBookIndex < BIBLE_BOOKS.length - 1) {
      const nextBookId = BIBLE_BOOKS[currentBookIndex + 1].id
      setBook(nextBookId)
      setChapter('1')
      setDirection(1)
      onNavigate?.(nextBookId, '1')
    }
  }, [book, chapter, onNavigate])

  const handlePrevChapter = useCallback(() => {
    const currentBookIndex = BIBLE_BOOKS.findIndex(b => b.id === book)
    if (currentBookIndex === -1) return
    const currentChapterInt = parseInt(chapter)

    if (currentChapterInt > 1) {
      const prev = String(currentChapterInt - 1)
      setChapter(prev)
      setDirection(-1)
      onNavigate?.(book, prev)
    } else if (currentBookIndex > 0) {
      const prevBookId = BIBLE_BOOKS[currentBookIndex - 1].id
      const prevBookConfig = BIBLE_BOOKS[currentBookIndex - 1]
      setBook(prevBookId)
      setChapter(String(prevBookConfig.chapters))
      setDirection(-1)
      onNavigate?.(prevBookId, String(prevBookConfig.chapters))
    }
  }, [book, chapter, onNavigate])

  // Scroll to top on chapter change
  useEffect(() => {
    const container = document.getElementById('compact-reader-scroll')
    if (container) {
      container.scrollTo(0, 0)
    }
  }, [book, chapter])

  const { verseMap, renderList } = useMemo(() => {
    const map = new Map<number, { CUV?: Verse; KJV?: Verse }>()
    verses.forEach(v => {
      if (!map.has(v.verse)) map.set(v.verse, {})
      const entry = map.get(v.verse)!
      if (v.version === 'CUV') entry.CUV = v
      if (v.version === 'KJV') entry.KJV = v
    })
    return { verseMap: map, renderList: Array.from(map.keys()).sort((a, b) => a - b) }
  }, [verses])

  return (
    <div className="flex flex-col h-full bg-background dark:bg-card">
      {/* Header with book/chapter title and navigation */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-black/[0.04] dark:border-white/[0.06] shrink-0">
        <button
          onClick={handlePrevChapter}
          className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
          title={t('reader.prevChapter')}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setBookPickerOpen(true)}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          title={t('reader.selectScripture')}
        >
          <BookOpenCheck className="w-3.5 h-3.5 text-primary/70" />
          <h2 className="text-sm font-semibold text-foreground select-none">
            {getBookDisplayName(book, locale)} <span className="opacity-60 mx-0.5">·</span> {chapter}
          </h2>
        </button>
        <button
          onClick={handleNextChapter}
          className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
          title={t('reader.nextChapter')}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Verse content */}
      <div id="compact-reader-scroll" className="flex-1 overflow-y-auto px-3 py-3">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={`${book}-${chapter}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: 'spring', stiffness: 350, damping: 35, mass: 0.8 }, opacity: { duration: 0.15 } }}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center justify-center min-h-[30vh]">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center min-h-[30vh] text-center">
                <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                <p className="text-sm text-destructive mb-2">{error}</p>
                <button
                  onClick={refetch}
                  className="text-xs text-primary hover:underline"
                >
                  {t('common.retry')}
                </button>
              </div>
            ) : renderList.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[30vh] text-center">
                <BookOpenCheck className="w-10 h-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">{t('reader.noContent')}</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {renderList.map((verseNum) => {
                  const entry = verseMap.get(verseNum)!
                  const cuvVerse = entry.CUV
                  const kjvVerse = entry.KJV
                  const mainVerse = primaryVersion === 'KJV' ? kjvVerse : cuvVerse
                  const altVerse = primaryVersion === 'KJV' ? cuvVerse : kjvVerse

                  if (!mainVerse) return null

                  const isSelected = selectedVerses.includes(verseNum)
                  const highlight = highlights.find(h => h.verse === verseNum && h.bookId === book && h.chapter === parseInt(chapter))
                  const highlightClass = highlight ? HIGHLIGHT_COLORS[highlight.color] : ''

                  return (
                    <div
                      key={mainVerse.id}
                      onClick={(e) => handleVerseClick(mainVerse, e)}
                      className={cn(
                        'flex items-start px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200',
                        isSelected ? 'bg-primary/10 border-l-[3px] border-l-primary' :
                        highlightClass || 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[11px] mr-2 select-none shrink-0 mt-[0.2em]',
                          isSelected ? 'text-primary font-semibold' : 'text-foreground/40'
                        )}
                        style={{ fontSize: Math.max(fontSize * 0.5, 9) }}
                      >
                        {verseNum}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'text-[15px] leading-[1.6]',
                            isSelected ? 'text-foreground font-medium' : 'text-foreground/90'
                          )}
                          style={{ fontSize: `${fontSize * 0.9}px`, lineHeight }}
                        >
                          {mainVerse.content}
                        </div>
                        {showDualVersion && altVerse && (
                          <div
                            className="mt-1.5 text-muted-foreground/70"
                            style={{ fontSize: `${fontSize * 0.75}px`, lineHeight: 1.5 }}
                          >
                            {altVerse.content}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Book/Chapter Picker */}
      <BookPicker
        open={bookPickerOpen}
        onOpenChange={setBookPickerOpen}
        currentBook={book}
        currentChapter={parseInt(chapter, 10) || 1}
        onSelect={handleBookPickerSelect}
      />

      {/* Floating menu for verse actions */}
      <FloatingMenu
        visible={isMenuVisible && selectedVerses.length > 0}
        position={menuPosition}
        selectedCount={selectedVerses.length}
        currentBook={book}
        currentChapter={parseInt(chapter, 10) || 1}
        onClose={() => { setIsMenuVisible(false); clearSelection() }}
        onExplain={handleAIExplain}
        onCopy={handleCopy}
        showAbove={showAbove}
        onInsertToSermon={handleInsertToSermon}
      />
    </div>
  )
}
