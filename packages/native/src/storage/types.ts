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
 * Note: Fields use snake_case to match Rust backend struct
 */
export interface Highlight {
  id: string;
  user_id: string;
  book_id: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  color: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Note data structure
 * Note: Fields use snake_case to match Rust backend struct
 */
export interface Note {
  id: string;
  user_id: string;
  book_id: string;
  chapter: number;
  verse_start: number;
  verse_end?: number;
  content: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Reading history entry
 * Note: Fields use snake_case to match Rust backend struct
 */
export interface ReadingHistoryEntry {
  id: string;
  user_id: string;
  book_id: string;
  chapter: number;
  read_at: string;
  duration?: number; // Reading duration in seconds
}

/**
 * Bookmark data structure
 * Note: Fields use snake_case to match Rust backend struct
 */
export interface Bookmark {
  id: string;
  user_id: string;
  book_id: string;
  chapter: number;
  verse?: number;
  created_at: string;
}