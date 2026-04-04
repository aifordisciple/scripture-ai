/**
 * Desktop storage adapter for Tauri environment
 * Uses Tauri invoke to call Rust storage commands
 */

import { invoke } from '@tauri-apps/api/core';
import type { StorageAdapter, DatabaseAdapter, Highlight, Note, ReadingHistoryEntry, Bookmark } from './types';

/**
 * Tauri Store adapter for key-value storage
 * Uses tauri-plugin-store via Rust commands
 */
export class DesktopStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await invoke<string>('store_get', { key });
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to get value for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await invoke('store_set', {
        key,
        value: JSON.stringify(value),
      });
    } catch (error) {
      console.error(`Failed to set value for key ${key}:`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await invoke('store_remove', { key });
    } catch (error) {
      console.error(`Failed to remove key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      await invoke('store_clear');
    } catch (error) {
      console.error('Failed to clear store:', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      return await invoke<string[]>('store_keys');
    } catch (error) {
      console.error('Failed to get keys:', error);
      return [];
    }
  }
}

/**
 * Tauri SQLite database adapter for complex queries
 * Uses tauri-plugin-sql via Rust commands
 */
export class DesktopDatabaseAdapter implements DatabaseAdapter {
  async getHighlights(userId: string): Promise<Highlight[]> {
    try {
      return await invoke<Highlight[]>('db_get_highlights', { userId });
    } catch (error) {
      console.error('Failed to get highlights:', error);
      return [];
    }
  }

  async saveHighlight(highlight: Highlight): Promise<void> {
    try {
      await invoke('db_save_highlight', { highlight });
    } catch (error) {
      console.error('Failed to save highlight:', error);
      throw error;
    }
  }

  async deleteHighlight(id: string): Promise<void> {
    try {
      await invoke('db_delete_highlight', { id });
    } catch (error) {
      console.error('Failed to delete highlight:', error);
      throw error;
    }
  }

  async getNotes(userId: string): Promise<Note[]> {
    try {
      return await invoke<Note[]>('db_get_notes', { userId });
    } catch (error) {
      console.error('Failed to get notes:', error);
      return [];
    }
  }

  async saveNote(note: Note): Promise<void> {
    try {
      await invoke('db_save_note', { note });
    } catch (error) {
      console.error('Failed to save note:', error);
      throw error;
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      await invoke('db_delete_note', { id });
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }

  async getReadingHistory(userId: string): Promise<ReadingHistoryEntry[]> {
    try {
      return await invoke<ReadingHistoryEntry[]>('db_get_reading_history', { userId });
    } catch (error) {
      console.error('Failed to get reading history:', error);
      return [];
    }
  }

  async saveReadingHistory(entry: ReadingHistoryEntry): Promise<void> {
    try {
      await invoke('db_save_reading_history', { entry });
    } catch (error) {
      console.error('Failed to save reading history:', error);
      throw error;
    }
  }

  async getBookmarks(userId: string): Promise<Bookmark[]> {
    try {
      return await invoke<Bookmark[]>('db_get_bookmarks', { userId });
    } catch (error) {
      console.error('Failed to get bookmarks:', error);
      return [];
    }
  }

  async saveBookmark(bookmark: Bookmark): Promise<void> {
    try {
      await invoke('db_save_bookmark', { bookmark });
    } catch (error) {
      console.error('Failed to save bookmark:', error);
      throw error;
    }
  }

  async deleteBookmark(id: string): Promise<void> {
    try {
      await invoke('db_delete_bookmark', { id });
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      throw error;
    }
  }

  async getLastSyncTime(): Promise<number | null> {
    try {
      return await invoke<number>('db_get_last_sync_time');
    } catch {
      return null;
    }
  }

  async setLastSyncTime(timestamp: number): Promise<void> {
    try {
      await invoke('db_set_last_sync_time', { timestamp });
    } catch (error) {
      console.error('Failed to set last sync time:', error);
    }
  }
}

/**
 * Create desktop storage adapter instance
 */
export function createDesktopStorageAdapter(): StorageAdapter {
  return new DesktopStorageAdapter();
}

/**
 * Create desktop database adapter instance
 */
export function createDesktopDatabaseAdapter(): DatabaseAdapter {
  return new DesktopDatabaseAdapter();
}