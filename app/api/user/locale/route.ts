import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ locale: null, bibleVersion: null });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { settings: true },
  });

  return NextResponse.json({
    locale: user?.settings?.locale || null,
    bibleVersion: user?.settings?.bibleVersion || null,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { locale, bibleVersion } = await request.json();
  if (locale !== 'zh' && locale !== 'en') {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }
  if (bibleVersion && bibleVersion !== 'CUV' && bibleVersion !== 'KJV') {
    return NextResponse.json({ error: 'Invalid bibleVersion' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updateData: Record<string, string> = { locale };
  if (bibleVersion) {
    updateData.bibleVersion = bibleVersion;
  }

  await prisma.userSetting.upsert({
    where: { userId: user.id },
    update: updateData,
    create: { userId: user.id, ...updateData },
  });

  return NextResponse.json({ locale, bibleVersion });
}