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

export interface PreloadProgress {
  bookId: string;
  bookName: string;
  currentChapter: number;
  totalChapters: number;
  totalBooks: number;
  completedBooks: number;
  status: 'idle' | 'loading' | 'complete' | 'error';
  error?: string;
}

export type ProgressCallback = (progress: PreloadProgress) => void;

const API_BASE_URL = 'http://113.44.66.210:3000/api';

// Book chapter counts (standard Protestant canon)
export const BOOK_CHAPTERS: Record<string, number> = {
  // Old Testament
  gen: 50, exod: 40, lev: 27, num: 36, deut: 34,
  josh: 24, judg: 21, ruth: 4, '1sam': 31, '2sam': 24,
  '1kgs': 22, '2kgs': 25, '1chr': 29, '2chr': 36,
  ezra: 10, neh: 13, esth: 10, job: 42, ps: 150,
  prov: 31, eccl: 12, song: 8, isa: 66, jer: 52,
  lam: 5, ezek: 48, dan: 12, hos: 14, joel: 3,
  amos: 9, obad: 1, jonah: 4, mic: 7, nah: 3,
  hab: 3, zeph: 3, hag: 2, zech: 14, mal: 4,
  // New Testament
  mat: 28, mark: 16, luke: 24, john: 21, acts: 28,
  rom: 16, '1cor': 16, '2cor': 13, gal: 6, eph: 6,
  phil: 4, col: 4, '1thess': 5, '2thess': 3,
  '1tim': 6, '2tim': 4, titus: 3, phlm: 1,
  heb: 13, jas: 5, '1pet': 5, '2pet': 3,
  '1john': 5, '2john': 1, '3john': 1, jude: 1, rev: 22,
};

// Book names in Chinese
export const BOOK_NAMES: Record<string, string> = {
  gen: '创世记', exod: '出埃及记', lev: '利未记', num: '民数记', deut: '申命记',
  josh: '约书亚记', judg: '士师记', ruth: '路得记', '1sam': '撒母耳记上', '2sam': '撒母耳记下',
  '1kgs': '列王纪上', '2kgs': '列王纪下', '1chr': '历代志上', '2chr': '历代志下',
  ezra: '以斯拉记', neh: '尼希米记', esth: '以斯帖记', job: '约伯记', ps: '诗篇',
  prov: '箴言', eccl: '传道书', song: '雅歌', isa: '以赛亚书', jer: '耶利米书',
  lam: '耶利米哀歌', ezek: '以西结书', dan: '但以理书', hos: '何西阿书', joel: '约珥书',
  amos: '阿摩司书', obad: '俄巴底亚书', jonah: '约拿书', mic: '弥迦书', nah: '那鸿书',
  hab: '哈巴谷书', zeph: '西番雅书', hag: '哈该书', zech: '撒迦利亚书', mal: '玛拉基书',
  mat: '马太福音', mark: '马可福音', luke: '路加福音', john: '约翰福音', acts: '使徒行传',
  rom: '罗马书', '1cor': '哥林多前书', '2cor': '哥林多后书', gal: '加拉太书', eph: '以弗所书',
  phil: '腓立比书', col: '歌罗西书', '1thess': '帖撒罗尼迦前书', '2thess': '帖撒罗尼迦后书',
  '1tim': '提摩太前书', '2tim': '提摩太后书', titus: '提多书', phlm: '腓利门书',
  heb: '希伯来书', jas: '雅各书', '1pet': '彼得前书', '2pet': '彼得后书',
  '1john': '约翰一书', '2john': '约翰二书', '3john': '约翰三书', jude: '犹大书', rev: '启示录',
};

/**
 * Get list of all book IDs
 */
export function getAllBookIds(): string[] {
  return Object.keys(BOOK_CHAPTERS);
}

/**
 * Get total chapter count for entire Bible
 */
