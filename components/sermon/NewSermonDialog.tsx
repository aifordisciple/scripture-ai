'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { BookOpen, Lightbulb, Loader2, X, Plus, Check } from 'lucide-react'

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

export function NewSermonDialog({ open, onClose, initialVerseRefs }: NewSermonDialogProps) {
  const { t } = useTranslation()
  const { apiConfig, locale, setSermons, sermons, setCurrentSermon, setActiveSermonPanel } = useBibleStore()
  const dialogRef = useRef<HTMLDivElement>(null)

  const [mode, setMode] = useState<'verse' | 'topic'>(initialVerseRefs ? 'verse' : 'verse')
  const [title, setTitle] = useState('')
  const [verseRefs, setVerseRefs] = useState(initialVerseRefs || '')
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState<'EXPOSITORY' | 'TOPICAL' | 'NARRATIVE'>('EXPOSITORY')
  const [loading, setLoading] = useState(false)
  const [recommendedVerses, setRecommendedVerses] = useState<RecommendedVerse[]>([])
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set())

  // Escape key handler
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Focus trap: focus first focusable element on open
  useEffect(() => {
    if (!open || !dialogRef.current) return
    const focusable = dialogRef.current.querySelector<HTMLElement>(
      'input, button, select, textarea, [tabindex]'
    )
    focusable?.focus()
  }, [open])

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

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
      const res = await fetch('/api/sermon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, verseRefs: finalVerseRefs, style }),
      })
      const data = await res.json()
      if (data.data) {
        setSermons([data.data, ...sermons])
        setCurrentSermon(data.data)
        setActiveSermonPanel('ai')
        onClose()
      }
    } catch {
      // Silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleOverlayClick}>
      <div ref={dialogRef} className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-[420px] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('sermon.newSermon')}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setMode('verse')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              mode === 'verse'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {t('sermon.createFromVerse')}
          </button>
          <button
            onClick={() => setMode('topic')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              mode === 'topic'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {t('sermon.createFromTopic')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* Title */}
          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{t('sermon.sermonTitle')}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('sermon.sermonTitlePlaceholder')}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Verse Mode */}
          {mode === 'verse' && (
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{t('sermon.verseRefsLabel')}</label>
              <input
                value={verseRefs}
                onChange={(e) => setVerseRefs(e.target.value)}
                placeholder="Rom 8:28-30; Psa 23:1-6"
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">{t('sermon.createFromVerseDesc')}</p>
            </div>
          )}

          {/* Topic Mode */}
          {mode === 'topic' && (
            <>
              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{t('sermon.topicInput')}</label>
                <div className="mt-1 flex gap-1.5">
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={t('sermon.topicInput')}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleRecommendVerses}
                    disabled={!topic.trim() || loading}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('sermon.aiRecommendVerses')}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{t('sermon.createFromTopicDesc')}</p>
              </div>

              {/* Recommended Verses */}
              {recommendedVerses.length > 0 && (
                <div>
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{t('sermon.selectVerses')}</label>
                  <div className="mt-1 space-y-1.5">
                    {recommendedVerses.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => toggleVerse(i)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                          selectedVerses.has(i)
                            ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center ${
                            selectedVerses.has(i) ? 'bg-blue-600 text-white' : 'border border-slate-300 dark:border-slate-600'
                          }`}>
                            {selectedVerses.has(i) && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {v.bookId} {v.chapter}:{v.verseStart}{v.verseEnd > v.verseStart ? `-${v.verseEnd}` : ''}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 ml-6">{v.reason}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Style */}
          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{t('sermon.sermonStyle')}</label>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {(['EXPOSITORY', 'TOPICAL', 'NARRATIVE'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`py-2 rounded-lg text-[11px] font-medium transition-colors ${
                    style === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t(`sermon.${s.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {t('sermon.cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || loading}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {t('sermon.create')}
          </button>
        </div>
      </div>
    </div>
  )
}
