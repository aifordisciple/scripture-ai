// app/api/card-history/route.ts
// 卡片生成历史 CRUD

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: true, message: 'Saved locally only' });
    }

    const history = await req.json();

    // TODO: 保存到数据库 (CardHistory model)
    console.log(`[CardHistory] User ${session.user.email} saved history: ${history.resolution}`);

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('Card history save error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: true, data: [] });
    }

    // TODO: 从数据库加载 (CardHistory model)
    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    console.error('Card history load error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}