// apps/desktop/src/sync/engine.ts
/**
 * Desktop sync engine for offline-first data synchronization
 *
 * Syncs local SQLite data with remote Web API when online
 */

import { invoke } from '@tauri-apps/api/core';
import { getAuthAdapter, getDatabaseAdapter } from '@scripture-ai/native';
import type { Highlight, Note, ReadingHistoryEntry, Bookmark } from '@scripture-ai/native';

// API base URL - should be configured based on environment
const API_BASE = 'https://your-domain.com';

/**
 * Sync status
 */
export interface SyncStatus {
  lastSyncTime: number | null;
  isSyncing: boolean;
  error: string | null;
  pendingChanges: number;
}

/**
 * Desktop sync engine
 */
export class DesktopSyncEngine {
  private status: SyncStatus = {
    lastSyncTime: null,
    isSyncing: false,
    error: null,
    pendingChanges: 0,
  };

  private listeners: Set<(status: SyncStatus) => void> = new Set();

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.status }));
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Perform full sync
   */
  async syncAll(userId: string): Promise<void> {
    if (this.status.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    this.status.isSyncing = true;
    this.status.error = null;
    this.notifyListeners();

    try {
      const auth = getAuthAdapter();
      const token = await auth.getToken();

      if (!token) {
        throw new Error('Not authenticated');
      }

      // Sync in parallel
      await Promise.all([
        this.syncHighlights(userId, token),
        this.syncNotes(userId, token),
        this.syncReadingHistory(userId, token),
        this.syncBookmarks(userId, token),
      ]);

      // Update last sync time
      const now = Date.now();
      await invoke('db_set_last_sync_time', { timestamp: now });
      this.status.lastSyncTime = now;

      console.log('Sync completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      this.status.error = errorMessage;
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.status.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Sync highlights with server
   */
  private async syncHighlights(userId: string, token: string): Promise<void> {
    try {
      // Get local highlights
      const localHighlights = await invoke<Highlight[]>('db_get_highlights', { userId });

      // Get server highlights
      const response = await fetch(`${API_BASE}/api/highlight?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch server highlights');
      }

      const serverHighlights: Highlight[] = await response.json();

      // Merge logic: server wins for conflicts
      // In a production app, you'd have more sophisticated conflict resolution
      for (const local of localHighlights) {
        const server = serverHighlights.find(s => s.id === local.id);

        if (!server) {
          // Upload new local highlight
          await fetch(`${API_BASE}/api/highlight`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(local),
          });
        } else {
          // Compare timestamps and resolve conflict
          const localTime = new Date(local.updatedAt || local.createdAt).getTime();
          const serverTime = new Date(server.updatedAt || server.createdAt).getTime();

          if (localTime > serverTime) {
            // Local is newer, push to server
            await fetch(`${API_BASE}/api/highlight/${local.id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(local),
            });
          } else if (serverTime > localTime) {
            // Server is newer, update local
            await invoke('db_save_highlight', { highlight: server });
          }
        }
      }

      // Download new server highlights
      for (const server of serverHighlights) {
        const local = localHighlights.find(l => l.id === server.id);
        if (!local) {
          await invoke('db_save_highlight', { highlight: server });
        }
      }
    } catch (error) {
      console.error('Failed to sync highlights:', error);
      throw error;
    }
  }

  /**
   * Sync notes with server
   */
  private async syncNotes(userId: string, token: string): Promise<void> {
    try {
      const localNotes = await invoke<Note[]>('db_get_notes', { userId });

      const response = await fetch(`${API_BASE}/api/note?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch server notes');

      const serverNotes: Note[] = await response.json();

      // Similar merge logic as highlights
      for (const local of localNotes) {
        const server = serverNotes.find(s => s.id === local.id);

        if (!server) {
          await fetch(`${API_BASE}/api/note`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(local),
          });
        }
      }

      for (const server of serverNotes) {
        const local = localNotes.find(l => l.id === server.id);
        if (!local) {
          await invoke('db_save_note', { note: server });
        }
      }
    } catch (error) {
      console.error('Failed to sync notes:', error);
      throw error;
    }
  }

  /**
   * Sync reading history with server
   */
  private async syncReadingHistory(userId: string, token: string): Promise<void> {
    try {
      const localHistory = await invoke<ReadingHistoryEntry[]>('db_get_reading_history', { userId });

      // Push local history to server
      await fetch(`${API_BASE}/api/user/reading-history/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries: localHistory }),
      });
    } catch (error) {
      console.error('Failed to sync reading history:', error);
      // Non-critical, don't throw
    }
  }

  /**
   * Sync bookmarks with server
   */
  private async syncBookmarks(userId: string, token: string): Promise<void> {
    try {
      const localBookmarks = await invoke<Bookmark[]>('db_get_bookmarks', { userId });

      const response = await fetch(`${API_BASE}/api/user/bookmarks?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) return;

      const serverBookmarks: Bookmark[] = await response.json();

      // Merge bookmarks
      for (const local of localBookmarks) {
        const exists = serverBookmarks.some(s => s.id === local.id);
        if (!exists) {
          await fetch(`${API_BASE}/api/user/bookmarks`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(local),
          });
        }
      }

      for (const server of serverBookmarks) {
        const local = localBookmarks.find(l => l.id === server.id);
        if (!local) {
          await invoke('db_save_bookmark', { bookmark: server });
        }
      }
    } catch (error) {
      console.error('Failed to sync bookmarks:', error);
    }
  }
}

// Singleton instance
let syncEngine: DesktopSyncEngine | null = null;

export function getSyncEngine(): DesktopSyncEngine {
  if (!syncEngine) {
    syncEngine = new DesktopSyncEngine();
  }
  return syncEngine;
}