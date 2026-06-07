// hooks/use-group-unread.ts
// 获取小组未读消息数的 Hook
// 使用模块级单例轮询：多个组件调用 useGroupUnread 共享同一个 interval，避免重复请求

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UnreadData {
  totalUnread: number;
  groups: Array<{ churchId: string; unreadCount: number }>;
}

// 模块级单例：保证整个应用只跑一个轮询
let singletonState: UnreadData = { totalUnread: 0, groups: [] };
const subscribers = new Set<(data: UnreadData) => void>();
let pollInterval: ReturnType<typeof setInterval> | null = null;
let isFetching = false;
let isStarted = false;

async function fetchOnce() {
  if (isFetching) return;
  isFetching = true;
  try {
    const res = await fetch('/api/church/unread-count');
    if (res.ok) {
      const result = await res.json();
      singletonState = {
        totalUnread: result.totalUnread ?? 0,
        groups: result.groups ?? [],
      };
      subscribers.forEach((cb) => cb(singletonState));
    }
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
  } finally {
    isFetching = false;
  }
}

function startPolling() {
  if (isStarted) return;
  isStarted = true;
  fetchOnce();
  if (typeof window !== 'undefined') {
    pollInterval = setInterval(fetchOnce, 30000);
  }
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  isStarted = false;
}

export function useGroupUnread() {
  const { status } = useSession();
  const [data, setData] = useState<UnreadData>(singletonState);
  const [loading, setLoading] = useState(status === 'authenticated' && singletonState.totalUnread === 0);

  const refetch = useCallback(() => {
    fetchOnce();
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }

    // 订阅共享状态
    const update = (next: UnreadData) => setData(next);
    subscribers.add(update);
    // 立即同步一次当前值
    update(singletonState);
    setLoading(false);

    // 启动/继续轮询
    startPolling();

    return () => {
      subscribers.delete(update);
      // 最后一个订阅者卸载时停止轮询，节省资源
      if (subscribers.size === 0) stopPolling();
    };
  }, [status]);

  return {
    totalUnread: data.totalUnread,
    groups: data.groups,
    loading,
    refetch,
  };
}
