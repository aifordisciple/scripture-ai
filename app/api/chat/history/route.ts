// app/api/chat/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // [修改]
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth(); // [修改]
  if (!session?.user?.id) return NextResponse.json([]);

  // [修复] 支持根据 sessionId 过滤消息
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  const where: any = { userId: session.user.id };
  if (sessionId) {
    where.sessionId = sessionId;
  }

  const messages = await prisma.chatMessage.findMany({
    where,
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