"use client";

import { useState } from "react";
import { Copy, Trash2, Plus, Link, Clock, Users, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface InviteCodeManagerProps {
  churchId: string;
  isAdmin: boolean;
}

export function InviteCodeManager({ churchId, isAdmin }: InviteCodeManagerProps) {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newMaxUses, setNewMaxUses] = useState(0);
  const [newExpires, setNewExpires] = useState("");

  const fetchCodes = async () => {
    try {
      const res = await fetch(`/api/church/${churchId}/invite`);
      const data = await res.json();
      if (data.codes) {
        setCodes(data.codes);
      }
    } catch (error) {
      console.error("Failed to fetch invite codes:", error);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchCodes();
  });

  const createCode = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/church/${churchId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxUses: newMaxUses,
          expiresAt: newExpires || null
        })
      });
      const data = await res.json();
      if (data.inviteCode) {
        setCodes(prev => [data.inviteCode, ...prev]);
        setCreateOpen(false);
        setNewMaxUses(0);
        setNewExpires("");
      }
    } catch (error) {
      console.error("Failed to create invite code:", error);
    } finally {
      setCreating(false);
    }
  };

  const deleteCode = async (codeId: string) => {
    if (!confirm("确定要删除此邀请码吗？")) return;
    try {
      await fetch(`/api/church/${churchId}/invite`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeId })
      });
      setCodes(prev => prev.filter(c => c.id !== codeId));
    } catch (error) {
      console.error("Failed to delete invite code:", error);
    }
  };

  const copyCode = (code: string) => {
    const link = `${window.location.origin}/join?code=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          加载中...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            邀请码
          </span>
          {isAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" /> 创建
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建邀请码</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>使用次数限制 (0 = 无限制)</Label>
                    <Input
                      type="number"
                      value={newMaxUses}
                      onChange={(e) => setNewMaxUses(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>过期时间 (可选)</Label>
                    <Input
                      type="datetime-local"
                      value={newExpires}
                      onChange={(e) => setNewExpires(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={createCode}
                    disabled={creating}
                    className="w-full"
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    创建邀请码
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {codes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            暂无邀请码
          </p>
        ) : (
          <div className="space-y-2">
            {codes.map((code) => {
              const expired = isExpired(code.expiresAt);
              const exhausted = code.maxUses > 0 && code.usedCount >= code.maxUses;

              return (
                <div
                  key={code.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    (expired || exhausted) && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <code className="font-mono text-lg font-bold bg-muted px-3 py-1 rounded">
                      {code.code}
                    </code>
                    <div className="flex items-center gap-2">
                      {code.maxUses > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {code.usedCount}/{code.maxUses}
                        </Badge>
                      )}
                      {code.expiresAt && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {expired ? "已过期" : formatDate(code.expiresAt)}
                        </Badge>
                      )}
                      {expired && <Badge variant="destructive" className="text-xs">已过期</Badge>}
                      {exhausted && <Badge variant="destructive" className="text-xs">已用完</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyCode(code.code)}
                    >
                      {copied === code.code ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCode(code.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}