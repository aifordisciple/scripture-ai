// lib/ai-context-builder.ts
import { prisma } from '@/lib/prisma'

/**
 * 用户 AI 上下文记忆系统
 *
 * 从用户行为中学习偏好，自动注入到 AI 提示词中，
 * 提供个性化的圣经解读体验。
 */

export interface AIStylePreference {
  detailLevel: 'concise' | 'balanced' | 'detailed'
  depthLevel: 'beginner' | 'intermediate' | 'academic'
  tone: 'modern' | 'traditional'
}

export interface UserAIContext {
  stylePreference: AIStylePreference
  favoriteBooks: string[]
  recentTopics: string[]
  readingHistory: {
    lastBook?: string
    lastChapter?: number
    streakDays: number
  }
  toPromptString: () => string
}

const BOOK_NAMES: Record<string, string> = {
  'Gen': '创世记', 'Exo': '出埃及记', 'Lev': '利未记', 'Num': '民数记', 'Deu': '申命记',
  'Jos': '约书亚记', 'Jdg': '士师记', 'Rut': '路得记', '1Sa': '撒母耳记上', '2Sa': '撒母耳记下',
  '1Ki': '列王纪上', '2Ki': '列王纪下', '1Ch': '历代志上', '2Ch': '历代志下',
  'Ezr': '以斯拉记', 'Neh': '尼希米记', 'Est': '以斯帖记',
  'Job': '约伯记', 'Psa': '诗篇', 'Pro': '箴言', 'Ecc': '传道书', 'Sng': '雅歌',
  'Isa': '以赛亚书', 'Jer': '耶利米书', 'Lam': '耶利米哀歌', 'Eze': '以西结书', 'Dan': '但以理书',
  'Hos': '何西阿书', 'Jol': '约珥书', 'Amo': '阿摩司书', 'Oba': '俄巴底亚书',
  'Jon': '约拿书', 'Mic': '弥迦书', 'Nam': '那鸿书', 'Hab': '哈巴谷书',
  'Zep': '西番雅书', 'Hag': '哈该书', 'Zec': '撒迦利亚书', 'Mal': '玛拉基书',
  'Mat': '马太福音', 'Mar': '马可福音', 'Luk': '路加福音', 'Jhn': '约翰福音',
  'Act': '使徒行传', 'Rom': '罗马书', '1Co': '哥林多前书', '2Co': '哥林多后书',
  'Gal': '加拉太书', 'Eph': '以弗所书', 'Php': '腓立比书', 'Col': '歌罗西书',
  '1Th': '帖撒罗尼迦前书', '2Th': '帖撒罗尼迦后书', '1Ti': '提摩太前书', '2Ti': '提摩太后书',
  'Tit': '提多书', 'Phm': '腓利门书', 'Heb': '希伯来书', 'Jam': '雅各书',
  '1Pe': '彼得前书', '2Pe': '彼得后书', '1Jn': '约翰一书', '2Jn': '约翰二书',
  '3Jn': '约翰三书', 'Jud': '犹大书', 'Rev': '启示录',
}

const DETAIL_NAMES: Record<string, string> = {
  'concise': '简洁',
  'balanced': '适中',
  'detailed': '详细',
}

const DEPTH_NAMES: Record<string, string> = {
  'beginner': '入门',
  'intermediate': '进阶',
  'academic': '学术',
}

const TONE_NAMES: Record<string, string> = {
  'modern': '现代',
  'traditional': '传统',
}

/**
 * 从数据库构建用户的 AI 上下文
 */
