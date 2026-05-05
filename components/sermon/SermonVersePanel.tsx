'use client'

import { useState, useEffect, useCallback } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { useBreakpoint } from '@/hooks/use-media-query'
import { BookMarked, ClipboardPaste, Loader2 } from 'lucide-react'
import { useSermonEditor } from './SermonEditorContext'

interface VerseRefData {
  bookId: string
  chapter: number
  verseStart: number
  verseEnd: number
  text?: string
  loading?: boolean
}

// Chinese book name to English mapping
const ZH_BOOK_MAP: Record<string, string> = {
  '创世记': 'Genesis', '创': 'Genesis',
  '出埃及记': 'Exodus', '出': 'Exodus',
  '利未记': 'Leviticus', '利': 'Leviticus',
  '民数记': 'Numbers', '民': 'Numbers',
  '申命记': 'Deuteronomy', '申': 'Deuteronomy',
  '约书亚记': 'Joshua', '书': 'Joshua',
  '士师记': 'Judges', '士': 'Judges',
  '路得记': 'Ruth', '得': 'Ruth',
  '撒母耳记上': '1Samuel', '撒上': '1Samuel',
  '撒母耳记下': '2Samuel', '撒下': '2Samuel',
  '列王纪上': '1Kings', '王上': '1Kings',
  '列王纪下': '2Kings', '王下': '2Kings',
  '历代志上': '1Chronicles', '代上': '1Chronicles',
  '历代志下': '2Chronicles', '代下': '2Chronicles',
  '以斯拉记': 'Ezra', '拉': 'Ezra',
  '尼希米记': 'Nehemiah', '尼': 'Nehemiah',
  '以斯帖记': 'Esther', '斯': 'Esther',
  '约伯记': 'Job', '伯': 'Job',
  '诗篇': 'Psalms', '诗': 'Psalms',
  '箴言': 'Proverbs', '箴': 'Proverbs',
  '传道书': 'Ecclesiastes', '传': 'Ecclesiastes',
  '雅歌': 'SongOfSolomon', '歌': 'SongOfSolomon',
  '以赛亚书': 'Isaiah', '赛': 'Isaiah',
  '耶利米书': 'Jeremiah', '耶': 'Jeremiah',
  '耶利米哀歌': 'Lamentations', '哀': 'Lamentations',
  '以西结书': 'Ezekiel', '结': 'Ezekiel',
  '但以理书': 'Daniel', '但': 'Daniel',
  '何西阿书': 'Hosea', '何': 'Hosea',
  '约珥书': 'Joel', '珥': 'Joel',
  '阿摩司书': 'Amos', '摩': 'Amos',
  '俄巴底亚书': 'Obadiah', '俄': 'Obadiah',
  '约拿书': 'Jonah', '拿': 'Jonah',
  '弥迦书': 'Micah', '弥': 'Micah',
  '那鸿书': 'Nahum', '鸿': 'Nahum',
  '哈巴谷书': 'Habakkuk', '哈': 'Habakkuk',
  '西番雅书': 'Zephaniah', '番': 'Zephaniah',
  '哈该书': 'Haggai', '该': 'Haggai',
  '撒迦利亚书': 'Zechariah', '亚': 'Zechariah',
  '玛拉基书': 'Malachi', '玛': 'Malachi',
  '马太福音': 'Matthew', '太': 'Matthew',
  '马可福音': 'Mark', '可': 'Mark',
  '路加福音': 'Luke', '路': 'Luke',
  '约翰福音': 'John', '约': 'John',
  '使徒行传': 'Acts', '徒': 'Acts',
  '罗马书': 'Romans', '罗': 'Romans',
  '哥林多前书': '1Corinthians', '林前': '1Corinthians',
  '哥林多后书': '2Corinthians', '林后': '2Corinthians',
  '加拉太书': 'Galatians', '加': 'Galatians',
  '以弗所书': 'Ephesians', '弗': 'Ephesians',
  '腓立比书': 'Philippians', '腓': 'Philippians',
  '歌罗西书': 'Colossians', '西': 'Colossians',
  '帖撒罗尼迦前书': '1Thessalonians', '帖前': '1Thessalonians',
  '帖撒罗尼迦后书': '2Thessalonians', '帖后': '2Thessalonians',
  '提摩太前书': '1Timothy', '提前': '1Timothy',
  '提摩太后书': '2Timothy', '提后': '2Timothy',
  '提多书': 'Titus', '多': 'Titus',
  '腓利门书': 'Philemon', '门': 'Philemon',
  '希伯来书': 'Hebrews', '来': 'Hebrews',
  '雅各书': 'James', '雅': 'James',
  '彼得前书': '1Peter', '彼前': '1Peter',
  '彼得后书': '2Peter', '彼后': '2Peter',
  '约翰一书': '1John', '约一': '1John',
  '约翰二书': '2John', '约二': '2John',
  '约翰三书': '3John', '约三': '3John',
  '犹大书': 'Jude', '犹': 'Jude',
  '启示录': 'Revelation', '启': 'Revelation',
}

