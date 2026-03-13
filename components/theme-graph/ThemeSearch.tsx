'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Hash, Loader2 } from 'lucide-react';
import { useBibleStore } from '@/store/useBibleStore';

interface Theme {
  id: string;
  nameZh: string;
  nameEn?: string;
  category: string;
  verseCount: number;
}

interface ThemeSearchProps {
  onSelectTheme: (theme: Theme) => void;
}

export default function ThemeSearch({ onSelectTheme }: ThemeSearchProps) {
  const { themeSearchQuery, setThemeSearchQuery, isDarkMode } = useBibleStore();
  const [results, setResults] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 搜索主题
  const searchThemes = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/themes?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      setResults(data.themes || []);
    } catch (error) {
      console.error('Failed to search themes:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (themeSearchQuery) {
        searchThemes(themeSearchQuery);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [themeSearchQuery, searchThemes]);

  const handleSelect = (theme: Theme) => {
    onSelectTheme(theme);
    setThemeSearchQuery('');
    setResults([]);
    setShowResults(false);
  };

  const categoryColors: Record<string, string> = {
    THEOLOGICAL: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    ETHICAL: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    HISTORICAL: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    PROPHETIC: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={themeSearchQuery}
          onChange={(e) => {
            setThemeSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="搜索主题..."
          className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* 搜索结果下拉 */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleSelect(theme)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
            >
              <Hash className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {theme.nameZh}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  {theme.nameEn && <span>{theme.nameEn}</span>}
                  <span className="text-xs">{theme.verseCount} 处经文</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${categoryColors[theme.category] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {theme.category}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 点击外部关闭 */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}