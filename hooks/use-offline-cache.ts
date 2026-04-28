// hooks/use-offline-cache.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'scripture-ai-offline';
const DB_VERSION = 1;

// 全局共享数据库连接，避免每次操作创建新连接
let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('chapters')) {
          db.createObjectStore('chapters', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export function useOfflineCache() {
  const [cachedCount, setCachedCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      if (mountedRef.current) setIsOnline(true);
    };
    const handleOffline = () => {
      if (mountedRef.current) setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初始化时统计缓存数量
    updateCachedCount();

    return () => {
      mountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateCachedCount = useCallback(async () => {
    try {
      const db = await getDB();
      const count = await db.count('chapters');
      if (mountedRef.current) setCachedCount(count);
    } catch (err) {
      console.error('Failed to count cached chapters:', err);
    }
  }, []);

  const cacheChapter = useCallback(async (bookId: string, chapter: number, verses: any[]) => {
    try {
      const db = await getDB();
      const key = `${bookId}-${chapter}`;
      const existing = await db.get('chapters', key);
      await db.put('chapters', {
        key,
        bookId,
        chapter,
        verses,
        cachedAt: new Date().toISOString(),
      });
      // 只有新增（非覆盖）时才递增计数
      if (!existing && mountedRef.current) {
        setCachedCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to cache chapter:', err);
    }
  }, []);

  const getCachedChapter = useCallback(async (bookId: string, chapter: number) => {
    try {
      const db = await getDB();
      const key = `${bookId}-${chapter}`;
      return await db.get('chapters', key);
    } catch (err) {
      console.error('Failed to get cached chapter:', err);
      return null;
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      const db = await getDB();
      await db.clear('chapters');
      await db.clear('metadata');
      if (mountedRef.current) setCachedCount(0);
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  }, []);

  const removeCachedChapter = useCallback(async (bookId: string, chapter: number) => {
    try {
      const db = await getDB();
      const key = `${bookId}-${chapter}`;
      await db.delete('chapters', key);
      if (mountedRef.current) setCachedCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to remove cached chapter:', err);
    }
  }, []);

  return {
    cachedCount,
    isOnline,
    cacheChapter,
    getCachedChapter,
    clearCache,
    removeCachedChapter,
  };
}
