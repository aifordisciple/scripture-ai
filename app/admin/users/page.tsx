// app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Shield, User, MoreVertical, X, Ban, CheckCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateClient } from '@/lib/locale';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  isMuted: boolean;
  mutedAt: string | null;
  mutedReason: string | null;
  createdAt: string;
  lastActiveDate: string | null;
  streakCount: number;
  _count: {
    highlights: number;
    notes: number;
    churchMemberships: number;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 禁言相关状态
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [muteUser, setMuteUser] = useState<User | null>(null);
  const [muteReason, setMuteReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        role: roleFilter
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(t('admin.loadUsersFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setUpdating(user.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role: newRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
      fetchUsers();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: t('admin.updateFailed') });
    } finally {
      setUpdating(null);
    }
  };

  // 打开禁言对话框
  const openMuteDialog = (user: User) => {
    setMuteUser(user);
    setMuteReason('');
    setMuteDialogOpen(true);
  };

  // 禁言用户
  const handleMuteUser = async () => {
    if (!muteUser) return;
    setUpdating(muteUser.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: muteUser.id,
          isMuted: true,
          mutedReason: muteReason || '违反社区规范'
        })
      });
      if (!res.ok) throw new Error('Failed to mute user');
      setMuteDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: t('admin.muteFailed') });
    } finally {
      setUpdating(null);
    }
  };

  // 解除禁言
  const handleUnmuteUser = async (user: User) => {
    setUpdating(user.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isMuted: false })
      });
      if (!res.ok) throw new Error('Failed to unmute user');
      fetchUsers();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: t('admin.unmuteFailed') });
    } finally {
      setUpdating(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066cc]"></div>
      </div>
    );
  }

  // [P2-18修复] 显示错误状态UI
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-red-500 text-lg">{error}</div>
        <button onClick={fetchUsers} className="px-4 py-2 bg-[#0066cc] text-white rounded-lg hover:bg-[#0071e3] active:scale-95">{t('admin.retry')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-semibold text-slate-900">{t('admin.userManagement')}</h1>

      {/* 搜索和筛选 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-3 md:p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={t('admin.searchNameOrEmail')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-[#0066cc]/20 focus:border-[#0066cc]"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="flex-1 md:flex-none px-4 py-2 border border-slate-300 rounded-lg focus:ring-[#0066cc]/20 focus:border-[#0066cc]"
            >
              <option value="">{t('admin.allRoles')}</option>
              <option value="user">{t('admin.userRole')}</option>
              <option value="admin">{t('admin.adminRole')}</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-[#0066cc] text-white rounded-lg hover:bg-[#0071e3] active:scale-95 whitespace-nowrap"
            >
              {t('admin.search')}

            </button>
          </div>
        </form>
      </div>

      {/* 用户列表 - 桌面端表格 */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.user')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.role')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.stats')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.registered')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data?.users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                        {user.image ? (
                          <img src={user.image} alt="" className="h-10 w-10 object-cover" />
                        ) : (
                          <User size={20} className="text-slate-500" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{user.name || t('admin.notSet')}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      user.role === 'admin'
                        ? "bg-purple-100 text-purple-700"
                        : "bg-slate-100 text-slate-700"
                    )}>
                      {user.role === 'admin' ? t('admin.adminRole') : t('admin.userRole')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isMuted ? (
                      <div className="flex items-center gap-1">
                        <Ban className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-red-600">{t('admin.muted')}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-green-600">{t('admin.normal')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div className="flex gap-3">
                      <span title={t('admin.highlights')}>{user._count.highlights} {t('admin.highlights')}</span>
                      <span title={t('admin.notes')}>{user._count.notes} {t('admin.notes')}</span>
                      <span title={t('admin.groups')}>{user._count.churchMemberships} {t('admin.groups')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDateClient(new Date(user.createdAt))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {user.isMuted ? (
                        <button
                          onClick={() => handleUnmuteUser(user)}
                          disabled={updating === user.id}
                          className="px-3 py-1 rounded text-sm text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          {t('admin.unmute')}
                        </button>
                      ) : (
                        <button
                          onClick={() => openMuteDialog(user)}
                          disabled={updating === user.id}
                          className="px-3 py-1 rounded text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          <Ban className="w-4 h-4 inline mr-1" />
                          {t('admin.mute')}
                        </button>
                      )}
                      <button
                        onClick={() => toggleRole(user)}
                        disabled={updating === user.id}
                        className={cn(
                          "px-3 py-1 rounded text-sm transition-colors",
                          user.role === 'admin'
                            ? "text-red-600 hover:bg-red-50"
                            : "text-[#0066cc] hover:bg-[#0066cc]/10",
                          updating === user.id && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {user.role === 'admin' ? t('admin.removeAdmin') : t('admin.setAdmin')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 用户列表 - 移动端卡片 */}
      <div className="md:hidden space-y-3">
        {data?.users.map((user) => (
          <div key={user.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {user.image ? (
                    <img src={user.image} alt="" className="h-12 w-12 object-cover" />
                  ) : (
                    <User size={24} className="text-slate-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">{user.name || t('admin.notSet')}</div>
                  <div className="text-sm text-slate-500 truncate">{user.email}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full shrink-0",
                  user.role === 'admin'
                    ? "bg-purple-100 text-purple-700"
                    : "bg-slate-100 text-slate-700"
                )}>
                  {user.role === 'admin' ? t('admin.adminRole') : t('admin.userRole')}
                </span>
                {user.isMuted && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                    {t('admin.muted')}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
              <span>{user._count.highlights} {t('admin.highlights')}</span>
              <span>{user._count.notes} {t('admin.notes')}</span>
              <span>{user._count.churchMemberships} {t('admin.groups')}</span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-slate-400">
                {t('admin.registeredColon')} {formatDateClient(new Date(user.createdAt))}
              </div>
              <div className="flex gap-2">
                {user.isMuted ? (
                  <button
                    onClick={() => handleUnmuteUser(user)}
                    disabled={updating === user.id}
                    className="px-3 py-1.5 rounded text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 disabled:opacity-50 transition-colors"
                  >
                    {t('admin.unmute')}
                  </button>
                ) : (
                  <button
                    onClick={() => openMuteDialog(user)}
                    disabled={updating === user.id}
                    className="px-3 py-1.5 rounded text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    {t('admin.mute')}
                  </button>
                )}
                <button
                  onClick={() => toggleRole(user)}
                  disabled={updating === user.id}
                  className={cn(
                    "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                    user.role === 'admin'
                      ? "text-red-600 bg-red-50 hover:bg-red-100"
                      : "text-[#0066cc] bg-[#0066cc]/10 hover:bg-[#0066cc]/20",
                    updating === user.id && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {user.role === 'admin' ? t('admin.removeAdmin') : t('admin.setAdmin')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 分页 */}
      {data && data.pagination.totalPages > 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm px-4 py-3 flex items-center justify-between border-t border-slate-200">
          <div className="text-sm text-slate-700">
            {t('admin.totalCount', { count: data.pagination.total })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded border border-slate-300 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 py-2 text-sm flex items-center">
              {page} / {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
              className="p-2 rounded border border-slate-300 disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* 禁言对话框 */}
      <Dialog open={muteDialogOpen} onOpenChange={setMuteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.muteUser')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              {t('admin.confirmMuteUser')} <strong>{muteUser?.name || muteUser?.email}</strong> {t('admin.muteUserConsequence')}
            </p>
            <div>
              <label className="text-sm font-medium">{t('admin.muteReason')}</label>
              <Textarea
                value={muteReason}
                onChange={(e) => setMuteReason(e.target.value)}
                placeholder={t('admin.muteReasonPlaceholder')}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMuteDialogOpen(false)}>
              {t('admin.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleMuteUser}
              disabled={updating === muteUser?.id}
            >
              {updating === muteUser?.id ? t('admin.processing') : t('admin.confirmMute')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}