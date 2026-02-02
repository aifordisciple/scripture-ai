// app/api/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const blob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', blob.type);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    // 关键：允许跨域访问
    headers.set('Access-Control-Allow-Origin', '*'); 

    return new NextResponse(blob, { headers });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Failed to proxy image', { status: 500 });
  }
}