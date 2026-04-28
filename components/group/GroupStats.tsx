"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import {
  Activity, Users, BookOpen, Flame, TrendingUp, Loader2,
  Calendar, Trophy, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface GroupStatsProps {
  churchId: string;
  plans: { id: string; name: string }[];
}

interface Stats {
  groupInfo: {
    name: string;
    memberCount: number;
    planCount: number;
  };
  overview: {
    totalChaptersRead: number;
    maxStreakDays: number;
    avgCompletionRate: number;
    totalActivityLogs: number;
  };
  dailyActivity: {
    date: string;
    count: number;
    duration: number;
  }[];
  memberStats: {
    userId: string;
    user: { id: string; name: string | null; image: string | null } | null;
    totalDuration: number;
    activeDays: number;
    lastActive: string | null;
  }[];
  leaderboard: {
    userId: string;
    score: number;
    chaptersRead: number;
    streakDays: number;
    completedDays: number;
    user: { id: string; name: string | null; image: string | null };
  }[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

export function GroupStats({ churchId, plans }: GroupStatsProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [daysRange, setDaysRange] = useState("30");

  useEffect(() => {
    fetchStats();
  }, [churchId, selectedPlan, daysRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedPlan && selectedPlan !== "all") params.append("planId", selectedPlan);
      params.append("days", daysRange);

      const res = await fetch(`/api/church/${churchId}/stats?${params.toString()}`);
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return t('group.minutesOnly', { count: minutes });
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? t('group.hoursAndMinutes', { hours, mins }) : t('group.hoursOnly', { count: hours });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 mx-auto animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('group.statsLoadFailed')}
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const activityChartData = stats.dailyActivity.map(d => ({
    ...d,
    dateLabel: formatDate(d.date)
  }));

  const pieData = stats.memberStats.slice(0, 5).map((m, i) => ({
    name: m.user?.name || t('group.anonymousUser'),
    value: m.activeDays,
    color: COLORS[i % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {plans.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('group.plan')}:</span>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('group.allPlans')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('group.allPlans')}</SelectItem>
                {plans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('group.timeRange')}:</span>
          <Select value={daysRange} onValueChange={setDaysRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t('group.last7Days')}</SelectItem>
              <SelectItem value="14">{t('group.last14Days')}</SelectItem>
              <SelectItem value="30">{t('group.last30Days')}</SelectItem>
              <SelectItem value="90">{t('group.last90Days')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">{t('group.memberCountLabel')}</span>
            </div>
            <div className="text-2xl font-bold">{stats.groupInfo.memberCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">{t('group.totalChaptersRead')}</span>
            </div>
            <div className="text-2xl font-bold">{stats.overview.totalChaptersRead}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-sm">{t('group.maxStreak')}</span>
            </div>
            <div className="text-2xl font-bold">{t('group.daysWithCount', { count: stats.overview.maxStreakDays })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">{t('group.avgCompletionRate')}</span>
            </div>
            <div className="text-2xl font-bold">{stats.overview.avgCompletionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {t('group.dailyActivityTrend')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {activityChartData.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(label) => t('group.dateLabel', { date: String(label) })}
                    formatter={(value: number) => [t('group.activityCount', { count: value }), t('group.activityCountLabel')]}
                  />
                  <Bar
                    dataKey="count"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {t('group.noActivityData')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('group.memberActivityRanking')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {stats.memberStats.length > 0 ? (
            <div className="space-y-3">
              {stats.memberStats.map((member, index) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      index === 0 ? "bg-amber-100 text-amber-700" :
                      index === 1 ? "bg-gray-100 text-gray-700" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{member.user?.name || t('group.anonymousUser')}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.lastActive
                          ? `最后活跃: ${new Date(member.lastActive).toLocaleDateString("zh-CN")}`
                          : "暂无活动"
                        }
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">
                      {member.activeDays} 天
                    </div>
                    <div className="text-xs text-muted-foreground">
                      活跃天数
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              暂无成员活动数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard (if plan selected) */}
      {selectedPlan && stats.leaderboard.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {t('group.planLeaderboard')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {stats.leaderboard.slice(0, 5).map((entry, index) => (
                <div
                  key={entry.userId}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    index === 0 && "bg-amber-50 dark:bg-amber-900/20",
                    index === 1 && "bg-gray-50 dark:bg-gray-900/20",
                    index === 2 && "bg-orange-50 dark:bg-orange-900/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      index === 0 ? "bg-amber-100 text-amber-700" :
                      index === 1 ? "bg-gray-100 text-gray-700" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{entry.user.name || "匿名用户"}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-primary">
                        {entry.score}
                      </div>
                      <div className="text-xs text-muted-foreground">积分</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{entry.chaptersRead}</div>
                      <div className="text-xs text-muted-foreground">章节</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {entry.streakDays}
                      </div>
                      <div className="text-xs text-muted-foreground">连续</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}