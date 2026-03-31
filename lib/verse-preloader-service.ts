// lib/verse-preloader-service.ts
import { prisma } from '@/lib/prisma'

/**
 * 经文预加载服务
 *
 * 智能预测用户接下来可能阅读的章节，提前加载数据到缓存，
 * 减少切换章节时的等待时间。
 */

interface VerseCache {
  bookId: string
  chapter: number
  verses: any[]
  timestamp: number
}

interface PreloaderConfig {
  maxCacheSize: number
  cacheExpiryMs: number
}

// 书卷章节数据 (圣经书卷章节对照表)
const BOOK_CHAPTERS: Record<string, number> = {
  // 旧约
  'Gen': 50, 'Exo': 40, 'Lev': 27, 'Num': 36, 'Deu': 34,
  'Jos': 24, 'Jdg': 21, 'Rut': 4, '1Sa': 31, '2Sa': 24,
  '1Ki': 22, '2Ki': 25, '1Ch': 29, '2Ch': 36, 'Ezr': 10,
  'Neh': 13, 'Est': 10, 'Job': 42, 'Psa': 150, 'Pro': 31,
  'Ecc': 12, 'Sng': 8, 'Isa': 66, 'Jer': 52, 'Lam': 5,
  'Eze': 48, 'Dan': 12, 'Hos': 14, 'Jol': 3, 'Amo': 9,
  'Oba': 1, 'Jon': 4, 'Mic': 7, 'Nam': 3, 'Hab': 3,
  'Zep': 3, 'Hag': 2, 'Zec': 14, 'Mal': 4,
  // 新约
  'Mat': 28, 'Mar': 16, 'Luk': 24, 'Jhn': 21, 'Act': 28,
  'Rom': 16, '1Co': 16, '2Co': 13, 'Gal': 6, 'Eph': 6,
  'Php': 4, 'Col': 4, '1Th': 5, '2Th': 3, '1Ti': 6,
  '2Ti': 4, 'Tit': 3, 'Phm': 1, 'Heb': 13, 'Jam': 5,
  '1Pe': 5, '2Pe': 3, '1Jn': 5, '2Jn': 1, '3Jn': 1,
  'Jud': 1, 'Rev': 22,
}

// 书卷顺序列表
const BOOK_ORDER = [
  'Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut',
  '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Neh',
  'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'Sng', 'Isa', 'Jer',
  'Lam', 'Eze', 'Dan', 'Hos', 'Jol', 'Amo', 'Oba', 'Jon',
  'Mic', 'Nam', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal',
  'Mat', 'Mar', 'Luk', 'Jhn', 'Act', 'Rom', '1Co', '2Co',
  'Gal', 'Eph', 'Php', 'Col', '1Th', '2Th', '1Ti', '2Ti',
  'Tit', 'Phm', 'Heb', 'Jam', '1Pe', '2Pe', '1Jn', '2Jn',
  '3Jn', 'Jud', 'Rev',
]

export class VersePreloader {
  private cache: Map<string, VerseCache> = new Map()
  private config: PreloaderConfig

  constructor(config?: Partial<PreloaderConfig>) {
    this.config = {
      maxCacheSize: config?.maxCacheSize || 5,
      cacheExpiryMs: config?.cacheExpiryMs || 30 * 60 * 1000, // 30 minutes
    }
  }

  /**
   * 预测下一个章节
   */
  predictNextChapter(bookId: string, chapter: number): { bookId: string; chapter: number } | null {
    const maxChapter = BOOK_CHAPTERS[bookId]

    if (!maxChapter) {
      return null
    }

    // 如果不是该书的最后一章，返回同一书的下一章
    if (chapter < maxChapter) {
      return { bookId, chapter: chapter + 1 }
    }

    // 如果是该书的最后一章，查找下一本书
    const bookIndex = BOOK_ORDER.indexOf(bookId)
    if (bookIndex === -1 || bookIndex === BOOK_ORDER.length - 1) {
      // Revelation 22 是最后一章
      return null
    }

    const nextBookId = BOOK_ORDER[bookIndex + 1]
    return { bookId: nextBookId, chapter: 1 }
  }

  /**
   * 预加载指定章节
   */
  async preloadChapter(bookId: string, chapter: number): Promise<any[] | null> {
    const cacheKey = `${bookId}:${chapter}`

    // 检查缓存
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.config.cacheExpiryMs) {
      return cached.verses
    }

    // 从数据库加载
    try {
      const verses = await prisma.bibleVerse.findMany({
        where: { bookId, chapter },
        orderBy: { verse: 'asc' },
      })

      // 添加到缓存
      this.addToCache(cacheKey, bookId, chapter, verses)

      return verses
    } catch (error) {
      console.error('[VersePreloader] Error preloading chapter:', error)
      return null
    }
  }

  /**
   * 预加载下一个章节
   */
  async preloadNextChapter(currentBookId: string, currentChapter: number): Promise<void> {
    const next = this.predictNextChapter(currentBookId, currentChapter)

    if (next) {
      await this.preloadChapter(next.bookId, next.chapter)
    }
  }

  /**
   * 从缓存获取章节
   */
  getCachedChapter(bookId: string, chapter: number): any[] | undefined {
    const cacheKey = `${bookId}:${chapter}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.config.cacheExpiryMs) {
      return cached.verses
    }

    return undefined
  }

  /**
   * 添加到缓存
   */
  private addToCache(cacheKey: string, bookId: string, chapter: number, verses: any[]): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.config.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(cacheKey, {
      bookId,
      chapter,
      verses,
      timestamp: Date.now(),
    })
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

// 导出单例实例
export const versePreloader = new VersePreloader()