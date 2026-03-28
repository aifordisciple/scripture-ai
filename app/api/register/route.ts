// app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return new NextResponse("Missing email or password", { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
        // 创建用户时同时初始化默认设置
        settings: {
          create: {
            fontSize: 20,
            lineHeight: 1.8,
            isDarkMode: false,
            showEnglish: true,
            // 默认使用云端AI（MiniMax）
            apiProvider: "cloud",
          }
        }
      },
    });

    // 自动加入默认群组"软件使用交流群"
    try {
      const defaultGroup = await prisma.church.findFirst({
        where: { name: '软件使用交流群' }
      });

      if (defaultGroup) {
        await prisma.churchMember.create({
          data: {
            churchId: defaultGroup.id,
            userId: user.id,
            role: 'MEMBER'
          }
        });
      }
    } catch (groupError) {
      // 加入群组失败不影响注册流程，仅记录日志
      console.error("Failed to join default group:", groupError);
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("REGISTRATION_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
