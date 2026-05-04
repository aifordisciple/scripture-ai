"use client"

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from '@/lib/i18n'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Bell, Check, CheckCheck, Trash2, Loader2, MessageCircle,
  Trophy, Calendar, Users, AlertCircle, MessageSquare, Mail, Trash
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRealtime } from "@/hooks/use-realtime";
import {
  notify,
  getNotificationType,
  requestBrowserNotificationPermission,
} from "@/lib/notification-service";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string | null;
  read: boolean;
  metadata: string | null;
  createdAt: string;
}

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NOTIFICATION_ICONS: Record<string, any> = {
  NEW_MESSAGE: MessageCircle,
  TASK_REMINDER: Calendar,
  BADGE_EARNED: Trophy,
  PLAN_UPDATE: Calendar,
  MEMBER_JOIN: Users,
  ANNOUNCEMENT: AlertCircle,
  NEW_FEEDBACK: MessageSquare,
  FEEDBACK_REPLY: MessageSquare,
  ADMIN_MESSAGE: Mail,
  USER_MUTED: AlertCircle,
  USER_UNMUTED: Check,
  DEFAULT: Bell
};

export function NotificationDialog({ open, onOpenChange }: NotificationDialogProps) {
  const { status } = useSession();
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [browserNotifyEnabled, setBrowserNotifyEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleRealtimeNotification = useCallback((data: any) => {
    setNotifications(prev => [data, ...prev.slice(0, 49)]);
    setUnreadCount(prev => prev + 1);

    const prefs = localStorage.getItem('notification-preferences');
    const preferences = prefs ? JSON.parse(prefs) : { soundNotify: true, browserNotify: true };
    const notifType = getNotificationType(data.type || 'DEFAULT');

    notify({
      title: data.title,
      body: data.content,
      type: notifType,
      playSound: preferences.soundNotify && soundEnabled,
      showBrowser: preferences.browserNotify && browserNotifyEnabled,
    });
  }, [browserNotifyEnabled, soundEnabled]);

  useRealtime({
    onNotification: status === 'authenticated' ? handleRealtimeNotification : undefined,
    onFeedbackReply: status === 'authenticated' ? handleRealtimeNotification : undefined,
  });

  useEffect(() => {
    const initNotificationPermission = async () => {
      const granted = await requestBrowserNotificationPermission();
      setBrowserNotifyEnabled(granted);
    };
    initNotificationPermission();
    const prefs = localStorage.getItem('notification-preferences');
    if (prefs) {
      const preferences = JSON.parse(prefs);
      setSoundEnabled(preferences.soundNotify ?? true);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notification?limit=20");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch("/api/notification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds })
      });
      setNotifications(prev =>
        prev.map(n => notificationIds.includes(n.id) ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notification?id=${id}`, { method: "DELETE" });
      setNotifications(prev => prev.filter(n => n.id !== id));
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await fetch("/api/notification?clearAll=true", { method: "DELETE" });
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id]);
    }
    onOpenChange(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('common.justNow');
    if (diffMins < 60) return t('common.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('common.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('common.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.DEFAULT;
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "BADGE_EARNED":
        return "text-amber-500 bg-amber-100 dark:bg-amber-900/30";
      case "NEW_MESSAGE":
        return "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30";
      case "TASK_REMINDER":
        return "text-orange-500 bg-orange-100 dark:bg-orange-900/30";
      case "ANNOUNCEMENT":
        return "text-red-500 bg-red-100 dark:bg-red-900/30";
      case "ADMIN_MESSAGE":
        return "text-purple-500 bg-purple-100 dark:bg-purple-900/30";
      case "FEEDBACK_REPLY":
        return "text-blue-500 bg-blue-100 dark:bg-blue-900/30";
      case "USER_MUTED":
        return "text-red-500 bg-red-100 dark:bg-red-900/30";
      case "USER_UNMUTED":
        return "text-green-500 bg-green-100 dark:bg-green-900/30";
      default:
        return "text-slate-500 bg-slate-100 dark:bg-slate-800";
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('notification.title')}
            </span>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowClearConfirm(true);
                  }}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  <Trash className="w-4 h-4 mr-1" />
                  {t('notification.clearAll')}
                </Button>
              )}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllRead}
                  className="text-xs text-muted-foreground"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  {t('notification.markAllRead')}
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t('notification.noNotifications')}</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "group flex gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      notification.read
                        ? "bg-muted/30 hover:bg-muted/50"
                        : "bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                    )}
                  >
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", getIconColor(notification.type))}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm font-medium",
                          !notification.read && "text-foreground"
                        )}>
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 shrink-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {notification.content && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.content}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title={t('notification.clearAll')}
        description={t('notification.confirmClearAll')}
        onConfirm={() => {
          clearAllNotifications();
          setShowClearConfirm(false);
        }}
      />
    </>
  );
}
