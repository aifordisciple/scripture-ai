// app/api/user/dashboard/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, subYears, startOfDay, endOfDay } from "date-fns";

/**
 * 仪表盘时间序列聚合 API
 * * 核心参数配置系统：
 * @param {string} range - 时间跨度参数。可选值: '7d', '30d', '1y', 'custom'。默认参数值为 '30d'。
 * @param {string} startDate - 自定义起始时间 ISO 字符串（当 range 为 custom 时生效）。
 * @param {string} endDate - 自定义结束时间 ISO 字符串（当 range 为 custom 时生效）。
 * * 功能说明：提取时间跨度内的用户行为（AI互动、经文研读），按照天(Date)进行分组聚合，并输出前端所需的时序数组。
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30d";
  let startDate = new Date();
  let endDate = new Date();

  if (range === "7d") startDate = subDays(endDate, 7);
  else if (range === "30d") startDate = subDays(endDate, 30);
  else if (range === "1y") startDate = subYears(endDate, 1);
  else if (range === "custom") {
      startDate = new Date(searchParams.get("startDate") || subDays(endDate, 30));
      endDate = new Date(searchParams.get("endDate") || new Date());
  }
  
  startDate = startOfDay(startDate);
  endDate = endOfDay(endDate);

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    // 1. 获取基础统计数据
    const chats = await prisma.chatMessage.findMany({
      where: { userId: user.id, createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true }
    });

    const highlights = await prisma.highlight.findMany({
      where: { userId: user.id, createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true }
    });

    // 2. 初始化时间轴序列，确保空数据日期补零
    const timeSeriesData: Record<string, { date: string, aiChats: number, interactions: number }> = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
       const dateKey = d.toISOString().split('T')[0];
       timeSeriesData[dateKey] = { date: dateKey, aiChats: 0, interactions: 0 };
    }

    // 3. 将离散记录映射到时间序列
    chats.forEach(c => {
       const dateStr = c.createdAt.toISOString().split('T')[0];
       if (timeSeriesData[dateStr]) timeSeriesData[dateStr].aiChats += 1;
    });

    highlights.forEach(h => {
       const dateStr = h.createdAt.toISOString().split('T')[0];
       if (timeSeriesData[dateStr]) timeSeriesData[dateStr].interactions += 1;
    });

    return NextResponse.json({
        success: true,
        data: {
            chartData: Object.values(timeSeriesData),
            summary: { totalAiChats: chats.length, totalHighlights: highlights.length }
        }
    });
  } catch (error) {
    console.error("Dashboard Aggregation Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
