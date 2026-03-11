"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Crown, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

interface LeaderboardProps {
  churchId: string;
  planId: string;
  currentUserId?: string;
}

export function Leaderboard({ churchId, planId, currentUserId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800";
      case 2:
        return "bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border-slate-200 dark:border-slate-700";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800";
      default:
        return "bg-card border-border";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          加载排行榜...
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>暂无排行数据</p>
          <p className="text-xs mt-1">完成读经打卡后将显示在排行榜上</p>
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
            排行榜
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 space-y-2">
          {/* My position (if not in top 3) */}
          {myEntry && myEntry.rank > 3 && (
            <div className="mb-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {myEntry.rank}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm">我的排名</p>
                  <p className="text-xs text-muted-foreground">
                    {myEntry.score} 分
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {leaderboard.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  getRankBg(entry.rank),
                  entry.userId === currentUserId && "ring-2 ring-indigo-500"
                )}
              >
                {getRankIcon(entry.rank)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {entry.user.name || "匿名用户"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{entry.chaptersRead} 章</span>
                    <span>·</span>
                    <span>{entry.streakDays} 天连续</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600 dark:text-indigo-400">
                    {entry.score}
                  </p>
                  <p className="text-xs text-muted-foreground">分</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground text-center pt-2">
            积分 = 章节数×10 + 连续天数×50 + 完成天数×100
          </p>
        </CardContent>
      )}
    </Card>
  );
}