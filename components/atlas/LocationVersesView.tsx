'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Loader2, MapPin } from 'lucide-react';
import { useBibleStore } from '@/store/useBibleStore';

interface LocationVersesViewProps {
  locationId: string;
  locationName: string;
  onBack: () => void;
}

interface VerseLocation {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  content: string;
}

export default function LocationVersesView({ locationId, locationName, onBack }: LocationVersesViewProps) {
  const { fontSize, lineHeight, tabs, addTab, setActiveTab, setScrollToVerse, setBook, setChapter } = useBibleStore();
  const [verses, setVerses] = useState<VerseLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVerses() {
      setLoading(true);
      try {
        // 获取地点相关的经文引用
        const res = await fetch(`/api/atlas/verse-locations?locationId=${locationId}`);
        const data = await res.json();
        const verseLocations = data.verseLocations || [];

        if (verseLocations.length === 0) {
          setVerses([]);
          setLoading(false);
          return;
        }

        // 获取经文内容
        const versePromises = verseLocations.map(async (vl: any) => {
          const verseRes = await fetch(
            `/api/bible?bookId=${vl.bookId}&chapter=${vl.chapter}&version=CUV`
          );
          const verseData = await verseRes.json();
          const verseContent = verseData.verses?.find((v: any) => v.verse === vl.verse);
          return {
            id: `${vl.bookId}-${vl.chapter}-${vl.verse}`,
            bookId: vl.bookId,
            bookName: vl.bookName || vl.bookId,
            chapter: vl.chapter,
            verse: vl.verse,
            content: verseContent?.content || '',
          };
        });

        const results = await Promise.all(versePromises);
        setVerses(results.filter(v => v.content));
      } catch (error) {
        console.error('Failed to fetch verses:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVerses();
  }, [locationId]);

  const handleVerseClick = (bookId: string, chapter: number, verse: number) => {
    setScrollToVerse(verse);
    setBook(bookId);
    setChapter(chapter);

    const readTab = tabs.find(t => t.type === 'read');
    if (readTab) {
      setActiveTab(readTab.id);
    } else {
      addTab({ type: 'read', book: bookId, chapter: chapter.toString() });
    }

    // 关闭地图面板
    useBibleStore.getState().setAtlasPanelOpen(false);
    useBibleStore.getState().setViewingLocationVerses(null);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* 头部 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {locationName} 相关经文
          </h2>
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>正在加载相关经文...</p>
          </div>
        ) : verses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <p>暂无相关经文记录</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              找到 {verses.length} 处相关经文
            </p>
            {verses.map((verse) => (
              <div
                key={verse.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                onClick={() => handleVerseClick(verse.bookId, verse.chapter, verse.verse)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                    {verse.bookName} {verse.chapter}:{verse.verse}
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div
                  className="text-gray-800 dark:text-gray-300 font-serif"
                  style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                >
                  {verse.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}