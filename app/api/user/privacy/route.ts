// app/api/user/privacy/route.ts
// Privacy Settings API

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/user/privacy - Get user's privacy settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.privacySettings.findUnique({
      where: { userId: session.user.id }
    });

    // Create default settings if not exist
    if (!settings) {
      settings = await prisma.privacySettings.create({
        data: { userId: session.user.id }
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    return NextResponse.json({ error: 'Failed to get privacy settings' }, { status: 500 });
  }
}

// PUT /api/user/privacy - Update privacy settings
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allowDmFrom, showOnlineStatus, profileVisible } = await req.json();

    // Validate values
    const validDmOptions = ['everyone', 'friends', 'nobody'];
    const validProfileOptions = ['everyone', 'friends', 'nobody'];

    if (allowDmFrom && !validDmOptions.includes(allowDmFrom)) {
      return NextResponse.json({ error: 'Invalid allowDmFrom value' }, { status: 400 });
    }

    if (profileVisible && !validProfileOptions.includes(profileVisible)) {
      return NextResponse.json({ error: 'Invalid profileVisible value' }, { status: 400 });
    }

    const updateData: any = {};
    if (allowDmFrom) updateData.allowDmFrom = allowDmFrom;
    if (typeof showOnlineStatus === 'boolean') updateData.showOnlineStatus = showOnlineStatus;
    if (profileVisible) updateData.profileVisible = profileVisible;

    // Upsert settings
    const settings = await prisma.privacySettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...updateData
      },
      update: updateData
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    return NextResponse.json({ error: 'Failed to update privacy settings' }, { status: 500 });
  }
}