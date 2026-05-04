"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Send,
  Loader2,
  Bug,
  Lightbulb,
  HelpCircle,
  Search,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/ui/toast';

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
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  // 搜索和筛选
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
        addToast({ type: 'error', message: error.error || t('feedback.replyFailed') });
      }
    } catch (error) {
      console.error("Reply error:", error);
      addToast({ type: 'error', message: t('feedback.replyFailedRetry') });
    } finally {
      setReplyLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "RESOLVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN":
        return t('feedback.statusOpen');
      case "IN_PROGRESS":
        return t('feedback.statusInProgress');
      case "RESOLVED":
        return t('feedback.statusResolved');
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
        return t('feedback.typeBugLabel');
      case "FEATURE_REQUEST":
        return t('feedback.typeFeatureLabel');
      case "QUESTION":
        return t('feedback.typeQuestionLabel');
      default:
        return t('feedback.typeOtherLabel');
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

  // 检查是否有新回复（用户最后一条回复之后管理员有回复）
  const hasNewAdminReply = (feedback: Feedback) => {
    const replies = parseReplies(feedback.replies);
    if (replies.length === 0) return feedback.adminReply;
    const lastReply = replies[replies.length - 1];
    return lastReply?.type === 'admin';
  };

  // 筛选反馈
  const filteredFeedbacks = feedbacks.filter((feedback) => {
    // 状态筛选
    if (statusFilter !== "all" && feedback.status !== statusFilter) {
      return false;
    }
    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        feedback.title.toLowerCase().includes(query) ||
        feedback.content.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {t('feedback.myFeedback')}
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
              {t('feedback.backToList')}
            </Button>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{selectedFeedback.title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
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
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">
                {t('feedback.yourFeedback')} · {formatTime(selectedFeedback.createdAt)}
              </div>
              <p className="text-sm whitespace-pre-wrap">{selectedFeedback.content}</p>
            </div>

            {/* 截图 */}
            {selectedFeedback.screenshot && (
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <div className="text-xs text-slate-500 mb-2">{t('feedback.screenshot')}</div>
                <img
                  src={selectedFeedback.screenshot}
                  alt={t('feedback.screenshotAlt')}
                  className="max-w-full rounded-lg border max-h-48"
                />
              </div>
            )}

            {/* 回复历史 */}
            {parseReplies(selectedFeedback.replies).length > 0 && (
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('feedback.conversationHistory')}
                </div>
                <ScrollArea className="max-h-[200px] border rounded-lg p-3">
                  {parseReplies(selectedFeedback.replies).map((reply, index) => (
                    <div
                      key={index}
                      className={cn(
                        "mb-3 last:mb-0 p-3 rounded-lg",
                        reply.type === "admin"
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : "bg-slate-100 dark:bg-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        {reply.type === "admin" ? (
                          <>
                            <Badge variant="secondary" className="text-xs py-0 h-5">{t('feedback.admin')}</Badge>
                            {formatTime(reply.createdAt)}
                          </>
                        ) : (
                          <>
                            <span className="text-slate-600 dark:text-slate-400">{t('feedback.you')}</span>
                            <span>·</span>
                            {formatTime(reply.createdAt)}
                          </>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}

            {/* 回复输入框或已解决提示 */}
            {selectedFeedback.status === "RESOLVED" ? (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  {t('feedback.feedbackResolved')}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  {t('feedback.resolvedThankYou')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={t('feedback.continueReply')}
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
                    {t('feedback.sendReply')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // 列表视图
          <div className="space-y-3">
            {/* 搜索和筛选栏 */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={t('feedback.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('feedback.allStatus')}</SelectItem>
                  <SelectItem value="OPEN">{t('feedback.statusOpen')}</SelectItem>
                  <SelectItem value="IN_PROGRESS">{t('feedback.statusInProgress')}</SelectItem>
                  <SelectItem value="RESOLVED">{t('feedback.statusResolved')}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchFeedbacks}
                disabled={loading}
                title={t('feedback.refresh')}
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            </div>

            {/* 统计信息 */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>{t('feedback.totalFeedback', { count: feedbacks.length })}</span>
              <span>·</span>
              <span>{t('feedback.newReplyCount', { count: feedbacks.filter(f => hasNewAdminReply(f)).length })}</span>
            </div>

            {/* 反馈列表 */}
            <ScrollArea className="max-h-[350px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredFeedbacks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchQuery || statusFilter !== "all" ? t('feedback.noMatchFound') : t('feedback.noFeedbackYet')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFeedbacks.map((feedback) => {
                    const hasNewReply = hasNewAdminReply(feedback);
                    return (
                      <div
                        key={feedback.id}
                        onClick={() => handleSelectFeedback(feedback)}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-colors",
                          "hover:bg-slate-50 dark:hover:bg-slate-800",
                          hasNewReply && "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{feedback.title}</div>
                            <div className="flex items-center gap-2 mt-1.5">
                              {hasNewReply ? (
                                <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  {t('feedback.hasNewReply')}
                                </Badge>
                              ) : feedback.adminReply ? (
                                <Badge variant="outline" className="text-xs text-slate-500">
                                  {t('feedback.replied')}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-slate-400">
                                  {t('feedback.pendingReply')}
                                </Badge>
                              )}
                              <Badge className={cn("text-xs", getStatusColor(feedback.status))}>
                                {getStatusLabel(feedback.status)}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 shrink-0">
                            {formatTime(feedback.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}