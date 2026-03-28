// components/AnalyticsTracker.tsx
"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// 生成或获取 sessionId
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  const STORAGE_KEY = 'analytics_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    // 生成简单的 session ID
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEY, sessionId);
  }

  return sessionId;
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    // 跳过不需要追踪的路径
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/admin/')
    ) {
      return;
    }

    // 只在路径变化时追踪（避免重复）
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;

    const trackPageView = async () => {
      try {
        const sessionId = getSessionId();
        if (!sessionId) return;

        // 使用 window.location 获取完整路径（包括查询参数）
        const fullPath = window.location.pathname + window.location.search;

        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: fullPath,
            referrer: document.referrer || null,
            sessionId,
          }),
        });
      } catch (error) {
        // 静默失败，不影响用户体验
        console.debug('[Analytics] Track error:', error);
      }
    };

    // 延迟执行，避免阻塞渲染
    const timer = setTimeout(trackPageView, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}