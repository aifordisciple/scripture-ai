"use client";

import { useState, useEffect, useCallback } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Users, Play, ChevronRight, Loader2, BookOpen,
  Flame, CheckCircle2, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HomeGroupData {
  churchId: string;
  churchName: string;
  role: string;
  activePlan: {
    id: string;
    name: string;
    day: number;
    totalDays: number;
    tasks?: any[];
    dailyChapters?: string[];
  } | null;
  todayProgress: {
    completed: number;
    total: number;
    chaptersRead: number;
    streakDays: number;
  };
}

interface HomeGroupCardProps {
  onJoinGroup?: () => void;
}

export function HomeGroupCard({ onJoinGroup }: HomeGroupCardProps) {
  const { startGroupPlanFlow, addTab, setActiveTab, tabs, apiConfig } = useBibleStore();
  const [data, setData] = useState<HomeGroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingReading, setStartingReading] = useState(false);

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/church?type=my");
      const result = await res.json();

      if (result.churches && result.churches.length > 0) {
        // Get the first group with an active plan
        for (const church of result.churches) {
          const planRes = await fetch(`/api/church/${church.id}/plan`);
          const planData = await planRes.json();

          if (planData.plans && planData.plans.length > 0) {
            const plan = planData.plans[0];

            // Get progress for this plan
            const progressRes = await fetch(`/api/church/${church.id}/plan/${plan.id}/progress`);
            const progressData = await progressRes.json();

            // Calculate current day
            const startDate = new Date(plan.startDate);
            const today = new Date();
            const daysPassed = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
            const currentDay = daysPassed + 1;

            // Parse tasks
            let tasks: any[] = [];
            if (plan.tasks) {
              tasks = JSON.parse(plan.tasks);
            } else if (plan.dailyChapters) {
              // Fallback: create tasks from dailyChapters
              tasks = plan.dailyChapters.map((chaptersStr: string, index: number) => {
                const chapters = chaptersStr.split(',');
                const readings = chapters.map((c: string) => {
                  const [book, chapter] = c.split('-');
                  return { book, chapter: parseInt(chapter) };
                });
                return { day: index + 1, readings };
              });
            }

            // Calculate today's progress
            const completedTasks = progressData.progress?.completedTasks || {};
            const todayTasks = completedTasks[currentDay.toString()] || [];
            const currentTask = tasks.find((t: any) => t.day === currentDay);
            const totalTasksForToday = currentTask
              ? (currentTask.devotional ? 1 : 0) + currentTask.readings.length
              : 0;
            const completedTasksForToday = todayTasks.length;

            setData({
              churchId: church.id,
              churchName: church.name,
              role: church.members?.[0]?.role || 'MEMBER',
              activePlan: {
                id: plan.id,
                name: plan.name,
                day: currentDay,
                totalDays: tasks.length || plan.dailyChapters?.length || 0,
                tasks,
                dailyChapters: plan.dailyChapters
              },
              todayProgress: {
                completed: completedTasksForToday,
                total: totalTasksForToday,
                chaptersRead: progressData.progress?.chaptersRead || 0,
                streakDays: progressData.progress?.streakDays || 0
              }
            });
            return;
          }
        }

        // User has groups but no active plans
        const firstChurch = result.churches[0];
        setData({
          churchId: firstChurch.id,
          churchName: firstChurch.name,
          role: firstChurch.members?.[0]?.role || 'MEMBER',
          activePlan: null,
          todayProgress: {
            completed: 0,
            total: 0,
            chaptersRead: 0,
            streakDays: 0
          }
        });
      } else {
        setData(null);
      }
    } catch (error) {
      console.error("Failed to fetch home group data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const handleStartReading = async () => {
    if (!data?.activePlan) return;

    setStartingReading(true);
    try {
      // Get or generate devotional
      const currentDay = data.activePlan.day;
      const tasks = data.activePlan.tasks || [];

      // Fetch shared devotionals
      let devotionals: Record<string, string> = {};
      try {
        const res = await fetch(`/api/church/${data.churchId}/plan/${data.activePlan.id}/progress`);
        const progressData = await res.json();
        if (progressData.plan?.sharedDevotionals) {
          devotionals = JSON.parse(progressData.plan.sharedDevotionals);
        }
      } catch (e) {}

      // Generate devotional if not exists for today
      if (!devotionals[currentDay.toString()] && tasks.length > 0) {
        try {
          const res = await fetch(`/api/church/${data.churchId}/plan/${data.activePlan.id}/devotional`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ day: currentDay, apiConfig })
          });
          const genData = await res.json();
          if (genData.devotional) {
            devotionals[currentDay.toString()] = genData.devotional;
          }
        } catch (e) {}
      }

      // Build tasks with devotionals
      const tasksWithDevotionals = tasks.map(t => ({
        ...t,
        devotional: devotionals[t.day.toString()] || t.devotional
      }));

      // Start the flow
      startGroupPlanFlow(
        data.churchId,
        data.activePlan.id,
        data.activePlan.name,
        tasksWithDevotionals,
        currentDay
      );
    } catch (error) {
      console.error("Failed to start reading:", error);
    } finally {
      setStartingReading(false);
    }
  };

  const goToGroupTab = () => {
    const groupTab = tabs.find(t => t.type === 'group');
    if (groupTab) {
      setActiveTab(groupTab.id);
    } else {
      addTab({ type: 'group' });
    }
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // No group
  if (!data) {
    return (
      <Card className="overflow-hidden border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">加入读经小组</p>
              <p className="text-xs text-muted-foreground">与家人朋友一起读经</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onJoinGroup || goToGroupTab}
              className="gap-1"
            >
              加入 <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Has group but no active plan
  if (!data.activePlan) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{data.churchName}</p>
              <p className="text-xs text-muted-foreground">暂无进行中的读经计划</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToGroupTab}
              className="gap-1"
            >
              查看 <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { activePlan, todayProgress } = data;
  const progressPercent = todayProgress.total > 0
    ? Math.round((todayProgress.completed / todayProgress.total) * 100)
    : 0;
  const isTodayCompleted = todayProgress.completed >= todayProgress.total && todayProgress.total > 0;

  return (
    <Card className={cn(
      "overflow-hidden transition-shadow hover:shadow-md",
      isTodayCompleted && "border-green-200 dark:border-green-800"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "p-2.5 rounded-xl",
            isTodayCompleted
              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
          )}>
            {isTodayCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Users className="w-5 h-5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm truncate">{data.churchName}</p>
              <span className="text-xs text-muted-foreground">
                第 {activePlan.day}/{activePlan.totalDays} 天
              </span>
            </div>

            <p className="text-xs text-muted-foreground mb-2 truncate">
              {activePlan.name}
            </p>

            {/* Progress bar */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">今日进度</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>{todayProgress.chaptersRead} 章</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-500" />
                <span>{todayProgress.streakDays} 天</span>
              </div>
            </div>

            {/* Action button */}
            {isTodayCompleted ? (
              <Button
                variant="outline"
                size="sm"
                onClick={goToGroupTab}
                className="w-full gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                今日已完成
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleStartReading}
                disabled={startingReading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 gap-1"
              >
                {startingReading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {startingReading ? "准备中..." : "继续今日阅读"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}