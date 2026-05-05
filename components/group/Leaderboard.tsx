"use client";

import { useState, useEffect, useMemo } from "react";
import { Trophy, Medal, Crown, ChevronUp, ChevronDown, Flame, BookOpen, Calendar, SortAsc } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface LeaderboardEntry {
  id: string;
  userId: string;
  score: number;
  chaptersRead: number;
  streakDays: number;
  completedDays: number;
  rank: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

type SortMode = 'score' | 'chapters' | 'streak' | 'completed';

interface LeaderboardProps {
  churchId: string;
  planId: string;
  currentUserId?: string;
}

export function Leaderboard({ churchId, planId, currentUserId }: LeaderboardProps) {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('completed');

  useEffect(() => {
    fetchLeaderboard();
  }, [churchId, planId]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`/api/church/${churchId}/plan/${planId}/leaderboard`);
      const data = await res.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
        setMyEntry(data.myEntry);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sort leaderboard based on selected mode
  const sortedLeaderboard = useMemo(() => {
    const sorted = [...leaderboard];
    switch (sortMode) {
      case 'chapters':
        return sorted.sort((a, b) => b.chaptersRead - a.chaptersRead);
      case 'streak':
        return sorted.sort((a, b) => b.streakDays - a.streakDays);
      case 'completed':
        return sorted.sort((a, b) => b.completedDays - a.completedDays);
      default:
        return sorted.sort((a, b) => b.score - a.score);
    }
  }, [leaderboard, sortMode]);

  // Calculate rank after sorting
  const rankedLeaderboard = useMemo(() => {
    return sortedLeaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }, [sortedLeaderboard]);

  const sortOptions: Array<{ mode: SortMode; label: string; icon: React.ReactNode }> = [
    { mode: 'score', label: t('group.score'), icon: <Trophy className="w-3 h-3" /> },
    { mode: 'chapters', label: t('group.chapters'), icon: <BookOpen className="w-3 h-3" /> },
    { mode: 'streak', label: t('group.streak'), icon: <Flame className="w-3 h-3" /> },
    { mode: 'completed', label: t('group.completed'), icon: <Calendar className="w-3 h-3" /> },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-semibold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-secondary dark:bg-card border-border dark:border-border";
      case 2:
        return "bg-secondary dark:bg-card border-border dark:border-border";
      case 3:
        return "bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30";
      default:
        return "bg-card border-border";
    }
  };

  const getDisplayValue = (entry: LeaderboardEntry) => {
    switch (sortMode) {
      case 'chapters':
        return { value: entry.chaptersRead, unit: t('group.chaptersUnit') };
      case 'streak':
        return { value: entry.streakDays, unit: t('group.daysUnit') };
      case 'completed':
        return { value: entry.completedDays, unit: t('group.daysUnit') };
      default:
        return { value: entry.score, unit: t('group.scoreUnit') };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('group.loadingLeaderboard')}
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{t('group.noLeaderboard')}</p>
          <p className="text-xs mt-1">{t('group.noLeaderboardHint')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle
          className="text-lg flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {t('group.leaderboardTitle')}
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 space-y-3">
          {/* Sort mode selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <SortAsc className="w-3 h-3 text-muted-foreground mr-1 shrink-0" />
            {sortOptions.map(option => (
              <Button
                key={option.mode}
                variant={sortMode === option.mode ? "default" : "outline"}
                size="sm"
                onClick={() => setSortMode(option.mode)}
                className={cn(
                  "h-7 px-2 text-xs gap-1 shrink-0 active:scale-95",
                  sortMode === option.mode && "bg-primary hover:bg-apple-focus"
                )}
              >
                {option.icon}
                {option.label}
              </Button>
            ))}
          </div>

          {/* My position (if not in top 3) */}
          {myEntry && myEntry.rank > 3 && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center text-sm font-semibold text-primary">
                  {myEntry.rank}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{t('group.myRank')}</p>
                  <p className="text-xs text-muted-foreground">
                    {getDisplayValue(myEntry).value} {getDisplayValue(myEntry).unit}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {rankedLeaderboard.slice(0, 10).map((entry) => {
              const displayValue = getDisplayValue(entry);
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    getRankBg(entry.rank),
                    entry.userId === currentUserId && "ring-2 ring-primary"
                  )}
                >
                  {getRankIcon(entry.rank)}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {entry.user.name || t('group.anonymousUser')}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <BookOpen className="w-3 h-3" />
                        {entry.chaptersRead}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {entry.streakDays}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {entry.completedDays}{t('group.daysUnit')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {displayValue.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{displayValue.unit}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground text-center pt-2">
            {t('group.scoreFormula')}
          </p>

          {/* 鼓励文案 */}
          <p className="text-xs text-muted-foreground/70 text-center pt-1 italic">
            {t('group.leaderboardEncouragement')}
          </p>
        </CardContent>
      )}
    </Card>
  );
}