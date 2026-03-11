"use client";

import { useState, useEffect } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft, ChevronRight, Play, Sparkles, BookOpen,
  Target, Trophy, Flame, Calendar, Users, Loader2, RefreshCw
} from "lucide-react";
import { BIBLE_BOOKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface GroupPlanDetailProps {
  churchId: string;
  plan: {
    id: string;
    name: string;
    description?: string | null;
    mode: string;
    challengeConfig?: string | null;
    dailyChapters: string[];
    tasks?: string | null;
    sharedDevotionals?: string | null;
    source?: string;
    startDate: Date | string;
    endDate?: Date | string | null;
  };
  onBack: () => void;
  isAdmin: boolean;
}

interface Task {
  day: number;
  devotional?: string;
  readings: { book: string; chapter: number }[];
}

export function GroupPlanDetail({ churchId, plan, onBack, isAdmin }: GroupPlanDetailProps) {
  const { startGroupPlanFlow, apiConfig } = useBibleStore();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<{
    completedTasks: Record<string, string[]>;
    chaptersRead: number;
    completedDays: number;
    streakDays: number;
  }>({
    completedTasks: {},
    chaptersRead: 0,
    completedDays: 0,
    streakDays: 0
  });
  const [generatingDevotional, setGeneratingDevotional] = useState(false);
  const [sharedDevotionals, setSharedDevotionals] = useState<Record<string, string>>({});

  // Calculate current day based on start date
  const startDate = new Date(plan.startDate);
  const today = new Date();
  const daysPassed = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const currentDay = Math.min(daysPassed + 1, tasks.length || plan.dailyChapters.length);

  useEffect(() => {
    fetchProgress();
  }, [plan.id]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/church/${churchId}/plan/${plan.id}/progress`);
      const data = await res.json();
      if (data.progress) {
        setProgress(data.progress);
      }
      if (data.plan?.tasks) {
        setTasks(JSON.parse(data.plan.tasks));
      }
      if (data.plan?.sharedDevotionals) {
        setSharedDevotionals(JSON.parse(data.plan.sharedDevotionals));
      }
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReading = async () => {
    // Get or generate devotional for current day
    let devotionals = sharedDevotionals;
    if (!devotionals[currentDay.toString()] && tasks.length > 0) {
      // Try to generate devotional
      try {
        setGeneratingDevotional(true);
        const res = await fetch(`/api/church/${churchId}/plan/${plan.id}/devotional`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day: currentDay, apiConfig })
        });
        const data = await res.json();
        if (data.devotional) {
          devotionals = { ...devotionals, [currentDay.toString()]: data.devotional };
          setSharedDevotionals(devotionals);
        }
      } catch (error) {
        console.error("Failed to generate devotional:", error);
      } finally {
        setGeneratingDevotional(false);
      }
    }

    // Start the flow
    if (tasks.length > 0) {
      const taskWithDevotional = tasks.map(t => ({
        ...t,
        devotional: devotionals[t.day.toString()] || t.devotional
      }));
      startGroupPlanFlow(churchId, plan.id, plan.name, taskWithDevotional, currentDay);
    } else {
      // Fallback: create tasks from dailyChapters
      const fallbackTasks: Task[] = plan.dailyChapters.map((chaptersStr, index) => {
        const chapters = chaptersStr.split(',');
        const readings = chapters.map(c => {
          const [book, chapter] = c.split('-');
          return { book, chapter: parseInt(chapter) };
        });
        return {
          day: index + 1,
          readings
        };
      });
      startGroupPlanFlow(churchId, plan.id, plan.name, fallbackTasks, currentDay);
    }
  };

  const generateDevotional = async (day: number) => {
    setGeneratingDevotional(true);
    try {
      const res = await fetch(`/api/church/${churchId}/plan/${plan.id}/devotional`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, forceRegenerate: true, apiConfig })
      });
      const data = await res.json();
      if (data.devotional) {
        setSharedDevotionals(prev => ({ ...prev, [day.toString()]: data.devotional }));
      }
    } catch (error) {
      console.error("Failed to generate devotional:", error);
    } finally {
      setGeneratingDevotional(false);
    }
  };

  const config = plan.challengeConfig ? JSON.parse(plan.challengeConfig) : null;
  const targetDays = config?.targetDays || tasks.length || plan.dailyChapters.length;
  const completionPercent = Math.min(100, Math.round((progress.completedDays / targetDays) * 100));

  const isChallenge = plan.mode === "CHALLENGE";

  // Get current day's readings
  const getCurrentDayReadings = () => {
    if (tasks.length > 0) {
      const task = tasks.find(t => t.day === currentDay);
      return task?.readings || [];
    }
    // Fallback to dailyChapters
    const chaptersStr = plan.dailyChapters[currentDay - 1];
    if (!chaptersStr) return [];
    return chaptersStr.split(',').map(c => {
      const [book, chapter] = c.split('-');
      return { book, chapter: parseInt(chapter) };
    });
  };

  const currentReadings = getCurrentDayReadings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" /> 返回
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-2">
            {isChallenge ? (
              <Trophy className="w-5 h-5" />
            ) : (
              <Target className="w-5 h-5" />
            )}
            <span className="text-sm uppercase tracking-widest">
              {isChallenge ? "挑战模式" : "读经计划"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground font-serif">
            {plan.name}
          </h1>
          {plan.description && (
            <p className="text-muted-foreground mt-2">{plan.description}</p>
          )}
        </div>
        {plan.source === "AI_GENERATED" && (
          <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full">
            AI 生成
          </span>
        )}
      </div>

      {/* Main Progress Card */}
      <Card className={cn(
        isChallenge && "border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            整体进度
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">完成进度</span>
              <span className="font-bold">{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.completedDays}/{targetDays} 天</span>
              <span>当前第 {currentDay} 天</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-black/20">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {progress.chaptersRead}
              </div>
              <div className="text-xs text-muted-foreground">已读章节</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-black/20">
              <div className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5" />
                {progress.streakDays}
              </div>
              <div className="text-xs text-muted-foreground">连续天数</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-black/20">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {progress.completedDays}
              </div>
              <div className="text-xs text-muted-foreground">完成天数</div>
            </div>
          </div>

          {/* Continue Reading Button */}
          {currentDay <= (tasks.length || plan.dailyChapters.length) && (
            <Button
              onClick={handleStartReading}
              disabled={generatingDevotional || loading}
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-600/20 gap-2"
            >
              {generatingDevotional ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {generatingDevotional ? "生成导读中..." : "继续今日阅读"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Today's Readings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            今日经文
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {currentReadings.map((reading, index) => {
              const bookName = BIBLE_BOOKS.find(b => b.id === reading.book)?.name || reading.book;
              const taskId = `reading-${index}`;
              const isCompleted = progress.completedTasks[currentDay.toString()]?.includes(taskId);
              return (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border text-center transition-colors",
                    isCompleted
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-muted/50 border-border"
                  )}
                >
                  <div className="font-bold">{bookName}</div>
                  <div className="text-sm text-muted-foreground">第 {reading.chapter} 章</div>
                  {isCompleted && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">✓ 已完成</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Tasks List */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              每日任务
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {tasks.slice(0, 14).map((task) => {
                const dayTasks = progress.completedTasks[task.day.toString()] || [];
                const hasDevotional = task.devotional || sharedDevotionals[task.day.toString()];
                const devotionalCompleted = dayTasks.includes('devotional');
                const readingsCompleted = task.readings.every((_, i) => dayTasks.includes(`reading-${i}`));
                const allCompleted = devotionalCompleted && readingsCompleted;
                const isCurrentDay = task.day === currentDay;

                return (
                  <div
                    key={task.day}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      allCompleted
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : isCurrentDay
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                          : "bg-muted/50 border-border"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">第 {task.day} 天</span>
                        {isCurrentDay && (
                          <span className="text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded">今日</span>
                        )}
                      </div>
                      {allCompleted && (
                        <span className="text-xs text-green-600 dark:text-green-400">✓ 已完成</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {hasDevotional && (
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          devotionalCompleted
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        )}>
                          灵修导读
                        </span>
                      )}
                      {task.readings.map((r, i) => {
                        const bookName = BIBLE_BOOKS.find(b => b.id === r.book)?.name || r.book;
                        const completed = dayTasks.includes(`reading-${i}`);
                        return (
                          <span
                            key={i}
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded",
                              completed
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            )}
                          >
                            {bookName} {r.chapter}章
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin: Generate Devotional */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              灵修导读管理
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              为每一天生成或更新灵修导读，帮助小组成员更好地理解经文。
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateDevotional(currentDay)}
                disabled={generatingDevotional}
                className="gap-1"
              >
                {generatingDevotional ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                重新生成今日导读
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}