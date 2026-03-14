'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Send, Trash2, MessageCircle } from 'lucide-react';
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

export function FeedbackAdminPanel({ initialFeedbacks, counts: initialCounts, embedded }: FeedbackAdminPanelProps) {
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [counts, setCounts] = useState(initialCounts);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

        {/* 反馈列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
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
                {feedbacks.map((feedback) => {
                    const replies = parseReplies(feedback.replies);
                    const lastReply = replies[replies.length - 1];
                    const hasUserReply = lastReply?.type === 'user';

                    return (
                      <tr
                        key={feedback.id}
                        onClick={() => handleSelectFeedback(feedback)}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {feedback.user?.name || '匿名用户'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {feedback.user?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {getTypeLabel(feedback.type)}
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

          {feedbacks.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              暂无反馈
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
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">管理员回复</div>
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