// app/api/church/route.ts
// Church/Group Management API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/church - List churches/groups
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'my' | 'discover' | 'public'
    const session = await auth();
    const userId = session?.user?.id;

    let churches;

    if (type === 'my' && userId) {
      // User's churches
      churches = await prisma.church.findMany({
        where: {
          members: { some: { userId } }
        },
        include: {
          members: {
            where: { userId },
            select: { role: true }
          },
          _count: { select: { members: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (type === 'discover' || type === 'public') {
      // Public churches for discovery
      churches = await prisma.church.findMany({
        where: { isPublic: true },
        include: {
          owner: { select: { name: true } },
          _count: { select: { members: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json({ churches });
  } catch (error) {
    console.error('List churches error:', error);
    return NextResponse.json({ error: 'Failed to list churches' }, { status: 500 });
  }
}

// POST /api/church - Create new church/group
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, isPublic = false, allowJoin = true } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Church name is required' }, { status: 400 });
    }

    // Create church with owner as first member
    const church = await prisma.church.create({
      data: {
        name,
        description,
        ownerId: session.user.id,
        isPublic,
        allowJoin,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER'
          }
        }
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { members: true, groupPlans: true } }
      }
    });

    return NextResponse.json({ church }, { status: 201 });
  } catch (error) {
    console.error('Create church error:', error);
    return NextResponse.json({ error: 'Failed to create church' }, { status: 500 });
  }
}
