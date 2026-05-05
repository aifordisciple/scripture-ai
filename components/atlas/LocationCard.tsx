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
    <div className="relative bg-card dark:bg-card rounded-lg border border-border dark:border-border overflow-hidden z-[9999]">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-border dark:border-border">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary dark:text-primary" />
          <h3 className="font-semibold text-foreground dark:text-foreground">{location.nameZh}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-accent dark:hover:bg-apple-tile3 text-muted-foreground active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 内容 */}
      <div className="p-4 space-y-3">
        {/* 英文名 */}
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">
          {location.nameEn}
        </div>

        {/* 区域 */}
        {location.region && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary text-xs rounded-full">
              {location.region}
            </span>
            {location.modernCountry && (
              <span className="px-2 py-0.5 bg-secondary dark:bg-apple-tile3 text-foreground dark:text-muted-foreground text-xs rounded-full">
                {location.modernCountry}
              </span>
            )}
          </div>
        )}

        {/* 描述 */}
        {location.description && (
          <p className="text-sm text-foreground dark:text-muted-foreground">
            {location.description}
          </p>
        )}

        {/* 圣经意义 */}
        {location.significance && (
          <div className="pt-2 border-t border-border dark:border-border">
            <div className="text-xs text-muted-foreground mb-1">{t('atlas.biblicalSignificance')}</div>
            <p className="text-sm text-foreground dark:text-muted-foreground">
              {location.significance}
            </p>
          </div>
        )}

        {/* 相关经文 */}
        {loading ? (
          <div className="text-xs text-muted-foreground">{t('atlas.loadingRelatedVerses')}</div>
        ) : verseLocations.length > 0 && (
          <div className="pt-2 border-t border-border dark:border-border">
            <div className="text-xs text-muted-foreground mb-2">{t('atlas.relatedVerses')}</div>
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
                  className="px-2 py-0.5 bg-secondary dark:bg-apple-tile3 text-foreground dark:text-muted-foreground text-xs rounded cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary transition-colors active:scale-95"
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
          className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary dark:text-primary bg-primary/10 dark:bg-primary/20 rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors active:scale-95"
        >
          <BookOpen className="w-4 h-4" />
          {t('atlas.viewAllRelatedVerses')}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}