"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, User, Send, RefreshCw, Loader2,
  Bell, Heart, MessageSquare, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BehindMember {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  behindDays: number[];
  completedDays: number;
  lastActiveDate: string | null;
  streakDays: number;
  daysSinceActive: number;
}

interface BehindMembersPanelProps {
  churchId: string;
  planId: string;
}

export function BehindMembersPanel({ churchId, planId }: BehindMembersPanelProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [behindMembers, setBehindMembers] = useState<BehindMember[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    behindCount: 0,
    onTrackCount: 0
  });
  const [currentDay, setCurrentDay] = useState(1);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [remindDialogOpen, setRemindDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<BehindMember | null>(null);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [pendingBatchAction, setPendingBatchAction] = useState<(() => void) | null>(null);

  const fetchBehindMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/church/${churchId}/behind-members?planId=${planId}`);
      const data = await res.json();
      if (data.behindMembers) {
        setBehindMembers(data.behindMembers);
        setStats(data.stats);
        setCurrentDay(data.currentDay);
      }
    } catch (error) {
      console.error("Failed to fetch behind members:", error);
    } finally {
      setLoading(false);
    }
  }, [churchId, planId]);

  useEffect(() => {
    fetchBehindMembers();
  }, [fetchBehindMembers]);

  const sendReminder = async (targetUserId: string, type: 'reminder' | 'encouragement' | 'custom', message?: string) => {
    setSendingReminder(targetUserId);
    try {
      const res = await fetch(`/api/church/${churchId}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          planId,
          type,
          message
        })
      });
      const data = await res.json();
      if (data.success) {
        // Show success feedback
        addToast({ type: 'success', message: t('group.reminderSent') });
      } else {
        addToast({ type: 'error', message: data.error || t('group.sendFailed') });
      }
    } catch (error) {
      console.error("Failed to send reminder:", error);
      addToast({ type: 'error', message: t('group.sendFailedRetry') });
    } finally {
      setSendingReminder(null);
    }
  };

  const handleCustomSend = () => {
    if (selectedMember && customMessage.trim()) {
      sendReminder(selectedMember.user.id, 'custom', customMessage);
      setCustomMessage("");
      setSelectedMember(null);
      setRemindDialogOpen(false);
    }
  };

  const formatLastActive = (lastActiveDate: string | null, daysSinceActive: number) => {
    if (!lastActiveDate) return t('group.neverActive');
    if (daysSinceActive === 0) return t('group.today');
    if (daysSinceActive === 1) return t('group.yesterday');
    return t('group.daysAgo', { count: daysSinceActive });
  };

  const getActivityColor = (daysSinceActive: number) => {
    if (daysSinceActive <= 1) return "text-green-500";
    if (daysSinceActive <= 3) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (behindMembers.length === 0) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Heart className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">
                {t('group.allMembersOnTrack')}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {t('group.onTrackCountDesc', { count: stats.onTrackCount })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            {t('group.behindMembersTitle')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBehindMembers}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <span>{t('group.currentDay', { day: currentDay })}</span>
          <span>•</span>
          <span className="text-orange-500">{t('group.behindCount', { count: stats.behindCount })}</span>
          <span>•</span>
          <span className="text-green-500">{t('group.onTrackCount', { count: stats.onTrackCount })}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {behindMembers.map((member) => {
            const isExpanded = expandedMember === member.user.id;
            const userName = member.user.name || member.user.email?.split('@')[0] || t('group.anonymousUser');

            return (
              <div
                key={member.user.id}
                className="border rounded-lg overflow-hidden"
              >
                {/* Header row */}
                <div
                  className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors"
                  onClick={() => setExpandedMember(isExpanded ? null : member.user.id)}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {member.user.image ? (
                      <img
                        src={member.user.image}
                        alt={userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <User className="w-5 h-5 text-orange-500" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{userName}</span>
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                        {t('group.daysBehind', { count: member.behindDays.length })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{t('group.completedDaysCount', { count: member.completedDays })}</span>
                      <span className={getActivityColor(member.daysSinceActive)}>
                        {t('group.lastActive', { date: formatLastActive(member.lastActiveDate, member.daysSinceActive) })}
                      </span>
                    </div>
                  </div>

                  {/* Expand icon */}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="p-3 border-t bg-card space-y-3">
                    {/* Behind days detail */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{t('group.behindDaysLabel')}</p>
                      <div className="flex flex-wrap gap-1">
                        {member.behindDays.slice(0, 10).map(day => (
                          <span
                            key={day}
                            className="text-xs px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                          >
                            {t('group.dayNumber', { number: day })}
                          </span>
                        ))}
                        {member.behindDays.length > 10 && (
                          <span className="text-xs px-2 py-1 text-muted-foreground">
                            +{member.behindDays.length - 10} {t('group.more')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendReminder(member.user.id, 'reminder')}
                        disabled={sendingReminder === member.user.id}
                        className="gap-1 active:scale-95"
                      >
                        {sendingReminder === member.user.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Bell className="w-3 h-3" />
                        )}
                        {t('group.sendReminder')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendReminder(member.user.id, 'encouragement')}
                        disabled={sendingReminder === member.user.id}
                        className="gap-1 active:scale-95"
                      >
                        <Heart className="w-3 h-3" />
                        {t('group.sendEncouragement')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedMember(member);
                          setRemindDialogOpen(true);
                        }}
                        className="gap-1 active:scale-95"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {t('group.customMessage')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick actions for all */}
        {behindMembers.length > 1 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">{t('group.batchActions')}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPendingBatchAction(() => async () => {
                    for (const member of behindMembers) {
                      await sendReminder(member.user.id, 'reminder');
                    }
                  });
                  setShowBatchConfirm(true);
                }}
                className="gap-1 active:scale-95"
              >
                <Send className="w-3 h-3" />
                {t('group.remindAll')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Custom message dialog */}
      <Dialog open={remindDialogOpen} onOpenChange={setRemindDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('group.sendCustomMessage')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('group.recipient')}</Label>
              <p className="text-sm text-muted-foreground">
                {selectedMember?.user.name || selectedMember?.user.email}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t('group.messageContent')}</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={t('group.messagePlaceholder')}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRemindDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCustomSend}
                disabled={!customMessage.trim()}
                className="active:scale-95"
              >
                {t('common.send')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={showBatchConfirm}
        onOpenChange={setShowBatchConfirm}
        title={t('group.remindAll')}
        description={t('group.confirmBatchRemind', { count: behindMembers.length })}
        onConfirm={() => {
          pendingBatchAction?.();
          setShowBatchConfirm(false);
        }}
      />
    </Card>
  );
}