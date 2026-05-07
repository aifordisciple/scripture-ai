// app/api/picsum/route.ts
// Picsum Photos 代理 - 随机图片浏览

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '12';

    const res = await fetch(`https://picsum.photos/v2/list?page=${page}&limit=${limit}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Picsum API error' }, { status: res.status });
    }

    const data = await res.json();

    // 标准化返回格式
    const images = data.map((img: any) => ({
      id: img.id,
      author: img.author,
      url: `https://picsum.photos/id/${img.id}/1080/1920`,
      thumb: `https://picsum.photos/id/${img.id}/200/200`,
      width: img.width,
      height: img.height,
    }));

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error('Picsum API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}