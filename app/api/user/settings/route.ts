// app/api/user/settings/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // [修改]
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth(); // [修改]
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const data = await req.json();
  const { fontSize, lineHeight, isDarkMode, showEnglish, lastBook, lastChapter } = data;

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      settings: {
        upsert: {
          create: { fontSize, lineHeight, isDarkMode, showEnglish, lastBook, lastChapter },
          update: { fontSize, lineHeight, isDarkMode, showEnglish, lastBook, lastChapter },
        }
      }
    }
  });

  return NextResponse.json({ success: true });
}