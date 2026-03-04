// app/api/reminder/route.ts
// Daily reading reminder settings - stores in DB, can be processed by external worker

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/reminder - Get all reminder settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reminders = await prisma.reminder.findMany({
      where: { userId: session.user.id },
      orderBy: { time: 'asc' },
    });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Get reminders error:', error);
    return NextResponse.json({ error: 'Failed to get reminders' }, { status: 500 });
  }
}

// POST /api/reminder - Create or update reminder
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { time, planId, enabled } = await req.json();
    
    // Validate time format (HH:mm)
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: 'Invalid time format' }, { status: 400 });
    }

    // Check if reminder already exists
    const existing = await prisma.reminder.findUnique({
      where: {
        userId_time: {
          userId: session.user.id,
          time,
        },
      },
    });

    if (existing) {
      // Update existing reminder
      const updated = await prisma.reminder.update({
        where: { id: existing.id },
        data: { enabled: enabled !== false, planId },
      });

      return NextResponse.json({ reminder: updated });
    }

    // Create new reminder
    const reminder = await prisma.reminder.create({
      data: {
        userId: session.user.id,
        time,
        planId,
        enabled: enabled !== false,
      },
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error('Set reminder error:', error);
    return NextResponse.json({ error: 'Failed to set reminder' }, { status: 500 });
  }
}

// DELETE /api/reminder - Delete reminder
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reminderId = searchParams.get('id');
    const time = searchParams.get('time');

    if (reminderId) {
      const reminder = await prisma.reminder.findUnique({
        where: { id: reminderId },
      });

      if (reminder && reminder.userId === session.user.id) {
        await prisma.reminder.delete({ where: { id: reminderId } });
      }
    } else if (time) {
      await prisma.reminder.delete({
        where: {
          userId_time: {
            userId: session.user.id,
            time,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete reminder error:', error);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
