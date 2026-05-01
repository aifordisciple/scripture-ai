// hooks/use-bible-data.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { BIBLE_BOOKS } from '@/lib/constants';
import { t } from '@/lib/i18n';

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

  // 竞态条件防护：请求序号 + AbortController
  const fetchIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // 递增请求序号，用于识别最新请求
    const currentFetchId = ++fetchIdRef.current;

    // 取消之前进行中的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    clearSelection();
    setChapterSpeechText("");

    try {
      const versesRes = await fetch(`/api/bible?book=${book}&chapter=${chapter}`, {
        signal: controller.signal,
      });
      if (!versesRes.ok) throw new Error("API request failed");

      const versesJson = await versesRes.json();

      // 只接受最新请求的结果，丢弃过时响应
      if (currentFetchId !== fetchIdRef.current) return;

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
    } catch (err: unknown) {
      // AbortError 是正常的取消行为，不作为错误处理
      if (err instanceof DOMException && err.name === 'AbortError') return;
      // 只处理最新请求的错误
      if (currentFetchId !== fetchIdRef.current) return;

      console.error("Failed to fetch bible data:", err);
      setError(t('common.networkError'));
      setVerses([]);
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [book, chapter, clearSelection, setChapterSpeechText, bibleVersion]);

  useEffect(() => {
    fetchData();

    return () => {
      // cleanup: 取消进行中的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

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
