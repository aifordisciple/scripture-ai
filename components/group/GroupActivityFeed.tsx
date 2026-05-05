"use client";

import { useState, useEffect, useCallback } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart, MessageCircle, BookOpen, Sparkles, CheckCircle2,
  Loader2, ChevronDown, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { formatDateClient } from "@/lib/locale";
import { BIBLE_BOOKS } from "@/lib/constants";

interface Activity {
  id: string;
  day: number;
  taskType: string;
  bookId?: string;
  chapter?: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  plan: {
    id: string;
    name: string;
  };
  likes: Array<{
    id: string;
    userId: string;
    userName: string | null;
  }>;
  likeCount: number;
  isLiked: boolean;
}

interface GroupActivityFeedProps {
  churchId: string;
  planId?: string;
}

export function GroupActivityFeed({ churchId, planId }: GroupActivityFeedProps) {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchActivities = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let url = `/api/church/${churchId}/activity?page=${pageNum}&limit=10`;
      if (planId) {
        url += `&planId=${planId}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.activities) {
        if (append) {
          setActivities(prev => [...prev, ...data.activities]);
        } else {
          setActivities(data.activities);
        }
        setHasMore(data.pagination.page < data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [churchId, planId]);

  useEffect(() => {
    fetchActivities(1);
  }, [fetchActivities]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchActivities(nextPage, true);
    }
  };

  const handleLike = async (activityId: string, isLiked: boolean) => {
    try {
      // Toggle like (POST handles both like and unlike)
      await fetch(`/api/church/${churchId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "GROUP_ACTIVITY",
          targetId: activityId
        })
      });

      // Update local state
      setActivities(prev => prev.map(a => {
        if (a.id === activityId) {
          return {
            ...a,
            isLiked: !isLiked,
            likeCount: isLiked ? a.likeCount - 1 : a.likeCount + 1
          };
        }
        return a;
      }));
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const getActivityIcon = (taskType: string) => {
    switch (taskType) {
      case "devotional":
        return <Sparkles className="w-4 h-4 text-[#0066cc]" />;
      case "reading":
        return <BookOpen className="w-4 h-4 text-green-500" />;
      case "completion":
        return <CheckCircle2 className="w-4 h-4 text-orange-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-[#7a7a7a]" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const userName = activity.user.name || t('group.anonymousUser');
    const bookName = activity.bookId
      ? BIBLE_BOOKS.find(b => b.id === activity.bookId)?.name || activity.bookId
      : "";

    switch (activity.taskType) {
      case "devotional":
        return (
          <>
            <span className="font-medium">{userName}</span>
            <span className="text-muted-foreground"> {t('group.completedDayDevotional', { day: activity.day })}</span>
          </>
        );
      case "reading":
        return (
          <>
            <span className="font-medium">{userName}</span>
            <span className="text-muted-foreground"> {t('group.readBook')}</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {t('group.bookChapter', { book: bookName, chapter: activity.chapter })}
            </span>
          </>
        );
      case "completion":
        return (
          <>
            <span className="font-medium">{userName}</span>
            <span className="text-muted-foreground"> {t('group.completedDayAll', { day: activity.day })} 🎉</span>
          </>
        );
      default:
        return (
          <>
            <span className="font-medium">{userName}</span>
            <span className="text-muted-foreground"> {t('group.completedTask')}</span>
          </>
        );
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('group.justNow');
    if (diffMins < 60) return t('group.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('group.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('group.daysAgo', { count: diffDays });
    return formatDateClient(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{t('group.noCheckinActivity')}</p>
        <p className="text-sm mt-1">{t('group.noCheckinActivityHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="text-sm text-muted-foreground mb-4">
        {t('group.totalActivities', { count: total })}
      </div>

      {/* Activity List */}
      {activities.map((activity) => (
        <Card key={activity.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {activity.user.image ? (
                  <img
                    src={activity.user.image}
                    alt={activity.user.name || ""}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#0066cc]/10 dark:bg-[#2997ff]/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#0066cc] dark:text-[#2997ff]" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getActivityIcon(activity.taskType)}
                  <span className="text-xs text-muted-foreground">
                    {activity.plan.name} · {t('group.dayX', { day: activity.day })}
                  </span>
                </div>
                <p className="text-sm mb-2">
                  {getActivityText(activity)}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatTimeAgo(activity.createdAt)}</span>
                  <button
                    onClick={() => handleLike(activity.id, activity.isLiked)}
                    className={cn(
                      "flex items-center gap-1 transition-colors",
                      activity.isLiked
                        ? "text-red-500"
                        : "hover:text-red-500"
                    )}
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4",
                        activity.isLiked && "fill-current"
                      )}
                    />
                    {activity.likeCount > 0 && (
                      <span>{activity.likeCount}</span>
                    )}
                  </button>
                </div>

                {/* Liked by section */}
                {activity.likeCount > 0 && activity.likes.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <Heart className="w-3 h-3 inline mr-1 text-red-500 fill-current" />
                    {activity.likes.slice(0, 3).map((l, i) => (
                      <span key={l.id}>
                        {l.userName || t('group.anonymous')}
                        {i < Math.min(activity.likes.length, 3) - 1 && "、"}
                      </span>
                    ))}
                    {activity.likes.length > 3 && (
                      <span> {t('group.andOthers', { count: activity.likeCount })}</span>
                    )}
                    <span> {t('group.feelsGreat')}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
            className="gap-2 active:scale-95"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            加载更多
          </Button>
        </div>
      )}
    </div>
  );
}