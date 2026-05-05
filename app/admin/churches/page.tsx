// app/admin/churches/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Users, BookOpen, Globe, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Church {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  themeColor: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  _count: {
    members: number;
    groupPlans: number;
  };
}

interface ChurchesResponse {
  churches: Church[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminChurchesPage() {
  const [data, setData] = useState<ChurchesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isPublicFilter, setIsPublicFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChurches();
  }, [page, isPublicFilter]);

  const fetchChurches = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        isPublic: isPublicFilter
      });
      const res = await fetch(`/api/admin/churches?${params}`);
      if (!res.ok) throw new Error('Failed to fetch churches');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError('加载教会列表失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchChurches();
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-destructive text-lg">{error}</div>
        <button onClick={fetchChurches} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-apple-focus active:scale-95 transition-all duration-150">重试</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground apple-headline tracking-tight">小组管理</h1>

      <div className="bg-card rounded-lg border border-border p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="搜索小组名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select
            value={isPublicFilter}
            onChange={(e) => { setIsPublicFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-border rounded-lg focus:ring-primary/20 focus:border-primary"
          >
            <option value="">全部类型</option>
            <option value="true">公开小组</option>
            <option value="false">私有小组</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-apple-focus active:scale-95 transition-all duration-150"
          >
            搜索
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.churches.map((church) => (
          <div
            key={church.id}
            className="bg-card rounded-lg border border-border overflow-hidden hover:bg-accent/50 transition-colors"
          >
            <div
              className="h-2"
              style={{ backgroundColor: church.themeColor || '#0066cc' }}
            ></div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground truncate">{church.name}</h3>
                {church.isPublic ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded">
                    <Globe size={12} />
                    公开
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground bg-accent px-2 py-1 rounded">
                    <Lock size={12} />
                    私有
                  </span>
                )}
              </div>

              {church.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{church.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {church._count.members} 成员
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={14} />
                  {church._count.groupPlans} 计划
                </span>
              </div>

              <div className="flex items-center text-xs text-muted-foreground">
                <span>创建者: {church.owner.name || church.owner.email}</span>
                <span className="mx-2">·</span>
                <span>{new Date(church.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data && data.churches.length === 0 && (
        <div className="text-center py-12 text-muted-foreground apple-body">
          暂无小组数据
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="bg-card rounded-lg border border-border px-4 py-3 flex items-center justify-between sm:px-6">
          <div className="text-sm text-foreground">
            共 {data.pagination.total} 条记录
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
              {page} / {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
              className="p-2 rounded border border-border disabled:opacity-50 transition-all duration-150 active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
