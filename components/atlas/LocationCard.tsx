'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, ExternalLink } from 'lucide-react';
import { useBibleStore } from '@/store/useBibleStore';

interface LocationCardProps {
  location: {
    id: string;
    nameZh: string;
    nameEn: string;
    region?: string;
    description?: string;
    significance?: string;
    modernCountry?: string;
  };
  onClose: () => void;
}

export default function LocationCard({ location, onClose }: LocationCardProps) {
  const { isDarkMode } = useBibleStore();

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[9999]">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">{location.nameZh}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 内容 */}
      <div className="p-4 space-y-3">
        {/* 英文名 */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {location.nameEn}
        </div>

        {/* 区域 */}
        {location.region && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
              {location.region}
            </span>
            {location.modernCountry && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                {location.modernCountry}
              </span>
            )}
          </div>
        )}

        {/* 描述 */}
        {location.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {location.description}
          </p>
        )}

        {/* 圣经意义 */}
        {location.significance && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-400 mb-1">圣经意义</div>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              {location.significance}
            </p>
          </div>
        )}

        {/* 相关经文 */}
        <LocationVerses locationId={location.id} />
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

// 地点相关经文组件
function LocationVerses({ locationId }: { locationId: string }) {
  const [verseLocations, setVerseLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVerses() {
      try {
        const res = await fetch(`/api/atlas/verse-locations?locationId=${locationId}`);
        const data = await res.json();
        setVerseLocations(data.verseLocations?.slice(0, 5) || []);
      } catch (error) {
        console.error('Failed to fetch verses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchVerses();
  }, [locationId]);

  if (loading) {
    return <div className="text-xs text-gray-400">加载相关经文...</div>;
  }

  if (verseLocations.length === 0) {
    return null;
  }

  return (
    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
      <div className="text-xs text-gray-400 mb-2">相关经文</div>
      <div className="flex flex-wrap gap-1">
        {verseLocations.map((vl, index) => (
          <span
            key={index}
            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {vl.bookId} {vl.chapter}:{vl.verse}
          </span>
        ))}
      </div>
    </div>
  );
}