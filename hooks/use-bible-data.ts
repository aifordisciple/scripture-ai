// hooks/use-bible-data.ts
import { useState, useEffect } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { BIBLE_BOOKS } from '@/lib/constants';

export interface Verse {
  id: number;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  content: string;
  version: string;
}

export function useBibleData(book: string, chapter: string) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { clearSelection, setChapterSpeechText, bibleVersion } = useBibleStore();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    clearSelection();
    setChapterSpeechText("");

    try {
      const versesRes = await fetch(`/api/bible?book=${book}&chapter=${chapter}`);
      if (!versesRes.ok) throw new Error("API request failed");

      const versesJson = await versesRes.json();

      if (versesJson.data && versesJson.data.length > 0) {
          setVerses(versesJson.data);
          const fullText = versesJson.data
              .filter((v: Verse) => v.version === bibleVersion)
              .map((v: Verse) => v.content)
              .join(" ");
          setChapterSpeechText(fullText);
      } else {
          console.warn(`No verses found for ${book} ${chapter}, Database might be empty.`);
          setVerses([]);
      }
    } catch (err) {
      console.error("Failed to fetch bible data:", err);
      const locale = useBibleStore.getState().locale;
      setError(locale === 'en' ? 'Failed to load chapter. Please check your network connection.' : '加载章节失败，请检查网络连接');
      setVerses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [book, chapter, clearSelection, setChapterSpeechText]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentBookIndex = BIBLE_BOOKS.findIndex(b => b.id === book);
      if (currentBookIndex === -1) return;

      const currentBookConfig = BIBLE_BOOKS[currentBookIndex];
      const currentChapterInt = parseInt(chapter);

      let nextBookId = book;
      let nextChapter = currentChapterInt;

      if (currentChapterInt < currentBookConfig.chapters) {
          nextChapter = currentChapterInt + 1;
      } else if (currentBookIndex < BIBLE_BOOKS.length - 1) {
          nextBookId = BIBLE_BOOKS[currentBookIndex + 1].id;
          nextChapter = 1;
      } else {
          return;
      }

      fetch(`/api/bible?book=${nextBookId}&chapter=${nextChapter}`).catch(() => {});

    }, 2000);

    return () => clearTimeout(timer);
  }, [book, chapter]);

  return { verses, loading, error, refetch: fetchData };
}
