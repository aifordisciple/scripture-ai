// app/admin/messages/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, Send, X, Mail, User, Users, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation();
  const { addToast } = useToast();
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'send') {
      fetchUsers();
    } else {
      fetchMessages();
    }
  }, [tab, messagePage]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?limit=50${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const json = await res.json();
      setUsers(json);
    } catch (err) {
      console.error(err);
      setError(t('admin.loadUsersFailedRefresh'));
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/messages?page=${messagePage}&limit=20`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const json = await res.json();
      setMessages(json);
    } catch (err) {
      console.error(err);
      setError(t('admin.loadMessagesFailedRefresh'));
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
      addToast({ type: 'error', message: t('admin.fillTitleAndContent') });
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      addToast({ type: 'error', message: t('admin.selectAtLeastOneUser') });
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
      addToast({ type: 'success', message: t('admin.sentCountMessages', { count: result.sentCount }) });
      closeCompose();
      setSelectedUsers([]);
      setTab('history');
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: t('admin.sendFailed') });
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
        <h1 className="text-xl md:text-2xl font-semibold text-foreground apple-headline">{t('admin.messageManagement')}</h1>
      </div>

      {/* Tab 切换 */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-4 md:space-x-8">
          <button
            onClick={() => setTab('send')}
            className={cn(
              "py-3 md:py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-150 active:scale-95",
              tab === 'send'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Send size={16} className="inline mr-1 md:mr-2" />
            {t('admin.sendMessage')}
          </button>
          <button
            onClick={() => setTab('history')}
            className={cn(
              "py-3 md:py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-150 active:scale-95",
              tab === 'history'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Mail size={16} className="inline mr-1 md:mr-2" />
            {t('admin.sendHistory')}
          </button>
        </nav>
      </div>

      {tab === 'send' && (
        <>
          {/* [P2-18修复] 错误状态 */}
          {error && !users && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 bg-card rounded-lg border border-border">
              <div className="text-destructive">{error}</div>
              <button onClick={fetchUsers} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-apple-focus active:scale-95 transition-all duration-150">{t('admin.retry')}</button>
            </div>
          )}

          {/* 搜索和批量操作 */}
          <div className="bg-card rounded-lg border border-border p-3 md:p-4">
            <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3 md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('admin.searchUsers')}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-all duration-150 active:scale-95"
                >
                  {t('admin.search')}
                </button>
              </div>
              <div className="flex gap-2 md:ml-auto">
                <button
                  onClick={() => openCompose('selected')}
                  disabled={selectedUsers.length === 0}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-primary text-white rounded-lg hover:bg-apple-focus disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-95 text-sm md:text-base min-h-[44px]"
                >
                  <User size={16} />
                  <span className="hidden sm:inline">{t('admin.sendToSelected')}</span>
                  <span>({selectedUsers.length})</span>
                </button>
                <button
                  onClick={() => openCompose('all')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-150 active:scale-95 text-sm md:text-base min-h-[44px]"
                >
                  <Users size={16} />
                  <span className="hidden sm:inline">{t('admin.sendToAllUsers')}</span>
                  <span className="sm:hidden">{t('admin.allUsers')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 用户列表 - 桌面端表格 */}
          <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-8">
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin.user')}</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin.email')}</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin.registered')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {users?.users.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => toggleUserSelection(user)}
                        className={cn(
                          "hover:bg-accent/50 cursor-pointer transition-colors min-h-[44px]",
                          selectedUsers.find(u => u.id === user.id) && "bg-primary/10"
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
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {user.image ? (
                                <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                              ) : (
                                <User size={16} className="text-primary" />
                              )}
                            </div>
                            <div className="text-sm font-semibold text-foreground">
                              {user.name || t('admin.notSet')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {users && users.users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground apple-body">
                {t('admin.noUsers')}
              </div>
            )}
          </div>

          {/* 用户列表 - 移动端卡片 */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12 bg-card rounded-lg border border-border">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              users?.users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => toggleUserSelection(user)}
                  className={cn(
                    "bg-card rounded-lg border border-border p-4 cursor-pointer transition-all duration-150 min-h-[44px]",
                    selectedUsers.find(u => u.id === user.id) && "ring-2 ring-primary bg-primary/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {user.image ? (
                        <img src={user.image} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <User size={20} className="text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">{user.name || t('admin.notSet')}</div>
                      <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                      selectedUsers.find(u => u.id === user.id)
                        ? "bg-primary border-primary"
                        : "border-border"
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
              <div className="text-center py-12 text-muted-foreground apple-body bg-card rounded-lg border border-border">
                {t('admin.noUsers')}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'history' && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {/* [P2-18修复] 错误状态 */}
          {error && !messages ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="text-destructive">{error}</div>
              <button onClick={fetchMessages} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-apple-focus transition-all duration-150 active:scale-95">{t('admin.retry')}</button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* 桌面端表格 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin.messageContent')}</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin.recipient')}</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin.sentAt')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {messages?.messages.map((msg) => (
                      <tr key={msg.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-foreground">{msg.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{msg.content}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">{msg.user.name || t('admin.notSet')}</div>
                          <div className="text-xs text-muted-foreground">{msg.user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
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
                  <div key={msg.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="font-semibold text-foreground">{msg.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{msg.content}</div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{t('admin.toColon')} {msg.user.name || msg.user.email}</span>
                      <span>{formatDate(msg.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 分页 */}
              {messages && messages.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 md:px-6 py-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    {t('admin.totalCount', { count: messages.pagination.total })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMessagePage(p => Math.max(1, p - 1))}
                      disabled={messagePage === 1}
                      className="p-2 border border-border rounded-lg hover:bg-accent/50 disabled:opacity-50 transition-all duration-150 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="px-4 py-2 text-sm flex items-center">
                      {messagePage} / {messages.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setMessagePage(p => Math.min(messages.pagination.totalPages, p + 1))}
                      disabled={messagePage === messages.pagination.totalPages}
                      className="p-2 border border-border rounded-lg hover:bg-accent/50 disabled:opacity-50 transition-all duration-150 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {messages && messages.messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground apple-body">
              {t('admin.noSentMessages')}
            </div>
          )}
        </div>
      )}

      {/* 发送私信弹窗 */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-semibold">
                {sendToAll ? t('admin.sendToAllUsers') : t('admin.sendToCountUsers', { count: selectedUsers.length })}
              </h3>
              <button onClick={closeCompose} className="text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-95">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!sendToAll && selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.slice(0, 5).map(user => (
                    <span key={user.id} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                      {user.name || user.email}
                    </span>
                  ))}
                  {selectedUsers.length > 5 && (
                    <span className="px-2 py-1 bg-accent text-muted-foreground rounded text-xs">
                      +{selectedUsers.length - 5} {t('admin.more')}
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">{t('admin.title')}</label>
                <input
                  type="text"
                  value={composeData.title}
                  onChange={(e) => setComposeData({ ...composeData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder={t('admin.messageTitlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">{t('admin.content')}</label>
                <textarea
                  value={composeData.content}
                  onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder={t('admin.messageContentPlaceholder')}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-border sticky bottom-0 bg-card z-10">
              <button
                onClick={closeCompose}
                className="px-4 py-2 text-foreground bg-accent rounded-lg hover:bg-accent/80 transition-all duration-150 active:scale-95 min-h-[44px]"
              >
                {t('admin.cancel')}
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-apple-focus disabled:opacity-50 transition-all duration-150 active:scale-95 min-h-[44px]"
              >
                {sending ? t('admin.sending') : t('admin.send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}