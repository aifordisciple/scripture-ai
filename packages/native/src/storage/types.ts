/**
 * Storage adapter interface for key-value storage
 * Abstracts storage between web (localStorage) and desktop (Tauri store)
 */

/**
 * Key-value storage adapter interface
 */
export interface StorageAdapter {
  /**
   * Get value by key
   * @param key - Storage key
   * @returns Stored value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set value for key
   * @param key - Storage key
   * @param value - Value to store
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Remove value by key
   * @param key - Storage key to remove
   */
  remove(key: string): Promise<void>;

  /**
   * Clear all stored values
   */
  clear(): Promise<void>;

  /**
   * Get all keys
   */
  keys?(): Promise<string[]>;
}

/**
 * Database adapter for complex queries
 * Used for highlights, notes, and offline data caching
 */
export interface DatabaseAdapter {
  // Highlights
  getHighlights(userId: string): Promise<Highlight[]>;
  saveHighlight(highlight: Highlight): Promise<void>;
  deleteHighlight(id: string): Promise<void>;

  // Notes
  getNotes(userId: string): Promise<Note[]>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;

  // Reading history
  getReadingHistory(userId: string): Promise<ReadingHistoryEntry[]>;
  saveReadingHistory(entry: ReadingHistoryEntry): Promise<void>;

  // Bookmarks
  getBookmarks(userId: string): Promise<Bookmark[]>;
  saveBookmark(bookmark: Bookmark): Promise<void>;
  deleteBookmark(id: string): Promise<void>;

  // Sync status
  getLastSyncTime?(): Promise<number | null>;
  setLastSyncTime?(timestamp: number): Promise<void>;
}

/**
 * Highlight data structure
 */
export interface Highlight {
  id: string;
  userId: string;
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  color: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Note data structure
 */
export interface Note {
  id: string;
  userId: string;
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Reading history entry
 */
export interface ReadingHistoryEntry {
  id: string;
  userId: string;
  bookId: string;
  chapter: number;
  readAt: string;
  duration?: number; // Reading duration in seconds
}

/**
 * Bookmark data structure
 */
export interface Bookmark {
  id: string;
  userId: string;
  bookId: string;
  chapter: number;
  verse?: number;
  createdAt: string;
}