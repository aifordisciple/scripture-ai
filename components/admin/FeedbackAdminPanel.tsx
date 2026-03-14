'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Send, Trash2, MessageCircle, Search, RefreshCw, Bug, Lightbulb, HelpCircle, MessageSquare, Zap, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
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

// 快捷回复模板
const QUICK_REPLIES = [
  {
    label: '收到确认',
    content: '感谢您的反馈，我们已收到并正在处理中，请耐心等待。'
  },
  {
    label: '已修复',
    content: '该问题已在最新版本修复，请更新应用后重试。如有其他问题，欢迎继续反馈。'
  },
  {
    label: '建议已记录',
    content: '您的建议非常有价值，我们已记录并在后续版本中考虑实现。感谢您的支持！'
  },
  {
    label: '需要更多信息',
    content: '感谢您的反馈。为了更好地帮助您解决问题，请提供更多详细信息（如操作步骤、截图等）。'
  },
  {
    label: '已知问题',
    content: '这是一个已知问题，我们正在积极修复中，预计将在下个版本解决。感谢您的耐心等待。'
  }
];

export function FeedbackAdminPanel({ initialFeedbacks, counts: initialCounts, embedded }: FeedbackAdminPanelProps) {
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [counts, setCounts] = useState(initialCounts);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 搜索和筛选
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // 批量操作
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'RESOLVED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'BUG_REPORT': return 'Bug报告';
      case 'FEATURE_REQUEST': return '功能建议';
      case 'QUESTION': return '问题咨询';
      default: return '其他';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUG_REPORT': return <Bug className="w-4 h-4" />;
      case 'FEATURE_REQUEST': return <Lightbulb className="w-4 h-4" />;
      case 'QUESTION': return <HelpCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return '待处理';
      case 'IN_PROGRESS': return '处理中';
      case 'RESOLVED': return '已解决';
      default: return status;
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

  const handleSelectFeedback = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setReplyContent(feedback.adminReply || '');
    setNewStatus(feedback.status);
  };

  const refreshFeedbacks = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/feedback?admin=true');
      const data = await res.json();
      if (data.feedbacks) {
        setFeedbacks(data.feedbacks);
      }
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Failed to refresh feedbacks:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 筛选反馈
  const filteredFeedbacks = feedbacks.filter((feedback) => {
    // 状态筛选
    if (statusFilter !== 'all' && feedback.status !== statusFilter) {
      return false;
    }
    // 类型筛选
    if (typeFilter !== 'all' && feedback.type !== typeFilter) {
      return false;
    }
    // 搜索筛选（用户名、邮箱、标题、内容）
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        feedback.title.toLowerCase().includes(query) ||
        feedback.content.toLowerCase().includes(query) ||
        feedback.user?.name?.toLowerCase().includes(query) ||
        feedback.user?.email?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // 批量操作函数
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFeedbacks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFeedbacks.map(f => f.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBatchStatusUpdate = async (newStatus: string) => {
    if (selectedIds.size === 0) return;

    if (!confirm(`确定要将选中的 ${selectedIds.size} 条反馈状态修改为"${getStatusLabel(newStatus)}"吗？`)) {
      return;
    }

    setBatchLoading(true);
    try {
      const res = await fetch('/api/feedback/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          ids: Array.from(selectedIds),
          data: { status: newStatus }
        })
      });

      if (res.ok) {
        setFeedbacks(prev => prev.map(f =>
          selectedIds.has(f.id) ? { ...f, status: newStatus } : f
        ));
        setSelectedIds(new Set());
        await refreshFeedbacks();
      } else {
        const error = await res.json();
        alert(error.error || '批量更新失败');
      }
    } catch (error) {
      console.error('Batch update error:', error);
      alert('批量更新失败，请重试');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`确定要删除选中的 ${selectedIds.size} 条反馈吗？此操作不可撤销。`)) {
      return;
    }

    setBatchLoading(true);
    try {
      const res = await fetch('/api/feedback/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          ids: Array.from(selectedIds)
        })
      });

      if (res.ok) {
        setFeedbacks(prev => prev.filter(f => !selectedIds.has(f.id)));
        setSelectedIds(new Set());
        await refreshFeedbacks();
      } else {
        const error = await res.json();
        alert(error.error || '批量删除失败');
      }
    } catch (error) {
      console.error('Batch delete error:', error);
      alert('批量删除失败，请重试');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!selectedFeedback) return;

    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedFeedback.id,
          status: newStatus,
          adminReply: replyContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setFeedbacks(prev => prev.map(f =>
          f.id === selectedFeedback.id
            ? { ...f, status: newStatus, adminReply: replyContent }
            : f
        ));
        setSelectedFeedback(prev => prev ? { ...prev, status: newStatus, adminReply: replyContent } : null);
        // Refresh counts
        await refreshFeedbacks();
      } else {
        const error = await res.json();
        alert(error.error || '提交失败');
      }
    } catch (error) {
      console.error('Submit reply error:', error);
      alert('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFeedback) return;

    if (!confirm('确定要删除这条反馈吗？此操作不可撤销。')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/feedback?id=${selectedFeedback.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setFeedbacks(prev => prev.filter(f => f.id !== selectedFeedback.id));
        setSelectedFeedback(null);
        await refreshFeedbacks();
      } else {
        const error = await res.json();
        alert(error.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete feedback error:', error);
      alert('删除失败，请重试');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={embedded ? "" : "min-h-screen bg-gray-50 dark:bg-gray-900 p-8"}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          反馈管理
        </h1>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500 dark:text-gray-400">总计</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{counts.total}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500 dark:text-gray-400">待处理</div>
            <div className="text-2xl font-bold text-yellow-600">{counts.open}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500 dark:text-gray-400">处理中</div>
            <div className="text-2xl font-bold text-blue-600">{counts.inProgress}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-sm text-gray-500 dark:text-gray-400">已解决</div>
            <div className="text-2xl font-bold text-green-600">{counts.resolved}</div>
          </div>
        </div>

        {/* 搜索和筛选栏 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索用户名、邮箱、标题或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="OPEN">待处理</SelectItem>
              <SelectItem value="IN_PROGRESS">处理中</SelectItem>
              <SelectItem value="RESOLVED">已解决</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="类型筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="BUG_REPORT">Bug报告</SelectItem>
              <SelectItem value="FEATURE_REQUEST">功能建议</SelectItem>
              <SelectItem value="QUESTION">问题咨询</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshFeedbacks}
            disabled={refreshing}
            title="刷新"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </Button>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <span>共 {filteredFeedbacks.length} 条反馈</span>
            {selectedIds.size > 0 && (
              <>
                <span>·</span>
                <span className="text-blue-600 font-medium">已选中 {selectedIds.size} 条</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="text-blue-500 hover:text-blue-600"
              >
                清除筛选
              </button>
            ) : null}
          </div>
        </div>

        {/* 批量操作栏 */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              已选中 {selectedIds.size} 条反馈
            </span>
            <div className="flex-1" />
            <Select
              onValueChange={(value) => handleBatchStatusUpdate(value)}
              disabled={batchLoading}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="修改状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">待处理</SelectItem>
                <SelectItem value="IN_PROGRESS">处理中</SelectItem>
                <SelectItem value="RESOLVED">已解决</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={batchLoading}
            >
              {batchLoading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              批量删除
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              取消选择
            </Button>
          </div>
        )}

        {/* 反馈列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectAll();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {selectedIds.size === filteredFeedbacks.length && filteredFeedbacks.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    回复
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    时间
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFeedbacks.map((feedback) => {
                    const replies = parseReplies(feedback.replies);
                    const lastReply = replies[replies.length - 1];
                    const hasUserReply = lastReply?.type === 'user';

                    return (
                      <tr
                        key={feedback.id}
                        onClick={() => handleSelectFeedback(feedback)}
                        className={cn(
                          "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700",
                          selectedIds.has(feedback.id) && "bg-blue-50 dark:bg-blue-900/10"
                        )}
                      >
                        <td className="w-12 px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleSelect(feedback.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {selectedIds.has(feedback.id) ? (
                              <CheckSquare className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {feedback.user?.name || '匿名用户'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {feedback.user?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <div className="flex items-center gap-1.5">
                            {getTypeIcon(feedback.type)}
                            {getTypeLabel(feedback.type)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {feedback.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn("px-2 py-1 text-xs rounded-full", getStatusColor(feedback.status))}>
                            {getStatusLabel(feedback.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasUserReply ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              用户已回复
                            </span>
                          ) : feedback.adminReply ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              已回复
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {filteredFeedbacks.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? '未找到匹配的反馈'
                : '暂无反馈'}
            </div>
          )}
        </div>

        {/* 详情模态框 */}
        {selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {selectedFeedback.title}
              </h2>

              <div className="space-y-4">
                {/* 类型与状态 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">类型</div>
                    <div className="text-gray-900 dark:text-white">{getTypeLabel(selectedFeedback.type)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">修改状态</div>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">待处理</SelectItem>
                        <SelectItem value="IN_PROGRESS">处理中</SelectItem>
                        <SelectItem value="RESOLVED">已解决</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 原始内容 */}
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    原始反馈 · {formatTime(selectedFeedback.createdAt)}
                  </div>
                  <div className="text-gray-900 dark:text-white whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {selectedFeedback.content}
                  </div>
                </div>

                {/* 截图 */}
                {selectedFeedback.screenshot && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">截图</div>
                    <img src={selectedFeedback.screenshot} alt="反馈截图" className="max-w-full rounded-lg border" />
                  </div>
                )}

                {/* 回复历史 */}
                {parseReplies(selectedFeedback.replies).length > 0 && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">对话记录</div>
                    <ScrollArea className="max-h-[200px] border rounded-lg p-2">
                      {parseReplies(selectedFeedback.replies).map((reply, index) => (
                        <div
                          key={index}
                          className={cn(
                            "mb-2 p-2 rounded",
                            reply.type === "admin"
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : "bg-green-50 dark:bg-green-900/20"
                          )}
                        >
                          <div className="text-xs text-gray-500 mb-1">
                            {reply.type === "admin" ? "管理员" : "用户"} · {formatTime(reply.createdAt)}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}

                {/* 管理员回复 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400">管理员回复</div>
                    <Select
                      onValueChange={(value) => {
                        const template = QUICK_REPLIES.find(r => r.label === value);
                        if (template) {
                          setReplyContent(prev => prev ? `${prev}\n\n${template.content}` : template.content);
                        }
                      }}
                    >
                      <SelectTrigger className="w-36 h-7 text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        <SelectValue placeholder="快捷回复" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUICK_REPLIES.map((reply) => (
                          <SelectItem key={reply.label} value={reply.label}>
                            {reply.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="输入回复内容..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* 用户信息 */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">用户</div>
                    <div className="text-gray-900 dark:text-white">
                      {selectedFeedback.user?.name || '匿名用户'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">邮箱</div>
                    <div className="text-gray-900 dark:text-white">
                      {selectedFeedback.user?.email || '-'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">提交时间</div>
                    <div className="text-gray-900 dark:text-white">
                      {new Date(selectedFeedback.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="mt-6 flex justify-between">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  删除
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFeedback(null)}
                  >
                    关闭
                  </Button>
                  <Button
                    onClick={handleSubmitReply}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    提交回复
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}