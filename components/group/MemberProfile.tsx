"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User, BookOpen, Trophy, Flame, Star, Loader2,
  ChevronRight, FileText, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BIBLE_BOOKS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";
import { formatDateClient } from "@/lib/locale";

interface MemberProfileProps {
  userId: string;
  churchId?: string;
  trigger?: React.ReactNode;
}

interface MemberData {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    createdAt: string;
    streakCount: number;
    lastActiveDate: string | null;
  };
  stats: {
    totalChaptersRead: number;
    uniqueBooksRead: number;
    totalScore: number;
    streakDays: number;
  };
  badges: {
    id: string;
    type: string;
    earnedAt: string;
  }[];
  sharedNotes: {
    id: string;
    bookId: string;
    chapter: number;
    verse: number;
    content: string;
    createdAt: string;
  }[];
  planProgress: {
    planId: string;
    planName: string;
    chaptersRead: number;
    streakDays: number;
    completedDays: number;
  }[];
}

const BADGE_ICONS: Record<string, string> = {
  STREAK_3: "🔥",
  STREAK_7: "🔥",
  STREAK_14: "🔥",
  STREAK_30: "🔥",
  STREAK_100: "🔥",
  COMPLETED_7: "📖",
  COMPLETED_30: "📖",
  COMPLETED_100: "📖",
  CHAPTERS_50: "📚",
  CHAPTERS_100: "📚",
  CHAPTERS_365: "📚",
  CHAPTERS_1000: "📚",
  PLAN_COMPLETE_1: "🏆",
  PLAN_COMPLETE_5: "🏆",
  PLAN_COMPLETE_10: "🏆",
  EARLY_BIRD: "🌅"
};

export function MemberProfile({ userId, churchId, trigger }: MemberProfileProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MemberData | null>(null);

  useEffect(() => {
    if (open) {
      fetchProfile();
    }
  }, [open, userId, churchId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (churchId) params.append("churchId", churchId);

      const res = await fetch(`/api/member/${userId}?${params.toString()}`);
      const result = await res.json();
      if (result.user) {
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return formatDateClient(new Date(dateStr));
  };

  const getBookName = (bookId: string) => {
    return BIBLE_BOOKS.find(b => b.id === bookId)?.name || bookId;
  };

  const getBadgeIcon = (type: string) => {
    return BADGE_ICONS[type] || "🏅";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="active:scale-95">
            <User className="w-4 h-4 mr-2" />
            {t('group.viewProfile')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('group.memberProfile')}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-6 pt-4">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                {data.user.image ? (
                  <img
                    src={data.user.image}
                    alt={data.user.name || "User"}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary dark:text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.022em]">{data.user.name || t('group.anonymousUser')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('group.joinedAt', { date: formatDate(data.user.createdAt) })}
                </p>
                {data.user.lastActiveDate && (
                  <p className="text-xs text-muted-foreground">
                    {t('group.lastActive', { date: formatDate(data.user.lastActiveDate!) })}
                  </p>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <div className="text-xl font-semibold">{data.stats.totalChaptersRead}</div>
                  <div className="text-xs text-muted-foreground">{t('group.chaptersRead')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <BookOpen className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <div className="text-xl font-semibold">{data.stats.uniqueBooksRead}</div>
                  <div className="text-xs text-muted-foreground">{t('group.booksRead')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                  <div className="text-xl font-semibold">{data.stats.streakDays}</div>
                  <div className="text-xs text-muted-foreground">{t('group.streakDays')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                  <div className="text-xl font-semibold">{data.stats.totalScore}</div>
                  <div className="text-xs text-muted-foreground">{t('group.totalScore')}</div>
                </CardContent>
              </Card>
            </div>

            {/* Badges */}
            {data.badges.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    {t('group.earnedBadges', { count: data.badges.length })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {data.badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20"
                        title={`${badge.type} - ${formatDate(badge.earnedAt)}`}
                      >
                        <span className="text-lg">{getBadgeIcon(badge.type)}</span>
                        <span className="text-sm font-semibold">{badge.type.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plan Progress */}
            {data.planProgress.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {t('group.joinedPlans')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {data.planProgress.map((progress) => (
                      <div
                        key={progress.planId}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div>
                          <div className="font-semibold">{progress.planName}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('group.readChaptersStreak', { chapters: progress.chaptersRead, streak: progress.streakDays })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {t('group.daysCompleted', { count: progress.completedDays })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shared Notes */}
            {data.sharedNotes.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('group.publicNotes', { count: data.sharedNotes.length })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {data.sharedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-primary dark:text-primary">
                            {getBookName(note.bookId)} {note.chapter}:{note.verse}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t('group.failedLoadProfile')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}