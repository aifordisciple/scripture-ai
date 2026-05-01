import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const cloudApiKey = process.env.CLOUD_AI_API_KEY || ''
  const cloudBaseUrl = process.env.CLOUD_AI_BASE_URL || 'https://api.claude.ai'
  const cloudModel = process.env.CLOUD_AI_MODEL || 'claude-sonnet-4-20250514'

  return NextResponse.json({
    cloud: {
      configured: cloudApiKey.length > 0,
      baseUrl: cloudBaseUrl,
      model: cloudModel,
      // Never expose the actual API key to the client
      keyPreview: cloudApiKey
        ? `${cloudApiKey.slice(0, 6)}...${cloudApiKey.slice(-4)}`
        : '',
    },
  })
}
