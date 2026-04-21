"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useBibleStore } from "@/store/useBibleStore";
import {
  Users, Plus, ChevronLeft, Settings, Crown, Calendar,
  BookOpen, Trophy, MessageCircle, Ticket, Loader2, UserCog, BarChart3, Activity, LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { GroupCard } from "@/components/group/GroupCard";
import { Leaderboard } from "@/components/group/Leaderboard";
import { GroupChat } from "@/components/group/GroupChat";
import { InviteCodeManager } from "@/components/group/InviteCodeManager";
import { JoinByInviteDialog } from "@/components/group/JoinByInviteDialog";
import { GroupPlanDetail } from "@/components/group/GroupPlanDetail";
import { GroupPlanCreateDialog } from "@/components/group/GroupPlanCreateDialog";
import { MemberManager } from "@/components/group/MemberManager";
import { AnnouncementManager } from "@/components/group/AnnouncementManager";
import { GroupStats } from "@/components/group/GroupStats";
import { GroupBadgeGallery } from "@/components/group/GroupBadgeGallery";
import { GroupSettings } from "@/components/group/GroupSettings";
import { MemberProfile } from "@/components/group/MemberProfile";
import { SharedNotes } from "@/components/group/SharedNotes";
import { GroupActivityFeed } from "@/components/group/GroupActivityFeed";

interface Church {
  id: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  ownerId: string;
  _count?: {
    members?: number;
    groupPlans?: number;
  };
}

interface Membership {
  churchId: string;
  role: string;
  church: Church;
}

interface GroupPlan {
  id: string;
  name: string;
  description?: string | null;
  mode: string;
  challengeConfig?: string | null;
  dailyChapters: string[];
  tasks?: string | null;
  sharedDevotionals?: string | null;
  source?: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  _count?: {
    progress?: number;
    leaderboard?: number;
  };
}

export function GroupTab() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // 从全局 store 获取选择状态（用于跨标签页保持）
  const { selectedGroupForPlan, selectedPlanId, setSelectedGroupForPlan, setSelectedPlanId } = useBibleStore();

  const [myGroups, setMyGroups] = useState<Membership[]>([]);
  const [publicGroups, setPublicGroups] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupPlans, setGroupPlans] = useState<GroupPlan[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  // 从全局 store 恢复选中的小组和计划
  const selectedGroup = selectedGroupForPlan ? {
    churchId: selectedGroupForPlan.churchId,
    role: selectedGroupForPlan.role,
    church: selectedGroupForPlan.church
  } as Membership : null;

  // 根据 selectedPlanId 从 groupPlans 中找到对应的计划
  const selectedPlan = selectedPlanId ? groupPlans.find(p => p.id === selectedPlanId) || null : null;

  // 只在用户已登录时加载数据
  useEffect(() => {
    if (status === 'authenticated') {
      fetchGroups();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupPlans(selectedGroup.churchId);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      // Fetch my groups
      const myRes = await fetch("/api/church?type=my");
      if (myRes.status === 401) {
        // 未授权，清空数据
        setMyGroups([]);
        return;
      }
      const myData = await myRes.json();
      if (myData.churches) {
        // Transform to Membership format
        const memberships: Membership[] = myData.churches.map((c: any) => ({
          churchId: c.id,
          role: c.members?.[0]?.role || 'MEMBER',
          church: c
        }));
        setMyGroups(memberships);
      }

      // Fetch public groups
      const publicRes = await fetch("/api/church?type=public");
      const publicData = await publicRes.json();
      if (publicData.churches) {
        setPublicGroups(publicData.churches);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupPlans = async (churchId: string) => {
    try {
      const res = await fetch(`/api/church/${churchId}/plan`);
      const data = await res.json();
      if (data.plans) {
        setGroupPlans(data.plans);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/church", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc,
          isPublic: false
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else if (data.church) {
        setMyGroups(prev => [{
          churchId: data.church.id,
          role: "OWNER",
          church: data.church
        }, ...prev]);
        setCreateOpen(false);
        setNewGroupName("");
        setNewGroupDesc("");
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("创建小组失败，请稍后重试");
    } finally {
      setCreating(false);
    }
  };

  const joinGroup = async (churchId: string) => {
    try {
      const res = await fetch(`/api/church/${churchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" })
      });
      const data = await res.json();
      if (data.success) {
        fetchGroups();
      } else {
        alert(data.error || "加入失败");
      }
    } catch (error) {
      console.error("Failed to join group:", error);
    }
  };

  const leaveGroup = async (churchId: string) => {
    if (!confirm("确定要离开这个小组吗？")) return;
    try {
      const res = await fetch(`/api/church/${churchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedGroupForPlan(null);
        fetchGroups();
      }
    } catch (error) {
      console.error("Failed to leave group:", error);
    }
  };

  const handlePlanCreated = (plan: GroupPlan) => {
    setGroupPlans(prev => [plan, ...prev]);
  };

  // 显示加载状态
  if (status === 'loading' || loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-8 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  // 未登录状态提示
  if (status === 'unauthenticated') {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-8">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b dark:border-slate-800">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">家庭/小组读经</h1>
            <p className="text-sm text-muted-foreground mt-1">
              与家人、朋友一起读经，互相鼓励，共同成长。
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20">
          <LogIn className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">请先登录</h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            登录后即可创建或加入小组，与弟兄姊妹一起读经、分享和成长。
          </p>
          <Button
            onClick={() => {
              useBibleStore.getState().setAuthOpen(true);
            }}
            className="gap-2"
          >
            <LogIn className="w-4 h-4" />
            立即登录
          </Button>
        </div>
      </div>
    );
  }

  // Render plan detail if selected
  if (selectedPlan && selectedGroup) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-8">
        <GroupPlanDetail
          churchId={selectedGroup.churchId}
          plan={selectedPlan}
          onBack={() => setSelectedPlanId(null)}
          isAdmin={selectedGroup.role === "OWNER" || selectedGroup.role === "ADMIN"}
        />
      </div>
    );
  }

  // Group detail view
  if (selectedGroup) {
    const isAdmin = selectedGroup.role === "OWNER" || selectedGroup.role === "ADMIN";

    return (
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-8">
        <button
          onClick={() => {
            setSelectedGroupForPlan(null);
            setSelectedPlanId(null);
            setGroupPlans([]);
          }}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> 返回小组列表
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm uppercase tracking-widest">
                {isAdmin ? "管理小组" : "我的小组"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-serif">
              {selectedGroup.church.name}
            </h1>
            {selectedGroup.church.description && (
              <p className="text-muted-foreground mt-2">
                {selectedGroup.church.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {selectedGroup.role !== "OWNER" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => leaveGroup(selectedGroup.churchId)}
                className="text-red-500 hover:text-red-600"
              >
                退出小组
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="plans" className="gap-2">
              <Calendar className="w-4 h-4" /> 读经计划
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" /> 动态
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="w-4 h-4" /> 排行榜
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageCircle className="w-4 h-4" /> 交流
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" /> 统计
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="manage" className="gap-2">
                <UserCog className="w-4 h-4" /> 管理
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            {isAdmin && (
              <GroupPlanCreateDialog
                churchId={selectedGroup.churchId}
                onSuccess={handlePlanCreated}
              />
            )}
            {groupPlans.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无读经计划</p>
                {isAdmin && <p className="text-sm mt-2">点击上方按钮创建第一个计划</p>}
              </div>
            ) : (
              <div className="grid gap-4">
                {groupPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className={cn(
                      "p-4 rounded-xl border",
                      plan.mode === "CHALLENGE"
                        ? "border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
                        : "border-border bg-card"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {plan.mode === "CHALLENGE" ? (
                            <Trophy className="w-5 h-5 text-orange-500" />
                          ) : (
                            <Calendar className="w-5 h-5 text-indigo-500" />
                          )}
                          <span className="font-bold">{plan.name}</span>
                        </div>
                        {plan.source === "AI_GENERATED" && (
                          <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                            AI 生成
                          </span>
                        )}
                      </div>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{plan.tasks ? JSON.parse(plan.tasks).length : plan.dailyChapters.length} 天</span>
                        <span>•</span>
                        <span>{plan._count?.progress || 0} 人参与</span>
                        {plan.mode === "CHALLENGE" && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600 dark:text-orange-400 font-medium">挑战模式</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <GroupActivityFeed churchId={selectedGroup.churchId} />
          </TabsContent>

          <TabsContent value="leaderboard">
            {groupPlans.length > 0 ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">选择一个计划查看排行榜：</p>
                {groupPlans.map((plan) => (
                  <Button
                    key={plan.id}
                    variant="outline"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className="w-full justify-start"
                  >
                    {plan.name}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无排行数据</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat">
            <GroupChat churchId={selectedGroup.churchId} />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <GroupStats
              churchId={selectedGroup.churchId}
              plans={groupPlans}
            />
            <GroupBadgeGallery churchId={selectedGroup.churchId} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="manage" className="space-y-6">
              <GroupSettings
                churchId={selectedGroup.churchId}
                isOwner={selectedGroup.role === "OWNER"}
                currentSettings={{
                  themeColor: selectedGroup.church.themeColor,
                  logoUrl: selectedGroup.church.logoUrl,
                  fontFamily: selectedGroup.church.fontFamily
                }}
              />
              <AnnouncementManager churchId={selectedGroup.churchId} isAdmin={isAdmin} />
              <SharedNotes churchId={selectedGroup.churchId} />
              <MemberManager
                churchId={selectedGroup.churchId}
                isOwner={selectedGroup.role === "OWNER"}
                isAdmin={isAdmin}
                onGroupDisbanded={() => {
                  setSelectedGroupForPlan(null);
                  fetchGroups();
                }}
              />
              <InviteCodeManager
                churchId={selectedGroup.churchId}
                isAdmin={isAdmin}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  }

  // Main list view
  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-8">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b dark:border-slate-800">
        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Users className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">家庭/小组读经</h1>
          <p className="text-sm text-muted-foreground mt-1">
            与家人、朋友一起读经，互相鼓励，共同成长。
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> 创建小组
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建家庭/小组</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>小组名称</Label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="例如：家庭读经小组"
                />
              </div>
              <div className="space-y-2">
                <Label>简介（可选）</Label>
                <Input
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="小组介绍..."
                />
              </div>
              <Button
                onClick={createGroup}
                disabled={creating || !newGroupName.trim()}
                className="w-full"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                创建小组
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <JoinByInviteDialog onSuccess={fetchGroups} />
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">
          <Loader2 className="w-8 h-8 mx-auto animate-spin" />
        </div>
      ) : (
        <>
          {/* My Groups */}
          {myGroups.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-bold text-foreground mb-4">
                我的小组 ({myGroups.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myGroups.map((membership) => (
                  <GroupCard
                    key={membership.churchId}
                    church={{
                      ...membership.church,
                      _count: membership.church._count || { members: 0, groupPlans: 0 }
                    }}
                    isMember={true}
                    memberRole={membership.role}
                    onClick={() => setSelectedGroupForPlan({ churchId: membership.churchId, role: membership.role, church: membership.church })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Public Groups */}
          {publicGroups.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">
                发现公开小组
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publicGroups.map((church) => (
                  <GroupCard
                    key={church.id}
                    church={{
                      ...church,
                      _count: church._count || { members: 0, groupPlans: 0 }
                    }}
                    onClick={() => joinGroup(church.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {myGroups.length === 0 && publicGroups.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">还没有加入任何小组</p>
              <p className="text-sm">创建一个新小组，或通过邀请码加入已有的小组</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}