function parseVerseRefs(refs: string): VerseRefData[] {
  if (!refs || refs === '[]') return []
  try {
    // Try JSON array format first
    const parsed = JSON.parse(refs)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  // Parse free-text format: "Rom 8:28-30; Psa 23:1; 罗8:28"
  const results: VerseRefData[] = []
  const parts = refs.split(/[;；,，]/).map(s => s.trim()).filter(Boolean)
  for (const part of parts) {
    const match = part.match(/([\u4e00-\u9fff]+|\w+)\s*(\d+):(\d+)(?:-(\d+))?/)
    if (match) {
      const rawBook = match[1]
      const bookId = ZH_BOOK_MAP[rawBook] || rawBook
      results.push({
        bookId,
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
  const { isMd } = useBreakpoint()
  const { currentSermon } = useBibleStore()
  const { insertContent } = useSermonEditor()
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
    // Race condition guard: ignore stale results if verseRefs changes mid-fetch
    let cancelled = false
    Promise.all(
      refs.map(async (ref) => {
        try {
          const res = await fetch(`/api/bible?book=${ref.bookId}&chapter=${ref.chapter}`)
          const data = await res.json()
          const verses = data.verses || data.data || []
          const relevantVerses = verses.filter((v: { verse?: number; verseNumber?: number }) => {
            const verse = v.verse || v.verseNumber
            return verse >= ref.verseStart && verse <= ref.verseEnd
          })
          const text = relevantVerses.map((v: { verse?: number; verseNumber?: number; content?: string; text?: string }) => `${v.verse || v.verseNumber}. ${v.content || v.text}`).join('\n')
          return { ...ref, text, loading: false }
        } catch {
          return { ...ref, text: '', loading: false }
        }
      })
    ).then((data) => {
      if (!cancelled) {
        setVerseData(data)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [currentSermon?.verseRefs])

  const handleInsert = useCallback((text: string) => {
    if (!currentSermon || !text) return
    // Insert directly into the CodeMirror editor via context
    insertContent(text)
  }, [currentSermon, insertContent])

  return (
    <div className="h-full flex flex-col bg-secondary">
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <BookMarked className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground/90">{t('sermon.versePanelTitle')}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && verseData.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            <BookMarked className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>{t('sermon.verseNoRefs')}</p>
          </div>
        )}
        {verseData.map((ref, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-primary">
                {ref.bookId} {ref.chapter}:{ref.verseStart}{ref.verseEnd > ref.verseStart ? `-${ref.verseEnd}` : ''}
              </span>
              <button
                onClick={() => handleInsert(ref.text || '')}
                className={`inline-flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80 ${isMd ? '' : 'min-h-[44px] px-3'} active:scale-95`}
              >
                <ClipboardPaste className="w-2.5 h-2.5" />
                {t('sermon.verseInsert')}
              </button>
            </div>
            {ref.text ? (
              <p className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap border-l-2 border-primary/40 pl-2">
                {ref.text}
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground">{t('sermon.verseLoading')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}