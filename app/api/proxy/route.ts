// app/api/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing URL', { status: 400 });

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Fetch failed');
    
    const blob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', blob.type);
    headers.set('Access-Control-Allow-Origin', '*');
    // 设置缓存，避免重复请求
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(blob, { headers });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Failed', { status: 500 });
  }
}