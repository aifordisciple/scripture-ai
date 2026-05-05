'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, BookOpen, ChevronRight } from 'lucide-react';
import { useBibleStore } from '@/store/useBibleStore';
import { useTranslation } from '@/lib/i18n';

interface VerseLocation {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
}

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
  const { t } = useTranslation();
  const { isDarkMode, setBook, setChapter, setAtlasPanelOpen, setActiveTab, tabs, setViewingLocationVerses } = useBibleStore();
  const [verseLocations, setVerseLocations] = useState<VerseLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取相关经文
  useEffect(() => {
    async function fetchVerses() {
      try {
        const res = await fetch(`/api/atlas/verse-locations?locationId=${location.id}`);
        const data = await res.json();
        setVerseLocations(data.verseLocations?.slice(0, 5) || []);
      } catch (error) {
        console.error('Failed to fetch verses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchVerses();
  }, [location.id]);

  // 查看相关经文 - 显示经文列表视图
  const handleViewVerses = () => {
    setViewingLocationVerses({
      locationId: location.id,
      locationName: location.nameZh,
    });
  };

  return (
    <div className="relative bg-white dark:bg-[#272729] rounded-lg border border-[#e0e0e0] dark:border-[#3a3a3c] overflow-hidden z-[9999]">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-[#e0e0e0] dark:border-[#3a3a3c]">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#0066cc] dark:text-[#4d9fe0]" />
          <h3 className="font-semibold text-[#1d1d1f] dark:text-white">{location.nameZh}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c] text-[#7a7a7a] active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 内容 */}
      <div className="p-4 space-y-3">
        {/* 英文名 */}
        <div className="text-sm text-[#7a7a7a] dark:text-[#7a7a7a]">
          {location.nameEn}
        </div>

        {/* 区域 */}
        {location.region && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#0066cc]/10 dark:bg-[#0066cc]/20 text-[#0066cc] dark:text-[#4d9fe0] text-xs rounded-full">
              {location.region}
            </span>
            {location.modernCountry && (
              <span className="px-2 py-0.5 bg-[#f5f5f7] dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#7a7a7a] text-xs rounded-full">
                {location.modernCountry}
              </span>
            )}
          </div>
        )}

        {/* 描述 */}
        {location.description && (
          <p className="text-sm text-[#1d1d1f] dark:text-[#e0e0e0]">
            {location.description}
          </p>
        )}

        {/* 圣经意义 */}
        {location.significance && (
          <div className="pt-2 border-t border-[#e0e0e0] dark:border-[#3a3a3c]">
            <div className="text-xs text-[#7a7a7a] mb-1">{t('atlas.biblicalSignificance')}</div>
            <p className="text-sm text-[#1d1d1f] dark:text-[#e0e0e0]">
              {location.significance}
            </p>
          </div>
        )}

        {/* 相关经文 */}
        {loading ? (
          <div className="text-xs text-[#7a7a7a]">{t('atlas.loadingRelatedVerses')}</div>
        ) : verseLocations.length > 0 && (
          <div className="pt-2 border-t border-[#e0e0e0] dark:border-[#3a3a3c]">
            <div className="text-xs text-[#7a7a7a] mb-2">{t('atlas.relatedVerses')}</div>
            <div className="flex flex-wrap gap-1">
              {verseLocations.map((vl, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setBook(vl.bookId);
                    setChapter(vl.chapter);
                    const readTab = tabs.find(t => t.type === 'read');
                    if (readTab) setActiveTab(readTab.id);
                    setAtlasPanelOpen(false);
                    onClose();
                  }}
                  className="px-2 py-0.5 bg-[#f5f5f7] dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#7a7a7a] text-xs rounded cursor-pointer hover:bg-[#0066cc]/10 dark:hover:bg-[#0066cc]/20 hover:text-[#0066cc] dark:hover:text-[#4d9fe0] transition-colors active:scale-95"
                >
                  {vl.bookId} {vl.chapter}:{vl.verse}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <div className="flex gap-2 p-4 pt-0">
        <button
          onClick={handleViewVerses}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#0066cc] dark:text-[#4d9fe0] bg-[#0066cc]/10 dark:bg-[#0066cc]/20 rounded-lg hover:bg-[#0066cc]/20 dark:hover:bg-[#0066cc]/30 transition-colors active:scale-95"
        >
          <BookOpen className="w-4 h-4" />
          {t('atlas.viewAllRelatedVerses')}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}