"use client";

import { useState, useEffect } from "react";
import { Copy, Trash2, Plus, Link, Clock, Users, Check, Loader2, QrCode, Download } from "lucide-react";
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
import QRCode from "qrcode";

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
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [selectedCodeForQr, setSelectedCodeForQr] = useState<string | null>(null);

  useEffect(() => {
    fetchCodes();
  }, [churchId]);

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

  const generateQRCode = async (code: string) => {
    const link = `${window.location.origin}/join?code=${code}`;
    try {
      const dataUrl = await QRCode.toDataURL(link, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });
      setQrCodeData(dataUrl);
      setSelectedCodeForQr(code);
      setQrCodeOpen(true);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeData) return;
    const link = document.createElement('a');
    link.download = `invite-${selectedCodeForQr}.png`;
    link.href = qrCodeData;
    link.click();
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
          <Loader2 className="w-6 h-6 mx-auto animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
                      {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
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
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => generateQRCode(code.code)}
                        title="二维码"
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCode(code.code)}
                        title="复制链接"
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
                          title="删除"
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

      {/* QR Code Dialog */}
      <Dialog open={qrCodeOpen} onOpenChange={setQrCodeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              邀请二维码
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrCodeData && (
              <>
                <img
                  src={qrCodeData}
                  alt="Invite QR Code"
                  className="w-64 h-64 rounded-lg border"
                />
                <p className="text-sm text-muted-foreground mt-3 mb-4">
                  邀请码: <span className="font-mono font-bold">{selectedCodeForQr}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => selectedCodeForQr && copyCode(selectedCodeForQr)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    复制链接
                  </Button>
                  <Button onClick={downloadQRCode}>
                    <Download className="w-4 h-4 mr-2" />
                    下载二维码
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}