// app/api/admin/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

// GET /api/admin/logs - 获取操作日志
export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.error!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action') || '';
    const targetType = searchParams.get('targetType') || '';
    const adminId = searchParams.get('adminId') || '';

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (action) {
      where.action = action;
    }
    if (targetType) {
      where.targetType = targetType;
    }
    if (adminId) {
      where.adminId = adminId;
    }

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      }),
      prisma.adminLog.count({ where })
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin logs list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}