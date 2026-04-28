// app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// [P2-6修复] 输入验证函数
function validateRegistration(email: string, password: string, name?: string): string | null {
  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  // 密码强度验证：至少6位
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  // 密码强度验证：不能全是数字
  if (/^\d+$/.test(password)) {
    return 'Password cannot be all numbers';
  }
  // 名称长度验证
  if (name !== undefined && name !== null && name.length > 50) {
    return 'Name cannot exceed 50 characters';
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return new NextResponse("Missing email or password", { status: 400 });
    }

    // [P2-6修复] 使用验证函数
    const validationError = validateRegistration(email, password, name);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // 使用事务确保用户创建和加入默认群组是原子操作
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          password: hashedPassword,
          settings: {
            create: {
              fontSize: 20,
              lineHeight: 1.8,
              isDarkMode: false,
              showEnglish: true,
              apiProvider: "cloud",
            }
          }
        },
      });

      // 自动加入默认群组
      const defaultGroup = await tx.church.findFirst({
        where: { name: '软件使用交流群' }
      });

      if (defaultGroup) {
        await tx.churchMember.create({
          data: {
            churchId: defaultGroup.id,
            userId: newUser.id,
            role: 'MEMBER'
          }
        });
      }

      return newUser;
    });

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
