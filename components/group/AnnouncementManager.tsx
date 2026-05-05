"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Megaphone, Plus, Pencil, Trash2, Loader2, Pin, PinOff, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { formatDateClient } from "@/lib/locale";
import { useToast } from '@/components/ui/toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementManagerProps {
  churchId: string;
  isAdmin: boolean;
}

export function AnnouncementManager({ churchId, isAdmin }: AnnouncementManagerProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, [churchId]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/church/${churchId}/announcement`);
      const data = await res.json();
      if (data.announcements) {
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async () => {
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/church/${churchId}/announcement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), pinned })
      });
      const data = await res.json();
      if (data.announcement) {
        setAnnouncements(prev => [data.announcement, ...prev]);
        setCreateOpen(false);
        resetForm();
      } else {
        addToast({ type: 'error', message: data.error || t('group.createFailedShort') });
      }
    } catch (error) {
      console.error("Failed to create announcement:", error);
      addToast({ type: 'error', message: t('group.createFailedRetry') });
    } finally {
      setSaving(false);
    }
  };

  const updateAnnouncement = async () => {
    if (!editId || !title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/church/${churchId}/announcement`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId: editId, title: title.trim(), content: content.trim(), pinned })
      });
      const data = await res.json();
      if (data.announcement) {
        setAnnouncements(prev => prev.map(a => a.id === editId ? data.announcement : a));
        setEditId(null);
        resetForm();
      } else {
        addToast({ type: 'error', message: data.error || t('group.updateFailedShort') });
      }
    } catch (error) {
      console.error("Failed to update announcement:", error);
      addToast({ type: 'error', message: t('group.updateFailedRetry') });
    } finally {
      setSaving(false);
    }
  };

  const deleteAnnouncement = async () => {
    if (!deleteId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/church/${churchId}/announcement?announcementId=${deleteId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== deleteId));
        setDeleteId(null);
      } else {
        addToast({ type: 'error', message: data.error || t('common.delete') });
      }
    } catch (error) {
      console.error("Failed to delete announcement:", error);
      addToast({ type: 'error', message: t('group.deleteFailedRetry') });
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (announcement: Announcement) => {
    try {
      const res = await fetch(`/api/church/${churchId}/announcement`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcementId: announcement.id,
          pinned: !announcement.pinned
        })
      });
      const data = await res.json();
      if (data.announcement) {
        setAnnouncements(prev => {
          const updated = prev.map(a => a.id === announcement.id ? data.announcement : a);
          // Re-sort: pinned first, then by date
          return updated.sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        });
      }
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.content);
    setPinned(announcement.pinned);
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPinned(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    return formatDateClient(new Date(dateStr), {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
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
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            {t('group.groupAnnouncements')}
          </div>
          {isAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 active:scale-95" onClick={resetForm}>
                  <Plus className="w-4 h-4" /> {t('group.publishAnnouncement')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('group.publishAnnouncement')}</DialogTitle>
                  <DialogDescription>
                    {t('group.publishAnnouncementDesc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>{t('group.title')}</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('group.announcementTitlePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('group.content')}</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={t('group.announcementContentPlaceholder')}
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="pinned"
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                      className="rounded border-[#e0e0e0] dark:border-[#3a3a3c]"
                    />
                    <Label htmlFor="pinned" className="text-sm font-normal">
                      {t('group.pinThisAnnouncement')}
                    </Label>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={createAnnouncement}
                    disabled={saving || !title.trim() || !content.trim()}
                    className="active:scale-95"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {t('group.publish')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {announcements.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('group.noAnnouncements')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => {
              const isExpanded = expandedIds.has(announcement.id);

              return (
                <div
                  key={announcement.id}
                  className={cn(
                    "p-4 rounded-lg border",
                    announcement.pinned
                      ? "bg-[#0066cc]/5 dark:bg-[#2997ff]/10 border-[#e0e0e0] dark:border-[#3a3a3c]"
                      : "bg-muted/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {announcement.pinned && (
                          <Pin className="w-4 h-4 text-[#0066cc]" />
                        )}
                        <h3 className="font-semibold truncate">{announcement.title}</h3>
                      </div>
                      <p className={cn(
                        "text-sm text-muted-foreground",
                        !isExpanded && "line-clamp-2"
                      )}>
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatDate(announcement.createdAt)}</span>
                        {announcement.content.length > 100 && (
                          <button
                            onClick={() => toggleExpand(announcement.id)}
                            className="text-[#0066cc] dark:text-[#2997ff] hover:underline"
                          >
                            {isExpanded ? (
                              <>{t('group.collapse')} <ChevronUp className="w-3 h-3 inline" /></>
                            ) : (
                              <>{t('group.expand')} <ChevronDown className="w-3 h-3 inline" /></>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePin(announcement)}
                          title={announcement.pinned ? t('group.unpin') : t('group.pin')}
                        >
                          {announcement.pinned ? (
                            <PinOff className="w-4 h-4" />
                          ) : (
                            <Pin className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(announcement)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(announcement.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('group.editAnnouncement')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t('group.title')}</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('group.announcementTitlePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('group.content')}</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('group.announcementContentPlaceholder')}
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-pinned"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="rounded border-[#e0e0e0] dark:border-[#3a3a3c]"
                />
                <Label htmlFor="edit-pinned" className="text-sm font-normal">
                  {t('group.pinThisAnnouncement')}
                </Label>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setEditId(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={updateAnnouncement}
                disabled={saving || !title.trim() || !content.trim()}
                className="active:scale-95"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('group.deleteAnnouncement')}</DialogTitle>
              <DialogDescription className="pt-4">
                {t('group.deleteAnnouncementWarning')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={deleteAnnouncement} disabled={saving} className="active:scale-95">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t('common.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}