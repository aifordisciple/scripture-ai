import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { extractApiConfig, getAIModel } from '@/lib/ai-client'
import { SERMON_TOPIC_VERSE_PROMPT } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { topic, apiConfig: rawConfig, locale } = body

  if (!topic?.trim()) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
  }

  const apiConfig = extractApiConfig(rawConfig)
  const model = getAIModel(apiConfig)

  const lang = locale === 'en' ? 'en' : 'zh'
  const promptTemplate = SERMON_TOPIC_VERSE_PROMPT[lang]
  const systemPrompt = promptTemplate.replace('{topic}', topic)

  try {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: 'Please recommend relevant Bible verses for this topic.',
    })

    let verses
    try {
      const jsonMatch = result.text.match(/\[[\s\S]*\]/)
      verses = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(result.text)
    } catch {
      verses = []
    }

    return NextResponse.json({ data: verses })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Recommendation failed' }, { status: 500 })
  }
}
