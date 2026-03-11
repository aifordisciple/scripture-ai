"use client";

import { Target, Trophy, Flame, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
        isChallenge && "border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {isChallenge ? (
            <Trophy className="w-5 h-5 text-orange-500" />
          ) : (
            <Target className="w-5 h-5 text-indigo-500" />
          )}
          {plan.name}
          {isChallenge && (
            <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full ml-auto">
              挑战模式
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Main progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">整体进度</span>
            <span className="font-bold">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.completedDays}/{targetDays} 天</span>
            <span>{daysRemaining > 0 ? `剩余 ${daysRemaining} 天` : "已结束"}</span>
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

        {/* Reward info */}
        {isChallenge && rewardTitle && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-sm">奖励: {rewardTitle}</p>
                {rewardBadge && (
                  <p className="text-xs text-muted-foreground">
                    完成后获得「{rewardBadge}」勋章
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Streak encouragement */}
        {progress.streakDays >= 3 && (
          <div className="text-center p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
              🔥 太棒了！已连续打卡 {progress.streakDays} 天，继续坚持！
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}