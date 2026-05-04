import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateText } from 'ai'
import { extractApiConfig, getAIModel } from '@/lib/ai-client'
import { SERMON_REVIEW_PROMPT } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rateLimit = checkRateLimit(`sermon-review-${session.user.id}`, 60_000, 10)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const { id } = await params
  const body = await request.json()
  const { apiConfig: rawConfig, locale } = body

  const sermon = await prisma.sermon.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!sermon) {
    return NextResponse.json({ error: 'Sermon not found' }, { status: 404 })
  }

  // Extract plain text from content (now Markdown, not Tiptap JSON)
  const contentText = String(sermon.content || '')

  if (!contentText.trim()) {
    return NextResponse.json({ error: 'Sermon content is empty' }, { status: 400 })
  }

  const apiConfig = extractApiConfig(rawConfig)
  const model = await getAIModel(apiConfig, session.user.id)

  const lang = locale === 'en' ? 'en' : 'zh'
  const promptTemplate = SERMON_REVIEW_PROMPT[lang]
  const systemPrompt = promptTemplate
    .replace('{title}', sermon.title)
    .replace('{verseRefs}', sermon.verseRefs || 'N/A')
    .replace('{style}', sermon.style || 'N/A')
    .replace('{content}', contentText.slice(0, 4000))

  try {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: 'Please review this sermon and return the JSON result.',
    })

    // Parse the JSON from AI response
    let reviewData
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      reviewData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(result.text)
    } catch {
      return NextResponse.json({ error: 'Failed to parse review result' }, { status: 500 })
    }

    return NextResponse.json({ data: reviewData })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Review failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}