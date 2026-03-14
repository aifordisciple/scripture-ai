// app/api/admin/churches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

// GET /api/admin/churches - 获取小组列表
export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.error!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const isPublic = searchParams.get('isPublic');

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (isPublic !== null && isPublic !== '') {
      where.isPublic = isPublic === 'true';
    }

    const [churches, total] = await Promise.all([
      prisma.church.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          isPublic: true,
          themeColor: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          _count: {
            select: {
              members: true,
              groupPlans: true
            }
          }
        }
      }),
      prisma.church.count({ where })
    ]);

    return NextResponse.json({
      churches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin churches list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch churches' },
      { status: 500 }
    );
  }
}