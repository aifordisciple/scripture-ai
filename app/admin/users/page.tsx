// app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Shield, User, MoreVertical, X, Ban, CheckCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  // 禁言相关状态
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [muteUser, setMuteUser] = useState<User | null>(null);
  const [muteReason, setMuteReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
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
      alert('更新失败');
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
      alert('禁言失败');
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
      alert('解除禁言失败');
    } finally {
      setUpdating(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">用户管理</h1>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow p-3 md:p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索用户名或邮箱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">全部角色</option>
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap"
            >
              搜索
            </button>
          </div>
        </form>
      </div>

      {/* 用户列表 - 桌面端表格 */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">统计</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {user.image ? (
                          <img src={user.image} alt="" className="h-10 w-10 object-cover" />
                        ) : (
                          <User size={20} className="text-gray-500" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || '未设置'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      user.role === 'admin'
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                    )}>
                      {user.role === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isMuted ? (
                      <div className="flex items-center gap-1">
                        <Ban className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-red-600">已禁言</span>
                      </div>
                    ) : (
                      <span className="text-xs text-green-600">正常</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-3">
                      <span title="高亮">{user._count.highlights} 高亮</span>
                      <span title="笔记">{user._count.notes} 笔记</span>
                      <span title="小组">{user._count.churchMemberships} 小组</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {user.isMuted ? (
                        <button
                          onClick={() => handleUnmuteUser(user)}
                          disabled={updating === user.id}
                          className="px-3 py-1 rounded text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          解除禁言
                        </button>
                      ) : (
                        <button
                          onClick={() => openMuteDialog(user)}
                          disabled={updating === user.id}
                          className="px-3 py-1 rounded text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Ban className="w-4 h-4 inline mr-1" />
                          禁言
                        </button>
                      )}
                      <button
                        onClick={() => toggleRole(user)}
                        disabled={updating === user.id}
                        className={cn(
                          "px-3 py-1 rounded text-sm",
                          user.role === 'admin'
                            ? "text-red-600 hover:bg-red-50"
                            : "text-indigo-600 hover:bg-indigo-50",
                          updating === user.id && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {user.role === 'admin' ? '取消管理员' : '设为管理员'}
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
          <div key={user.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {user.image ? (
                    <img src={user.image} alt="" className="h-12 w-12 object-cover" />
                  ) : (
                    <User size={24} className="text-gray-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{user.name || '未设置'}</div>
                  <div className="text-sm text-gray-500 truncate">{user.email}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full shrink-0",
                  user.role === 'admin'
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-700"
                )}>
                  {user.role === 'admin' ? '管理员' : '用户'}
                </span>
                {user.isMuted && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                    已禁言
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span>{user._count.highlights} 高亮</span>
              <span>{user._count.notes} 笔记</span>
              <span>{user._count.churchMemberships} 小组</span>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-gray-400">
                注册: {new Date(user.createdAt).toLocaleDateString('zh-CN')}
              </div>
              <div className="flex gap-2">
                {user.isMuted ? (
                  <button
                    onClick={() => handleUnmuteUser(user)}
                    disabled={updating === user.id}
                    className="px-3 py-1.5 rounded text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                  >
                    解除禁言
                  </button>
                ) : (
                  <button
                    onClick={() => openMuteDialog(user)}
                    disabled={updating === user.id}
                    className="px-3 py-1.5 rounded text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                  >
                    禁言
                  </button>
                )}
                <button
                  onClick={() => toggleRole(user)}
                  disabled={updating === user.id}
                  className={cn(
                    "px-3 py-1.5 rounded text-sm font-medium",
                    user.role === 'admin'
                      ? "text-red-600 bg-red-50 hover:bg-red-100"
                      : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100",
                    updating === user.id && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {user.role === 'admin' ? '取消管理员' : '设为管理员'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 分页 */}
      {data && data.pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-700">
            共 {data.pagination.total} 条
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded border border-gray-300 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 py-2 text-sm flex items-center">
              {page} / {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
              className="p-2 rounded border border-gray-300 disabled:opacity-50"
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
            <DialogTitle>禁言用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              确定要禁言用户 <strong>{muteUser?.name || muteUser?.email}</strong> 吗？禁言后该用户将无法发送私信或回复消息。
            </p>
            <div>
              <label className="text-sm font-medium">禁言原因</label>
              <Textarea
                value={muteReason}
                onChange={(e) => setMuteReason(e.target.value)}
                placeholder="请输入禁言原因（可选）"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMuteDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleMuteUser}
              disabled={updating === muteUser?.id}
            >
              {updating === muteUser?.id ? '处理中...' : '确认禁言'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}