export async function buildAIContext(userId: string): Promise<UserAIContext> {
  try {
    // 并行获取所有数据
    const [userSettings, highlights, notes, chatSessions] = await Promise.all([
      prisma.userSetting.findUnique({ where: { userId } }),
      prisma.highlight.groupBy({
        by: ['bookId'],
        where: { userId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.note.findMany({
        where: { userId },
        select: { bookId: true, chapter: true },
        take: 10,
      }),
      prisma.chatSession.findMany({
        where: { userId },
        select: { title: true, mode: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ])

    // 解析偏好设置
    const stylePreference: AIStylePreference = {
      detailLevel: (userSettings?.aiDetail as AIStylePreference['detailLevel']) || 'balanced',
      depthLevel: (userSettings?.aiDepth as AIStylePreference['depthLevel']) || 'intermediate',
      tone: (userSettings?.aiTone as AIStylePreference['tone']) || 'modern',
    }

    // 提取喜爱的书卷（按高亮数量排序）
    const favoriteBooks = highlights
      .map(h => h.bookId)
      .filter((bookId): bookId is string => !!bookId)

    // 从对话历史提取话题
    const recentTopics = chatSessions
      .map(s => s.title)
      .filter((title): title is string => !!title)
      .slice(0, 3)

    // 阅读历史
    const readingHistory = {
      lastBook: userSettings?.lastBook || undefined,
      lastChapter: userSettings?.lastChapter || undefined,
      streakDays: 0, // TODO: 从 Interaction 表计算
    }

    return createAIContextObject({
      stylePreference,
      favoriteBooks,
      recentTopics,
      readingHistory,
    })
  } catch (error) {
    console.error('[AI Context] Error building context:', error)
    // 返回默认上下文
    return createAIContextObject({
      stylePreference: {
        detailLevel: 'balanced',
        depthLevel: 'intermediate',
        tone: 'modern',
      },
      favoriteBooks: [],
      recentTopics: [],
      readingHistory: { streakDays: 0 },
    })
  }
}

/**
 * 创建带有 toPromptString 方法的上下文对象
 */
function createAIContextObject(data: {
  stylePreference: AIStylePreference
  favoriteBooks: string[]
  recentTopics: string[]
  readingHistory: {
    lastBook?: string
    lastChapter?: number
    streakDays: number
  }
}): UserAIContext {
  return {
    ...data,
    toPromptString: () => formatContextAsPrompt(data),
  }
}

/**
 * 将上下文格式化为 AI 提示词
 */
function formatContextAsPrompt(data: {
  stylePreference: AIStylePreference
  favoriteBooks: string[]
  recentTopics: string[]
  readingHistory: {
    lastBook?: string
    lastChapter?: number
    streakDays: number
  }
}): string {
  const parts: string[] = []

  // 用户偏好设置
  parts.push('### 🎯 用户偏好设置')
  parts.push(`- **解读详细度**: ${DETAIL_NAMES[data.stylePreference.detailLevel] || '适中'}`)
  parts.push(`- **神学深度**: ${DEPTH_NAMES[data.stylePreference.depthLevel] || '进阶'}`)
  parts.push(`- **语言风格**: ${TONE_NAMES[data.stylePreference.tone] || '现代'}`)

  // 喜爱的书卷
  if (data.favoriteBooks.length > 0) {
    parts.push('\n### 📚 用户常读经卷')
    const bookNames = data.favoriteBooks
      .map(id => BOOK_NAMES[id] || id)
      .join('、')
    parts.push(`用户经常研读: ${bookNames}`)
  }

  // 最近关注的话题
  if (data.recentTopics.length > 0) {
    parts.push('\n### 💭 最近关注的话题')
    data.recentTopics.forEach(topic => {
      parts.push(`- ${topic}`)
    })
  }

  // 阅读位置记忆
  if (data.readingHistory.lastBook) {
    parts.push('\n### 📍 阅读进度')
    const bookName = BOOK_NAMES[data.readingHistory.lastBook] || data.readingHistory.lastBook
    parts.push(`上次阅读: ${bookName} 第 ${data.readingHistory.lastChapter} 章`)
  }

  return parts.join('\n')
}

/**
 * 快速获取用户的上下文提示词（用于 API 调用）
 */
export async function getAIContextPrompt(userId: string | null | undefined): Promise<string> {
  if (!userId) return ''

  try {
    const context = await buildAIContext(userId)
    return context.toPromptString()
  } catch (error) {
    console.error('[AI Context] Error getting context prompt:', error)
    return ''
  }
}