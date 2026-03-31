import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkDueMemoryCards, createMemoryReminder, MemoryReminderService } from '../memory-reminder-service'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    memoryCard: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('Memory Reminder Service', () => {
  const mockUserId = 'user-test-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkDueMemoryCards', () => {
    it('returns empty array when no cards due', async () => {
      vi.mocked(prisma.memoryCard.findMany).mockResolvedValue([])

      const result = await checkDueMemoryCards(mockUserId)

      expect(result).toEqual([])
    })

    it('returns due memory cards', async () => {
      const mockCards = [
        {
          id: 'card-1',
          userId: mockUserId,
          content: '约翰福音3:16',
          reference: 'Jhn 3:16',
          nextReview: new Date('2026-03-30'),
        },
        {
          id: 'card-2',
          userId: mockUserId,
          content: '诗篇23:1',
          reference: 'Psa 23:1',
          nextReview: new Date('2026-03-29'),
        },
      ]

      vi.mocked(prisma.memoryCard.findMany).mockResolvedValue(mockCards as any)

      const result = await checkDueMemoryCards(mockUserId)

      expect(result.length).toBe(2)
      expect(result[0].id).toBe('card-1')
    })

    it('filters cards by nextReview date', async () => {
      await checkDueMemoryCards(mockUserId)

      expect(prisma.memoryCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nextReview: expect.any(Object),
          }),
        })
      )
    })
  })

  describe('createMemoryReminder', () => {
    it('creates notification for due cards', async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({
        id: 'notif-1',
        userId: mockUserId,
        type: 'MEMORY_REVIEW',
        title: '复习提醒',
        content: '您有2张记忆卡片需要复习',
        read: false,
        createdAt: new Date(),
      } as any)

      const result = await createMemoryReminder(mockUserId, 2)

      expect(result).toBeTruthy()
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'MEMORY_REVIEW',
          }),
        })
      )
    })

    it('returns null when count is 0', async () => {
      const result = await createMemoryReminder(mockUserId, 0)

      expect(result).toBeNull()
      expect(prisma.notification.create).not.toHaveBeenCalled()
    })
  })

  describe('MemoryReminderService', () => {
    it('processes all users with due cards', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 'user-1' },
        { id: 'user-2' },
      ] as any)

      vi.mocked(prisma.memoryCard.findMany)
        .mockResolvedValueOnce([{ id: 'card-1' }] as any)
        .mockResolvedValueOnce([] as any)

      vi.mocked(prisma.notification.create).mockResolvedValue({} as any)

      const service = new MemoryReminderService()
      const result = await service.processAllUsers()

      expect(result.processed).toBe(2)
      expect(result.notified).toBe(1)
    })
  })
})