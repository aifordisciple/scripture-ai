'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { BIBLE_BOOKS, getBookDisplayName } from '@/lib/constants'
import { BookOpen, Lightbulb, Loader2, X, Plus, Check, Search, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecommendedVerse {
  bookId: string
  chapter: number
  verseStart: number
  verseEnd: number
  reason: string
}

interface NewSermonDialogProps {
  open: boolean
  onClose: () => void
  initialVerseRefs?: string
}

// Steps for the verse selector
type VerseSelectorStep = 'book' | 'chapter' | 'verse'

export function NewSermonDialog({ open, onClose, initialVerseRefs }: NewSermonDialogProps) {
  const { t } = useTranslation()
  const { apiConfig, locale, setSermons, sermons, setCurrentSermon, setActiveSermonPanel } = useBibleStore()
  const dialogRef = useRef<HTMLDivElement>(null)

  const [mode, setMode] = useState<'verse' | 'topic'>('verse')
  const [title, setTitle] = useState('')
  const [verseRefs, setVerseRefs] = useState('')
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState<'EXPOSITORY' | 'TOPICAL' | 'NARRATIVE' | 'FREE'>('EXPOSITORY')
  const [loading, setLoading] = useState(false)
  const [generateOutline, setGenerateOutline] = useState(true)
  const [recommendedVerses, setRecommendedVerses] = useState<RecommendedVerse[]>([])
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set())

  // Verse selector state
  const [showVerseSelector, setShowVerseSelector] = useState(false)
  const [selectorStep, setSelectorStep] = useState<VerseSelectorStep>('book')
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [verseStart, setVerseStart] = useState<number | null>(null)
  const [verseEnd, setVerseEnd] = useState<number | null>(null)
  const [verseSearch, setVerseSearch] = useState('')
  const [selectedRefs, setSelectedRefs] = useState<Array<{ bookId: string; chapter: number; verseStart: number; verseEnd: number }>>([])

  // Reset dialog state when opening (only on open transition false→true)
  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setTitle('')
      setVerseRefs(initialVerseRefs || '')
      setTopic('')
      setStyle('EXPOSITORY')
      setMode('verse')
      setLoading(false)
      setRecommendedVerses([])
      setSelectedVerses(new Set())
      setSelectedRefs([])
    }
    prevOpenRef.current = open
  }, [open, initialVerseRefs])

  // Escape key handler
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showVerseSelector) {
          setShowVerseSelector(false)
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, showVerseSelector])

  // Focus trap
  useEffect(() => {
    if (!open || !dialogRef.current) return
    const focusable = dialogRef.current.querySelector<HTMLElement>('input, button, select, textarea, [tabindex]')
    focusable?.focus()
  }, [open])

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  // Get the selected book's data
  const selectedBookData = useMemo(() => {
    return BIBLE_BOOKS.find(b => b.id === selectedBook)
  }, [selectedBook])

  // Filter books by search
  const filteredBooks = useMemo(() => {
    if (!verseSearch) return BIBLE_BOOKS
    const q = verseSearch.toLowerCase()
    return BIBLE_BOOKS.filter(b =>
      b.name.includes(q) ||
      (b.nameEn && b.nameEn.toLowerCase().includes(q)) ||
      b.id.toLowerCase().includes(q) ||
      (getBookDisplayName(b.id, locale)).toLowerCase().includes(q)
    )
  }, [verseSearch, locale])

  const oldTestament = filteredBooks.slice(0, 39)
  const newTestament = filteredBooks.slice(39)

  // Get max verse count for a chapter (approximate - we'll show 1-50 as range)
  const MAX_VERSE = 50

  if (!open) return null

  const handleRecommendVerses = async () => {
    if (!topic.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/sermon/recommend-verses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, apiConfig, locale }),
      })
      const data = await res.json()
      if (data.data) {
        setRecommendedVerses(data.data)
        setSelectedVerses(new Set(data.data.map((_: any, i: number) => i)))
      }
    } catch {
      // Silent
    } finally {
      setLoading(false)
    }
  }

  const toggleVerse = (idx: number) => {
    const next = new Set(selectedVerses)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setSelectedVerses(next)
  }

  const buildVerseRefsFromSelected = () => {
    return recommendedVerses
      .filter((_, i) => selectedVerses.has(i))
      .map(v => `${v.bookId} ${v.chapter}:${v.verseStart}${v.verseEnd > v.verseStart ? `-${v.verseEnd}` : ''}`)
      .join('; ')
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      const finalVerseRefs = mode === 'topic' ? buildVerseRefsFromSelected() : verseRefs

      // If generateOutline is enabled, call the sermon outline generator first
      let initialContent = `# ${title}\n\n## 🎯 引言\n\n## 💡 要点\n\n## ✅ 结论\n\n`

      if (generateOutline && finalVerseRefs) {
        try {
          const outlineRes = await fetch('/api/chat/sermon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              verseRef: finalVerseRefs,
              title,
              style: style.toLowerCase(),
              locale,
              apiConfig,
            }),
          })
          const outlineData = await outlineRes.json()
          if (outlineData.sermon) {
            initialContent = outlineData.sermon
          }
        } catch {
          // Fall back to default template if outline generation fails
        }
      }

      const res = await fetch('/api/sermon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          verseRefs: finalVerseRefs,
          style,
          content: initialContent,
        }),
      })
      const data = await res.json()
      if (data.data) {
        setSermons([data.data, ...sermons])
        setCurrentSermon(data.data)
        setActiveSermonPanel(generateOutline ? 'ai' : 'ai')
        onClose()
      }
    } catch {
      // Silent
    } finally {
      setLoading(false)
    }
  }

  // Add a selected verse range from the visual selector
  const addSelectedRef = () => {
    if (!selectedBook || !selectedChapter || !verseStart) return
    const end = verseEnd || verseStart
    const newRef = { bookId: selectedBook, chapter: selectedChapter, verseStart, verseEnd: end }
    setSelectedRefs(prev => [...prev, newRef])
    // Update the verseRefs text
    const refsText = [...selectedRefs, newRef]
      .map(r => `${r.bookId} ${r.chapter}:${r.verseStart}${r.verseEnd > r.verseStart ? `-${r.verseEnd}` : ''}`)
      .join('; ')
    setVerseRefs(refsText)
    // Reset selector
    setShowVerseSelector(false)
    setSelectorStep('book')
    setSelectedBook(null)
    setSelectedChapter(null)
    setVerseStart(null)
    setVerseEnd(null)
  }

  const removeSelectedRef = (idx: number) => {
    const next = selectedRefs.filter((_, i) => i !== idx)
    setSelectedRefs(next)
    const refsText = next
      .map(r => `${r.bookId} ${r.chapter}:${r.verseStart}${r.verseEnd > r.verseStart ? `-${r.verseEnd}` : ''}`)
      .join('; ')
    setVerseRefs(refsText)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleOverlayClick}>
      <div ref={dialogRef} className="bg-card rounded-xl shadow-2xl w-[480px] max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{t('sermon.newSermon')}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setMode('verse')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors',
              mode === 'verse'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {t('sermon.createFromVerse')}
          </button>
          <button
            onClick={() => setMode('topic')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors',
              mode === 'topic'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {t('sermon.createFromTopic')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* Title */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('sermon.sermonTitle')}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('sermon.sermonTitlePlaceholder')}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
            />
          </div>

          {/* Verse Mode */}
          {mode === 'verse' && (
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('sermon.verseRefsLabel')}</label>
              <div className="mt-1 flex gap-1.5">
                <input
                  value={verseRefs}
                  onChange={(e) => setVerseRefs(e.target.value)}
                  placeholder="Rom 8:28-30; Psa 23:1-6"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                />
                <button
                  onClick={() => {
                    setShowVerseSelector(true)
                    setSelectorStep('book')
                    setVerseSearch('')
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {locale === 'en' ? 'Pick' : '选择'}
                </button>
              </div>

              {/* Selected verse chips */}
              {selectedRefs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedRefs.map((ref, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                    >
                      {getBookDisplayName(ref.bookId, locale)} {ref.chapter}:{ref.verseStart}{ref.verseEnd > ref.verseStart ? `-${ref.verseEnd}` : ''}
                      <button onClick={() => removeSelectedRef(i)} className="hover:text-destructive">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-muted-foreground mt-1">{t('sermon.createFromVerseDesc')}</p>
            </div>
          )}

          {/* Topic Mode */}
          {mode === 'topic' && (
            <>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('sermon.topicInput')}</label>
                <div className="mt-1 flex gap-1.5">
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={t('sermon.topicInput')}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                  />
                  <button
                    onClick={handleRecommendVerses}
                    disabled={!topic.trim() || loading}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('sermon.aiRecommendVerses')}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{t('sermon.createFromTopicDesc')}</p>
              </div>

              {/* Recommended Verses */}
              {recommendedVerses.length > 0 && (
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('sermon.selectVerses')}</label>
                  <div className="mt-1 space-y-1.5">
                    {recommendedVerses.map((v, i) => (
                      <button
              key={i}
                        onClick={() => toggleVerse(i)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors',
                          selectedVerses.has(i)
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-border bg-card'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-4 h-4 rounded-md flex items-center justify-center',
                            selectedVerses.has(i) ? 'bg-primary text-primary-foreground' : 'border border-border'
                          )}>
                            {selectedVerses.has(i) && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className="font-semibold text-foreground/90">
                            {v.bookId} {v.chapter}:{v.verseStart}{v.verseEnd > v.verseStart ? `-${v.verseEnd}` : ''}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 ml-6">{v.reason}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Style */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('sermon.sermonStyle')}</label>
            <div className="mt-1 grid grid-cols-4 gap-1.5">
              {(['EXPOSITORY', 'TOPICAL', 'NARRATIVE', 'FREE'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={cn(
                    'py-2 rounded-lg text-[11px] font-semibold transition-colors',
                    style === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {t(`sermon.${s.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>

          {/* AI Outline Toggle */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {locale === 'en' ? 'Initial Content' : '初始内容'}
            </label>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setGenerateOutline(true)}
                className={cn(
                  'py-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1',
                  generateOutline
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-secondary'
                )}
              >
                <Lightbulb className="w-3 h-3" />
                {locale === 'en' ? 'AI Outline' : 'AI 生成大纲'}
              </button>
              <button
                onClick={() => setGenerateOutline(false)}
                className={cn(
                  'py-2 rounded-lg text-[11px] font-semibold transition-colors',
                  !generateOutline
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-secondary'
                )}
              >
                {locale === 'en' ? 'Blank Template' : '空白模板'}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {generateOutline
                ? (locale === 'en' ? 'AI will generate a sermon outline based on your verses and style' : 'AI 将根据经文和风格自动生成讲章大纲')
                : (locale === 'en' ? 'Start with a blank template' : '从空白模板开始撰写')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            {t('sermon.cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || loading}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {t('sermon.create')}
          </button>
        </div>
      </div>

      {/* ===== Visual Verse Selector Overlay ===== */}
      {showVerseSelector && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowVerseSelector(false)}>
          <div
            className="bg-card rounded-xl shadow-2xl w-[520px] max-w-[calc(100vw-1rem)] max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Selector Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                {selectorStep !== 'book' && (
                  <button
                    onClick={() => {
                      if (selectorStep === 'verse') {
                        setSelectorStep('chapter')
                        setVerseStart(null)
                        setVerseEnd(null)
                      } else if (selectorStep === 'chapter') {
                        setSelectorStep('book')
                        setSelectedBook(null)
                        setSelectedChapter(null)
                      }
                    }}
                    className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <h3 className="text-sm font-semibold text-foreground">
                  {selectorStep === 'book' && (locale === 'en' ? 'Select Book' : '选择书卷')}
                  {selectorStep === 'chapter' && (locale === 'en' ? `Select Chapter — ${getBookDisplayName(selectedBook!, locale)}` : `选择章节 — ${getBookDisplayName(selectedBook!, locale)}`)}
                  {selectorStep === 'verse' && (locale === 'en' ? `Select Verses — ${getBookDisplayName(selectedBook!, locale)} ${selectedChapter}` : `选择经文 — ${getBookDisplayName(selectedBook!, locale)} ${selectedChapter}章`)}
                </h3>
              </div>
              <button onClick={() => setShowVerseSelector(false)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search (book step only) */}
            {selectorStep === 'book' && (
              <div className="px-4 py-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={verseSearch}
                    onChange={(e) => setVerseSearch(e.target.value)}
                    placeholder={locale === 'en' ? 'Search books...' : '搜索书卷...'}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>
            )}

            {/* Selector Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Book Selection */}
              {selectorStep === 'book' && (
                <>
                  {oldTestament.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                          {locale === 'en' ? 'Old Testament' : '旧约'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{oldTestament.length}</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {oldTestament.map(book => (
                          <button
                            key={book.id}
                            onClick={() => {
                              setSelectedBook(book.id)
                              setSelectorStep('chapter')
                            }}
                            className={cn(
                              'px-2 py-2 rounded-lg text-xs transition-colors text-center',
                              selectedBook === book.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary hover:bg-primary/10 hover:text-primary text-foreground/80'
                            )}
                          >
                            {getBookDisplayName(book.id, locale)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {newTestament.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                          {locale === 'en' ? 'New Testament' : '新约'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{newTestament.length}</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {newTestament.map(book => (
                          <button
                            key={book.id}
                            onClick={() => {
                              setSelectedBook(book.id)
                              setSelectorStep('chapter')
                            }}
                            className={cn(
                              'px-2 py-2 rounded-lg text-xs transition-colors text-center',
                              selectedBook === book.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary hover:bg-primary/10 hover:text-primary text-foreground/80'
                            )}
                          >
                            {getBookDisplayName(book.id, locale)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Chapter Selection */}
              {selectorStep === 'chapter' && selectedBookData && (
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: selectedBookData.chapters }, (_, i) => i + 1).map(ch => (
                    <button
                      key={ch}
                      onClick={() => {
                        setSelectedChapter(ch)
                        setSelectorStep('verse')
                      }}
                      className={cn(
                        'aspect-square flex items-center justify-center rounded-xl text-sm transition-all',
                        selectedChapter === ch
                          ? 'bg-primary text-primary-foreground font-semibold scale-105 shadow-sm'
                          : 'bg-secondary text-foreground/80 hover:bg-primary/10 hover:text-primary hover:scale-110 border border-border/60'
                      )}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              )}

              {/* Verse Selection */}
              {selectorStep === 'verse' && selectedBook && selectedChapter && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    {locale === 'en' ? 'Tap start verse, then tap end verse to select a range' : '点击起始经文，再点击结束经文选择范围'}
                  </p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {Array.from({ length: MAX_VERSE }, (_, i) => i + 1).map(v => {
                      const isSelected = verseStart !== null && v >= verseStart && v <= (verseEnd || verseStart)
                      const isStart = v === verseStart
                      const isEnd = v === (verseEnd || verseStart)
                      return (
                        <button
                          key={v}
                          onClick={() => {
                            if (verseStart === null || (verseStart !== null && verseEnd !== null)) {
                              // Start new selection
                              setVerseStart(v)
                              setVerseEnd(null)
                            } else if (verseEnd === null) {
                              // Set end verse
                              if (v >= verseStart) {
                                setVerseEnd(v)
                              } else {
                                // Swap if end < start
                                setVerseEnd(verseStart)
                                setVerseStart(v)
                              }
                            }
                          }}
                          className={cn(
                            'aspect-square flex items-center justify-center rounded-lg text-xs transition-all',
                            isStart && 'bg-primary text-primary-foreground font-semibold rounded-l-lg',
                            isEnd && !isStart && 'bg-primary text-primary-foreground font-semibold rounded-r-lg',
                            isSelected && !isStart && !isEnd && 'bg-primary/20 text-primary',
                            !isSelected && 'bg-secondary text-foreground/70 hover:bg-primary/10 hover:text-primary border border-border/40'
                          )}
                        >
                          {v}
                        </button>
                      )
                    })}
                  </div>

                  {/* Selection preview */}
                  {verseStart !== null && (
                    <div className="mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-xs text-primary font-semibold">
                        {getBookDisplayName(selectedBook, locale)} {selectedChapter}:{verseStart}{verseEnd && verseEnd > verseStart ? `-${verseEnd}` : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selector Footer */}
            <div className="px-4 py-3 border-t border-border flex justify-between items-center">
              <div className="text-[10px] text-muted-foreground">
                {selectedRefs.length > 0 && (
                  <span>{locale === 'en' ? `${selectedRefs.length} verse(s) selected` : `已选 ${selectedRefs.length} 处经文`}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowVerseSelector(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                >
                  {locale === 'en' ? 'Cancel' : '取消'}
                </button>
                {selectorStep === 'verse' && verseStart !== null && (
                  <button
                    onClick={addSelectedRef}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {locale === 'en' ? 'Add' : '添加'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}