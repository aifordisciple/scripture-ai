// app/api/user/sync/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // [修改]
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth(); // [修改]
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      settings: true,
      highlights: true,
      notes: true,
    }
  });

  if (!user) return new NextResponse("User not found", { status: 404 });

  return NextResponse.json({
    settings: user.settings,
    highlights: user.highlights,
    notes: user.notes,
  });
}