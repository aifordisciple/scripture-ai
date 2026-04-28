// app/api/highlight/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // [修改] 引入 auth
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  const chapter = parseInt(searchParams.get("chapter") || "0");

  const session = await auth(); // [修改] 使用 auth()
  
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ data: [] });

    const highlights = await prisma.highlight.findMany({
      where: { userId: user.id, bookId: bookId!, chapter },
    });
    return NextResponse.json({ data: highlights });
  } else {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(req: Request) {
  const session = await auth(); // [修改] 使用 auth()
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { bookId, chapter, verse, color, action } = body;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  
  if (!user) return new NextResponse("User not found", { status: 404 });

  if (action === 'remove') {
    await prisma.highlight.deleteMany({
      where: { userId: user.id, bookId, chapter, verse }
    });
  } else {
    // [P2-2修复] 使用 upsert 替代 findFirst + create/update，防止并发创建重复高亮
    // @@unique([userId, bookId, chapter, verse]) 约束保证 upsert 正确匹配
    await prisma.highlight.upsert({
      where: { userId_bookId_chapter_verse: { userId: user.id, bookId, chapter, verse } },
      update: { color },
      create: { userId: user.id, bookId, chapter, verse, color }
    });
  }

  return NextResponse.json({ success: true });
}