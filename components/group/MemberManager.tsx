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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users, Crown, Shield, MoreVertical, UserMinus, Loader2, Trash2, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface MemberManagerProps {
  churchId: string;
  isOwner: boolean;
  isAdmin: boolean;
  onGroupDisbanded?: () => void;
}

export function MemberManager({ churchId, isOwner, isAdmin, onGroupDisbanded }: MemberManagerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [disbandOpen, setDisbandOpen] = useState(false);
  const [disbanding, setDisbanding] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [churchId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/church/${churchId}`);
      const data = await res.json();
      if (data.church?.members) {
        setMembers(data.church.members);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  const kickMember = async (userId: string) => {
    if (!confirm("确定要移除该成员吗？")) return;

    setProcessing(userId);
    try {
      const res = await fetch(`/api/church/${churchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "kick", targetUserId: userId })
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.filter(m => m.userId !== userId));
      } else {
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to kick member:", error);
      alert("操作失败，请稍后重试");
    } finally {
      setProcessing(null);
    }
  };

  const setRole = async (userId: string, role: string) => {
    setProcessing(userId);
    try {
      const res = await fetch(`/api/church/${churchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setRole", targetUserId: userId, role })
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.map(m =>
          m.userId === userId ? { ...m, role } : m
        ));
      } else {
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to set role:", error);
      alert("操作失败，请稍后重试");
    } finally {
      setProcessing(null);
    }
  };

  const disbandGroup = async () => {
    setDisbanding(true);
    try {
      const res = await fetch(`/api/church/${churchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disband" })
      });
      const data = await res.json();
      if (data.success) {
        setDisbandOpen(false);
        onGroupDisbanded?.();
      } else {
        alert(data.error || "解散失败");
      }
    } catch (error) {
      console.error("Failed to disband group:", error);
      alert("解散失败，请稍后重试");
    } finally {
      setDisbanding(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
            <Crown className="w-3 h-3" /> 创建者
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
            <Shield className="w-3 h-3" /> 管理员
          </span>
        );
      default:
        return (
          <span className="text-xs text-muted-foreground">成员</span>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 mx-auto animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          成员管理
          <span className="text-sm font-normal text-muted-foreground">
            ({members.length} 人)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {members.map((member) => {
          const isProcessing = processing === member.userId;

          return (
            <div
              key={member.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                member.role === "OWNER"
                  ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                  : "bg-muted/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  {member.user.image ? (
                    <img
                      src={member.user.image}
                      alt={member.user.name || "User"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{member.user.name || "匿名用户"}</div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member.role)}
                    <span className="text-xs text-muted-foreground">
                      加入于 {formatDate(member.joinedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions - only for non-owners */}
              {member.role !== "OWNER" && isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MoreVertical className="w-4 h-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwner && member.role === "MEMBER" && (
                      <DropdownMenuItem
                        onClick={() => setRole(member.userId, "ADMIN")}
                        className="text-indigo-600"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        设为管理员
                      </DropdownMenuItem>
                    )}
                    {isOwner && member.role === "ADMIN" && (
                      <DropdownMenuItem
                        onClick={() => setRole(member.userId, "MEMBER")}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        取消管理员
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => kickMember(member.userId)}
                      className="text-red-600"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      移除成员
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}

        {/* Disband Group - Owner Only */}
        {isOwner && (
          <div className="pt-4 border-t mt-4">
            <Dialog open={disbandOpen} onOpenChange={setDisbandOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  解散小组
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    确定要解散小组吗？
                  </DialogTitle>
                  <DialogDescription className="pt-4">
                    此操作不可撤销。解散后，所有成员将被移除，所有读经计划和进度数据将被删除。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setDisbandOpen(false)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={disbandGroup}
                    disabled={disbanding}
                  >
                    {disbanding ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    确认解散
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}