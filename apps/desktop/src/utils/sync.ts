// apps/desktop/src/utils/sync.ts
/**
 * Sync utilities for desktop app
 *
 * Handles syncing local data (highlights, notes) with remote Web API
 */

import { invoke } from '@tauri-apps/api/core';
import { getAuthAdapter } from '@scripture-ai/native';
import type { Highlight, Note } from '@scripture-ai/native';

// API base URL - use window injection or environment variable, default to aidu.app
const API_BASE = typeof window !== 'undefined' && (window as unknown as { __API_URL__?: string }).__API_URL__
  ? (window as unknown as { __API_URL__: string }).__API_URL__
  : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE
      ? import.meta.env.VITE_API_BASE
      : 'https://aidu.app');

interface SyncResult {
  success: boolean;
  uploadedHighlights: number;
  uploadedNotes: number;
  downloadedHighlights: number;
  downloadedNotes: number;
  conflicts: number;
  error?: string;
}

interface RemoteHighlight {
  id: string;
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  color: string;
  createdAt: string;
  updatedAt?: string;
}

interface RemoteNote {
  id: string;
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Sync local data with remote server
 */
export async function syncWithServer(userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    uploadedHighlights: 0,
    uploadedNotes: 0,
    downloadedHighlights: 0,
    downloadedNotes: 0,
    conflicts: 0,
  };

  try {
    const auth = getAuthAdapter();
    const token = await auth.getToken();

    if (!token) {
      result.error = 'Not authenticated';
      return result;
    }

    // Step 1: Upload local highlights
    const localHighlights = await invoke<Highlight[]>('db_get_highlights', { userId });
    if (localHighlights && localHighlights.length > 0) {
      const uploadResponse = await fetch(`${API_BASE}/api/highlight/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          highlights: localHighlights.map(h => ({
            id: h.id,
            bookId: h.book_id,
            chapter: h.chapter,
            verseStart: h.verse_start,
            verseEnd: h.verse_end,
            color: h.color,
            createdAt: h.created_at,
          })),
        }),
      });

      if (uploadResponse.ok) {
        result.uploadedHighlights = localHighlights.length;
      }
    }

    // Step 2: Upload local notes
    const localNotes = await invoke<Note[]>('db_get_notes', { userId });
    if (localNotes && localNotes.length > 0) {
      const uploadResponse = await fetch(`${API_BASE}/api/note/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          notes: localNotes.map(n => ({
            id: n.id,
            bookId: n.book_id,
            chapter: n.chapter,
            verseStart: n.verse_start,
            verseEnd: n.verse_end,
            content: n.content,
            createdAt: n.created_at,
            updatedAt: n.updated_at,
          })),
        }),
      });

      if (uploadResponse.ok) {
        result.uploadedNotes = localNotes.length;
      }
    }

    // Step 3: Download remote highlights
    const highlightsResponse = await fetch(`${API_BASE}/api/highlight?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (highlightsResponse.ok) {
      const { data: remoteHighlights } = await highlightsResponse.json() as { data: RemoteHighlight[] };

      for (const rh of remoteHighlights) {
        const localHighlight = localHighlights?.find(h => h.id === rh.id);

        // Conflict resolution: use the one with later updatedAt/createdAt
        if (localHighlight) {
          const localTime = new Date(localHighlight.created_at).getTime();
          const remoteTime = new Date(rh.updatedAt || rh.createdAt).getTime();

          if (remoteTime > localTime) {
            // Update local with remote
            await invoke('db_save_highlight', {
              highlight: {
                id: rh.id,
                user_id: userId,
                book_id: rh.bookId,
                chapter: rh.chapter,
                verse_start: rh.verseStart,
                verse_end: rh.verseEnd,
                color: rh.color,
                created_at: rh.updatedAt || rh.createdAt,
              },
            });
            result.conflicts++;
          }
        } else {
          // New remote highlight, save locally
          await invoke('db_save_highlight', {
            highlight: {
              id: rh.id,
              user_id: userId,
              book_id: rh.bookId,
              chapter: rh.chapter,
              verse_start: rh.verseStart,
              verse_end: rh.verseEnd,
              color: rh.color,
              created_at: rh.createdAt,
            },
          });
          result.downloadedHighlights++;
        }
      }
    }

    // Step 4: Download remote notes
    const notesResponse = await fetch(`${API_BASE}/api/note?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (notesResponse.ok) {
      const { data: remoteNotes } = await notesResponse.json() as { data: RemoteNote[] };

      for (const rn of remoteNotes) {
        const localNote = localNotes?.find(n => n.id === rn.id);

        if (localNote) {
          const localTime = new Date(localNote.updated_at || localNote.created_at).getTime();
          const remoteTime = new Date(rn.updatedAt || rn.createdAt).getTime();

          if (remoteTime > localTime) {
            await invoke('db_save_note', {
              note: {
                id: rn.id,
                user_id: userId,
                book_id: rn.bookId,
                chapter: rn.chapter,
                verse_start: rn.verseStart,
                verse_end: rn.verseEnd,
                content: rn.content,
                created_at: rn.createdAt,
                updated_at: rn.updatedAt,
              },
            });
            result.conflicts++;
          }
        } else {
          await invoke('db_save_note', {
            note: {
              id: rn.id,
              user_id: userId,
              book_id: rn.bookId,
              chapter: rn.chapter,
              verse_start: rn.verseStart,
              verse_end: rn.verseEnd,
              content: rn.content,
              created_at: rn.createdAt,
              updated_at: rn.updatedAt,
            },
          });
          result.downloadedNotes++;
        }
      }
    }

    // Update last sync time
    await invoke('db_set_last_sync_time', { timestamp: Date.now() });

    result.success = true;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Sync failed';
  }

  return result;
}

/**
 * Get last sync time
 */
export async function getLastSyncTime(): Promise<number | null> {
  try {
    return await invoke<number | null>('db_get_last_sync_time');
  } catch {
    return null;
  }
}