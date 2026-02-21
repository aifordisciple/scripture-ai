// hooks/use-bible-data.ts
import { useState, useEffect } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { BIBLE_BOOKS } from '@/lib/constants'; // [新增] 用于计算下一章

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

  const { clearSelection, setHighlights, setChapterSpeechText } = useBibleStore();

  // 1. 获取当前章节数据
  useEffect(() => {
    async function fetchData() {
      // 优化：如果内存中还没有数据才显示全局 loading
      if (verses.length === 0) setLoading(true);
      
      clearSelection();
      setChapterSpeechText(""); 
      
      try {
        const [versesRes, highlightsRes] = await Promise.all([
          fetch(`/api/bible?book=${book}&chapter=${chapter}`),
          fetch(`/api/highlight?bookId=${book}&chapter=${chapter}`)
        ]);

        const versesJson = await versesRes.json();
        const highlightsJson = await highlightsRes.json();

        if (versesJson.data) {
            setVerses(versesJson.data);
            const fullText = versesJson.data
                .filter((v: Verse) => v.version === 'CUV')
                .map((v: Verse) => v.content)
                .join(" ");
            setChapterSpeechText(fullText);
        }
        if (highlightsJson.data) {
            setHighlights(highlightsJson.data);
        }

      } catch (error) {
        console.error("Failed to fetch bible data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [book, chapter, clearSelection, setHighlights, setChapterSpeechText]);

  // 2. [关键优化] 静默预取下一章数据 (Prefetching)
  useEffect(() => {
    // 延迟 2 秒执行预取，确保不抢占当前页面的网络和渲染资源
    const timer = setTimeout(() => {
      const currentBookIndex = BIBLE_BOOKS.findIndex(b => b.id === book);
      if (currentBookIndex === -1) return;

      const currentBookConfig = BIBLE_BOOKS[currentBookIndex];
      const currentChapterInt = parseInt(chapter);

      let nextBookId = book;
      let nextChapter = currentChapterInt;

      // 计算下一章的位置
      if (currentChapterInt < currentBookConfig.chapters) {
          nextChapter = currentChapterInt + 1;
      } else if (currentBookIndex < BIBLE_BOOKS.length - 1) {
          nextBookId = BIBLE_BOOKS[currentBookIndex + 1].id;
          nextChapter = 1;
      } else {
          return; // 已是圣经最后一章
      }

      // 在后台发起 fetch 请求，请求结果会自动被浏览器和 Next.js Router Cache 缓存
      // 我们不需要处理返回值，只要发起请求即可
      Promise.all([
          fetch(`/api/bible?book=${nextBookId}&chapter=${nextChapter}`),
          fetch(`/api/highlight?bookId=${nextBookId}&chapter=${nextChapter}`)
      ]).catch(() => {
          // 预加载失败静默处理，不干扰用户
      });

    }, 2000);

    return () => clearTimeout(timer);
  }, [book, chapter]);

  return { verses, loading };
}