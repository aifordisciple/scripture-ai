// hooks/use-realtime.ts
import { useEffect, useRef, useCallback } from 'react';
import { useBibleStore } from '@/store/useBibleStore';

interface RealtimeOptions {
  onMessage?: (data: any) => void;
  onNotification?: (data: any) => void;
  onDM?: (data: any) => void;
  onPlanUpdate?: (data: any) => void;
  onHighlight?: (data: any) => void;
  enabled?: boolean;
}

export function useRealtime(options: RealtimeOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // 使用 ref 存储回调选项，使 connect 有稳定引用，避免重渲染导致重连循环
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    // 清理旧连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // 清理重连定时器
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const { userId } = useBibleStore.getState();
    if (!userId) return;

    try {
      const es = new EventSource(`/api/sse?userId=${userId}`);
      eventSourceRef.current = es;

      es.onopen = () => {
        reconnectAttemptsRef.current = 0; // 连接成功，重置重连计数
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // 通过 ref 读取最新回调
          const opts = optionsRef.current;
          switch (data.type) {
            case 'message':
              opts.onMessage?.(data);
              break;
            case 'notification':
              opts.onNotification?.(data);
              break;
            case 'dm':
              opts.onDM?.(data);
              break;
            case 'plan_update':
              opts.onPlanUpdate?.(data);
              break;
            case 'highlight':
              opts.onHighlight?.(data);
              break;
          }
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;

        // 指数退避重连，最多 10 次
        const maxAttempts = 10;
        if (reconnectAttemptsRef.current < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (err) {
      console.error('SSE connection error:', err);
    }
  }, []); // 空依赖 - 通过 ref 和 useBibleStore.getState() 访问所有状态

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    const { userId } = useBibleStore.getState();
    if (userId && options.enabled !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, options.enabled]);

  // 监听 userId 变化，用户登录/登出时重新连接/断开
  useEffect(() => {
    const unsubscribe = useBibleStore.subscribe((state, prevState) => {
      if (state.userId !== prevState.userId) {
        if (state.userId && options.enabled !== false) {
          connect();
        } else {
          disconnect();
        }
      }
    });

    return unsubscribe;
  }, [connect, disconnect, options.enabled]);

  return { connect, disconnect };
}
