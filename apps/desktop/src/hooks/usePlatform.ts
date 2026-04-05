// apps/desktop/src/hooks/usePlatform.ts
/**
 * Platform-specific hooks for desktop app
 */

import { useState, useEffect } from 'react';

/**
 * Hook to check if Tauri APIs are available
 */
export function useTauri() {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    setIsTauri(typeof window !== 'undefined' && '__TAURI__' in window);
  }, []);

  return isTauri;
}

/**
 * Hook to listen for Tauri events
 */
export function useTauriEvent<T = unknown>(
  eventName: string,
  callback: (payload: T) => void
) {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<T>(eventName, (event) => {
          callback(event.payload);
        });
      } catch (error) {
        console.error(`Failed to listen to event ${eventName}:`, error);
      }
    };

    setup();

    return () => {
      unlisten?.();
    };
  }, [eventName, callback]);
}