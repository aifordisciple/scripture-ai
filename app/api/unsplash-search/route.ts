// app/api/unsplash-search/route.ts
// Unsplash 图片搜索代理

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const perPage = searchParams.get('per_page') || '12';

    if (!query.trim()) {
      return NextResponse.json({ success: false, error: 'query is required' }, { status: 400 });
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      return NextResponse.json({
        success: false,
        error: 'UNSPLASH_ACCESS_KEY not configured',
        fallback: true,
      }, { status: 400 });
    }

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Unsplash API error' }, { status: res.status });
    }

    const data = await res.json();
    const results = (data.results || []).map((img: any) => ({
      id: img.id,
      url: img.urls?.raw ? `${img.urls.raw}&w=1080&q=80&auto=format` : img.urls?.regular,
      thumb: img.urls?.thumb,
      description: img.description || img.alt_description || query,
      author: img.user?.name,
    }));

    return NextResponse.json({ success: true, data: { results, total: data.total } });
  } catch (error) {
    console.error('Unsplash search error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}