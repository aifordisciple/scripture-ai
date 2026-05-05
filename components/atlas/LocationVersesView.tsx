'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { useBibleStore } from '@/store/useBibleStore';
import { useTranslation } from '@/lib/i18n';

interface VerseInfo {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
  content: string;
}

interface LocationVersesViewProps {
  locationId: string;
  locationName: string;
  onBack: () => void;
}

export default function LocationVersesView({ locationId, locationName, onBack }: LocationVersesViewProps) {
  const { t } = useTranslation();
  const { setBook, setChapter, setAtlasPanelOpen, setActiveTab, tabs } = useBibleStore();
  const [verses, setVerses] = useState<VerseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // 获取相关经文
  useEffect(() => {
    async function fetchVerses() {
      try {
        const res = await fetch(`/api/atlas/verse-locations?locationId=${locationId}&page=${page}`);
        const data = await res.json();
        if (page === 1) {
          setVerses(data.verseLocations || []);
        } else {
          setVerses(prev => [...prev, ...(data.verseLocations || [])]);
        }
        setHasMore((data.verseLocations?.length || 0) >= 20);
      } catch (error) {
        console.error('Failed to fetch verses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchVerses();
  }, [locationId, page]);

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e0e0e0] dark:border-[#3a3a3c]">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c] text-[#7a7a7a] active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-[#1d1d1f] dark:text-white">
          {t('atlas.relatedVersesOf', { locationName })}
        </h3>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#0066cc] mr-2" />
            <span className="text-[#7a7a7a]">{t('atlas.loadingVerses')}</span>
          </div>
        ) : verses.length === 0 ? (
          <div className="text-center py-8 text-[#7a7a7a]">
            {t('atlas.noRelatedVerses')}
          </div>
        ) : (
          <>
            <div className="text-sm text-[#7a7a7a] mb-4">
              {t('atlas.foundVersesCount', { count: verses.length })}
            </div>
            {verses.map((verse, index) => (
              <div
                key={`${verse.bookId}-${verse.chapter}-${verse.verse}`}
                className="p-3 bg-[#f5f5f7] dark:bg-[#1d1d1f] rounded-lg border border-[#e0e0e0] dark:border-[#3a3a3c]"
              >
                {/* 经文出处 */}
                <button
                  onClick={() => {
                    setBook(verse.bookId);
                    setChapter(verse.chapter);
                    const readTab = tabs.find(t => t.type === 'read');
                    if (readTab) setActiveTab(readTab.id);
                    setAtlasPanelOpen(false);
                    onBack();
                  }}
                  className="flex items-center gap-2 mb-2 text-sm font-medium text-[#0066cc] dark:text-[#4d9fe0] hover:underline active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  {verse.bookId} {verse.chapter}:{verse.verse}
                  {verse.verseEnd && verse.verseEnd !== verse.verse ? `-${verse.verseEnd}` : ''}
                </button>
                {/* 经文内容 */}
                <p className="text-sm text-[#1d1d1f] dark:text-[#e0e0e0] leading-relaxed">
                  {verse.content}
                </p>
              </div>
            ))}

            {/* 加载更多 */}
            {hasMore && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="w-full py-2 text-sm text-[#0066cc] dark:text-[#4d9fe0] hover:bg-[#0066cc]/10 dark:hover:bg-[#0066cc]/20 rounded-lg active:scale-95"
              >
                {t('atlas.foundVersesCount', { count: verses.length })}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}