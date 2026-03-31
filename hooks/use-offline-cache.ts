// hooks/use-offline-cache.ts
"use client";

import { useState, useEffect, useCallback } from "react";

interface CachedChapter {
  bookId: string;
  chapter: number;
  content: string;
  cachedAt: number;
}

const DB_NAME = "scripture-ai-cache";
const DB_VERSION = 1;
const STORE_NAME = "chapters";

// 打开IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: ["bookId", "chapter"] });
        store.createIndex("cachedAt", "cachedAt", { unique: false });
      }
    };
  });
}

export function useOfflineCache() {
  const [cachedChapters, setCachedChapters] = useState<number>(0);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 获取缓存章节数
  useEffect(() => {
    async function countCached() {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const count = await new Promise<number>((resolve) => {
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
        });
        setCachedChapters(count);
      } catch (err) {
        console.error("Failed to count cached chapters:", err);
      }
    }
    countCached();
  }, []);

  // 缓存章节
  const cacheChapter = useCallback(async (bookId: string, chapter: number, content: string) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const cachedChapter: CachedChapter = {
        bookId,
        chapter,
        content,
        cachedAt: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(cachedChapter);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      setCachedChapters((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to cache chapter:", err);
    }
  }, []);

  // 获取缓存的章节
  const getCachedChapter = useCallback(async (bookId: string, chapter: number): Promise<string | null> => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);

      const result = await new Promise<CachedChapter | null>((resolve) => {
        const request = store.get([bookId, chapter]);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });

      return result?.content || null;
    } catch (err) {
      console.error("Failed to get cached chapter:", err);
      return null;
    }
  }, []);

  // 清除缓存
  const clearCache = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      setCachedChapters(0);
    } catch (err) {
      console.error("Failed to clear cache:", err);
    }
  }, []);

  // 同步数据
  const syncData = useCallback(async () => {
    if (!isOnline) return;

    try {
      const response = await fetch("/api/sync/offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "merge",
          clientData: {},
        }),
      });

      if (response.ok) {
        setPendingSync(0);
      }
    } catch (err) {
      console.error("Failed to sync:", err);
    }
  }, [isOnline]);

  return {
    isOnline,
    cachedChapters,
    pendingSync,
    cacheChapter,
    getCachedChapter,
    clearCache,
    syncData,
  };
}