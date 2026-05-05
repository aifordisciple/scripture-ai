// app/admin/announcements/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Edit2, Eye, EyeOff, Calendar, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/lib/i18n';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'maintenance';
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminAnnouncementsPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'maintenance',
    startDate: '',
    endDate: '',
    isActive: true
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/announcements');
      if (!res.ok) throw new Error('Failed to fetch announcements');
      const data = await res.json();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
      setError(t('admin.loadAnnouncementsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      startDate: '',
      endDate: '',
      isActive: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      addToast({ type: 'error', message: t('admin.fillRequiredFields') });
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/announcements/${editingId}`
        : '/api/admin/announcements';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to save announcement');

      addToast({
        type: 'success',
        message: editingId ? t('admin.announcementUpdated') : t('admin.announcementCreated')
      });
      resetForm();
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: t('admin.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      startDate: announcement.startDate ? announcement.startDate.split('T')[0] : '',
      endDate: announcement.endDate ? announcement.endDate.split('T')[0] : '',
      isActive: announcement.isActive
    });
    setEditingId(announcement.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmDeleteAnnouncement'))) return;

    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete announcement');

      addToast({ type: 'success', message: t('admin.announcementDeleted') });
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: t('admin.deleteFailed') });
    }
  };

  const toggleActive = async (announcement: Announcement) => {
    try {
      const res = await fetch(`/api/admin/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...announcement, isActive: !announcement.isActive })
      });

      if (!res.ok) throw new Error('Failed to toggle announcement');

      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: t('admin.updateFailed') });
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'maintenance':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'warning': return t('admin.warning');
      case 'maintenance': return t('admin.maintenance');
      default: return t('admin.info');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066cc]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground apple-headline">{t('admin.announcementManagement')}</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0066cc] text-white rounded-lg hover:bg-[#0071e3] transition-all duration-fast active:scale-95 min-h-[44px]"
        >
          <Plus size={18} />
          {t('admin.createAnnouncement')}
        </button>
      </div>

      {/* [P2-18修复] 错误状态 */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
          <Megaphone size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 公告列表 */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={cn(
              "bg-card rounded-lg border border-border p-4 transition-colors",
              !announcement.isActive && "opacity-60"
            )}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                  <span className={cn(
                    "px-2 py-0.5 text-xs font-semibold rounded-full",
                    getTypeStyle(announcement.type)
                  )}>
                    {getTypeLabel(announcement.type)}
                  </span>
                  {!announcement.isActive && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent text-muted-foreground">
                      {t('admin.inactive')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{announcement.content}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {t('admin.created')}: {new Date(announcement.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                  {announcement.startDate && (
                    <span>{t('admin.start')}: {new Date(announcement.startDate).toLocaleDateString('zh-CN')}</span>
                  )}
                  {announcement.endDate && (
                    <span>{t('admin.end')}: {new Date(announcement.endDate).toLocaleDateString('zh-CN')}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(announcement)}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-fast active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center",
                    announcement.isActive
                      ? "text-green-600 dark:text-green-400 hover:bg-green-500/10"
                      : "text-muted-foreground hover:bg-accent/50"
                  )}
                  title={announcement.isActive ? t('admin.deactivate') : t('admin.activate')}
                >
                  {announcement.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button
                  onClick={() => handleEdit(announcement)}
                  className="p-2 text-[#0066cc] hover:bg-[#0066cc]/10 rounded-lg transition-all duration-fast active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-fast active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-12 text-muted-foreground apple-body">
            {t('admin.noAnnouncements')}
          </div>
        )}
      </div>

      {/* 创建/编辑公告弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <h3 className="text-lg font-semibold">
                {editingId ? t('admin.editAnnouncement') : t('admin.createAnnouncement')}
              </h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground transition-all duration-fast active:scale-95">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">{t('admin.title')} *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-[#0066cc]"
                  placeholder={t('admin.announcementTitlePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">{t('admin.content')} *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-[#0066cc]"
                  placeholder={t('admin.announcementContentPlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">{t('admin.type')}</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'info' | 'warning' | 'maintenance' })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-[#0066cc]"
                >
                  <option value="info">{t('admin.info')}</option>
                  <option value="warning">{t('admin.warning')}</option>
                  <option value="maintenance">{t('admin.maintenance')}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">{t('admin.startDate')}</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-[#0066cc]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">{t('admin.endDate')}</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-[#0066cc]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-[#0066cc] focus:ring-primary"
                />
                <label className="text-sm font-semibold text-foreground">{t('admin.publishImmediately')}</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-foreground bg-accent rounded-lg hover:bg-accent/80 transition-all duration-fast active:scale-95 min-h-[44px]"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#0066cc] text-white rounded-lg hover:bg-[#0071e3] disabled:opacity-50 transition-all duration-fast active:scale-95 min-h-[44px]"
                >
                  {saving ? t('admin.saving') : (editingId ? t('admin.update') : t('admin.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}