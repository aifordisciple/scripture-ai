// app/api/highlight/batch/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/highlight/batch
 * 批量获取多个章节的高亮
 *
 * Query params:
 * - bookId: 书卷ID
 * - chapters: 逗号分隔的章节列表 (e.g., "1,2,3")
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const bookId = searchParams.get('bookId')
    const chaptersParam = searchParams.get('chapters')

    // 验证参数
    if (!bookId || !chaptersParam) {
      return NextResponse.json({ data: [] })
    }

    // 解析章节列表
    const chapters = chaptersParam
      .split(',')
      .map(c => parseInt(c.trim()))
      .filter(c => !isNaN(c) && c > 0)

    if (chapters.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // 获取用户
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ data: [] })
    }

    // 批量查询高亮
    const highlights = await prisma.highlight.findMany({
      where: {
        userId: session.user.id,
        bookId,
        chapter: { in: chapters },
      },
      orderBy: [
        { chapter: 'asc' },
        { verse: 'asc' },
      ],
    })

    return NextResponse.json({ data: highlights })
  } catch (error) {
    console.error('[Highlight Batch] GET error:', error)
    return NextResponse.json({ data: [], error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/highlight/batch
 * 批量创建或更新高亮
 *
 * Body:
 * - highlights: Array<{ bookId, chapter, verse, color }>
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { highlights } = body as {
      highlights?: Array<{
        bookId: string
        chapter: number
        verse: number
        color: string
      }>
    }

    if (!highlights || highlights.length === 0) {
      return NextResponse.json({ success: true, count: 0 })
    }

    // 批量处理高亮
    let successCount = 0
    for (const h of highlights) {
      try {
        // 检查是否已存在
        const existing = await prisma.highlight.findFirst({
          where: {
            userId: session.user.id,
            bookId: h.bookId,
            chapter: h.chapter,
            verse: h.verse,
          },
        })

        if (existing) {
          // 更新颜色
          await prisma.highlight.update({
            where: { id: existing.id },
            data: { color: h.color },
          })
        } else {
          // 创建新高亮
          await prisma.highlight.create({
            data: {
              userId: session.user.id,
              bookId: h.bookId,
              chapter: h.chapter,
              verse: h.verse,
              color: h.color,
            },
          })
        }
        successCount++
      } catch (err) {
        console.error('[Highlight Batch] Error processing highlight:', err)
      }
    }

    return NextResponse.json({ success: true, count: successCount })
  } catch (error) {
    console.error('[Highlight Batch] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}