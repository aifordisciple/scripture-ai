// hooks/use-group-unread.ts
// 获取小组未读消息数的 Hook

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UnreadData {
  totalUnread: number;
  groups: Array<{ churchId: string; unreadCount: number }>;
}

export function useGroupUnread() {
  const { status } = useSession();
  const [data, setData] = useState<UnreadData>({ totalUnread: 0, groups: [] });
  const [loading, setLoading] = useState(true);

  const fetchUnread = useCallback(async () => {
    // Only fetch when authenticated
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/church/unread-count');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchUnread();

    // 每 30 秒轮询一次 (only when authenticated)
    if (status === 'authenticated') {
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchUnread, status]);

  return {
    totalUnread: data.totalUnread,
    groups: data.groups,
    loading,
    refetch: fetchUnread
  };
}