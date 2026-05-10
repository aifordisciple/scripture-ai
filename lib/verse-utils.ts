// lib/verse-utils.ts
// Utility for parsing verse references and mapping book names to IDs

import { BIBLE_BOOKS } from './constants'

interface ParsedVerseRef {
  book: string
  chapter: number
  verse?: number
  verseEnd?: number
}

/**
 * Parse a verse reference string like "Rom 8:28", "创世记 1:1", "Psa 23"
 * Returns null if parsing fails
 */
export function parseVerseRef(ref: string): ParsedVerseRef | null {
  if (!ref || !ref.trim()) return null

  const trimmed = ref.trim()

  // Match pattern: BookName Chapter:Verse or BookName Chapter
  const match = trimmed.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/)
  if (!match) return null

  const bookName = match[1].trim()
  const chapter = parseInt(match[2])
  const verse = match[3] ? parseInt(match[3]) : undefined
  const verseEnd = match[4] ? parseInt(match[4]) : undefined

  return { book: bookName, chapter, verse, verseEnd }
}

/**
 * Map a book name (Chinese or English) to the BIBLE_BOOKS ID (e.g. 'Gen', 'Rom')
 * Returns null if not found
 */
export function bookNameToId(name: string): string | null {
  if (!name) return null

  const lower = name.toLowerCase().replace(/\s+/g, '')

  // Try exact match on id first
  const exactMatch = BIBLE_BOOKS.find(b => b.id.toLowerCase() === lower)
  if (exactMatch) return exactMatch.id

  // Try match on English name
  const enMatch = BIBLE_BOOKS.find(b => b.nameEn.toLowerCase().replace(/\s+/g, '') === lower)
  if (enMatch) return enMatch.id

  // Try match on Chinese name
  const zhMatch = BIBLE_BOOKS.find(b => b.name === name)
  if (zhMatch) return zhMatch.id

  // Try partial match on English name (e.g. "Rom" matches "Romans")
  const partialMatch = BIBLE_BOOKS.find(b =>
    b.nameEn.toLowerCase().startsWith(lower) || lower.startsWith(b.nameEn.toLowerCase())
  )
  if (partialMatch) return partialMatch.id

  // Try partial match on id (e.g. "rom" matches "Rom")
  const idPartialMatch = BIBLE_BOOKS.find(b =>
    b.id.toLowerCase().startsWith(lower) || lower.startsWith(b.id.toLowerCase())
  )
  if (idPartialMatch) return idPartialMatch.id

  return null
}

/**
 * Parse verseRefs from a sermon (can be JSON array or free-text string)
 * and return the first reference's bookId and chapter for navigation
 */
export function getFirstVerseRef(verseRefs: string): { bookId: string; chapter: string } | null {
  if (!verseRefs || verseRefs === '[]') return null

  // Try JSON array format first
  try {
    const parsed = JSON.parse(verseRefs)
    if (Array.isArray(parsed) && parsed.length > 0) {
      const first = parsed[0]
      if (typeof first === 'object' && first.bookId && first.chapter) {
        return { bookId: first.bookId, chapter: String(first.chapter) }
      }
      if (typeof first === 'string') {
        const ref = parseVerseRef(first)
        if (ref) {
          const bookId = bookNameToId(ref.book)
          if (bookId) return { bookId, chapter: String(ref.chapter) }
        }
      }
    }
  } catch {
    // Not JSON, try free-text format
  }

  // Free-text format: "Rom 8:28-30; Psa 23:1"
  const parts = verseRefs.split(/[;；,，]/).map(s => s.trim()).filter(Boolean)
  if (parts.length > 0) {
    const ref = parseVerseRef(parts[0])
    if (ref) {
      const bookId = bookNameToId(ref.book)
      if (bookId) return { bookId, chapter: String(ref.chapter) }
    }
  }

  return null
}
