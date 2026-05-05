"use client";

import { Target, Trophy, Flame, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface ChallengeProgressProps {
  plan: {
    id: string;
    name: string;
    mode: string;
    challengeConfig?: string | null;
    dailyChapters: string[];
    startDate: Date | string;
    endDate?: Date | string | null;
  };
  progress: {
    completedDays: number;
    streakDays: number;
    chaptersRead: number;
  };
}

export function ChallengeProgress({ plan, progress }: ChallengeProgressProps) {
  const { t } = useTranslation();
  const config = plan.challengeConfig
    ? JSON.parse(plan.challengeConfig)
    : null;

  const targetDays = config?.targetDays || plan.dailyChapters.length;
  const rewardTitle = config?.rewardTitle;
  const rewardBadge = config?.rewardBadge;

  const completionPercent = Math.min(
    100,
    Math.round((progress.completedDays / targetDays) * 100)
  );

  const isChallenge = plan.mode === "CHALLENGE";

  // Calculate days remaining
  const start = new Date(plan.startDate);
  const today = new Date();
  const daysPassed = Math.max(
    0,
    Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  const daysRemaining = Math.max(0, targetDays - daysPassed);

  return (
    <Card
      className={cn(
        isChallenge && "border-border dark:border-border bg-gradient-to-br from-orange-50 to-amber-50 dark:from-card dark:to-card"
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {isChallenge ? (
            <Trophy className="w-5 h-5 text-orange-500" />
          ) : (
            <Target className="w-5 h-5 text-primary" />
          )}
          {plan.name}
          {isChallenge && (
            <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full ml-auto">
              {t('group.challengeMode')}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Main progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('group.overallProgress')}</span>
            <span className="font-semibold">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('group.daysOfTotal', { completed: progress.completedDays, total: targetDays })}</span>
            <span>{daysRemaining > 0 ? t('group.daysRemaining', { count: daysRemaining }) : t('group.ended')}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-3 rounded-lg bg-secondary dark:bg-card">
            <div className="text-2xl font-semibold text-primary dark:text-primary">
              {progress.chaptersRead}
            </div>
            <div className="text-xs text-muted-foreground">{t('group.chaptersRead')}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary dark:bg-card">
            <div className="text-2xl font-semibold text-orange-500 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5" />
              {progress.streakDays}
            </div>
            <div className="text-xs text-muted-foreground">{t('group.streakDays')}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary dark:bg-card">
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {progress.completedDays}
            </div>
            <div className="text-xs text-muted-foreground">{t('group.completedDaysLabel')}</div>
          </div>
        </div>

        {/* Reward info */}
        {isChallenge && rewardTitle && (
          <div className="p-3 rounded-lg bg-secondary dark:bg-card border border-border dark:border-border">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-sm">{t('group.rewardLabel', { title: rewardTitle })}</p>
                {rewardBadge && (
                  <p className="text-xs text-muted-foreground">
                    {t('group.badgeRewardDesc', { badge: rewardBadge })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Streak encouragement */}
        {progress.streakDays >= 3 && (
          <div className="text-center p-2 rounded-lg bg-orange-50 dark:bg-orange-900/30">
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
              🔥 {t('group.streakEncouragement', { count: progress.streakDays })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}