// hooks/use-realtime.ts
// Hook for real-time updates via SSE

import { useEffect, useRef, useCallback, useState } from 'react';
import { useBibleStore } from '@/store/useBibleStore';

interface SSEEvent {
  event: string;
  data: any;
}

interface UseRealtimeOptions {
  onMessage?: (event: string, data: any) => void;
  onNotification?: (data: any) => void;
  onGroupMessage?: (data: any) => void;
  onDirectMessage?: (data: any) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface RealtimeState {
  connected: boolean;
  reconnectAttempts: number;
  lastEventTime: Date | null;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const {
    onMessage,
    onNotification,
    onGroupMessage,
    onDirectMessage,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const [state, setState] = useState<RealtimeState>({
    connected: false,
    reconnectAttempts: 0,
    lastEventTime: null,
  });

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[SSE] Connected');
      reconnectAttemptsRef.current = 0;
      setState(prev => ({
        ...prev,
        connected: true,
        reconnectAttempts: 0,
      }));
    };

    eventSource.onerror = (error) => {
      console.error('[SSE] Error:', error);
      eventSource.close();
      setState(prev => ({ ...prev, connected: false }));

      // Attempt to reconnect
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        setState(prev => ({ ...prev, reconnectAttempts: reconnectAttemptsRef.current }));

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`[SSE] Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
          connect();
        }, reconnectInterval);
      } else {
        console.error('[SSE] Max reconnect attempts reached');
      }
    };

    // Handle different event types
    eventSource.addEventListener('connected', (e) => {
      console.log('[SSE] Connection confirmed');
    });

    eventSource.addEventListener('heartbeat', () => {
      setState(prev => ({ ...prev, lastEventTime: new Date() }));
    });

    eventSource.addEventListener('notification', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        onNotification?.(data);
        onMessage?.('notification', data);
      } catch (error) {
        console.error('[SSE] Failed to parse notification:', error);
      }
    });

    eventSource.addEventListener('group_message', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        onGroupMessage?.(data);
        onMessage?.('group_message', data);
      } catch (error) {
        console.error('[SSE] Failed to parse group message:', error);
      }
    });

    eventSource.addEventListener('direct_message', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        onDirectMessage?.(data);
        onMessage?.('direct_message', data);
      } catch (error) {
        console.error('[SSE] Failed to parse direct message:', error);
      }
    });

    eventSource.addEventListener('plan_update', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        onMessage?.('plan_update', data);
      } catch (error) {
        console.error('[SSE] Failed to parse plan update:', error);
      }
    });

    // Generic message handler
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMessage?.('message', data);
      } catch (error) {
        console.error('[SSE] Failed to parse message:', error);
      }
    };

  }, [onMessage, onNotification, onGroupMessage, onDirectMessage, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setState(prev => ({ ...prev, connected: false }));
  }, []);

  // Auto-connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
  };
}

// Hook specifically for notification updates
export function useNotificationRealtime() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const handleNotification = useCallback((data: any) => {
    setNotifications(prev => [data, ...prev.slice(0, 49)]); // Keep last 50
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useRealtime({
    onNotification: handleNotification,
  });

  return {
    notifications,
    unreadCount,
    markAsRead,
  };
}

// Hook for group chat updates
export function useGroupChatRealtime(churchId: string | null) {
  const [lastMessage, setLastMessage] = useState<any>(null);

  const handleGroupMessage = useCallback((data: any) => {
    if (data.churchId === churchId) {
      setLastMessage(data);
    }
  }, [churchId]);

  useRealtime({
    onGroupMessage: handleGroupMessage,
  });

  return {
    lastMessage,
  };
}