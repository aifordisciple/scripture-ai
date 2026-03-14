// app/admin/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Edit2, Trash2, Plus, Filter } from 'lucide-react';

interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: string | null;
  ip: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface LogsResponse {
  logs: AdminLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminSettingsPage() {
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, targetTypeFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        action: actionFilter,
        targetType: targetTypeFilter
      });
      const res = await fetch(`/api/admin/logs?${params}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const json = await res.json();
      setLogs(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      VIEW: 'bg-gray-100 text-gray-700',
      CREATE: 'bg-green-100 text-green-700',
      UPDATE: 'bg-blue-100 text-blue-700',
      DELETE: 'bg-red-100 text-red-700'
    };
    const labels: Record<string, string> = {
      VIEW: '查看',
      CREATE: '创建',
      UPDATE: '更新',
      DELETE: '删除'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[action] || 'bg-gray-100 text-gray-700'}`}>
        {labels[action] || action}
      </span>
    );
  };

  const getTargetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      USER: '用户',
      CHURCH: '小组',
      FEEDBACK: '反馈',
      ANNOUNCEMENT: '公告',
      SYSTEM: '系统',
      PLAN: '计划'
    };
    return labels[type] || type;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'VIEW':
        return <Eye size={14} />;
      case 'CREATE':
        return <Plus size={14} />;
      case 'UPDATE':
        return <Edit2 size={14} />;
      case 'DELETE':
        return <Trash2 size={14} />;
      default:
        return null;
    }
  };

  const parseDetails = (details: string | null) => {
    if (!details) return null;
    try {
      const parsed = JSON.parse(details);
      return parsed;
    } catch {
      return details;
    }
  };

  if (loading && !logs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>

      {/* 操作日志 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">操作日志</h2>
            <div className="flex gap-4">
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">全部操作</option>
                <option value="VIEW">查看</option>
                <option value="CREATE">创建</option>
                <option value="UPDATE">更新</option>
                <option value="DELETE">删除</option>
              </select>
              <select
                value={targetTypeFilter}
                onChange={(e) => { setTargetTypeFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">全部对象</option>
                <option value="USER">用户</option>
                <option value="CHURCH">小组</option>
                <option value="FEEDBACK">反馈</option>
                <option value="ANNOUNCEMENT">公告</option>
                <option value="SYSTEM">系统</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">对象</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">详情</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs?.logs.map((log) => {
                const details = parseDetails(log.details);
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.admin.name || log.admin.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        {getActionBadge(log.action)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{getTargetTypeLabel(log.targetType)}</span>
                      {log.targetId && (
                        <span className="text-xs text-gray-400 ml-2">({log.targetId.slice(0, 8)}...)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {details && (
                        <details className="text-sm text-gray-500">
                          <summary className="cursor-pointer hover:text-gray-700">查看详情</summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto max-w-xs">
                            {JSON.stringify(details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {logs && logs.pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="text-sm text-gray-700">
              共 {logs.pagination.total} 条记录
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded border border-gray-300 disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 py-2 text-sm">
                {page} / {logs.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(logs.pagination.totalPages, p + 1))}
                disabled={page === logs.pagination.totalPages}
                className="p-2 rounded border border-gray-300 disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}