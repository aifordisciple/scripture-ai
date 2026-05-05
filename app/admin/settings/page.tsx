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
      VIEW: 'bg-accent text-muted-foreground',
      CREATE: 'bg-green-500/10 text-green-600 dark:text-green-400',
      UPDATE: 'bg-primary/10 text-primary',
      DELETE: 'bg-destructive/10 text-destructive'
    };
    const labels: Record<string, string> = {
      VIEW: '查看',
      CREATE: '创建',
      UPDATE: '更新',
      DELETE: '删除'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[action] || 'bg-accent text-muted-foreground'}`}>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground apple-headline">系统设置</h1>

      {/* 操作日志 */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">操作日志</h2>
            <div className="flex gap-4">
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 text-sm border border-border rounded-lg focus:ring-primary/20 focus:border-primary"
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
                className="px-3 py-1.5 text-sm border border-border rounded-lg focus:ring-primary/20 focus:border-primary"
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
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-accent/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">时间</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">操作人</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">操作</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">对象</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">详情</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {logs?.logs.map((log) => {
                const details = parseDetails(log.details);
                return (
                  <tr key={log.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-foreground">
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
                      <span className="text-sm text-foreground">{getTargetTypeLabel(log.targetType)}</span>
                      {log.targetId && (
                        <span className="text-xs text-muted-foreground ml-2">({log.targetId.slice(0, 8)}...)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {details && (
                        <details className="text-sm text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground transition-colors">查看详情</summary>
                          <pre className="mt-2 text-xs bg-accent p-2 rounded overflow-x-auto max-w-xs">
                            {JSON.stringify(details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
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
          <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
            <div className="text-sm text-foreground">
              共 {logs.pagination.total} 条记录
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded border border-border disabled:opacity-50 transition-all duration-150 active:scale-95"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 py-2 text-sm">
                {page} / {logs.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(logs.pagination.totalPages, p + 1))}
                disabled={page === logs.pagination.totalPages}
                className="p-2 rounded border border-border disabled:opacity-50 transition-all duration-150 active:scale-95"
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