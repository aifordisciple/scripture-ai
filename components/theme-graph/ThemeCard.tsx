'use client';

import { useState, useEffect } from 'react';
import { X, Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react';
import { useBibleStore } from '@/store/useBibleStore';

interface ThemeCardProps {
  theme: {
    id: string;
    nameZh: string;
    nameEn?: string;
    category: string;
    summary?: string;
    description?: string;
    verseCount: number;
  };
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave: () => void;
}

const categoryLabels: Record<string, string> = {
  THEOLOGICAL: '神学主题',
  ETHICAL: '伦理主题',
  HISTORICAL: '历史主题',
  PROPHETIC: '预言主题',
};

const categoryColors: Record<string, string> = {
  THEOLOGICAL: 'indigo',
  ETHICAL: 'emerald',
  HISTORICAL: 'amber',
  PROPHETIC: 'red',
};

export default function ThemeCard({ theme, onClose, isSaved, onToggleSave }: ThemeCardProps) {
  const { isDarkMode } = useBibleStore();
  const color = categoryColors[theme.category] || 'indigo';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-${color}-500`} />
          <h3 className="font-semibold text-gray-900 dark:text-white">{theme.nameZh}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSave}
            className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isSaved ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
            }`}
            title={isSaved ? '取消收藏' : '收藏主题'}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4 space-y-3">
        {/* 英文名和分类 */}
        <div className="flex items-center gap-2">
          {theme.nameEn && (
            <span className="text-sm text-gray-500 dark:text-gray-400">{theme.nameEn}</span>
          )}
          <span className={`px-2 py-0.5 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 text-xs rounded-full`}>
            {categoryLabels[theme.category] || theme.category}
          </span>
        </div>

        {/* 经文数量 */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          共 {theme.verseCount} 处经文
        </div>

        {/* 摘要 */}
        {theme.summary && (
          <p className="text-sm text-gray-600 dark:text-gray-300">{theme.summary}</p>
        )}

        {/* 描述 */}
        {theme.description && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-400 mb-1">详细说明</div>
            <p className="text-sm text-gray-700 dark:text-gray-200">{theme.description}</p>
          </div>
        )}

        {/* 相关经文 */}
        <ThemeVerses themeId={theme.id} />
      </div>

      {/* 底部操作 */}
      <div className="flex gap-2 p-4 pt-0">
        <button
          onClick={() => {
            // TODO: 在阅读器中打开相关经文
          }}
          className="flex-1 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
        >
          查看相关经文
        </button>
      </div>
    </div>
  );
}

// 主题相关经文组件
function ThemeVerses({ themeId }: { themeId: string }) {
  const [verseLinks, setVerseLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVerses() {
      try {
        const res = await fetch(`/api/themes/verses?themeId=${themeId}&limit=5`);
        const data = await res.json();
        setVerseLinks(data.verseLinks?.slice(0, 5) || []);
      } catch (error) {
        console.error('Failed to fetch theme verses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchVerses();
  }, [themeId]);

  if (loading) {
    return <div className="text-xs text-gray-400">加载相关经文...</div>;
  }

  if (verseLinks.length === 0) {
    return null;
  }

  return (
    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
      <div className="text-xs text-gray-400 mb-2">主要经文</div>
      <div className="flex flex-wrap gap-1">
        {verseLinks.map((link, index) => (
          <span
            key={index}
            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {link.bookId} {link.chapter}:{link.verseStart}
          </span>
        ))}
      </div>
    </div>
  );
}