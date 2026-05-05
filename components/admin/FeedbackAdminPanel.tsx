"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from '@/lib/i18n';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  MessageSquare,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Inbox,
} from "lucide-react";

interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  category: string;
  title: string;
  content: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  adminReply?: string;
  repliedAt?: string;
}

interface FeedbackStats {
  total: number;
  pending: number;
  processing: number;
  resolved: number;
  closed: number;
}

export default function FeedbackAdminPanel() {
  const { t } = useTranslation();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    pending: 0,
    processing: 0,
    resolved: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pageSize = 10;

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(filterStatus !== "all" && { status: filterStatus }),
        ...(filterType !== "all" && { type: filterType }),
      });
      const res = await fetch(`/api/feedback?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks || []);
        setStats(data.stats || { total: 0, pending: 0, processing: 0, resolved: 0, closed: 0 });
      }
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, filterStatus, filterType]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchFeedbacks();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    const id = pendingDeleteId;
    if (!id) return;
    setShowDeleteConfirm(false);
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchFeedbacks();
      }
    } catch (error) {
      console.error("Failed to delete feedback:", error);
    }
  };

  const handleReply = async () => {
    if (!selectedFeedback || !replyContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/feedback/${selectedFeedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          adminReply: replyContent.trim(),
        }),
      });
      if (res.ok) {
        setShowDetailModal(false);
        setReplyContent("");
        setSelectedFeedback(null);
        fetchFeedbacks();
      }
    } catch (error) {
      console.error("Failed to reply:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "processing":
        return <AlertCircle className="w-4 h-4 text-primary" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: t('adminFeedback.statusPending'),
      processing: t('adminFeedback.statusProcessing'),
      resolved: t('adminFeedback.statusResolved'),
      closed: t('adminFeedback.statusClosed'),
    };
    return map[status] || status;
  };

  const getStatusBadgeClass = (status: string) => {
    const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold";
    switch (status) {
      case "pending":
        return `${base} bg-amber-500/10 text-amber-600 dark:text-amber-400`;
      case "processing":
        return `${base} bg-primary/10 text-primary`;
      case "resolved":
        return `${base} bg-green-500/10 text-green-600 dark:text-green-400`;
      case "closed":
        return `${base} bg-accent text-muted-foreground`;
      default:
        return `${base} bg-accent text-muted-foreground`;
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      bug: t('adminFeedback.typeBug'),
      feature: t('adminFeedback.typeFeature'),
      improvement: t('adminFeedback.typeImprovement'),
      other: t('adminFeedback.typeOther'),
    };
    return map[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-amber-500";
      case "low":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = {
      high: t('adminFeedback.priorityHigh'),
      medium: t('adminFeedback.priorityMedium'),
      low: t('adminFeedback.priorityLow'),
    };
    return map[priority] || priority;
  };

  return (
    <>
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: t('adminFeedback.statsAll'), value: stats.total, color: "text-primary", bg: "bg-primary/10" },
          { label: t('adminFeedback.statsPending'), value: stats.pending, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
          { label: t('adminFeedback.statsProcessing'), value: stats.processing, color: "text-primary dark:text-primary", bg: "bg-primary/5 dark:bg-primary/10" },
          { label: t('adminFeedback.statsResolved'), value: stats.resolved, color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10" },
          { label: t('adminFeedback.statsClosed'), value: stats.closed, color: "text-muted-foreground", bg: "bg-accent" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} rounded-lg p-4 border border-border`}
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('adminFeedback.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-8 py-2 border border-border rounded-lg bg-card text-foreground text-sm appearance-none cursor-pointer"
              >
                <option value="all">{t('adminFeedback.filterAllStatus')}</option>
                <option value="pending">{t('adminFeedback.statusPending')}</option>
                <option value="processing">{t('adminFeedback.statusProcessing')}</option>
                <option value="resolved">{t('adminFeedback.statusResolved')}</option>
                <option value="closed">{t('adminFeedback.statusClosed')}</option>
              </select>
            </div>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-border rounded-lg bg-card text-foreground text-sm appearance-none cursor-pointer"
            >
              <option value="all">{t('adminFeedback.filterAllType')}</option>
              <option value="bug">{t('adminFeedback.typeBug')}</option>
              <option value="feature">{t('adminFeedback.typeFeature')}</option>
              <option value="improvement">{t('adminFeedback.typeImprovement')}</option>
              <option value="other">{t('adminFeedback.typeOther')}</option>
            </select>
          </div>
          <button
            onClick={fetchFeedbacks}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-accent/50 rounded-lg transition-all duration-150 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={t('adminFeedback.refreshTitle')}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground apple-body">
            <Inbox className="w-12 h-12 mb-3" />
            <p className="text-lg">{t('adminFeedback.noFeedback')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-4 hover:bg-accent/50 transition-colors cursor-pointer min-h-[44px]"
                onClick={() => {
                  setSelectedFeedback(fb);
                  setShowDetailModal(true);
                  setReplyContent(fb.adminReply || "");
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(fb.status)}
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {fb.title}
                      </h3>
                      <span className={getPriorityColor(fb.priority)}>
                        {getPriorityLabel(fb.priority)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {fb.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {fb.userName || fb.userEmail}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getTypeLabel(fb.type)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={getStatusBadgeClass(fb.status)}>
                      {getStatusLabel(fb.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {feedbacks.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-accent/30">
            <p className="text-sm text-muted-foreground">
              {t('adminFeedback.pageIndicator', { page: currentPage })}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={feedbacks.length < pageSize}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground tracking-[-0.022em]">
                  {t('adminFeedback.detailTitle')}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedFeedback(null);
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-all duration-150 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={getStatusBadgeClass(selectedFeedback.status)}>
                    {getStatusLabel(selectedFeedback.status)}
                  </span>
                  <span className={`text-sm ${getPriorityColor(selectedFeedback.priority)}`}>
                    {t('adminFeedback.priorityLabel')}: {getPriorityLabel(selectedFeedback.priority)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {getTypeLabel(selectedFeedback.type)}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {selectedFeedback.title}
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedFeedback.content}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{t('adminFeedback.submitter')}: {selectedFeedback.userName || selectedFeedback.userEmail}</p>
                  <p>{t('adminFeedback.submitTime')}: {new Date(selectedFeedback.createdAt).toLocaleString()}</p>
                  {selectedFeedback.category && (
                    <p>{t('adminFeedback.category')}: {selectedFeedback.category}</p>
                  )}
                </div>

                {selectedFeedback.adminReply && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-xs font-semibold text-primary mb-1">
                      {t('adminFeedback.adminReply')}
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {selectedFeedback.adminReply}
                    </p>
                    {selectedFeedback.repliedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(selectedFeedback.repliedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Reply Section */}
                <div className="border-t border-border pt-4">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    {t('adminFeedback.replyLabel')}
                  </label>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={4}
                    placeholder={t('adminFeedback.replyPlaceholder')}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-2">
                      {selectedFeedback.status !== "processing" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(selectedFeedback.id, "processing")
                          }
                          className="px-3 py-1.5 text-sm border border-primary/30 text-primary rounded-lg hover:bg-primary/10 transition-all duration-150 active:scale-95 min-h-[44px]"
                        >
                          {t('adminFeedback.markProcessing')}
                        </button>
                      )}
                      {selectedFeedback.status === "resolved" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(selectedFeedback.id, "closed")
                          }
                          className="px-3 py-1.5 text-sm border border-border text-muted-foreground rounded-lg hover:bg-accent/50 transition-all duration-150 active:scale-95 min-h-[44px]"
                        >
                          {t('adminFeedback.closeFeedback')}
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setSelectedFeedback(null);
                        }}
                        className="px-4 py-2 text-sm text-muted-foreground hover:bg-accent/50 rounded-lg transition-all duration-150 active:scale-95 min-h-[44px]"
                      >
                        {t('adminFeedback.cancel')}
                      </button>
                      <button
                        onClick={handleReply}
                        disabled={!replyContent.trim() || submitting}
                        className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-white rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-h-[44px]"
                      >
                        {submitting ? t('adminFeedback.submitting') : t('adminFeedback.replyAndResolve')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    <ConfirmDialog
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title={t('common.delete')}
      description={t('adminFeedback.confirmDelete')}
      onConfirm={confirmDelete}
    />
    </>
  );
}