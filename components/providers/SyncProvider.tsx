// components/providers/SyncProvider.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useBibleStore } from "@/store/useBibleStore";

export function SyncProvider() {
  const { data: session } = useSession();
  const { 
    setAllUserData, 
    fontSize, lineHeight, isDarkMode, showEnglish, activeTabId, tabs 
  } = useBibleStore();

  const isLoadedRef = useRef(false);

  // 1. 登录后拉取数据
  useEffect(() => {
    if (session?.user && !isLoadedRef.current) {
      fetch("/api/user/sync")
        .then((res) => res.json())
        .then((data) => {
          setAllUserData(data);
          isLoadedRef.current = true;
          console.log("User data synced");
        })
        .catch((err) => console.error("Sync failed", err));
    }
  }, [session, setAllUserData]);

  // 2. 监听设置变化并自动保存 (防抖 2秒)
  useEffect(() => {
    if (!session?.user) return;
    if (!isLoadedRef.current) return; // 防止初始加载覆盖服务器数据

    const activeTab = tabs.find(t => t.id === activeTabId);
    const lastBook = activeTab?.type === 'read' ? activeTab.book : null;
    const lastChapter = activeTab?.type === 'read' ? parseInt(activeTab.chapter) : null;

    const timer = setTimeout(() => {
      fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fontSize,
          lineHeight,
          isDarkMode,
          showEnglish,
          lastBook,
          lastChapter
        }),
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [session, fontSize, lineHeight, isDarkMode, showEnglish, activeTabId, tabs]); // 依赖项

  return null; // 不渲染任何 UI
}
