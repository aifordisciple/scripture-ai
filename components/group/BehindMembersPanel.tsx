"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, User, Send, RefreshCw, Loader2,
  Bell, Heart, MessageSquare, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
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
        alert("提醒已发送！");
      } else {
        alert(data.error || "发送失败");
      }
    } catch (error) {
      console.error("Failed to send reminder:", error);
      alert("发送失败，请重试");
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
    if (!lastActiveDate) return "从未活跃";
    if (daysSinceActive === 0) return "今天";
    if (daysSinceActive === 1) return "昨天";
    return `${daysSinceActive} 天前`;
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
                太棒了！所有成员都跟上了进度
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {stats.onTrackCount} 位成员正在按时阅读
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
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            进度落后成员
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
          <span>当前第 {currentDay} 天</span>
          <span>•</span>
          <span className="text-orange-500">{stats.behindCount} 人落后</span>
          <span>•</span>
          <span className="text-green-500">{stats.onTrackCount} 人正常</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {behindMembers.map((member) => {
            const isExpanded = expandedMember === member.user.id;
            const userName = member.user.name || member.user.email?.split('@')[0] || "匿名用户";

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
                        落后 {member.behindDays.length} 天
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>已完成 {member.completedDays} 天</span>
                      <span className={getActivityColor(member.daysSinceActive)}>
                        最后活跃: {formatLastActive(member.lastActiveDate, member.daysSinceActive)}
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
                      <p className="text-xs font-medium text-muted-foreground mb-2">落后的天数：</p>
                      <div className="flex flex-wrap gap-1">
                        {member.behindDays.slice(0, 10).map(day => (
                          <span
                            key={day}
                            className="text-xs px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                          >
                            第 {day} 天
                          </span>
                        ))}
                        {member.behindDays.length > 10 && (
                          <span className="text-xs px-2 py-1 text-muted-foreground">
                            +{member.behindDays.length - 10} 更多
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
                        className="gap-1"
                      >
                        {sendingReminder === member.user.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Bell className="w-3 h-3" />
                        )}
                        发送提醒
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendReminder(member.user.id, 'encouragement')}
                        disabled={sendingReminder === member.user.id}
                        className="gap-1"
                      >
                        <Heart className="w-3 h-3" />
                        发送鼓励
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedMember(member);
                          setRemindDialogOpen(true);
                        }}
                        className="gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        自定义消息
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
            <p className="text-xs text-muted-foreground mb-2">批量操作：</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (confirm(`确定要向 ${behindMembers.length} 位落后成员发送提醒吗？`)) {
                    for (const member of behindMembers) {
                      await sendReminder(member.user.id, 'reminder');
                    }
                  }
                }}
                className="gap-1"
              >
                <Send className="w-3 h-3" />
                全部提醒
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Custom message dialog */}
      <Dialog open={remindDialogOpen} onOpenChange={setRemindDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发送自定义消息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>收件人</Label>
              <p className="text-sm text-muted-foreground">
                {selectedMember?.user.name || selectedMember?.user.email}
              </p>
            </div>
            <div className="space-y-2">
              <Label>消息内容</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="输入你的消息..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRemindDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleCustomSend}
                disabled={!customMessage.trim()}
              >
                发送
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}