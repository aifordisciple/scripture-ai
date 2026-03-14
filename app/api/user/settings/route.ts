// app/api/user/settings/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const settings = await prisma.userSetting.findUnique({ where: { userId: user.id } });
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings GET error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const data = await req.json();
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const safeSettings = {
        fontSize: Number(data.fontSize) || 18,
        lineHeight: Number(data.lineHeight) || 1.8,
        isDarkMode: Boolean(data.isDarkMode),
        showEnglish: Boolean(data.showEnglish),
        lastBook: data.lastBook || null,
        lastChapter: data.lastChapter ? Number(data.lastChapter) : null,
        // API 配置
        apiProvider: data.apiProvider || 'openai',
        apiBaseUrl: data.apiBaseUrl || null,
        apiKey: data.apiKey || null,
        apiModel: data.apiModel || null,
        // 通知偏好设置
        emailNotifyFeedback: data.emailNotifyFeedback !== undefined ? Boolean(data.emailNotifyFeedback) : true,
        emailNotifySystem: data.emailNotifySystem !== undefined ? Boolean(data.emailNotifySystem) : true,
        browserNotify: data.browserNotify !== undefined ? Boolean(data.browserNotify) : true,
        soundNotify: data.soundNotify !== undefined ? Boolean(data.soundNotify) : true,
    };

    const userSettings = await prisma.userSetting.upsert({
      where: { userId: user.id },
      update: safeSettings,
      create: { ...safeSettings, userId: user.id }
    });

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error("Settings error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
