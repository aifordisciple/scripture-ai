"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trophy, Loader2, Lock, Unlock } from "lucide-react";
import {
  GROUP_BADGES,
  getRarityColor,
  getRarityLabel,
  type GroupBadge
} from "@/lib/group-badges";
import { cn } from "@/lib/utils";

interface UserBadge {
  id: string;
  type: string;
  earnedAt: string;
}

interface GroupBadgeGalleryProps {
  churchId?: string;
  planId?: string;
  userId?: string;
  earnedBadges?: UserBadge[];
}

export function GroupBadgeGallery({
  churchId,
  planId,
  userId,
  earnedBadges = []
}: GroupBadgeGalleryProps) {
  const [loading, setLoading] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<GroupBadge | null>(null);

  const earnedBadgeIds = new Set(earnedBadges.map(b => b.type));

  const getEarnedDate = (badgeId: string): string | null => {
    const badge = earnedBadges.find(b => b.type === badgeId);
    return badge ? new Date(badge.earnedAt).toLocaleDateString("zh-CN") : null;
  };

  // Group badges by rarity
  const badgesByRarity = {
    LEGENDARY: GROUP_BADGES.filter(b => b.rarity === 'LEGENDARY'),
    EPIC: GROUP_BADGES.filter(b => b.rarity === 'EPIC'),
    RARE: GROUP_BADGES.filter(b => b.rarity === 'RARE'),
    COMMON: GROUP_BADGES.filter(b => b.rarity === 'COMMON')
  };

  const totalEarned = earnedBadgeIds.size;
  const totalBadges = GROUP_BADGES.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          成就徽章
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
            {/* Badge grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {GROUP_BADGES.map((badge) => {
                const isEarned = earnedBadgeIds.has(badge.id);
                const earnedDate = getEarnedDate(badge.id);

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
                            : "bg-muted/30 border-border opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span className="text-2xl mb-1">{badge.icon}</span>
                        <span className="text-[10px] font-medium text-center px-1 truncate w-full">
                          {badge.name}
                        </span>
                        {!isEarned && (
                          <Lock className="absolute top-1 right-1 w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <span className="text-3xl">{badge.icon}</span>
                          {badge.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <p className="text-muted-foreground">{badge.description}</p>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: `${getRarityColor(badge.rarity)}20`,
                              color: getRarityColor(badge.rarity)
                            }}
                          >
                            {getRarityLabel(badge.rarity)}
                          </span>
                        </div>
                        {isEarned ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <Unlock className="w-4 h-4" />
                            <span className="text-sm">
                              于 {earnedDate} 获得
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Lock className="w-4 h-4" />
                            <span className="text-sm">尚未获得</span>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>

            {/* Progress indicator */}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">收集进度</span>
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