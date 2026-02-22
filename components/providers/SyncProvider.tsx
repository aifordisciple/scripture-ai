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
    
    // [修复] 确保 book 和 chapter 为 undefined 时回退为 null
    const lastBook = activeTab?.type === 'read' ? (activeTab.book ?? null) : null;
    
    // [修复] 确保 chapter 存在且为字符串时才调用 parseInt
    const lastChapter = (activeTab?.type === 'read' && activeTab.chapter) 
      ? parseInt(activeTab.chapter) 
      : null;

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
  }, [session, fontSize, lineHeight, isDarkMode, showEnglish, activeTabId, tabs]);

  return null;
}