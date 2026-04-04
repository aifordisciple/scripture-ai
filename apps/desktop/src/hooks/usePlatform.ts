// apps/desktop/src/hooks/usePlatform.ts
/**
 * Platform-specific hooks for desktop app
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

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
 * Hook for desktop-specific keyboard shortcuts
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Q to quit
      if ((e.metaKey || e.ctrlKey) && e.key === 'q') {
        e.preventDefault();
        invoke('quit_app').catch(console.error);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
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