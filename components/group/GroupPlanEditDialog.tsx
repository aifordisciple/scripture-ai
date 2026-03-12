"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, Loader2, MoreVertical, Target, Trophy, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupPlanEditDialogProps {
  churchId: string;
  plan: {
    id: string;
    name: string;
    description?: string | null;
    mode: string;
    challengeConfig?: string | null;
    startDate: Date | string;
    endDate?: Date | string | null;
  };
  onUpdate: (plan: any) => void;
  onDelete: () => void;
}

export function GroupPlanEditDialog({
  churchId,
  plan,
  onUpdate,
  onDelete
}: GroupPlanEditDialogProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description || "");
  const [mode, setMode] = useState(plan.mode);
  const [startDate, setStartDate] = useState(
    new Date(plan.startDate).toISOString().split("T")[0]
  );

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/church/${churchId}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          name: name.trim(),
          description: description.trim() || null,
          mode,
          startDate
        })
      });
      const data = await res.json();
      if (data.plan) {
        onUpdate(data.plan);
        setEditOpen(false);
      } else {
        alert(data.error || "保存失败");
      }
    } catch (error) {
      console.error("Failed to save plan:", error);
      alert("保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/church/${churchId}/plan?planId=${plan.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setDeleteOpen(false);
        onDelete();
      } else {
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete plan:", error);
      alert("删除失败，请稍后重试");
    } finally {
      setDeleting(false);
    }
  };

  const openEditDialog = () => {
    // Reset form to current values
    setName(plan.name);
    setDescription(plan.description || "");
    setMode(plan.mode);
    setStartDate(new Date(plan.startDate).toISOString().split("T")[0]);
    setEditOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openEditDialog}>
            <Pencil className="w-4 h-4 mr-2" />
            编辑计划
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除计划
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑读经计划</DialogTitle>
            <DialogDescription>
              修改计划的名称、描述和其他设置
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>计划名称</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：创世记读经计划"
              />
            </div>
            <div className="space-y-2">
              <Label>简介（可选）</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="计划介绍..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始日期</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>模式</Label>
                <div className="flex gap-2">
                  <Button
                    variant={mode === "NORMAL" ? "default" : "outline"}
                    onClick={() => setMode("NORMAL")}
                    className="flex-1"
                    size="sm"
                  >
                    <Target className="w-4 h-4 mr-1" /> 普通
                  </Button>
                  <Button
                    variant={mode === "CHALLENGE" ? "default" : "outline"}
                    onClick={() => setMode("CHALLENGE")}
                    className="flex-1"
                    size="sm"
                  >
                    <Trophy className="w-4 h-4 mr-1" /> 挑战
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              确定要删除此计划吗？
            </DialogTitle>
            <DialogDescription className="pt-4">
              删除后，所有成员的进度数据将被永久删除，此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}