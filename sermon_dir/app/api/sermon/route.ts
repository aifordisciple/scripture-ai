import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTiptapJson } from "@/lib/sermon-markdown";
import { tiptapToMarkdown } from "@/lib/tiptap-to-markdown";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ data: [] });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ data: [] });

  const where: Record<string, unknown> = { userId: user.id };
  if (folderId) where.folderId = folderId;
  if (tag) where.tags = { has: tag };
  if (status) where.status = status;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const sermons = await prisma.sermon.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, title: true, content: true, folderId: true, style: true, status: true,
      sermonDate: true, verseRefs: true, tags: true, wordCount: true,
      estimatedMinutes: true, createdAt: true, updatedAt: true,
    },
  });

  // Convert any legacy Tiptap JSON content to Markdown
  const convertedSermons = sermons.map(s => ({
    ...s,
    content: s.content && isTiptapJson(s.content) ? tiptapToMarkdown(s.content) : s.content,
  }));

  return NextResponse.json({ data: convertedSermons });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new NextResponse("User not found", { status: 404 });

  const sermon = await prisma.sermon.create({
    data: {
      userId: user.id,
      title: body.title || "",
      content: body.content || "",
      folderId: body.folderId || null,
      style: body.style || "FREE",
      status: body.status || "DRAFT",
      sermonDate: body.sermonDate ? new Date(body.sermonDate) : null,
      verseRefs: body.verseRefs || "[]",
      tags: body.tags || [],
    },
  });

  return NextResponse.json({ data: sermon });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) return new NextResponse("Missing sermon id", { status: 400 });

  const existing = await prisma.sermon.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.folderId !== undefined) updateData.folderId = data.folderId;
  if (data.style !== undefined) updateData.style = data.style;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.sermonDate !== undefined) updateData.sermonDate = data.sermonDate ? new Date(data.sermonDate) : null;
  if (data.verseRefs !== undefined) updateData.verseRefs = data.verseRefs;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.wordCount !== undefined) updateData.wordCount = data.wordCount;
  if (data.estimatedMinutes !== undefined) updateData.estimatedMinutes = data.estimatedMinutes;

  const sermon = await prisma.sermon.update({ where: { id }, data: updateData });
  return NextResponse.json({ data: sermon });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const existing = await prisma.sermon.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  await prisma.sermon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
