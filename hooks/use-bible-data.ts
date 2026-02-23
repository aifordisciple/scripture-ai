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

  // [修复] 移除了原有的 setHighlights，防止单章数据覆盖全局离线缓存
  const { clearSelection, setChapterSpeechText } = useBibleStore();

  // 1. 获取当前章节数据
  useEffect(() => {
    async function fetchData() {
      // 优化：如果内存中还没有数据才显示全局 loading
      if (verses.length === 0) setLoading(true);
      
      clearSelection();
      setChapterSpeechText(""); 
      
      try {
        const versesRes = await fetch(`/api/bible?book=${book}&chapter=${chapter}`);
        const versesJson = await versesRes.json();

        if (versesJson.data) {
            setVerses(versesJson.data);
            const fullText = versesJson.data
                .filter((v: Verse) => v.version === 'CUV')
                .map((v: Verse) => v.content)
                .join(" ");
            setChapterSpeechText(fullText);
        }
        
        // ⚠️ 核心修复区：
        // 删除了 fetch(`/api/highlight`) 并 setHighlights 的逻辑。
        // 因为用户的个人数据现在由 Zustand 本地持久化与 SyncProvider 全局接管，
        // 这样 PWA 在离线状态下也能完美保留并展示历史高亮，不受网络请求干扰。

      } catch (error) {
        console.error("Failed to fetch bible data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [book, chapter, clearSelection, setChapterSpeechText]);

  // 2. 静默预取下一章数据 (Prefetching)
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

      // [修复] 仅预取经文数据即可，减少不必要的 highlight API 请求
      fetch(`/api/bible?book=${nextBookId}&chapter=${nextChapter}`).catch(() => {});

    }, 2000);

    return () => clearTimeout(timer);
  }, [book, chapter]);

  return { verses, loading };
}