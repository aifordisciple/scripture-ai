// app/api/admin/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, logAdminAction, getClientIP, buildAuditDetails } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

// GET /api/admin/announcements - 获取公告列表
export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.error!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [announcements, total] = await Promise.all([
      prisma.systemAnnouncement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          // We'll need to join with user manually if needed
        }
      }),
      prisma.systemAnnouncement.count({ where })
    ]);

    // 获取创建者信息
    const creatorIds = [...new Set(announcements.map(a => a.createdBy))];
    const creators = await prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, name: true, email: true, image: true }
    });
    const creatorMap = Object.fromEntries(creators.map(c => [c.id, c]));

    const announcementsWithCreator = announcements.map(a => ({
      ...a,
      creator: creatorMap[a.createdBy] || null
    }));

    return NextResponse.json({
      announcements: announcementsWithCreator,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin announcements list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

// POST /api/admin/announcements - 创建公告
export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json();
    const { title, content, type, startsAt, endsAt } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      );
    }

    const announcement = await prisma.systemAnnouncement.create({
      data: {
        title,
        content,
        type: type || 'INFO',
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        createdBy: adminCheck.userId!
      }
    });

    // 记录操作日志
    await logAdminAction(
      adminCheck.userId!,
      'CREATE',
      'ANNOUNCEMENT',
      {
        targetId: announcement.id,
        details: buildAuditDetails('create', null, { title, type }),
        ip: getClientIP(request)
      }
    );

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error('Admin announcement create error:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/announcements - 更新公告
export async function PUT(request: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json();
    const { id, title, content, type, isActive, startsAt, endsAt } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const beforeUpdate = await prisma.systemAnnouncement.findUnique({
      where: { id }
    });

    if (!beforeUpdate) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (startsAt !== undefined) updateData.startsAt = startsAt ? new Date(startsAt) : null;
    if (endsAt !== undefined) updateData.endsAt = endsAt ? new Date(endsAt) : null;

    const announcement = await prisma.systemAnnouncement.update({
      where: { id },
      data: updateData
    });

    // 记录操作日志
    await logAdminAction(
      adminCheck.userId!,
      'UPDATE',
      'ANNOUNCEMENT',
      {
        targetId: id,
        details: buildAuditDetails('update', beforeUpdate, updateData),
        ip: getClientIP(request)
      }
    );

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error('Admin announcement update error:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/announcements - 删除公告
export async function DELETE(request: NextRequest) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return adminCheck.error!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const announcement = await prisma.systemAnnouncement.findUnique({
      where: { id }
    });

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    await prisma.systemAnnouncement.delete({
      where: { id }
    });

    // 记录操作日志
    await logAdminAction(
      adminCheck.userId!,
      'DELETE',
      'ANNOUNCEMENT',
      {
        targetId: id,
        details: buildAuditDetails('delete', announcement, null),
        ip: getClientIP(request)
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin announcement delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}