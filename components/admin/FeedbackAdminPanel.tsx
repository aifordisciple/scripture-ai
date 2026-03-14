'use client';

import { useState } from 'react';

interface Feedback {
  id: string;
  type: string;
  title: string;
  content: string;
  status: string;
  screenshot?: string | null;
  adminReply?: string | null;
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

export function FeedbackAdminPanel({ initialFeedbacks, counts, embedded }: FeedbackAdminPanelProps) {
  const [feedbacks] = useState(initialFeedbacks);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className={embedded ? "" : "min-h-screen bg-gray-50 dark:bg-gray-900 p-8"}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          反馈管理
        </h1>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
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
                  时间
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {feedbacks.map((feedback) => (
                <tr
                  key={feedback.id}
                  onClick={() => setSelectedFeedback(feedback)}
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
                    {feedback.type === 'BUG_REPORT' ? 'Bug报告' : feedback.type === 'FEATURE_REQUEST' ? '功能建议' : feedback.type === 'QUESTION' ? '问题咨询' : '其他'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                    {feedback.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(feedback.status)}`}>
                      {feedback.status === 'OPEN' ? '待处理' : feedback.status === 'IN_PROGRESS' ? '处理中' : '已解决'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {feedbacks.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              暂无反馈
            </div>
          )}
        </div>

        {/* 详情模态框 */}
        {selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {selectedFeedback.title}
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">类型</div>
                  <div className="text-gray-900 dark:text-white">{getTypeLabel(selectedFeedback.type)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">状态</div>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedFeedback.status)}`}>
                    {selectedFeedback.status === 'OPEN' ? '待处理' : selectedFeedback.status === 'IN_PROGRESS' ? '处理中' : '已解决'}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">内容</div>
                  <div className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedFeedback.content}</div>
                </div>
                {selectedFeedback.screenshot && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">截图</div>
                    <img src={selectedFeedback.screenshot} alt="反馈截图" className="max-w-full rounded-lg border" />
                  </div>
                )}
                {selectedFeedback.adminReply && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">管理员回复</div>
                    <div className="text-gray-900 dark:text-white whitespace-pre-wrap bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      {selectedFeedback.adminReply}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">用户</div>
                  <div className="text-gray-900 dark:text-white">
                    {selectedFeedback.user?.name || '匿名用户'} ({selectedFeedback.user?.email})
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">提交时间</div>
                  <div className="text-gray-900 dark:text-white">
                    {new Date(selectedFeedback.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
