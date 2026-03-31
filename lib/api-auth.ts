// lib/api-auth.ts

/**
 * API认证辅助函数
 * 用于统一处理API路由中的用户认证和用户获取逻辑
 *
 * 使用方式：
 * 1. requireUser(req) - 获取当前用户，未登录返回401
 * 2. getOptionalUser(req) - 获取当前用户，未登录返回null
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

/**
 * 获取当前认证用户，如果未登录则返回401错误响应
 *
 * @returns 成功返回用户对象，失败返回NextResponse错误
 *
 * @example
 * const userOrError = await requireUser();
 * if (userOrError instanceof NextResponse) return userOrError;
 * // userOrError 现在是 AuthenticatedUser 类型
 */
export async function requireUser(): Promise<AuthenticatedUser | NextResponse> {
  const session = await auth();

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
    },
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  return user;
}

/**
 * 获取当前认证用户，未登录返回null（不返回错误）
 * 适用于可选认证的API端点
 *
 * @returns 用户对象或null
 *
 * @example
 * const user = await getOptionalUser();
 * if (user) {
 *   // 已登录用户的处理逻辑
 * } else {
 *   // 游客用户的处理逻辑
 * }
 */
export async function getOptionalUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
    },
  });

  return user;
}

/**
 * 检查用户是否已认证
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user?.email;
}

/**
 * 获取当前用户的ID，如果未登录返回null
 * 比完整用户查询更轻量
 */
export async function getUserId(): Promise<string | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  return user?.id ?? null;
}

/**
 * 类型守卫：检查返回值是用户还是错误响应
 */
export function isUser(result: AuthenticatedUser | NextResponse): result is AuthenticatedUser {
  return !(result instanceof NextResponse);
}