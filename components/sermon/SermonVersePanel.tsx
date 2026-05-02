'use client'

import { useState, useEffect } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { useSermonEditor } from './SermonEditorContext'
import { BookMarked, ClipboardPaste, Loader2 } from 'lucide-react'

interface VerseRefData {
  bookId: string
  chapter: number
  verseStart: number
  verseEnd: number
  text?: string
  loading?: boolean
}

function parseVerseRefs(refs: string): VerseRefData[] {
  if (!refs || refs === '[]') return []
  try {
    // Try JSON array format first
    const parsed = JSON.parse(refs)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  // Parse free-text format: "Rom 8:28-30; Psa 23:1"
  const results: VerseRefData[] = []
  const parts = refs.split(/[;；,，]/).map(s => s.trim()).filter(Boolean)
  for (const part of parts) {
    const match = part.match(/(\w+)\s+(\d+):(\d+)(?:-(\d+))?/)
    if (match) {
      results.push({
        bookId: match[1],
        chapter: parseInt(match[2]),
        verseStart: parseInt(match[3]),
        verseEnd: match[4] ? parseInt(match[4]) : parseInt(match[3]),
      })
    }
  }
  return results
}

export function SermonVersePanel() {
  const { t } = useTranslation()
  const { currentSermon } = useBibleStore()
  const editor = useSermonEditor()
  const [verseData, setVerseData] = useState<VerseRefData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentSermon?.verseRefs) {
      setVerseData([])
      return
    }
    const refs = parseVerseRefs(currentSermon.verseRefs)
    if (refs.length === 0) {
      setVerseData([])
      return
    }
    setLoading(true)
    // Fetch verse text for each reference
    Promise.all(
      refs.map(async (ref) => {
        try {
          const res = await fetch(`/api/bible?book=${ref.bookId}&chapter=${ref.chapter}`)
          const data = await res.json()
          const verses = data.verses || data.data || []
          const relevantVerses = verses.filter((v: any) => {
            const verse = v.verse || v.verseNumber
            return verse >= ref.verseStart && verse <= ref.verseEnd
          })
          const text = relevantVerses.map((v: any) => `${v.verse || v.verseNumber}. ${v.content || v.text}`).join('\n')
          return { ...ref, text, loading: false }
        } catch {
          return { ...ref, text: '', loading: false }
        }
      })
    ).then((data) => {
      setVerseData(data)
      setLoading(false)
    })
  }, [currentSermon?.verseRefs])

  const handleInsert = (text: string) => {
    if (!editor || !text) return
    editor.chain().focus().insertContent(text).run()
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <BookMarked className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t('sermon.versePanelTitle')}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        )}
        {!loading && verseData.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            <BookMarked className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>{t('sermon.verseNoRefs')}</p>
          </div>
        )}
        {verseData.map((ref, i) => (
          <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                {ref.bookId} {ref.chapter}:{ref.verseStart}{ref.verseEnd > ref.verseStart ? `-${ref.verseEnd}` : ''}
              </span>
              <button
                onClick={() => handleInsert(ref.text || '')}
                className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 hover:text-blue-600"
              >
                <ClipboardPaste className="w-2.5 h-2.5" />
                {t('sermon.verseInsert')}
              </button>
            </div>
            {ref.text ? (
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap border-l-2 border-blue-300 dark:border-blue-700 pl-2">
                {ref.text}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400">{t('sermon.verseLoading')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
