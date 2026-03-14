"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Bug,
  Lightbulb,
  HelpCircle,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  ChevronLeft,
  Send,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";

interface Feedback {
  id: string;
  type: string;
  title: string;
  content: string;
  screenshot: string | null;
  status: string;
  adminReply: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface FeedbackAdminPanelProps {
  initialFeedbacks: Feedback[];
  counts: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  embedded?: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  BUG_REPORT: { label: "Bug报告", icon: Bug, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  FEATURE_REQUEST: { label: "功能建议", icon: Lightbulb, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  QUESTION: { label: "问题咨询", icon: HelpCircle, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  OTHER: { label: "其他", icon: MessageSquare, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  OPEN: { label: "待处理", icon: Clock, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  IN_PROGRESS: { label: "处理中", icon: Loader2, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  RESOLVED: { label: "已解决", icon: CheckCircle, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  CLOSED: { label: "已关闭", icon: AlertCircle, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
};

export function FeedbackAdminPanel({ initialFeedbacks, counts, embedded = false }: FeedbackAdminPanelProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("admin", "true");
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterType !== "all") params.set("type", filterType);

      const res = await fetch(`/api/feedback?${params}`);
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
    } catch (error) {
      console.error("Fetch feedbacks error:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: feedbackId, status: newStatus }),
      });

      if (res.ok) {
        setFeedbacks(prev =>
          prev.map(f => f.id === feedbackId ? { ...f, status: newStatus } : f)
        );
        if (selectedFeedback?.id === feedbackId) {
          setSelectedFeedback(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (error) {
      console.error("Update status error:", error);
    }
  };

  const handleReply = async () => {
    if (!selectedFeedback || !replyText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedFeedback.id,
          adminReply: replyText,
          status: "IN_PROGRESS"
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFeedbacks(prev =>
          prev.map(f => f.id === selectedFeedback.id ? data.feedback : f)
        );
        setSelectedFeedback(data.feedback);
        setReplyText("");
      }
    } catch (error) {
      console.error("Reply error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (feedbackId: string) => {
    if (!confirm("确定要删除这条反馈吗？")) return;

    try {
      const res = await fetch(`/api/feedback?id=${feedbackId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
        if (selectedFeedback?.id === feedbackId) {
          setSelectedFeedback(null);
        }
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(query) ||
        f.content.toLowerCase().includes(query) ||
        f.user.email.toLowerCase().includes(query) ||
        f.user.name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={cn("min-h-screen bg-background", embedded && "min-h-0")}>
      {/* Header - only show when not embedded */}
      {!embedded && (
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="icon">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-bold">反馈管理</h1>
                  <p className="text-sm text-muted-foreground">管理和回复用户反馈</p>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Stats */}
      <div className={cn("max-w-7xl mx-auto px-4 py-6", embedded && "px-0 py-0")}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg border p-4">
            <div className="text-2xl font-bold">{counts.total}</div>
            <div className="text-sm text-muted-foreground">总反馈</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-2xl font-bold text-orange-500">{counts.open}</div>
            <div className="text-sm text-muted-foreground">待处理</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-2xl font-bold text-blue-500">{counts.inProgress}</div>
            <div className="text-sm text-muted-foreground">处理中</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-2xl font-bold text-green-500">{counts.resolved}</div>
            <div className="text-sm text-muted-foreground">已解决</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索反馈..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="OPEN">待处理</SelectItem>
              <SelectItem value="IN_PROGRESS">处理中</SelectItem>
              <SelectItem value="RESOLVED">已解决</SelectItem>
              <SelectItem value="CLOSED">已关闭</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="BUG_REPORT">Bug报告</SelectItem>
              <SelectItem value="FEATURE_REQUEST">功能建议</SelectItem>
              <SelectItem value="QUESTION">问题咨询</SelectItem>
              <SelectItem value="OTHER">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-[1fr,400px] gap-6">
          {/* Feedback List */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <ScrollArea className="h-[calc(100vh-400px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredFeedbacks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                  <p>暂无反馈</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredFeedbacks.map((feedback) => {
                    const typeConfig = TYPE_CONFIG[feedback.type] || TYPE_CONFIG.OTHER;
                    const statusConfig = STATUS_CONFIG[feedback.status] || STATUS_CONFIG.OPEN;
                    const TypeIcon = typeConfig.icon;
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={feedback.id}
                        onClick={() => setSelectedFeedback(feedback)}
                        className={cn(
                          "p-4 cursor-pointer transition-colors",
                          selectedFeedback?.id === feedback.id
                            ? "bg-muted/50"
                            : "hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={feedback.user.image || undefined} />
                            <AvatarFallback>{getInitials(feedback.user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={cn("text-xs", typeConfig.color)}>
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {typeConfig.label}
                              </Badge>
                              <Badge className={cn("text-xs", statusConfig.color)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <h3 className="font-medium truncate">{feedback.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {feedback.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{feedback.user.name || feedback.user.email}</span>
                              <span>·</span>
                              <span>
                                {formatDistanceToNow(new Date(feedback.createdAt), {
                                  addSuffix: true,
                                  locale: zhCN
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Detail Panel */}
          <div className="bg-card rounded-lg border overflow-hidden">
            {selectedFeedback ? (
              <div className="h-full flex flex-col">
                {/* Detail Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={TYPE_CONFIG[selectedFeedback.type]?.color || TYPE_CONFIG.OTHER.color}>
                      {TYPE_CONFIG[selectedFeedback.type]?.label || "其他"}
                    </Badge>
                    <Select
                      value={selectedFeedback.status}
                      onValueChange={(v) => handleStatusChange(selectedFeedback.id, v)}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">待处理</SelectItem>
                        <SelectItem value="IN_PROGRESS">处理中</SelectItem>
                        <SelectItem value="RESOLVED">已解决</SelectItem>
                        <SelectItem value="CLOSED">已关闭</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <h2 className="text-lg font-semibold">{selectedFeedback.title}</h2>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={selectedFeedback.user.image || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(selectedFeedback.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedFeedback.user.name || selectedFeedback.user.email}</span>
                    <span>·</span>
                    <span>
                      {formatDistanceToNow(new Date(selectedFeedback.createdAt), {
                        addSuffix: true,
                        locale: zhCN
                      })}
                    </span>
                  </div>
                </div>

                {/* Detail Content */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">反馈内容</h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedFeedback.content}</p>
                    </div>

                    {selectedFeedback.screenshot && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">截图</h4>
                        <img
                          src={selectedFeedback.screenshot}
                          alt="Screenshot"
                          className="max-w-full rounded-lg border"
                        />
                      </div>
                    )}

                    {selectedFeedback.adminReply && (
                      <div className="bg-primary/5 rounded-lg p-3">
                        <h4 className="text-sm font-medium mb-2">管理员回复</h4>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.adminReply}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Reply Section */}
                <div className="p-4 border-t">
                  <Textarea
                    placeholder="输入回复..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="mb-2"
                  />
                  <div className="flex justify-between">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(selectedFeedback.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      删除
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleReply}
                      disabled={!replyText.trim() || submitting}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-1" />
                      )}
                      发送回复
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
                <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                <p>选择一条反馈查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}