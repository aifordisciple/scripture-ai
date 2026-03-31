import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock must be defined before the import of the module being tested
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userSetting: {
      findUnique: vi.fn(),
    },
    highlight: {
      groupBy: vi.fn(),
    },
    note: {
      findMany: vi.fn(),
    },
    chatMessage: {
      findMany: vi.fn(),
    },
    chatSession: {
      findMany: vi.fn(),
    },
  },
}))

// Import after mock is set up
import { buildAIContext } from '../ai-context-builder'
import { prisma } from '@/lib/prisma'

describe('AI Context Builder', () => {
  const mockUserId = 'user-test-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty context when user has no data', async () => {
    vi.mocked(prisma.userSetting.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.highlight.groupBy).mockResolvedValue([])
    vi.mocked(prisma.note.findMany).mockResolvedValue([])
    vi.mocked(prisma.chatMessage.findMany).mockResolvedValue([])
    vi.mocked(prisma.chatSession.findMany).mockResolvedValue([])

    const context = await buildAIContext(mockUserId)

    expect(context).toBeDefined()
    expect(context.stylePreference).toBeDefined()
    expect(context.stylePreference.detailLevel).toBe('balanced')
    expect(context.stylePreference.depthLevel).toBe('intermediate')
  })

  it('includes user AI style preferences', async () => {
    vi.mocked(prisma.userSetting.findUnique).mockResolvedValue({
      id: 'setting-1',
      userId: mockUserId,
      fontSize: 20,
      lineHeight: 1.8,
      isDarkMode: false,
      showEnglish: true,
      aiDetail: 'detailed',
      aiDepth: 'academic',
      aiTone: 'traditional',
      apiProvider: 'openai',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    vi.mocked(prisma.highlight.groupBy).mockResolvedValue([])
    vi.mocked(prisma.note.findMany).mockResolvedValue([])
    vi.mocked(prisma.chatMessage.findMany).mockResolvedValue([])
    vi.mocked(prisma.chatSession.findMany).mockResolvedValue([])

    const context = await buildAIContext(mockUserId)

    expect(context.stylePreference.detailLevel).toBe('detailed')
    expect(context.stylePreference.depthLevel).toBe('academic')
    expect(context.stylePreference.tone).toBe('traditional')
  })

  it('extracts favorite books from highlights', async () => {
    vi.mocked(prisma.userSetting.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.highlight.groupBy).mockResolvedValue([
      { bookId: 'Psa', _count: { id: 10 } },
      { bookId: 'Rom', _count: { id: 8 } },
      { bookId: 'Gen', _count: { id: 5 } },
    ] as any)
    vi.mocked(prisma.note.findMany).mockResolvedValue([])
    vi.mocked(prisma.chatMessage.findMany).mockResolvedValue([])
    vi.mocked(prisma.chatSession.findMany).mockResolvedValue([])

    const context = await buildAIContext(mockUserId)

    expect(context.favoriteBooks).toContain('Psa')
    expect(context.favoriteBooks).toContain('Rom')
  })

  it('extracts topics from recent chat sessions', async () => {
    vi.mocked(prisma.userSetting.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.highlight.groupBy).mockResolvedValue([])
    vi.mocked(prisma.note.findMany).mockResolvedValue([])
    vi.mocked(prisma.chatMessage.findMany).mockResolvedValue([])
    vi.mocked(prisma.chatSession.findMany).mockResolvedValue([
      { title: '关于信心的探讨', mode: 'tutor' },
      { title: '罗马书8章解读', mode: 'general' },
      { title: '祷告生活', mode: 'devotional' },
    ] as any)

    const context = await buildAIContext(mockUserId)

    expect(context.recentTopics).toBeDefined()
  })

  it('formats context as prompt string', async () => {
    vi.mocked(prisma.userSetting.findUnique).mockResolvedValue({
      aiDetail: 'detailed',
      aiDepth: 'academic',
      aiTone: 'traditional',
    } as any)
    vi.mocked(prisma.highlight.groupBy).mockResolvedValue([
      { bookId: 'Psa', _count: { id: 15 } },
    ] as any)
    vi.mocked(prisma.note.findMany).mockResolvedValue([])
    vi.mocked(prisma.chatMessage.findMany).mockResolvedValue([])
    vi.mocked(prisma.chatSession.findMany).mockResolvedValue([])

    const context = await buildAIContext(mockUserId)
    const promptString = context.toPromptString()

    expect(promptString).toContain('用户偏好')
    expect(promptString).toContain('详细')
    expect(promptString).toContain('学术')
    expect(promptString).toContain('诗篇')
  })

  it('handles errors gracefully', async () => {
    vi.mocked(prisma.userSetting.findUnique).mockRejectedValue(new Error('DB error'))

    const context = await buildAIContext(mockUserId)

    // Should return default context on error
    expect(context).toBeDefined()
    expect(context.stylePreference.detailLevel).toBe('balanced')
  })
})