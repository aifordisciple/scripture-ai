// app/api/bing-wallpaper/route.ts
// Bing 壁纸代理 - 每日壁纸 + 图片搜索

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'daily';
    const query = searchParams.get('query') || '';

    if (type === 'search' && query) {
      return handleSearch(query);
    }

    return handleDaily();
  } catch (error) {
    console.error('Bing wallpaper API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleDaily() {
  try {
    const res = await fetch(
      'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=zh-CN',
      { headers: { 'Accept': 'application/json' } }
    );

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Bing API error' }, { status: res.status });
    }

    const data = await res.json();
    const images = (data.images || []).map((img: any) => ({
      url: `https://www.bing.com${img.urlbase}_1920x1080.jpg`,
      thumb: `https://www.bing.com${img.urlbase}_400x240.jpg`,
      title: img.copyright || 'Bing Daily Wallpaper',
    }));

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error('Bing daily error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch daily wallpapers' }, { status: 500 });
  }
}

async function handleSearch(query: string) {
  const apiKey = process.env.BING_SEARCH_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'BING_SEARCH_API_KEY not configured',
      fallback: true,
    }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(query)}&count=12&aspectRatio=Wide&size=Large`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Bing Search API error' }, { status: res.status });
    }

    const data = await res.json();
    const images = (data.value || []).map((img: any) => ({
      url: img.contentUrl,
      thumb: img.thumbnailUrl,
      title: img.name || query,
    }));

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error('Bing search error:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}