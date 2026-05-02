import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ data: [] });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ data: [] });

  const folders = await prisma.sermonFolder.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ data: folders });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const { name, parentId, sortOrder } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new NextResponse("User not found", { status: 404 });

  const folder = await prisma.sermonFolder.create({
    data: {
      userId: user.id,
      name: name || "New Folder",
      parentId: parentId || null,
      sortOrder: sortOrder || 0,
    },
  });

  return NextResponse.json({ data: folder });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const { id, name, parentId, sortOrder } = await req.json();
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const existing = await prisma.sermonFolder.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (parentId !== undefined) updateData.parentId = parentId;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

  const folder = await prisma.sermonFolder.update({ where: { id }, data: updateData });
  return NextResponse.json({ data: folder });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const existing = await prisma.sermonFolder.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Move sermons to root before deleting folder
  await prisma.sermon.updateMany({
    where: { folderId: id },
    data: { folderId: null },
  });
  await prisma.sermonFolder.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
