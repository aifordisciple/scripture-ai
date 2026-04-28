// app/api/note/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // [修改]
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth(); // [修改]
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const { noteId, book, chapter, verse, content, action } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new NextResponse("User not found", { status: 404 });

  if (action === 'delete') {
    if (noteId) {
        // 所有权验证：只能删除自己的笔记
        const note = await prisma.note.findUnique({ where: { id: noteId }, select: { userId: true } });
        if (!note || note.userId !== user.id) {
          return new NextResponse("Forbidden", { status: 403 });
        }
        await prisma.note.delete({ where: { id: noteId } });
    }
  } else {
    if (noteId && !noteId.startsWith('temp-')) {
        // 所有权验证：只能修改自己的笔记
        const note = await prisma.note.findUnique({ where: { id: noteId }, select: { userId: true } });
        if (!note || note.userId !== user.id) {
          return new NextResponse("Forbidden", { status: 403 });
        }
        await prisma.note.update({
            where: { id: noteId },
            data: { content }
        });
    } else {
        await prisma.note.create({
            data: {
                userId: user.id,
                bookId: book,
                chapter: parseInt(chapter),
                verse: parseInt(verse),
                content
            }
        });
    }
  }

  return NextResponse.json({ success: true });
}