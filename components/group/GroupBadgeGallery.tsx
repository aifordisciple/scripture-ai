"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trophy, Loader2, Lock, Unlock, Flame, BookOpen, Calendar, Award } from "lucide-react";
import {
  GROUP_BADGES,
  getRarityColor,
  getRarityLabel,
  type GroupBadge
} from "@/lib/group-badges";
import { cn } from "@/lib/utils";
import { useTranslation, t } from "@/lib/i18n";
import { formatDateClient } from "@/lib/locale";

interface UserBadge {
  id: string;
  type: string;
  earnedAt: string;
}

interface BadgeProgress {
  current: number;
  target: number;
  percentage: number;
}

interface GroupBadgeGalleryProps {
  churchId?: string;
  planId?: string;
  userId?: string;
  earnedBadges?: UserBadge[];
  stats?: {
    streakDays: number;
    completedDays: number;
    chaptersRead: number;
    plansCompleted: number;
  };
}

export function GroupBadgeGallery({
  churchId,
  planId,
  userId,
  earnedBadges = [],
  stats
}: GroupBadgeGalleryProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<GroupBadge | null>(null);
  const [badgeProgress, setBadgeProgress] = useState<Record<string, BadgeProgress>>({});

  const earnedBadgeIds = new Set(earnedBadges.map(b => b.type));

  // Calculate progress for each badge
  useEffect(() => {
    if (!stats) return;

    const progress: Record<string, BadgeProgress> = {};

    GROUP_BADGES.forEach(badge => {
      let current = 0;
      let target = badge.requirement.value;

      switch (badge.requirement.type) {
        case 'STREAK':
          current = stats.streakDays;
          break;
        case 'COMPLETED_DAYS':
          current = stats.completedDays;
          break;
        case 'CHAPTERS_READ':
          current = stats.chaptersRead;
          break;
        case 'PLAN_COMPLETE':
          current = stats.plansCompleted;
          break;
      }

      progress[badge.id] = {
        current,
        target,
        percentage: Math.min(100, (current / target) * 100)
      };
    });

    setBadgeProgress(progress);
  }, [stats]);

  const getEarnedDate = (badgeId: string): string | null => {
    const badge = earnedBadges.find(b => b.type === badgeId);
    return badge ? formatDateClient(new Date(badge.earnedAt)) : null;
  };

  const getRequirementIcon = (type: string) => {
    switch (type) {
      case 'STREAK':
        return <Flame className="w-3 h-3" />;
      case 'COMPLETED_DAYS':
        return <Calendar className="w-3 h-3" />;
      case 'CHAPTERS_READ':
        return <BookOpen className="w-3 h-3" />;
      case 'PLAN_COMPLETE':
        return <Trophy className="w-3 h-3" />;
      default:
        return <Award className="w-3 h-3" />;
    }
  };

  const totalEarned = earnedBadgeIds.size;
  const totalBadges = GROUP_BADGES.length;

  // Group badges by rarity
  const badgesByRarity = {
    LEGENDARY: GROUP_BADGES.filter(b => b.rarity === 'LEGENDARY'),
    EPIC: GROUP_BADGES.filter(b => b.rarity === 'EPIC'),
    RARE: GROUP_BADGES.filter(b => b.rarity === 'RARE'),
    COMMON: GROUP_BADGES.filter(b => b.rarity === 'COMMON')
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          {t('group.badgeWall')}
          <span className="text-sm font-normal text-muted-foreground">
            ({totalEarned}/{totalBadges})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Badge grid by rarity */}
            {(['LEGENDARY', 'EPIC', 'RARE', 'COMMON'] as const).map(rarity => {
              const badges = badgesByRarity[rarity];
              if (badges.length === 0) return null;

              return (
                <div key={rarity} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${getRarityColor(rarity)}20`,
                        color: getRarityColor(rarity)
                      }}
                    >
                      {getRarityLabel(rarity)}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {badges.map((badge) => {
                      const isEarned = earnedBadgeIds.has(badge.id);
                      const earnedDate = getEarnedDate(badge.id);
                      const progress = badgeProgress[badge.id];

                      return (
                        <Dialog key={badge.id}>
                          <DialogTrigger asChild>
                            <button
                              onClick={() => setSelectedBadge(badge)}
                              className={cn(
                                "relative w-full aspect-square rounded-xl flex flex-col items-center justify-center transition-all",
                                "border-2",
                                isEarned
                                  ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300 dark:border-amber-700 cursor-pointer hover:scale-105"
                                  : "bg-muted/30 border-border cursor-pointer hover:bg-muted/50"
                              )}
                            >
                              <span className={cn(
                                "text-2xl mb-1",
                                !isEarned && "opacity-40 grayscale"
                              )}>
                                {badge.icon}
                              </span>
                              <span className="text-[9px] font-medium text-center px-1 truncate w-full">
                                {t(badge.nameKey)}
                              </span>
                              {!isEarned && (
                                <Lock className="absolute top-1 right-1 w-3 h-3 text-muted-foreground/50" />
                              )}
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <span className={cn(
                                  "text-3xl",
                                  !isEarned && "opacity-40 grayscale"
                                )}>
                                  {badge.icon}
                                </span>
                                {t(badge.nameKey)}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <p className="text-muted-foreground">{t(badge.descKey)}</p>

                              <div className="flex items-center gap-2">
                                <span
                                  className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                                  style={{
                                    backgroundColor: `${getRarityColor(badge.rarity)}20`,
                                    color: getRarityColor(badge.rarity)
                                  }}
                                >
                                  {getRarityIcon(badge.rarity)}
                                  {getRarityLabel(badge.rarity)}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  {getRequirementIcon(badge.requirement.type)}
                                  {badge.requirement.value} {getRequirementUnit(badge.requirement.type)}
                                </span>
                              </div>

                              {/* Progress bar */}
                              {progress && !isEarned && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">{t('group.progress')}</span>
                                    <span className="font-medium">
                                      {progress.current}/{progress.target}
                                    </span>
                                  </div>
                                  <Progress value={progress.percentage} className="h-2" />
                                </div>
                              )}

                              {isEarned ? (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <Unlock className="w-4 h-4" />
                                  <span className="text-sm">
                                    {t('group.earnedOn', { date: earnedDate })}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Lock className="w-4 h-4" />
                                  <span className="text-sm">{t('group.notYetEarned')}</span>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Progress indicator */}
            <div className="pt-3 border-t">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{t('group.collectionProgress')}</span>
                <span className="font-medium">{Math.round((totalEarned / totalBadges) * 100)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                  style={{ width: `${(totalEarned / totalBadges) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getRequirementUnit(type: string): string {
  switch (type) {
    case 'STREAK':
      return t('group.reqUnitStreak');
    case 'COMPLETED_DAYS':
      return t('group.reqUnitDays');
    case 'CHAPTERS_READ':
      return t('group.reqUnitChapters');
    case 'PLAN_COMPLETE':
      return t('group.reqUnitPlan');
    default:
      return '';
  }
}

function getRarityIcon(rarity: string): React.ReactNode {
  switch (rarity) {
    case 'LEGENDARY':
      return '⭐';
    case 'EPIC':
      return '💎';
    case 'RARE':
      return '🔮';
    default:
      return null;
  }
}