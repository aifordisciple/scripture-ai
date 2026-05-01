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
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';

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
  const { t } = useTranslation();
  const { addToast } = useToast();
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
        addToast({ type: 'error', message: data.error || t('group.saveFailed') });
      }
    } catch (error) {
      console.error("Failed to save plan:", error);
      addToast({ type: 'error', message: t('group.saveFailedRetry') });
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
        addToast({ type: 'error', message: data.error || t('common.delete') });
      }
    } catch (error) {
      console.error("Failed to delete plan:", error);
      addToast({ type: 'error', message: t('group.deleteFailedRetry') });
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
            {t('group.editPlan')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('group.deletePlan')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('group.editReadingPlan')}</DialogTitle>
            <DialogDescription>
              {t('group.editPlanDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('group.planName')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('group.planNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('group.planDescOptional')}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('group.planDescPlaceholder')}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('group.startDate')}</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('group.mode')}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={mode === "NORMAL" ? "default" : "outline"}
                    onClick={() => setMode("NORMAL")}
                    className="flex-1"
                    size="sm"
                  >
                    <Target className="w-4 h-4 mr-1" /> {t('group.normalMode')}
                  </Button>
                  <Button
                    variant={mode === "CHALLENGE" ? "default" : "outline"}
                    onClick={() => setMode("CHALLENGE")}
                    className="flex-1"
                    size="sm"
                  >
                    <Trophy className="w-4 h-4 mr-1" /> {t('group.challengeModeShort')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {t('common.save')}
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
              {t('group.confirmDeletePlan')}
            </DialogTitle>
            <DialogDescription className="pt-4">
              {t('group.deletePlanWarning')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t('common.cancel')}
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
              {t('group.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
