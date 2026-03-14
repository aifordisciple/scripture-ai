import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/feedback/batch - 批量操作
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 检查管理员权限
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ids, data } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    switch (action) {
      case 'update_status':
        if (!data?.status) {
          return NextResponse.json({ error: '缺少状态参数' }, { status: 400 });
        }
        await prisma.feedback.updateMany({
          where: { id: { in: ids } },
          data: { status: data.status }
        });
        return NextResponse.json({
          success: true,
          message: `已更新 ${ids.length} 条反馈状态`
        });

      case 'delete':
        await prisma.feedback.deleteMany({
          where: { id: { in: ids } }
        });
        return NextResponse.json({
          success: true,
          message: `已删除 ${ids.length} 条反馈`
        });

      default:
        return NextResponse.json({ error: '未知的操作类型' }, { status: 400 });
    }
  } catch (error) {
    console.error('Batch operation error:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}