export function getTotalChapterCount(): number {
  return Object.values(BOOK_CHAPTERS).reduce((sum, count) => sum + count, 0);
}

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
export async function preloadBook(
  bookId: string,
  onProgress?: ProgressCallback
): Promise<number> {
  const chapters = BOOK_CHAPTERS[bookId] || 1;
  let loaded = 0;

  for (let ch = 1; ch <= chapters; ch++) {
    try {
      const verses = await getChapter(bookId, ch, 'CUV');
      if (verses.length > 0) {
        loaded++;
      }
      onProgress?.({
        bookId,
        bookName: BOOK_NAMES[bookId] || bookId,
        currentChapter: ch,
        totalChapters: chapters,
        totalBooks: 1,
        completedBooks: 0,
        status: 'loading',
      });
      // Small delay to avoid overwhelming the server
      await new Promise(r => setTimeout(r, 50));
    } catch (error) {
      console.error(`Failed to preload ${bookId} ${ch}:`, error);
    }
  }

  onProgress?.({
    bookId,
    bookName: BOOK_NAMES[bookId] || bookId,
    currentChapter: chapters,
    totalChapters: chapters,
    totalBooks: 1,
    completedBooks: 1,
    status: 'complete',
  });

  return loaded;
}

/**
 * Preload entire Bible for offline reading
 */
export async function preloadAllBooks(
  onProgress?: ProgressCallback
): Promise<{ loaded: number; total: number }> {
  const bookIds = getAllBookIds();
  const totalBooks = bookIds.length;
  let completedBooks = 0;
  let totalChaptersLoaded = 0;
  const totalChapterCount = getTotalChapterCount();

  for (const bookId of bookIds) {
    try {
      const chapters = BOOK_CHAPTERS[bookId] || 1;

      for (let ch = 1; ch <= chapters; ch++) {
        try {
          const verses = await getChapter(bookId, ch, 'CUV');
          if (verses.length > 0) {
            totalChaptersLoaded++;
          }
          onProgress?.({
            bookId,
            bookName: BOOK_NAMES[bookId] || bookId,
            currentChapter: ch,
            totalChapters: chapters,
            totalBooks,
            completedBooks,
            status: 'loading',
          });
          // Small delay to avoid overwhelming the server
          await new Promise(r => setTimeout(r, 30));
        } catch (error) {
          console.error(`Failed to preload ${bookId} ${ch}:`, error);
        }
      }

      completedBooks++;
    } catch (error) {
      console.error(`Failed to preload book ${bookId}:`, error);
    }
  }

  onProgress?.({
    bookId: '',
    bookName: '',
    currentChapter: 0,
    totalChapters: 0,
    totalBooks,
    completedBooks,
    status: 'complete',
  });

  return { loaded: totalChaptersLoaded, total: totalChapterCount };
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

/**
 * Get cached verse count
 */
export async function getCachedVerseCount(): Promise<number> {
  try {
    const count = await invoke<number>('db_count_bible_verses', { bookId: null });
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Get cache status for all books
 */
export async function getBooksCacheStatus(): Promise<Record<string, { cached: boolean; chapters: number }>> {
  const status: Record<string, { cached: boolean; chapters: number }> = {};

  for (const bookId of getAllBookIds()) {
    const totalChapters = BOOK_CHAPTERS[bookId] || 0;
    try {
      const count = await invoke<number>('db_count_bible_verses', { bookId });
      status[bookId] = {
        cached: count > 0,
        chapters: totalChapters,
      };
    } catch {
      status[bookId] = {
        cached: false,
        chapters: totalChapters,
      };
    }
  }

  return status;
}

/**
 * Clear all cached Bible verses
 */
export async function clearBibleCache(): Promise<void> {
  try {
    await invoke('db_clear_bible_cache');
  } catch (error) {
    console.error('Failed to clear Bible cache:', error);
    throw error;
  }
}

/**
 * Estimate storage size for caching
 */
export async function estimateCacheSize(): Promise<{ verses: number; sizeKB: number }> {
  try {
    const count = await getCachedVerseCount();
    // Estimate: ~200 bytes per verse (text + metadata)
    const sizeKB = Math.round(count * 200 / 1024);
    return { verses: count, sizeKB };
  } catch {
    return { verses: 0, sizeKB: 0 };
  }
}