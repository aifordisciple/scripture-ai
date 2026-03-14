// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, logAdminAction, getClientIP, buildAuditDetails } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

// GET /api/admin/users - 获取用户列表
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
    const role = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          lastActiveDate: true,
          streakCount: true,
          _count: {
            select: {
              highlights: true,
              notes: true,
              churchMemberships: true,
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users - 更新用户角色
export async function PUT(request: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user" or "admin"' },
        { status: 400 }
      );
    }

    // 获取修改前的用户信息
    const beforeUpdate = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!beforeUpdate) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 更新用户角色
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    // 记录操作日志
    await logAdminAction(
      adminCheck.userId!,
      'UPDATE',
      'USER',
      {
        targetId: userId,
        details: buildAuditDetails(
          'role_change',
          { role: beforeUpdate.role },
          { role }
        ),
        ip: getClientIP(request)
      }
    );

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}