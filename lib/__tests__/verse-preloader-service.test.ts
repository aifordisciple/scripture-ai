import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VersePreloader } from '../verse-preloader-service'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    bibleVerse: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('VersePreloader', () => {
  const mockVerses = [
    { id: 'v1', bookId: 'Gen', chapter: 1, verse: 1, text: 'In the beginning' },
    { id: 'v2', bookId: 'Gen', chapter: 1, verse: 2, text: 'God created' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('predictNextChapter', () => {
    it('predicts next chapter in same book', () => {
      const preloader = new VersePreloader()

      const result = preloader.predictNextChapter('Gen', 1)

      expect(result).toEqual({ bookId: 'Gen', chapter: 2 })
    })

    it('handles last chapter of book by moving to next book', () => {
      const preloader = new VersePreloader()

      // Genesis has 50 chapters
      const result = preloader.predictNextChapter('Gen', 50)

      expect(result).toEqual({ bookId: 'Exo', chapter: 1 })
    })

    it('returns null for last chapter of Revelation', () => {
      const preloader = new VersePreloader()

      // Revelation has 22 chapters
      const result = preloader.predictNextChapter('Rev', 22)

      expect(result).toBeNull()
    })
  })

  describe('preloadChapter', () => {
    it('fetches verses for specified chapter', async () => {
      vi.mocked(prisma.bibleVerse.findMany).mockResolvedValue(mockVerses as any)

      const preloader = new VersePreloader()
      const result = await preloader.preloadChapter('Gen', 1)

      expect(result).toBeDefined()
      expect(result?.length).toBe(2)
      expect(prisma.bibleVerse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { bookId: 'Gen', chapter: 1 },
        })
      )
    })

    it('caches preloaded verses', async () => {
      vi.mocked(prisma.bibleVerse.findMany).mockResolvedValue(mockVerses as any)

      const preloader = new VersePreloader()

      // First call
      await preloader.preloadChapter('Gen', 1)
      // Second call - should use cache
      await preloader.preloadChapter('Gen', 1)

      // Should only call database once
      expect(prisma.bibleVerse.findMany).toHaveBeenCalledTimes(1)
    })

    it('returns cached data if available', async () => {
      vi.mocked(prisma.bibleVerse.findMany).mockResolvedValue(mockVerses as any)

      const preloader = new VersePreloader()

      const result1 = await preloader.preloadChapter('Gen', 1)
      const result2 = await preloader.getCachedChapter('Gen', 1)

      expect(result2).toEqual(result1)
    })
  })

  describe('preloadNextChapter', () => {
    it('preloads predicted next chapter', async () => {
      vi.mocked(prisma.bibleVerse.findMany).mockResolvedValue(mockVerses as any)

      const preloader = new VersePreloader()
      await preloader.preloadNextChapter('Gen', 1)

      // Should preload Genesis 2
      expect(prisma.bibleVerse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { bookId: 'Gen', chapter: 2 },
        })
      )
    })

    it('does nothing if no next chapter predicted', async () => {
      vi.mocked(prisma.bibleVerse.findMany).mockResolvedValue(mockVerses as any)

      const preloader = new VersePreloader()
      await preloader.preloadNextChapter('Rev', 22)

      // Should not preload anything
      expect(prisma.bibleVerse.findMany).not.toHaveBeenCalled()
    })
  })

  describe('cache management', () => {
    it('clears cache when requested', async () => {
      vi.mocked(prisma.bibleVerse.findMany).mockResolvedValue(mockVerses as any)

      const preloader = new VersePreloader()
      await preloader.preloadChapter('Gen', 1)

      preloader.clearCache()

      const cached = preloader.getCachedChapter('Gen', 1)
      expect(cached).toBeUndefined()
    })

    it('limits cache size', async () => {
      vi.mocked(prisma.bibleVerse.findMany).mockResolvedValue(mockVerses as any)

      const preloader = new VersePreloader({ maxCacheSize: 2 })

      // Load 3 chapters
      await preloader.preloadChapter('Gen', 1)
      await preloader.preloadChapter('Gen', 2)
      await preloader.preloadChapter('Gen', 3)

      // First chapter should be evicted
      const cached1 = preloader.getCachedChapter('Gen', 1)
      const cached2 = preloader.getCachedChapter('Gen', 2)
      const cached3 = preloader.getCachedChapter('Gen', 3)

      expect(cached1).toBeUndefined()
      expect(cached2).toBeDefined()
      expect(cached3).toBeDefined()
    })
  })
})