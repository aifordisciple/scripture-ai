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
import { useTranslation } from "@/lib/i18n";
import { formatDateClient } from "@/lib/locale";
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [disbandOpen, setDisbandOpen] = useState(false);
  const [disbanding, setDisbanding] = useState(false);
  const [showKickConfirm, setShowKickConfirm] = useState(false);
  const [pendingKickAction, setPendingKickAction] = useState<(() => void) | null>(null);

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
    setPendingKickAction(() => async () => {
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
          addToast({ type: 'error', message: data.error || t('group.operationFailed') });
        }
      } catch (error) {
        console.error("Failed to kick member:", error);
        addToast({ type: 'error', message: t('group.operationFailedRetry') });
      } finally {
        setProcessing(null);
      }
    });
    setShowKickConfirm(true);
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
        addToast({ type: 'error', message: data.error || t('group.operationFailed') });
      }
    } catch (error) {
      console.error("Failed to set role:", error);
      addToast({ type: 'error', message: t('group.operationFailedRetry') });
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
        addToast({ type: 'error', message: data.error || t('group.disbandFailed') });
      }
    } catch (error) {
      console.error("Failed to disband group:", error);
      addToast({ type: 'error', message: t('group.disbandFailedRetry') });
    } finally {
      setDisbanding(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return formatDateClient(new Date(dateStr));
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
            <Crown className="w-3 h-3" /> {t('group.roleOwner')}
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
            <Shield className="w-3 h-3" /> {t('group.roleAdmin')}
          </span>
        );
      default:
        return (
          <span className="text-xs text-muted-foreground">{t('group.roleMember')}</span>
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
    <>
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t('group.memberManage')}
          <span className="text-sm font-normal text-muted-foreground">
            ({t('group.memberCount', { count: members.length })})
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
                  <div className="font-medium">{member.user.name || t('group.anonymousUser')}</div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member.role)}
                    <span className="text-xs text-muted-foreground">
                      {t('group.joinedAt', { date: formatDate(member.joinedAt) })}
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
                        {t('group.setAsAdmin')}
                      </DropdownMenuItem>
                    )}
                    {isOwner && member.role === "ADMIN" && (
                      <DropdownMenuItem
                        onClick={() => setRole(member.userId, "MEMBER")}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        {t('group.removeAdmin')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => kickMember(member.userId)}
                      className="text-red-600"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      {t('group.removeMember')}
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
                  {t('group.disbandGroup')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    {t('group.confirmDisbandGroup')}
                  </DialogTitle>
                  <DialogDescription className="pt-4">
                    {t('group.disbandGroupDesc')}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setDisbandOpen(false)}
                  >
                    {t('common.cancel')}
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
                    {t('group.confirmDisband')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
      <ConfirmDialog
        open={showKickConfirm}
        onOpenChange={setShowKickConfirm}
        title={t('group.removeMember')}
        description={t('group.confirmKickMember')}
        onConfirm={() => {
          pendingKickAction?.();
          setShowKickConfirm(false);
        }}
      />
    </>
  );
}