// app/api/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

// URL 白名单 - 仅允许代理这些域名的资源
const ALLOWED_DOMAINS = [
  'images.unsplash.com',
  'plus.unsplash.com',
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing URL', { status: 400 });

  // SSRF 防护：仅允许白名单域名
  if (!isAllowedUrl(url)) {
    return new NextResponse('Domain not allowed', { status: 403 });
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ScriptureAI-Proxy/1.0' },
    });
    if (!response.ok) throw new Error('Fetch failed');

    const blob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', blob.type);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(blob, { headers });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Failed', { status: 500 });
  }
}