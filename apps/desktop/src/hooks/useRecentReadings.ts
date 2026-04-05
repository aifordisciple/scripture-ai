// apps/desktop/src/hooks/useRecentReadings.ts
/**
 * Recent readings management hook
 *
 * Tracks recently read chapters for tray menu quick access
 */

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface RecentReading {
  book_id: string;
  book_name: string;
  chapter: number;
  read_at: string;
}

export function useRecentReadings() {
  const [recentReadings, setRecentReadings] = useState<RecentReading[]>([]);

  // Load recent readings on mount
  useEffect(() => {
    loadRecentReadings();
  }, []);

  const loadRecentReadings = useCallback(async () => {
    try {
      const readings = await invoke<RecentReading[]>('get_recent_readings');
      setRecentReadings(readings || []);
    } catch (error) {
      console.error('Failed to load recent readings:', error);
    }
  }, []);

  const addRecentReading = useCallback(async (bookId: string, bookName: string, chapter: number) => {
    try {
      await invoke('add_recent_reading', {
        reading: {
          book_id: bookId,
          book_name: bookName,
          chapter,
          read_at: new Date().toISOString(),
        },
      });
      // Reload to get updated list
      await loadRecentReadings();
    } catch (error) {
      console.error('Failed to add recent reading:', error);
    }
  }, [loadRecentReadings]);

  const clearRecentReadings = useCallback(async () => {
    try {
      await invoke('clear_recent_readings');
      setRecentReadings([]);
    } catch (error) {
      console.error('Failed to clear recent readings:', error);
    }
  }, []);

  return {
    recentReadings,
    addRecentReading,
    clearRecentReadings,
    loadRecentReadings,
  };
}