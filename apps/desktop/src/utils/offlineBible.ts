// apps/desktop/src/utils/offlineBible.ts
/**
 * Offline Bible support for desktop app
 *
 * Caches Bible verses in SQLite for offline reading
 */

import { invoke } from '@tauri-apps/api/core';

export interface OfflineVerse {
  id: string;
  book_id: string;
  chapter: number;
  verse: number;
  text: string;
  text_en?: string;
  version: string;
}

const API_BASE_URL = 'https://scripture-ai.com/api';

/**
 * Initialize offline Bible database
 */
export async function initOfflineBible(): Promise<void> {
  try {
    await invoke('db_init_bible_tables');
  } catch (error) {
    console.error('Failed to init offline Bible tables:', error);
  }
}

/**
 * Get chapter from local cache or API
 */
export async function getChapter(
  bookId: string,
  chapter: number,
  version: string = 'CUV'
): Promise<OfflineVerse[]> {
  // Try local cache first
  const cached = await getCachedChapter(bookId, chapter, version);
  if (cached.length > 0) {
    return cached;
  }

  // Try to fetch from API
  try {
    const response = await fetch(
      `${API_BASE_URL}/bible?book=${bookId}&chapter=${chapter}&version=${version}`
    );

    if (response.ok) {
      const data = await response.json();
      const verses = data.verses || data.data || [];

      // Cache verses for offline use
      if (verses.length > 0) {
        await cacheVerses(verses, version);
      }

      return verses;
    }
  } catch (error) {
    console.warn('Failed to fetch from API, using cache:', error);
  }

  // Return empty if no cache and no network
  return [];
}

/**
 * Get cached chapter from SQLite
 */
async function getCachedChapter(
  bookId: string,
  chapter: number,
  version: string
): Promise<OfflineVerse[]> {
  try {
    const verses = await invoke<OfflineVerse[]>('db_get_bible_chapter', {
      bookId,
      chapter,
      version,
    });
    return verses || [];
  } catch (error) {
    console.error('Failed to get cached chapter:', error);
    return [];
  }
}

/**
 * Cache verses in SQLite
 */
async function cacheVerses(verses: OfflineVerse[], version: string): Promise<void> {
  try {
    for (const verse of verses) {
      await invoke('db_save_bible_verse', {
        verse: {
          id: `${verse.book_id}-${verse.chapter}-${verse.verse}-${version}`,
          book_id: verse.book_id,
          chapter: verse.chapter,
          verse: verse.verse,
          text: verse.text,
          text_en: verse.text_en || null,
          version,
        },
      });
    }
  } catch (error) {
    console.error('Failed to cache verses:', error);
  }
}

/**
 * Preload entire book for offline reading
 */
export async function preloadBook(bookId: string): Promise<number> {
  // Book chapter counts
  const bookChapters: Record<string, number> = {
    gen: 50, exod: 40, lev: 27, num: 36, deut: 34,
    josh: 24, judg: 21, ruth: 4, '1sam': 31, '2sam': 24,
    '1kgs': 22, '2kgs': 25, '1chr': 29, '2chr': 36,
    ezra: 10, neh: 13, esth: 10, job: 42, ps: 150,
    prov: 31, eccl: 12, song: 8, isa: 66, jer: 52,
    lam: 5, ezek: 48, dan: 12, hos: 14, joel: 3,
    amos: 9, obad: 1, jonah: 4, mic: 7, nah: 3,
    hab: 3, zeph: 3, hag: 2, zech: 14, mal: 4,
    mat: 28, mark: 16, luke: 24, john: 21, acts: 28,
    rom: 16, '1cor': 16, '2cor': 13, gal: 6, eph: 6,
    phil: 4, col: 4, '1thess': 5, '2thess': 3,
    '1tim': 6, '2tim': 4, titus: 3, phlm: 1,
    heb: 13, jas: 5, '1pet': 5, '2pet': 3,
    '1john': 5, '2john': 1, '3john': 1, jude: 1, rev: 22,
  };

  const chapters = bookChapters[bookId] || 1;
  let loaded = 0;

  for (let ch = 1; ch <= chapters; ch++) {
    try {
      const verses = await getChapter(bookId, ch, 'CUV');
      if (verses.length > 0) {
        loaded++;
      }
      // Small delay to avoid overwhelming the server
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.error(`Failed to preload ${bookId} ${ch}:`, error);
    }
  }

  return loaded;
}

/**
 * Check if book is cached
 */
export async function isBookCached(bookId: string): Promise<boolean> {
  try {
    const count = await invoke<number>('db_count_bible_verses', { bookId });
    return count > 0;
  } catch {
    return false;
  }
}

/**
 * Get offline status
 */
export function isOnline(): boolean {
  return navigator.onLine;
}