"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { formatDateClient } from "@/lib/locale";

interface GroupProgressCalendarProps {
  churchId: string;
  planId: string;
  startDate: Date | string;
  tasks?: any[];
  dailyChapters?: string[];
  onDayClick?: (day: number) => void;
}

interface DayProgress {
  day: number;
  date: Date;
  completed: boolean;
  partial: boolean;
  totalTasks: number;
  completedTasks: number;
}

export function GroupProgressCalendar({
  churchId,
  planId,
  startDate,
  tasks = [],
  dailyChapters = [],
  onDayClick
}: GroupProgressCalendarProps) {
  const [progress, setProgress] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const [currentViewMonth, setCurrentViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Fetch progress data
  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/church/${churchId}/plan/${planId}/progress`);
        const data = await res.json();
        if (data.progress?.completedTasks) {
          setProgress(data.progress.completedTasks);
        }
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [churchId, planId]);

  // Calculate day progress for each day
  const calendarData = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const totalDays = tasks.length || dailyChapters.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: DayProgress[] = [];

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(start);
      date.setDate(date.getDate() + day - 1);

      const task = tasks.find((t: any) => t.day === day);
      const totalTasks = task
        ? (task.devotional ? 1 : 0) + task.readings.length
        : dailyChapters[day - 1] ? 1 : 0;

      const completedTasks = progress[day.toString()] || [];
      const completedCount = completedTasks.length;

      days.push({
        day,
        date,
        completed: completedCount >= totalTasks && totalTasks > 0,
        partial: completedCount > 0 && completedCount < totalTasks,
        totalTasks,
        completedTasks: completedCount
      });
    }

    return days;
  }, [startDate, tasks, dailyChapters, progress]);

  // Get days for the current month view
  const monthDays = useMemo(() => {
    const { year, month } = currentViewMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (DayProgress | null)[] = [];

    // Add padding for days before the first day of month
    const startPadding = firstDay.getDay(); // 0 = Sunday
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dayProgress = calendarData.find(dp => {
        const dpDate = new Date(dp.date);
        return dpDate.getFullYear() === date.getFullYear() &&
               dpDate.getMonth() === date.getMonth() &&
               dpDate.getDate() === date.getDate();
      });
      days.push(dayProgress || null);
    }

    return days;
  }, [currentViewMonth, calendarData]);

  const goToPrevMonth = () => {
    setCurrentViewMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const goToNextMonth = () => {
    setCurrentViewMonth(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentViewMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

  const monthName = formatDateClient(new Date(currentViewMonth.year, currentViewMonth.month), {
    year: 'numeric',
    month: 'long'
  });

  const weekDays = [t('group.weekSun'), t('group.weekMon'), t('group.weekTue'), t('group.weekWed'), t('group.weekThu'), t('group.weekFri'), t('group.weekSat')];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('group.progressCalendar')}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs">
              {t('group.today')}
            </Button>
            <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{monthName}</p>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((dayProgress, index) => {
            if (!dayProgress) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square rounded-lg"
                />
              );
            }

            const isToday = new Date(dayProgress.date).getTime() === today.getTime();
            const isFuture = new Date(dayProgress.date) > today;

            return (
              <button
                key={dayProgress.day}
                onClick={() => onDayClick?.(dayProgress.day)}
                disabled={isFuture}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all",
                  "hover:ring-2 hover:ring-indigo-300",
                  dayProgress.completed && "bg-green-100 dark:bg-green-900/30",
                  dayProgress.partial && !dayProgress.completed && "bg-yellow-100 dark:bg-yellow-900/30",
                  !dayProgress.completed && !dayProgress.partial && !isFuture && "bg-red-50 dark:bg-red-900/20",
                  isFuture && "opacity-40",
                  isToday && "ring-2 ring-indigo-500"
                )}
              >
                <span className={cn(
                  "font-medium",
                  dayProgress.completed ? "text-green-700 dark:text-green-300" :
                  dayProgress.partial ? "text-yellow-700 dark:text-yellow-300" :
                  isFuture ? "text-muted-foreground" : "text-red-600 dark:text-red-400"
                )}>
                  {new Date(dayProgress.date).getDate()}
                </span>
                {dayProgress.completed ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5" />
                ) : dayProgress.partial ? (
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-0.5" />
                ) : !isFuture ? (
                  <Circle className="w-3 h-3 text-red-400 mt-0.5" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30" />
            <span className="text-muted-foreground">{t('group.completed')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30" />
            <span className="text-muted-foreground">{t('group.partiallyCompleted')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-50 dark:bg-red-900/20" />
            <span className="text-muted-foreground">{t('group.notCompleted')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}