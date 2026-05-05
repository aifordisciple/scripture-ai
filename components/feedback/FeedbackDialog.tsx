"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bug,
  Lightbulb,
  HelpCircle,
  MessageSquare,
  Loader2,
  Camera,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEEDBACK_TYPE_VALUES = [
  { value: "BUG_REPORT", labelKey: "feedback.typeBugReport", icon: Bug, descKey: "feedback.typeBugReportDesc" },
  { value: "FEATURE_REQUEST", labelKey: "feedback.typeFeatureRequest", icon: Lightbulb, descKey: "feedback.typeFeatureRequestDesc" },
  { value: "QUESTION", labelKey: "feedback.typeQuestion", icon: HelpCircle, descKey: "feedback.typeQuestionDesc" },
  { value: "OTHER", labelKey: "feedback.typeOther", icon: MessageSquare, descKey: "feedback.typeOtherDesc" },
] as const;

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<string>("BUG_REPORT");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, content, screenshot }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onOpenChange(false);
          resetForm();
        }, 2000);
      }
    } catch (error) {
      console.error("Submit feedback error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setScreenshot(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const resetForm = () => {
    setType("BUG_REPORT");
    setTitle("");
    setContent("");
    setScreenshot(null);
    setSubmitted(false);
  };

  const selectedType = FEEDBACK_TYPE_VALUES.find((ft) => ft.value === type);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {t('feedback.dialogTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('feedback.dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-1 tracking-[-0.022em]">{t('feedback.submitSuccess')}</h3>
            <p className="text-sm text-muted-foreground">{t('feedback.submitSuccessMessage')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Feedback Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t('feedback.feedbackType')}</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_TYPE_VALUES.map((ft) => (
                    <SelectItem key={ft.value} value={ft.value}>
                      <div className="flex items-center gap-2">
                        <ft.icon className="w-4 h-4" />
                        {t(ft.labelKey)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType && (
                <p className="text-xs text-muted-foreground">{t(selectedType.descKey)}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t('feedback.titleLabel')}</label>
              <Input
                placeholder={t('feedback.titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t('feedback.contentLabel')}</label>
              <Textarea
                placeholder={t('feedback.contentPlaceholder')}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {t('feedback.pasteScreenshot')}
              </p>
            </div>

            {/* Screenshot Preview */}
            {screenshot && (
              <div className="relative inline-block">
                <img
                  src={screenshot}
                  alt="Screenshot"
                  className="max-h-32 rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 w-6 h-6"
                  onClick={() => setScreenshot(null)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!submitted && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('feedback.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || !content.trim() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('feedback.submitting')}
                  </>
                ) : (
                  t('feedback.submit')
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}