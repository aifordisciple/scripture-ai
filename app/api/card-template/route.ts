// app/api/card-template/route.ts
// 卡片模板 CRUD

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// 简单的内存缓存（生产环境应使用数据库）
// 当前版本：仅处理已登录用户的模板同步

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: true, message: 'Saved locally only' });
    }

    const template = await req.json();

    // TODO: 保存到数据库 (CardTemplate model)
    // 当前版本：仅确认接收，实际存储由客户端 localStorage 管理
    console.log(`[CardTemplate] User ${session.user.email} saved template: ${template.name}`);

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('Card template save error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: true, message: 'Deleted locally only' });
    }

    // TODO: 从数据库删除 (CardTemplate model)
    console.log(`[CardTemplate] User ${session.user.email} deleted template: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Card template delete error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}