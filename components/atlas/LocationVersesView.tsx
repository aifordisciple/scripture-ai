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
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {t('atlas.relatedVersesOf', { locationName })}
        </h3>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
            <span className="text-gray-500">{t('atlas.loadingVerses')}</span>
          </div>
        ) : verses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {t('atlas.noRelatedVerses')}
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-4">
              {t('atlas.foundVersesCount', { count: verses.length })}
            </div>
            {verses.map((verse, index) => (
              <div
                key={`${verse.bookId}-${verse.chapter}-${verse.verse}`}
                className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700"
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
                  className="flex items-center gap-2 mb-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <BookOpen className="w-4 h-4" />
                  {verse.bookId} {verse.chapter}:{verse.verse}
                  {verse.verseEnd && verse.verseEnd !== verse.verse ? `-${verse.verseEnd}` : ''}
                </button>
                {/* 经文内容 */}
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {verse.content}
                </p>
              </div>
            ))}

            {/* 加载更多 */}
            {hasMore && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
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