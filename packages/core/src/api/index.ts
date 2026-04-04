// packages/core/src/api/index.ts
/**
 * API client for Scripture AI
 *
 * Provides a unified interface for both web and desktop to call backend APIs
 */

import { getAuthAdapter } from '@scripture-ai/native';

// API base URL configuration
const API_BASE = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL
  : typeof window !== 'undefined' && (window as unknown as { __API_URL__?: string }).__API_URL__
    ? (window as unknown as { __API_URL__: string }).__API_URL__
    : ''; // Empty string for web (same origin)

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

/**
 * Bible verse structure
 */
export interface BibleVerse {
  id: number;
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
  textEn?: string; // KJV text for bilingual support
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Make an API call with authentication
 */
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const auth = getAuthAdapter();
  const token = await auth.getToken();

  const url = API_BASE ? `${API_BASE}${endpoint}` : endpoint;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Bible API endpoints
 */
export const bibleApi = {
  /**
   * Get verses for a chapter
   */
  async getChapter(bookId: string, chapter: number): Promise<BibleVerse[]> {
    return apiCall<BibleVerse[]>(`/api/bible/${bookId}/${chapter}`);
  },

  /**
   * Search verses
   */
  async search(query: string, limit = 50): Promise<BibleVerse[]> {
    return apiCall<BibleVerse[]>(`/api/bible/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  /**
   * Get verse by reference
   */
  async getVerse(bookId: string, chapter: number, verse: number): Promise<BibleVerse> {
    return apiCall<BibleVerse>(`/api/bible/${bookId}/${chapter}/${verse}`);
  },
};

/**
 * AI Chat API endpoints
 */
export const chatApi = {
  /**
   * Send a chat message and get streaming response
   */
  async chat(
    messages: ChatMessage[],
    context?: {
      bookId?: string;
      chapter?: number;
      verses?: number[];
      mode?: string;
    }
  ): Promise<Response> {
    const auth = getAuthAdapter();
    const token = await auth.getToken();

    const url = API_BASE ? `${API_BASE}/api/chat` : '/api/chat';

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        messages,
        ...context,
      }),
    });
  },

  /**
   * Get verse interpretation
   */
  async interpretVerse(
    bookId: string,
    chapter: number,
    verseStart: number,
    verseEnd?: number
  ): Promise<string> {
    const response = await apiCall<{ interpretation: string }>('/api/chat/interpret', {
      method: 'POST',
      body: JSON.stringify({
        bookId,
        chapter,
        verseStart,
        verseEnd,
      }),
    });
    return response.interpretation;
  },
};

/**
 * User data API endpoints
 */
export const userApi = {
  /**
   * Get user's highlights
   */
  async getHighlights(): Promise<unknown[]> {
    return apiCall<unknown[]>('/api/highlight');
  },

  /**
   * Save a highlight
   */
  async saveHighlight(highlight: {
    bookId: string;
    chapter: number;
    verseStart: number;
    verseEnd: number;
    color: string;
  }): Promise<unknown> {
    return apiCall<unknown>('/api/highlight', {
      method: 'POST',
      body: JSON.stringify(highlight),
    });
  },

  /**
   * Get user's notes
   */
  async getNotes(): Promise<unknown[]> {
    return apiCall<unknown[]>('/api/note');
  },

  /**
   * Save a note
   */
  async saveNote(note: {
    bookId: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
    content: string;
  }): Promise<unknown> {
    return apiCall<unknown>('/api/note', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  },

  /**
   * Sync data with server
   */
  async sync(data: {
    highlights?: unknown[];
    notes?: unknown[];
    lastSyncTime?: number;
  }): Promise<{
    highlights: unknown[];
    notes: unknown[];
    syncTime: number;
  }> {
    return apiCall<{
      highlights: unknown[];
      notes: unknown[];
      syncTime: number;
    }>('/api/user/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Set API base URL (for desktop)
 */
export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    (window as unknown as { __API_URL__: string }).__API_URL__ = url;
  }
}