// lib/memory-reminder-service.ts
import { prisma } from '@/lib/prisma'

/**
 * 记忆卡片提醒服务
 *
 * 基于 SM-2 算法的记忆系统，检查到期的记忆卡片并发送复习提醒。
 */

export interface DueMemoryCard {
  id: string
  userId: string
  content: string
  reference: string
  nextReview: Date
}

export interface ReminderResult {
  processed: number
  notified: number
  errors: number
}

/**
 * 检查用户到期的记忆卡片
 */
export async function checkDueMemoryCards(userId: string): Promise<DueMemoryCard[]> {
  const now = new Date()

  const dueCards = await prisma.memoryCard.findMany({
    where: {
      userId,
      nextReview: {
        lte: now,
      },
    },
    select: {
      id: true,
      userId: true,
      content: true,
      reference: true,
      nextReview: true,
    },
    orderBy: {
      nextReview: 'asc',
    },
  })

  return dueCards
}

/**
 * 为用户创建记忆复习提醒通知
 */
export async function createMemoryReminder(
  userId: string,
  dueCardCount: number
): Promise<{ id: string } | null> {
  if (dueCardCount === 0) {
    return null
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      type: 'MEMORY_REVIEW',
      title: '复习提醒',
      content: `您有${dueCardCount}张记忆卡片需要复习`,
      read: false,
    },
  })

  return { id: notification.id }
}

/**
 * 记忆提醒服务类
 * 用于批量处理所有用户的提醒
 */
export class MemoryReminderService {
  /**
   * 处理所有用户的记忆卡片提醒
   */
  async processAllUsers(): Promise<ReminderResult> {
    const result: ReminderResult = {
      processed: 0,
      notified: 0,
      errors: 0,
    }

    // 获取所有启用了通知的用户
    const users = await prisma.user.findMany({
      where: {
        // 可以添加更多过滤条件
      },
      select: {
        id: true,
      },
    })

    for (const user of users) {
      try {
        result.processed++

        const dueCards = await checkDueMemoryCards(user.id)

        if (dueCards.length > 0) {
          await createMemoryReminder(user.id, dueCards.length)
          result.notified++
        }
      } catch (error) {
        console.error(`[Memory Reminder] Error processing user ${user.id}:`, error)
        result.errors++
      }
    }

    return result
  }

  /**
   * 获取用户的复习统计
   */
  async getReviewStats(userId: string): Promise<{
    total: number
    due: number
    mastered: number
    learning: number
  }> {
    const [total, due, mastered, learning] = await Promise.all([
      prisma.memoryCard.count({ where: { userId } }),
      prisma.memoryCard.count({
        where: {
          userId,
          nextReview: { lte: new Date() },
        },
      }),
      prisma.memoryCard.count({
        where: {
          userId,
          repetitions: { gte: 5 },
        },
      }),
      prisma.memoryCard.count({
        where: {
          userId,
          repetitions: { lt: 5 },
        },
      }),
    ])

    return { total, due, mastered, learning }
  }
}

// 导出单例实例
export const memoryReminderService = new MemoryReminderService()