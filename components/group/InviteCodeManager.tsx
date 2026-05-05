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
import { useTranslation } from "@/lib/i18n";
import { formatDateClient } from "@/lib/locale";
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingCodeId, setPendingCodeId] = useState<string | null>(null);
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
    setPendingCodeId(codeId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCode = async () => {
    const codeId = pendingCodeId;
    if (!codeId) return;
    setShowDeleteConfirm(false);
    try {
      await fetch(`/api/church/${churchId}/invite`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeId })
      });
      setCodes(prev => prev.filter(c => c.id !== codeId));
      setPendingCodeId(null);
    } catch (error) {
      console.error("Failed to delete invite code:", error);
      addToast({ type: 'error', message: t('group.deleteFailedRetry') });
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
    return formatDateClient(new Date(dateStr));
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
              {t('group.inviteCodes')}
            </span>
            {isAdmin && (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" /> {t('group.create')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('group.createInviteCode')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>{t('group.maxUsesLabel')}</Label>
                      <Input
                        type="number"
                        value={newMaxUses}
                        onChange={(e) => setNewMaxUses(parseInt(e.target.value) || 0)}
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('group.expiresAtLabel')}</Label>
                      <Input
                        type="datetime-local"
                        value={newExpires}
                        onChange={(e) => setNewExpires(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={createCode}
                      disabled={creating}
                      className="w-full active:scale-95"
                    >
                      {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      {t('group.createInviteCode')}
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
              {t('group.noInviteCodes')}
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
                      <code className="font-mono text-lg font-semibold bg-muted px-3 py-1 rounded">
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
                            {expired ? t('group.expired') : formatDate(code.expiresAt)}
                          </Badge>
                        )}
                        {expired && <Badge variant="destructive" className="text-xs">{t('group.expired')}</Badge>}
                        {exhausted && <Badge variant="destructive" className="text-xs">{t('group.exhausted')}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => generateQRCode(code.code)}
                        title={t('group.qrCode')}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCode(code.code)}
                        title={t('group.copyLink')}
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
                          title={t('common.delete')}
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
              {t('group.inviteQrCode')}
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
                  {t('group.inviteCode')}: <span className="font-mono font-semibold">{selectedCodeForQr}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => selectedCodeForQr && copyCode(selectedCodeForQr)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {t('group.copyLink')}
                  </Button>
                  <Button onClick={downloadQRCode}>
                    <Download className="w-4 h-4 mr-2" />
                    {t('group.downloadQrCode')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('common.delete')}
        description={t('group.confirmDeleteCode')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="destructive"
        onConfirm={confirmDeleteCode}
      />
    </>
  );
}