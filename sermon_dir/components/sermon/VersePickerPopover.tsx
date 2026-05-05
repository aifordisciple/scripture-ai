'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { EditorView } from '@codemirror/view'
import { BIBLE_BOOKS, getBookDisplayName } from '@/lib/constants'
import { generateVerseBlock } from '@/lib/sermon-markdown'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { BookOpen, X, Plus, ChevronLeft, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type VerseSelectorStep = 'book' | 'chapter' | 'verse'

interface SelectedRef {
  bookId: string
  chapter: number
  verseStart: number
  verseEnd: number
}

interface VersePickerPopoverProps {
  editorView: EditorView | null
  isDark: boolean
  children: React.ReactNode
}

const MAX_VERSE = 50

export default function VersePickerPopover({ editorView, isDark, children }: VersePickerPopoverProps) {
  const { locale } = useBibleStore()
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<VerseSelectorStep>('book')
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [verseStart, setVerseStart] = useState<number | null>(null)
  const [verseEnd, setVerseEnd] = useState<number | null>(null)
  const [selectedRefs, setSelectedRefs] = useState<SelectedRef[]>([])
  const [verseSearch, setVerseSearch] = useState('')
  const [inserting, setInserting] = useState(false)

  const resetState = useCallback(() => {
    setStep('book')
    setSelectedBook(null)
    setSelectedChapter(null)
    setVerseStart(null)
    setVerseEnd(null)
    setVerseSearch('')
  }, [])

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      resetState()
      setSelectedRefs([])
    }
  }, [resetState])

  const selectedBookData = useMemo(() => {
    return BIBLE_BOOKS.find(b => b.id === selectedBook)
  }, [selectedBook])

  const filteredBooks = useMemo(() => {
    if (!verseSearch) return BIBLE_BOOKS
    const q = verseSearch.toLowerCase()
    return BIBLE_BOOKS.filter(b =>
      b.name.includes(q) ||
      (b.nameEn && b.nameEn.toLowerCase().includes(q)) ||
      b.id.toLowerCase().includes(q) ||
      getBookDisplayName(b.id, locale).toLowerCase().includes(q)
    )
  }, [verseSearch, locale])

  const oldTestament = filteredBooks.slice(0, 39)
  const newTestament = filteredBooks.slice(39)

  const addRef = useCallback(() => {
    if (!selectedBook || !selectedChapter || verseStart === null) return
    const end = verseEnd || verseStart
    const newRef: SelectedRef = { bookId: selectedBook, chapter: selectedChapter, verseStart, verseEnd: end }
    setSelectedRefs(prev => [...prev, newRef])
    // Reset verse selection but stay on verse step for quick multi-add
    setVerseStart(null)
    setVerseEnd(null)
  }, [selectedBook, selectedChapter, verseStart, verseEnd])

  const removeRef = useCallback((idx: number) => {
    setSelectedRefs(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const formatRef = useCallback((ref: SelectedRef) => {
    const name = getBookDisplayName(ref.bookId, locale)
    return `${name} ${ref.chapter}:${ref.verseStart}${ref.verseEnd > ref.verseStart ? `-${ref.verseEnd}` : ''}`
  }, [locale])

  /** Insert all selected verse refs into the editor */
  const handleInsert = useCallback(async () => {
    if (!editorView || selectedRefs.length === 0) return
    setInserting(true)
    try {
      const blocks: string[] = []
      for (const ref of selectedRefs) {
        // Fetch verse text from API
        const res = await fetch(`/api/bible?book=${ref.bookId}&chapter=${ref.chapter}`)
        const data = await res.json()
        const verses: Array<{ verse: number; content: string; version?: string }> = data.data || []
        // Filter to selected range, deduplicate by verse number (take first version only)
        const seen = new Set<number>()
        const filtered = verses.filter(v => {
          if (v.verse < ref.verseStart || v.verse > ref.verseEnd) return false
          if (seen.has(v.verse)) return false
          seen.add(v.verse)
          return true
        })
        const verseText = filtered.map(v => `${v.verse} ${v.content}`).join('\n')
        const displayRef = formatRef(ref)
        blocks.push(generateVerseBlock(displayRef, verseText || '...'))
      }
      const combined = blocks.join('\n\n')
      // Insert at cursor using EditorView.dispatch
      const { from } = editorView.state.selection.main
      const line = editorView.state.doc.lineAt(from)
      const insertPos = line.to
      const prefix = line.text.trim() === '' ? '' : '\n'
      editorView.dispatch({
        changes: { from: insertPos, insert: `${prefix}${combined}\n` },
        selection: { anchor: insertPos + prefix.length + combined.length + 1 },
      })
      editorView.focus()
      setOpen(false)
    } catch (err) {
      console.error('[VersePickerPopover] Insert failed:', err)
    } finally {
      setInserting(false)
    }
  }, [editorView, selectedRefs, formatRef])

  const bgColor = isDark ? '#1e293b' : '#ffffff'
  const borderColor = isDark ? '#334155' : '#e2e8f0'
  const fgColor = isDark ? '#e2e8f0' : '#1e293b'
  const mutedColor = isDark ? '#94a3b8' : '#64748b'
  const hoverBg = isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.06)'
  const primaryColor = '#3b82f6'

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[420px] p-0 overflow-hidden rounded-xl border shadow-xl"
        style={{ backgroundColor: bgColor, borderColor, color: fgColor }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor }}>
          <div className="flex items-center gap-2">
            {step !== 'book' && (
              <button
                onClick={() => {
                  if (step === 'verse') {
                    setStep('chapter')
                    setVerseStart(null)
                    setVerseEnd(null)
                  } else if (step === 'chapter') {
                    setStep('book')
                    setSelectedBook(null)
                    setSelectedChapter(null)
                  }
                }}
                className="p-1 rounded-md transition-colors"
                style={{ color: mutedColor }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = hoverBg)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              {step === 'book' && t('sermon.versePickerSelectBook')}
              {step === 'chapter' && `${t('sermon.versePickerSelectChapter')} — ${selectedBook ? getBookDisplayName(selectedBook, locale) : ''}`}
              {step === 'verse' && `${t('sermon.versePickerSelectVerse')} — ${selectedBook ? getBookDisplayName(selectedBook, locale) : ''} ${selectedChapter}`}
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md transition-colors"
            style={{ color: mutedColor }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search (book step only) */}
        {step === 'book' && (
          <div className="px-3 py-2 border-b" style={{ borderColor }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: mutedColor }} />
              <input
                value={verseSearch}
                onChange={e => setVerseSearch(e.target.value)}
                placeholder={t('sermon.versePickerSearchBook')}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1"
                style={{
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderColor,
                  color: fgColor,
                  '--tw-ring-color': primaryColor,
                } as React.CSSProperties}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
          {/* Book Selection */}
          {step === 'book' && (
            <div className="p-3">
              {oldTestament.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1" style={{ backgroundColor: borderColor }} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: mutedColor }}>
                      {locale === 'en' ? 'Old Testament' : '旧约'}
                    </span>
                    <span className="text-[10px]" style={{ color: mutedColor }}>{oldTestament.length}</span>
                    <div className="h-px flex-1" style={{ backgroundColor: borderColor }} />
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {oldTestament.map(book => (
                      <button
                        key={book.id}
                        onClick={() => { setSelectedBook(book.id); setStep('chapter') }}
                        className={cn(
                          'px-2 py-1.5 rounded-lg text-[11px] transition-colors text-center',
                          selectedBook === book.id ? 'font-semibold' : ''
                        )}
                        style={selectedBook === book.id
                          ? { backgroundColor: primaryColor, color: '#fff' }
                          : { backgroundColor: isDark ? '#334155' : '#f1f5f9', color: fgColor }
                        }
                      >
                        {getBookDisplayName(book.id, locale)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {newTestament.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1" style={{ backgroundColor: borderColor }} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: mutedColor }}>
                      {locale === 'en' ? 'New Testament' : '新约'}
                    </span>
                    <span className="text-[10px]" style={{ color: mutedColor }}>{newTestament.length}</span>
                    <div className="h-px flex-1" style={{ backgroundColor: borderColor }} />
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {newTestament.map(book => (
                      <button
                        key={book.id}
                        onClick={() => { setSelectedBook(book.id); setStep('chapter') }}
                        className={cn(
                          'px-2 py-1.5 rounded-lg text-[11px] transition-colors text-center',
                          selectedBook === book.id ? 'font-semibold' : ''
                        )}
                        style={selectedBook === book.id
                          ? { backgroundColor: primaryColor, color: '#fff' }
                          : { backgroundColor: isDark ? '#334155' : '#f1f5f9', color: fgColor }
                        }
                      >
                        {getBookDisplayName(book.id, locale)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chapter Selection */}
          {step === 'chapter' && selectedBookData && (
            <div className="p-3">
              <div className="grid grid-cols-6 gap-1.5">
                {Array.from({ length: selectedBookData.chapters }, (_, i) => i + 1).map(ch => (
                  <button
                    key={ch}
                    onClick={() => { setSelectedChapter(ch); setStep('verse') }}
                    className={cn(
                      'aspect-square flex items-center justify-center rounded-lg text-xs transition-all',
                      selectedChapter === ch ? 'font-semibold scale-105 shadow-sm' : ''
                    )}
                    style={selectedChapter === ch
                      ? { backgroundColor: primaryColor, color: '#fff' }
                      : { backgroundColor: isDark ? '#334155' : '#f1f5f9', color: fgColor, border: `1px solid ${borderColor}` }
                    }
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Verse Selection */}
          {step === 'verse' && selectedBook && selectedChapter && (
            <div className="p-3">
              <p className="text-[10px] mb-2" style={{ color: mutedColor }}>
                {t('sermon.versePickerRangeHint')}
              </p>
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: MAX_VERSE }, (_, i) => i + 1).map(v => {
                  const isSelected = verseStart !== null && v >= verseStart && v <= (verseEnd || verseStart)
                  const isStart = v === verseStart
                  const isEnd = v === (verseEnd || verseStart)
                  return (
                    <button
                      key={v}
                      onClick={() => {
                        if (verseStart === null || (verseStart !== null && verseEnd !== null)) {
                          setVerseStart(v)
                          setVerseEnd(null)
                        } else if (verseEnd === null) {
                          if (v >= verseStart) {
                            setVerseEnd(v)
                          } else {
                            setVerseEnd(verseStart)
                            setVerseStart(v)
                          }
                        }
                      }}
                      className={cn(
                        'aspect-square flex items-center justify-center rounded text-[10px] transition-all',
                        isStart && 'rounded-l-lg font-semibold',
                        isEnd && !isStart && 'rounded-r-lg font-semibold',
                      )}
                      style={
                        (isStart || isEnd)
                          ? { backgroundColor: primaryColor, color: '#fff' }
                          : isSelected
                            ? { backgroundColor: `${primaryColor}33`, color: primaryColor }
                            : { backgroundColor: isDark ? '#334155' : '#f1f5f9', color: fgColor, border: `1px solid ${borderColor}80` }
                      }
                    >
                      {v}
                    </button>
                  )
                })}
              </div>

              {/* Selection preview + add button */}
              {verseStart !== null && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: `${primaryColor}1a`, color: primaryColor, border: `1px solid ${primaryColor}33` }}>
                    {getBookDisplayName(selectedBook, locale)} {selectedChapter}:{verseStart}{verseEnd && verseEnd > verseStart ? `-${verseEnd}` : ''}
                  </div>
                  <button
                    onClick={addRef}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg flex items-center gap-1 transition-colors"
                    style={{ backgroundColor: primaryColor, color: '#fff' }}
                  >
                    <Plus className="w-3 h-3" />
                    {t('sermon.versePickerAdd')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: selected refs + insert */}
        {selectedRefs.length > 0 && (
          <div className="px-3 py-2 border-t" style={{ borderColor }}>
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedRefs.map((ref, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${primaryColor}1a`, color: primaryColor }}
                >
                  {formatRef(ref)}
                  <button onClick={() => removeRef(i)} className="hover:opacity-70">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={handleInsert}
              disabled={inserting}
              className="w-full py-1.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              style={{ backgroundColor: primaryColor, color: '#fff' }}
            >
              {inserting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BookOpen className="w-3.5 h-3.5" />
              )}
              {t('sermon.versePickerInsert')} ({selectedRefs.length})
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}