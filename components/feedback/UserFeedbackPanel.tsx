"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Send,
  Loader2,
  Bug,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Reply {
  type: 'admin' | 'user';
  content: string;
  createdAt: string;
}

interface Feedback {
  id: string;
  type: string;
  title: string;
  content: string;
  status: string;
  screenshot?: string | null;
  adminReply?: string | null;
  userReply?: string | null;
  replies?: string | null;
  createdAt: string;
}

interface UserFeedbackPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserFeedbackPanel({ open, onOpenChange }: UserFeedbackPanelProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchFeedbacks();
    }
  }, [open]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
    } catch (error) {
      console.error("Fetch feedbacks error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFeedback = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setReplyContent("");
  };

  const handleSubmitReply = async () => {
    if (!selectedFeedback || !replyContent.trim()) return;

    setReplyLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedFeedback.id,
          userReply: replyContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFeedbacks((prev) =>
          prev.map((f) =>
            f.id === selectedFeedback.id ? { ...f, ...data.feedback } : f
          )
        );
        setSelectedFeedback((prev) =>
          prev ? { ...prev, userReply: replyContent, replies: data.feedback.replies } : null
        );
        setReplyContent("");
      } else {
        const error = await res.json();
        alert(error.error || "回复失败");
      }
    } catch (error) {
      console.error("Reply error:", error);
      alert("回复失败，请重试");
    } finally {
      setReplyLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN":
        return "待处理";
      case "IN_PROGRESS":
        return "处理中";
      case "RESOLVED":
        return "已解决";
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "BUG_REPORT":
        return <Bug className="w-4 h-4" />;
      case "FEATURE_REQUEST":
        return <Lightbulb className="w-4 h-4" />;
      case "QUESTION":
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "BUG_REPORT":
        return "Bug报告";
      case "FEATURE_REQUEST":
        return "功能建议";
      case "QUESTION":
        return "问题咨询";
      default:
        return "其他";
    }
  };

  const parseReplies = (repliesJson: string | null | undefined): Reply[] => {
    if (!repliesJson) return [];
    try {
      return JSON.parse(repliesJson);
    } catch {
      return [];
    }
  };

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            我的反馈
          </DialogTitle>
        </DialogHeader>

        {selectedFeedback ? (
          // 详情视图
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFeedback(null)}
              className="mb-2"
            >
              ← 返回列表
            </Button>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{selectedFeedback.title}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  {getTypeIcon(selectedFeedback.type)}
                  {getTypeLabel(selectedFeedback.type)}
                </Badge>
                <Badge className={getStatusColor(selectedFeedback.status)}>
                  {getStatusLabel(selectedFeedback.status)}
                </Badge>
              </div>
            </div>

            {/* 原始反馈 */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">
                您的反馈 · {formatTime(selectedFeedback.createdAt)}
              </div>
              <p className="text-sm whitespace-pre-wrap">{selectedFeedback.content}</p>
            </div>

            {/* 回复历史 */}
            <ScrollArea className="max-h-[300px]">
              {parseReplies(selectedFeedback.replies).map((reply, index) => (
                <div
                  key={index}
                  className={cn(
                    "mb-3 p-3 rounded-lg",
                    reply.type === "admin"
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "bg-gray-50 dark:bg-gray-800"
                  )}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {reply.type === "admin" ? "管理员回复" : "您的回复"} ·{" "}
                    {formatTime(reply.createdAt)}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                </div>
              ))}
            </ScrollArea>

            {/* 回复输入框 */}
            {selectedFeedback.status !== "RESOLVED" && (
              <div className="space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="继续回复..."
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitReply}
                    disabled={!replyContent.trim() || replyLoading}
                  >
                    {replyLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    发送回复
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // 列表视图
          <ScrollArea className="max-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">暂无反馈记录</p>
              </div>
            ) : (
              <div className="space-y-2">
                {feedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    onClick={() => handleSelectFeedback(feedback)}
                    className="p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{feedback.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              feedback.adminReply
                                ? "border-blue-300 text-blue-600"
                                : "text-gray-500"
                            )}
                          >
                            {feedback.adminReply ? "有回复" : "待回复"}
                          </Badge>
                          <Badge className={cn("text-xs", getStatusColor(feedback.status))}>
                            {getStatusLabel(feedback.status)}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">
                        {formatTime(feedback.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}