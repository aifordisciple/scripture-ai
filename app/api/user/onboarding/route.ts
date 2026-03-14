import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取引导状态
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const userSetting = await prisma.userSetting.findUnique({
      where: { userId: session.user.id },
      select: { onboardingCompleted: true }
    });

    if (!userSetting?.onboardingCompleted) {
      return NextResponse.json({ onboarding: null });
    }

    try {
      const onboarding = JSON.parse(userSetting.onboardingCompleted);
      return NextResponse.json({ onboarding });
    } catch {
      return NextResponse.json({ onboarding: null });
    }
  } catch (error) {
    console.error("获取引导状态失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// 更新引导状态
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { type, completed, skipped } = body;

    if (!type) {
      return NextResponse.json({ error: "缺少引导类型" }, { status: 400 });
    }

    // 获取当前状态
    const userSetting = await prisma.userSetting.findUnique({
      where: { userId: session.user.id },
      select: { onboardingCompleted: true }
    });

    let currentStatus: Record<string, { completed: boolean; shown: boolean }> = {};
    try {
      currentStatus = userSetting?.onboardingCompleted
        ? JSON.parse(userSetting.onboardingCompleted)
        : {};
    } catch {
      currentStatus = {};
    }

    // 更新状态
    currentStatus[type] = {
      completed: completed ?? true,
      shown: true
    };

    // 保存到数据库
    await prisma.userSetting.upsert({
      where: { userId: session.user.id },
      update: {
        onboardingCompleted: JSON.stringify(currentStatus)
      },
      create: {
        userId: session.user.id,
        onboardingCompleted: JSON.stringify(currentStatus)
      }
    });

    return NextResponse.json({ success: true, onboarding: currentStatus });
  } catch (error) {
    console.error("更新引导状态失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// 重置引导状态
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const userSetting = await prisma.userSetting.findUnique({
      where: { userId: session.user.id },
      select: { onboardingCompleted: true }
    });

    let currentStatus: Record<string, { completed: boolean; shown: boolean }> = {};
    try {
      currentStatus = userSetting?.onboardingCompleted
        ? JSON.parse(userSetting.onboardingCompleted)
        : {};
    } catch {
      currentStatus = {};
    }

    if (type) {
      // 重置特定类型
      currentStatus[type] = { completed: false, shown: false };
    } else {
      // 重置所有
      currentStatus = {};
    }

    await prisma.userSetting.upsert({
      where: { userId: session.user.id },
      update: {
        onboardingCompleted: JSON.stringify(currentStatus)
      },
      create: {
        userId: session.user.id,
        onboardingCompleted: JSON.stringify(currentStatus)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("重置引导状态失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}