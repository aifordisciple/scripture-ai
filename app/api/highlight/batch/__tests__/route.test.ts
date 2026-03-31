import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    highlight: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('/api/highlight/batch', () => {
  const mockUserId = 'user-test-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET batch highlights', () => {
    it('returns highlights for multiple chapters', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: 'test@example.com', id: mockUserId },
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: mockUserId,
        email: 'test@example.com',
      } as any)

      vi.mocked(prisma.highlight.findMany).mockResolvedValue([
        { id: 'h1', bookId: 'Gen', chapter: 1, verse: 1, color: 'yellow' },
        { id: 'h2', bookId: 'Gen', chapter: 1, verse: 2, color: 'blue' },
        { id: 'h3', bookId: 'Gen', chapter: 2, verse: 1, color: 'green' },
      ] as any)

      const request = new NextRequest(
        'http://localhost/api/highlight/batch?bookId=Gen&chapters=1,2'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('handles empty chapters parameter', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: mockUserId,
      } as any)

      const request = new NextRequest(
        'http://localhost/api/highlight/batch?bookId=Gen&chapters='
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual([])
    })

    it('returns empty array when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost/api/highlight/batch?bookId=Gen&chapters=1,2'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(data.data).toEqual([])
    })
  })

  describe('POST batch highlights', () => {
    it('creates multiple highlights at once', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: 'test@example.com', id: mockUserId },
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: mockUserId,
      } as any)

      vi.mocked(prisma.highlight.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.highlight.create).mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/highlight/batch', {
        method: 'POST',
        body: JSON.stringify({
          highlights: [
            { bookId: 'Gen', chapter: 1, verse: 1, color: 'yellow' },
            { bookId: 'Gen', chapter: 1, verse: 2, color: 'blue' },
          ],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/highlight/batch', {
        method: 'POST',
        body: JSON.stringify({
          highlights: [{ bookId: 'Gen', chapter: 1, verse: 1, color: 'yellow' }],
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('handles empty highlights array', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { email: 'test@example.com', id: mockUserId },
      } as any)

      const request = new NextRequest('http://localhost/api/highlight/batch', {
        method: 'POST',
        body: JSON.stringify({ highlights: [] }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})