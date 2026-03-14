// app/admin/messages/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, Send, X, Mail, User, Users, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  role: string;
}

interface SentMessage {
  id: string;
  title: string;
  content: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  sender: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface UsersResponse {
  users: UserItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface MessagesResponse {
  messages: SentMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type TabType = 'send' | 'history';

export default function AdminMessagesPage() {
  const [tab, setTab] = useState<TabType>('send');
  const [users, setUsers] = useState<UsersResponse | null>(null);
  const [messages, setMessages] = useState<MessagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserItem[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    title: '',
    content: ''
  });
  const [sending, setSending] = useState(false);
  const [sendToAll, setSendToAll] = useState(false);
  const [messagePage, setMessagePage] = useState(1);

  useEffect(() => {
    if (tab === 'send') {
      fetchUsers();
    } else {
      fetchMessages();
    }
  }, [tab, messagePage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?limit=50${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const json = await res.json();
      setUsers(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/messages?page=${messagePage}&limit=20`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const json = await res.json();
      setMessages(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const toggleUserSelection = (user: UserItem) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const openCompose = (mode: 'selected' | 'all') => {
    if (mode === 'all') {
      setSendToAll(true);
    } else {
      setSendToAll(false);
    }
    setComposeData({ title: '', content: '' });
    setShowCompose(true);
  };

  const closeCompose = () => {
    setShowCompose(false);
    setComposeData({ title: '', content: '' });
    setSendToAll(false);
  };

  const handleSend = async () => {
    if (!composeData.title || !composeData.content) {
      alert('请填写标题和内容');
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      alert('请选择至少一个用户');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/messages/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers.map(u => u.id),
          title: composeData.title,
          content: composeData.content,
          sendToAll
        })
      });

      if (!res.ok) throw new Error('Failed to send messages');

      const result = await res.json();
      alert(`成功发送 ${result.sentCount} 条私信`);
      closeCompose();
      setSelectedUsers([]);
      setTab('history');
    } catch (err) {
      console.error(err);
      alert('发送失败');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">私信管理</h1>
      </div>

      {/* Tab 切换 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 md:space-x-8">
          <button
            onClick={() => setTab('send')}
            className={cn(
              "py-3 md:py-4 px-1 border-b-2 font-medium text-sm",
              tab === 'send'
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <Send size={16} className="inline mr-1 md:mr-2" />
            发送私信
          </button>
          <button
            onClick={() => setTab('history')}
            className={cn(
              "py-3 md:py-4 px-1 border-b-2 font-medium text-sm",
              tab === 'history'
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <Mail size={16} className="inline mr-1 md:mr-2" />
            发送历史
          </button>
        </nav>
      </div>

      {tab === 'send' && (
        <>
          {/* 搜索和批量操作 */}
          <div className="bg-white rounded-lg shadow p-3 md:p-4">
            <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3 md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="搜索用户..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  搜索
                </button>
              </div>
              <div className="flex gap-2 md:ml-auto">
                <button
                  onClick={() => openCompose('selected')}
                  disabled={selectedUsers.length === 0}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  <User size={16} />
                  <span className="hidden sm:inline">发送给选中</span>
                  <span>({selectedUsers.length})</span>
                </button>
                <button
                  onClick={() => openCompose('all')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm md:text-base"
                >
                  <Users size={16} />
                  <span className="hidden sm:inline">发送给所有用户</span>
                  <span className="sm:hidden">全部用户</span>
                </button>
              </div>
            </div>
          </div>

          {/* 用户列表 - 桌面端表格 */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                        <input
                          type="checkbox"
                          checked={users?.users.length === selectedUsers.length && users?.users.length > 0}
                          onChange={(e) => {
                            if (e.target.checked && users) {
                              setSelectedUsers(users.users);
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users?.users.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => toggleUserSelection(user)}
                        className={cn(
                          "hover:bg-gray-50 cursor-pointer",
                          selectedUsers.find(u => u.id === user.id) && "bg-indigo-50"
                        )}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={!!selectedUsers.find(u => u.id === user.id)}
                            onChange={() => {}}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                              {user.image ? (
                                <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                              ) : (
                                <User size={16} className="text-indigo-600" />
                              )}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || '未设置'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {users && users.users.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                暂无用户
              </div>
            )}
          </div>

          {/* 用户列表 - 移动端卡片 */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12 bg-white rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              users?.users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => toggleUserSelection(user)}
                  className={cn(
                    "bg-white rounded-lg shadow p-4 cursor-pointer transition-colors",
                    selectedUsers.find(u => u.id === user.id) && "ring-2 ring-indigo-500 bg-indigo-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                      {user.image ? (
                        <img src={user.image} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <User size={20} className="text-indigo-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{user.name || '未设置'}</div>
                      <div className="text-sm text-gray-500 truncate">{user.email}</div>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                      selectedUsers.find(u => u.id === user.id)
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300"
                    )}>
                      {selectedUsers.find(u => u.id === user.id) && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {users && users.users.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                暂无用户
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              {/* 桌面端表格 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">私信内容</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">接收用户</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发送时间</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {messages?.messages.map((msg) => (
                      <tr key={msg.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{msg.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-2 mt-1">{msg.content}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{msg.user.name || '未设置'}</div>
                          <div className="text-xs text-gray-500">{msg.user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(msg.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 移动端卡片 */}
              <div className="md:hidden space-y-3 p-3">
                {messages?.messages.map((msg) => (
                  <div key={msg.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="font-medium text-gray-900">{msg.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-2 mt-1">{msg.content}</div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>接收: {msg.user.name || msg.user.email}</span>
                      <span>{formatDate(msg.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 分页 */}
              {messages && messages.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 md:px-6 py-4 border-t">
                  <div className="text-sm text-gray-500">
                    共 {messages.pagination.total} 条
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMessagePage(p => Math.max(1, p - 1))}
                      disabled={messagePage === 1}
                      className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="px-4 py-2 text-sm flex items-center">
                      {messagePage} / {messages.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setMessagePage(p => Math.min(messages.pagination.totalPages, p + 1))}
                      disabled={messagePage === messages.pagination.totalPages}
                      className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {messages && messages.messages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              暂无发送记录
            </div>
          )}
        </div>
      )}

      {/* 发送私信弹窗 */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">
                {sendToAll ? '发送给所有用户' : `发送给 ${selectedUsers.length} 位用户`}
              </h3>
              <button onClick={closeCompose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!sendToAll && selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.slice(0, 5).map(user => (
                    <span key={user.id} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                      {user.name || user.email}
                    </span>
                  ))}
                  {selectedUsers.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      +{selectedUsers.length - 5} 更多
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={composeData.title}
                  onChange={(e) => setComposeData({ ...composeData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="请输入私信标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                <textarea
                  value={composeData.content}
                  onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="请输入私信内容"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={closeCompose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {sending ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}