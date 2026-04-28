// components/providers/SyncProvider.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useCallback } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { useToast } from "@/components/ui/toast";
import { t } from "@/lib/i18n";

export function SyncProvider() {
  const { data: session } = useSession();
  const {
    setAllUserData,
    fontSize, lineHeight, isDarkMode, showDualVersion, activeTabId, tabs,
    highlights, notes, interactions, activePlans, streakCount, lastActiveDate, badges,
    syncMode, setSyncMode,
    lastSyncTime, setLastSyncTime,
    isSyncing, setIsSyncing,
    syncError, setSyncError,
    customPlans, // [修复] 从 store 中解构 customPlans
  } = useBibleStore();

  const { addToast } = useToast();
  const isLoadedRef = useRef(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. 登录后拉取数据
  useEffect(() => {
    if (session?.user && !isLoadedRef.current) {
      setIsSyncing(true);
      setSyncError(null);
      
      fetch("/api/user/sync")
        .then((res) => res.json())
        .then((data) => {
          setAllUserData(data);
          setLastSyncTime(Date.now());
          isLoadedRef.current = true;
          console.log("User data synced from server");
          // 检查勋章解锁
          useBibleStore.getState().checkAndUnlockBadges();
        })
        .catch((err) => {
          console.error("Sync failed", err);
          setSyncError(t('common.tabs.syncFailedRetry'));
          addToast({ type: 'error', message: t('common.tabs.syncFailedNetwork') });
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }
  }, [session, setAllUserData, setLastSyncTime, setIsSyncing, setSyncError]);

  // 2. 手动同步函数（支持 merge/overwrite 模式）
  const syncToServer = useCallback(async () => {
    if (!session?.user) return;
    
    setIsSyncing(true);
    setSyncError(null);
    
    const activeTab = tabs.find(t => t.id === activeTabId);
    // [修复] 避免传递 undefined，避免 parseInt 产生 NaN
    const currentBook = activeTab?.type === 'read' ? (activeTab.book || null) : null;
    const currentChapter = activeTab?.type === 'read' && activeTab.chapter ? parseInt(activeTab.chapter) : null;

    try {
      const res = await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: syncMode,
          settings: {
            fontSize,
            lineHeight,
            isDarkMode,
            showDualVersion,
            lastBook: currentBook,
            lastChapter: currentChapter,
            customPlans, // [修复] 使用解构的 customPlans 变量
          },
          highlights: highlights.map(h => ({
            bookId: h.bookId,
            chapter: h.chapter,
            verse: h.verse,
            color: h.color,
          })),
          notes: notes.map(n => ({
            id: n.id,
            bookId: n.bookId,
            chapter: n.chapter,
            verse: n.verse,
            content: n.content,
          })),
           interactions: interactions.map(i => ({
             bookId: i.bookId,
             chapter: i.chapter,
             count: i.count,
           })),
           activePlans,
           streakCount,
           lastActiveDate,
           badges,
         }),
       });

       if (!res.ok) throw new Error("Sync failed");

      const data = await res.json();
      
      if (data.success) {
        setLastSyncTime(Date.now());
        console.log(`Data synced to server (${syncMode} mode)`);
      }
    } catch (err) {
      console.error("Sync to server failed", err);
      setSyncError(t('common.tabs.syncToServerFailed'));
      addToast({ type: 'error', message: t('common.tabs.syncFailedRetry') });
    } finally {
      setIsSyncing(false);
    }
  }, [
     session,
     syncMode,
     fontSize, lineHeight, isDarkMode, showDualVersion, activeTabId, tabs,
     highlights, notes, interactions, activePlans, streakCount, lastActiveDate, badges, customPlans,
     setAllUserData, setLastSyncTime, setIsSyncing, setSyncError,
   ]);

  // 3. 监听设置变化并自动保存 (防抖 3秒)
  useEffect(() => {
    if (!session?.user) return;
    if (!isLoadedRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      syncToServer();
    }, 3000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [session, syncToServer]);

  // 4. 暴露同步函数到全局（仅开发环境）
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).__syncToServer = syncToServer;
    }
  }, [syncToServer]);

  return null;
}