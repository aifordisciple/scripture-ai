"use client";

import { Users, BookOpen, Crown, Lock, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GroupCardProps {
  church: {
    id: string;
    name: string;
    description?: string | null;
    isPublic: boolean;
    ownerId: string;
    _count?: {
      members?: number;
      groupPlans?: number;
    };
  };
  isMember?: boolean;
  memberRole?: string;
  onClick?: () => void;
}

export function GroupCard({ church, isMember, memberRole, onClick }: GroupCardProps) {
  const memberCount = church._count?.members || 0;
  const planCount = church._count?.groupPlans || 0;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isMember && "border-primary/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{church.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {church.isPublic ? (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Globe className="w-3 h-3" /> 公开
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Lock className="w-3 h-3" /> 私密
                  </Badge>
                )}
                {memberRole === 'OWNER' && (
                  <Badge className="text-xs gap-1 bg-yellow-500">
                    <Crown className="w-3 h-3" /> 创建者
                  </Badge>
                )}
                {memberRole === 'ADMIN' && (
                  <Badge className="text-xs bg-primary">管理员</Badge>
                )}
              </div>
            </div>
          </div>
          {isMember && (
            <Badge variant="secondary" className="text-xs">已加入</Badge>
          )}
        </div>

        {church.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {church.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {memberCount} 成员
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> {planCount} 计划
          </span>
        </div>
      </CardContent>
    </Card>
  );
}