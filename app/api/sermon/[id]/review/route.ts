import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateText } from 'ai'
import { extractApiConfig, getAIModel } from '@/lib/ai-client'
import { SERMON_REVIEW_PROMPT } from '@/lib/constants'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { apiConfig: rawConfig, locale } = body

  const sermon = await prisma.sermon.findUnique({ where: { id } })
  if (!sermon) {
    return NextResponse.json({ error: 'Sermon not found' }, { status: 404 })
  }

  // Extract plain text from content
  let contentText = ''
  try {
    const parsed = typeof sermon.content === 'string' ? JSON.parse(sermon.content) : sermon.content
    contentText = parsed?.content
      ?.map((node: any) => node.content?.map((c: any) => c.text || '').join('') || '')
      .join('\n') || ''
  } catch {
    contentText = String(sermon.content || '')
  }

  if (!contentText.trim()) {
    return NextResponse.json({ error: 'Sermon content is empty' }, { status: 400 })
  }

  const apiConfig = extractApiConfig(rawConfig)
  const model = getAIModel(apiConfig)

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Review failed' }, { status: 500 })
  }
}
