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

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEEDBACK_TYPES = [
  { value: "BUG_REPORT", label: "Bug报告", icon: Bug, description: "报告应用中的问题或错误" },
  { value: "FEATURE_REQUEST", label: "功能建议", icon: Lightbulb, description: "提出新功能或改进建议" },
  { value: "QUESTION", label: "问题咨询", icon: HelpCircle, description: "使用问题或功能咨询" },
  { value: "OTHER", label: "其他反馈", icon: MessageSquare, description: "其他类型的反馈" },
];

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
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

  const selectedType = FEEDBACK_TYPES.find((t) => t.value === type);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            意见反馈
          </DialogTitle>
          <DialogDescription>
            我们非常重视您的反馈，感谢您帮助我们改进产品
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-1">提交成功</h3>
            <p className="text-sm text-muted-foreground">感谢您的反馈，我们会尽快处理</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Feedback Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">反馈类型</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon className="w-4 h-4" />
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType && (
                <p className="text-xs text-muted-foreground">{selectedType.description}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">标题</label>
              <Input
                placeholder="简要描述您的反馈"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">详细描述</label>
              <Textarea
                placeholder="请详细描述您遇到的问题或建议..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                支持粘贴截图 (Ctrl/Cmd + V)
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
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || !content.trim() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  "提交反馈"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}