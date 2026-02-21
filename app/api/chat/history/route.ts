// app/api/chat/history/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // [修改]
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth(); // [修改]
  if (!session?.user?.id) return NextResponse.json([]);

  const messages = await prisma.chatMessage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(messages);
}

export async function DELETE() {
  const session = await auth(); // [修改]
  if (!session?.user?.id) return NextResponse.json({ success: false });

  await prisma.chatMessage.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}