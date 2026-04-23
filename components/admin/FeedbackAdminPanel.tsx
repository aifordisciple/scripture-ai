"use client";

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
    if (!confirm("确定要删除这条反馈吗？")) return;
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
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "待处理",
      processing: "处理中",
      resolved: "已解决",
      closed: "已关闭",
    };
    return map[status] || status;
  };

  const getStatusBadgeClass = (status: string) => {
    const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case "pending":
        return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`;
      case "processing":
        return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`;
      case "resolved":
        return `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
      case "closed":
        return `${base} bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400`;
      default:
        return `${base} bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400`;
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      bug: "Bug",
      feature: "功能建议",
      improvement: "改进建议",
      other: "其他",
    };
    return map[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-amber-500";
      case "low":
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = {
      high: "高",
      medium: "中",
      low: "低",
    };
    return map[priority] || priority;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "全部", value: stats.total, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "待处理", value: stats.pending, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "处理中", value: stats.processing, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
          { label: "已解决", value: stats.resolved, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "已关闭", value: stats.closed, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-700/30" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} rounded-xl p-4 border border-gray-200 dark:border-gray-700`}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索反馈..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm appearance-none cursor-pointer"
              >
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="resolved">已解决</option>
                <option value="closed">已关闭</option>
              </select>
            </div>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm appearance-none cursor-pointer"
            >
              <option value="all">全部类型</option>
              <option value="bug">Bug</option>
              <option value="feature">功能建议</option>
              <option value="improvement">改进建议</option>
              <option value="other">其他</option>
            </select>
          </div>
          <button
            onClick={fetchFeedbacks}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <Inbox className="w-12 h-12 mb-3" />
            <p className="text-lg">暂无反馈</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
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
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {fb.title}
                      </h3>
                      <span className={getPriorityColor(fb.priority)}>
                        {getPriorityLabel(fb.priority)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {fb.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {fb.userName || fb.userEmail}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {getTypeLabel(fb.type)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              第 {currentPage} 页
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={feedbacks.length < pageSize}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  反馈详情
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedFeedback(null);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
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
                    优先级: {getPriorityLabel(selectedFeedback.priority)}
                  </span>
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    {getTypeLabel(selectedFeedback.type)}
                  </span>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {selectedFeedback.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedFeedback.content}
                  </p>
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                  <p>提交者: {selectedFeedback.userName || selectedFeedback.userEmail}</p>
                  <p>提交时间: {new Date(selectedFeedback.createdAt).toLocaleString()}</p>
                  {selectedFeedback.category && (
                    <p>分类: {selectedFeedback.category}</p>
                  )}
                </div>

                {selectedFeedback.adminReply && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                      管理员回复
                    </p>
                    <p className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-wrap">
                      {selectedFeedback.adminReply}
                    </p>
                    {selectedFeedback.repliedAt && (
                      <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
                        {new Date(selectedFeedback.repliedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Reply Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    回复
                  </label>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={4}
                    placeholder="输入回复内容..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-2">
                      {selectedFeedback.status !== "processing" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(selectedFeedback.id, "processing")
                          }
                          className="px-3 py-1.5 text-sm border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          标记处理中
                        </button>
                      )}
                      {selectedFeedback.status === "resolved" && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(selectedFeedback.id, "closed")
                          }
                          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          关闭
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setSelectedFeedback(null);
                        }}
                        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleReply}
                        disabled={!replyContent.trim() || submitting}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "提交中..." : "回复并解决"}
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
  );
}
