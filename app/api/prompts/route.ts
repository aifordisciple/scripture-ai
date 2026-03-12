// app/api/prompts/route.ts
// 自定义提示词 CRUD API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: 获取用户的所有自定义提示词
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prompts = await prisma.customPrompt.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: 创建新提示词
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { label, prompt, isDefault = false } = body;

    if (!label || !prompt) {
      return NextResponse.json({ error: 'Missing label or prompt' }, { status: 400 });
    }

    // 如果设为默认，先取消其他默认
    if (isDefault) {
      await prisma.customPrompt.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newPrompt = await prisma.customPrompt.create({
      data: {
        userId: session.user.id,
        label,
        prompt,
        isDefault,
      },
    });

    return NextResponse.json(newPrompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: 更新提示词
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, label, prompt, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing prompt id' }, { status: 400 });
    }

    // 验证提示词属于当前用户
    const existingPrompt = await prisma.customPrompt.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // 如果设为默认，先取消其他默认
    if (isDefault) {
      await prisma.customPrompt.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (label) updateData.label = label;
    if (prompt) updateData.prompt = prompt;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedPrompt = await prisma.customPrompt.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: 删除提示词
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing prompt id' }, { status: 400 });
    }

    // 验证提示词属于当前用户
    const existingPrompt = await prisma.customPrompt.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    await prisma.customPrompt.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}