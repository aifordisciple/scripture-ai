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
        alert(data.error || "创建失败");
      }
    } catch (error) {
      console.error("Failed to create announcement:", error);
      alert("创建失败，请稍后重试");
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
        alert(data.error || "更新失败");
      }
    } catch (error) {
      console.error("Failed to update announcement:", error);
      alert("更新失败，请稍后重试");
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
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete announcement:", error);
      alert("删除失败，请稍后重试");
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
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
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
            小组公告
          </div>
          {isAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1" onClick={resetForm}>
                  <Plus className="w-4 h-4" /> 发布公告
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>发布公告</DialogTitle>
                  <DialogDescription>
                    向小组成员发布重要通知或信息
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>标题</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="公告标题"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>内容</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="公告内容..."
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="pinned"
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="pinned" className="text-sm font-normal">
                      置顶此公告
                    </Label>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    取消
                  </Button>
                  <Button
                    onClick={createAnnouncement}
                    disabled={saving || !title.trim() || !content.trim()}
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    发布
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
            <p className="text-sm">暂无公告</p>
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
                      ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                      : "bg-muted/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {announcement.pinned && (
                          <Pin className="w-4 h-4 text-amber-500" />
                        )}
                        <h3 className="font-bold truncate">{announcement.title}</h3>
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
                            className="text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {isExpanded ? (
                              <>收起 <ChevronUp className="w-3 h-3 inline" /></>
                            ) : (
                              <>展开 <ChevronDown className="w-3 h-3 inline" /></>
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
                          title={announcement.pinned ? "取消置顶" : "置顶"}
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
              <DialogTitle>编辑公告</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>标题</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="公告标题"
                />
              </div>
              <div className="space-y-2">
                <Label>内容</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="公告内容..."
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-pinned"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-pinned" className="text-sm font-normal">
                  置顶此公告
                </Label>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setEditId(null)}>
                取消
              </Button>
              <Button
                onClick={updateAnnouncement}
                disabled={saving || !title.trim() || !content.trim()}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>删除公告</DialogTitle>
              <DialogDescription className="pt-4">
                确定要删除此公告吗？此操作不可撤销。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                取消
              </Button>
              <Button variant="destructive" onClick={deleteAnnouncement} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}