// app/admin/announcements/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, AlertTriangle, Info, Bell, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateClient } from '@/lib/locale';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdBy: string;
  createdAt: string;
  creator?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface AnnouncementsResponse {
  announcements: Announcement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminAnnouncementsPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [data, setData] = useState<AnnouncementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'INFO',
    isActive: true,
    startsAt: '',
    endsAt: '',
    sendNotification: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/announcements');
      if (!res.ok) throw new Error('Failed to fetch announcements');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(t('admin.loadAnnouncementsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (announcement?: Announcement) => {
    if (announcement) {
      setEditingId(announcement.id);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        isActive: announcement.isActive,
        startsAt: announcement.startsAt ? announcement.startsAt.slice(0, 16) : '',
        endsAt: announcement.endsAt ? announcement.endsAt.slice(0, 16) : '',
        sendNotification: false
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        content: '',
        type: 'INFO',
        isActive: true,
        startsAt: '',
        endsAt: '',
        sendNotification: false
      });
    }
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      type: 'INFO',
      isActive: true,
      startsAt: '',
      endsAt: '',
      sendNotification: false
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      addToast({ type: 'error', message: t('admin.fillTitleAndContent') });
      return;
    }

    setSaving(true);
    try {
      const url = '/api/admin/announcements';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Failed to save announcement');

      closeEditor();
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: t('admin.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAnnouncement = async () => {
    if (!pendingDeleteId) return;
    setShowDeleteConfirm(false);

    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete announcement');
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: t('admin.deleteFailed') });
    }
  };

  const toggleActive = async (announcement: Announcement) => {
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: announcement.id,
          isActive: !announcement.isActive
        })
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'MAINTENANCE':
        return <Bell size={16} className="text-red-600" />;
      default:
        return <Info size={16} className="text-blue-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'WARNING':
        return t('admin.warning');
      case 'MAINTENANCE':
        return t('admin.maintenance');
      default:
        return t('admin.info');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-700';
      case 'MAINTENANCE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
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
        <button onClick={fetchAnnouncements} className="px-4 py-2 bg-[#0066cc] text-white rounded-lg hover:bg-[#0071e3] active:scale-95 transition-colors">{t('admin.retry')}</button>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">{t('admin.announcementManagement')}</h1>
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#0066cc] text-white rounded-lg hover:bg-[#0071e3] active:scale-95 transition-colors text-sm md:text-base"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t('admin.newAnnouncement')}</span>
          <span className="sm:hidden">{t('admin.newBtn')}</span>
        </button>
      </div>

      {/* 公告列表 - 桌面端表格 */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.announcement')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.type')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.time')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data?.announcements.map((announcement) => (
                <tr key={announcement.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{announcement.title}</div>
                    <div className="text-sm text-slate-500 line-clamp-1">{announcement.content}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(announcement.type)}
                      <span className="text-sm text-slate-600">{getTypeLabel(announcement.type)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(announcement)}
                      className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        announcement.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {announcement.isActive ? t('admin.enabled') : t('admin.disabled')}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDateClient(new Date(announcement.createdAt))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditor(announcement)}
                      className="text-[#0066cc] hover:text-[#0071e3] mr-3 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.announcements.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            {t('admin.noAnnouncements')}
          </div>
        )}
      </div>

      {/* 公告列表 - 移动端卡片 */}
      <div className="md:hidden space-y-3">
        {data?.announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full",
                    getTypeColor(announcement.type)
                  )}>
                    {getTypeLabel(announcement.type)}
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full",
                    announcement.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  )}>
                    {announcement.isActive ? t('admin.enabled') : t('admin.disabled')}
                  </span>
                </div>
                <h3 className="font-medium text-slate-900 truncate">{announcement.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mt-1">{announcement.content}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {formatDateClient(new Date(announcement.createdAt))}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(announcement)}
                  className="text-xs px-2 py-1 rounded text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {announcement.isActive ? t('admin.disable') : t('admin.enable')}
                </button>
                <button
                  onClick={() => openEditor(announcement)}
                  className="p-1.5 text-[#0066cc] hover:bg-[#0066cc]/10 rounded transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {data && data.announcements.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-xl">
            {t('admin.noAnnouncements')}
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      {showEditor && (
        <div className="bg-black/50 fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">
                {editingId ? t('admin.editAnnouncement') : t('admin.newAnnouncement')}
              </h3>
              <button onClick={closeEditor} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.title')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0066cc]/20 focus:border-[#0066cc]"
                  placeholder={t('admin.announcementTitlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.content')}</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0066cc]/20 focus:border-[#0066cc]"
                  placeholder={t('admin.announcementContentPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.type')}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0066cc]/20 focus:border-[#0066cc]"
                  >
                    <option value="INFO">{t('admin.info')}</option>
                    <option value="WARNING">{t('admin.warning')}</option>
                    <option value="MAINTENANCE">{t('admin.maintenance')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.status')}</label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0066cc]/20 focus:border-[#0066cc]"
                  >
                    <option value="true">{t('admin.enable')}</option>
                    <option value="false">{t('admin.disable')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.startTimeOptional')}</label>
                  <input
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0066cc]/20 focus:border-[#0066cc]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.endTimeOptional')}</label>
                  <input
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-[#0066cc]/20 focus:border-[#0066cc]"
                  />
                </div>
              </div>

              {/* 推送通知选项 - 仅新建时显示 */}
              {!editingId && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="sendNotification"
                    checked={formData.sendNotification}
                    onChange={(e) => setFormData({ ...formData, sendNotification: e.target.checked })}
                    className="w-4 h-4 text-[#0066cc] border-slate-300 rounded focus:ring-[#0066cc]/20"
                  />
                  <label htmlFor="sendNotification" className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <BellRing size={16} className="text-[#0066cc]" />
                    {t('admin.pushNotificationOnPublish')}
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={closeEditor}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                {t('admin.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#0066cc] text-white rounded-lg hover:bg-[#0071e3] active:scale-95 disabled:opacity-50 transition-colors"
              >
                {saving ? t('admin.saving') : t('admin.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    <ConfirmDialog
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title={t('admin.confirmDeleteAnnouncement')}
      description={t('admin.deleteAnnouncementWarning')}
      onConfirm={confirmDeleteAnnouncement}
    />
    </>
  );
}