// packages/core/src/storage/sqlite.ts
// SQLite storage adapter for mobile (expo-sqlite)

import * as SQLite from 'expo-sqlite';
import { StorageAdapter } from './index';

const DB_NAME = 'scripture_ai.db';

// Initialize database
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  
  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    
    CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookId TEXT,
      chapter INTEGER,
      verse INTEGER,
      color TEXT,
      content TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
    
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      bookId TEXT,
      chapter INTEGER,
      verse INTEGER,
      content TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
    
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookId TEXT,
      chapter INTEGER,
      count INTEGER DEFAULT 1,
      createdAt TEXT,
      updatedAt TEXT,
      UNIQUE(bookId, chapter)
    );
    
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      planId TEXT,
      startDate INTEGER,
      status TEXT,
      completedTasks TEXT,
      savedDevotionals TEXT
    );
    
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      value TEXT,
      expiresAt INTEGER
    );
    
    CREATE INDEX IF NOT EXISTS idx_highlights_book ON highlights(bookId, chapter);
    CREATE INDEX IF NOT EXISTS idx_notes_book ON notes(bookId, chapter);
    CREATE INDEX IF NOT EXISTS idx_interactions_book ON interactions(bookId, chapter);
  `);
  
  return db;
}

// SQLite storage adapter
export function createSQLiteAdapter(db: SQLite.SQLiteDatabase): StorageAdapter {
  return {
    async get<T>(key: string): Promise<T | null> {
      try {
        const result = await db.getFirstAsync<{ value: string }>(
          'SELECT value FROM settings WHERE key = ?',
          [key]
        );
        if (!result) return null;
        return JSON.parse(result.value) as T;
      } catch {
        return null;
      }
    },
    
    async set<T>(key: string, value: T): Promise<void> {
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, JSON.stringify(value)]
      );
    },
    
    async remove(key: string): Promise<void> {
      await db.runAsync('DELETE FROM settings WHERE key = ?', [key]);
    },
    
    async clear(): Promise<void> {
      await db.execAsync('DELETE FROM settings');
    }
  };
}

// Highlight operations
export async function saveHighlight(
  db: SQLite.SQLiteDatabase,
  highlight: { bookId: string; chapter: number; verse: number; color: string; content?: string }
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO highlights (bookId, chapter, verse, color, content, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      highlight.bookId,
      highlight.chapter,
      highlight.verse,
      highlight.color,
      highlight.content || null,
      new Date().toISOString(),
      new Date().toISOString()
    ]
  );
}

export async function getHighlights(
  db: SQLite.SQLiteDatabase
): Promise<{ bookId: string; chapter: number; verse: number; color: string; content?: string }[]> {
  const results = await db.getAllAsync<any>('SELECT * FROM highlights ORDER BY updatedAt DESC');
  return results.map(r => ({
    bookId: r.bookId,
    chapter: r.chapter,
    verse: r.verse,
    color: r.color,
    content: r.content
  }));
}

export async function deleteHighlight(
  db: SQLite.SQLiteDatabase,
  bookId: string,
  chapter: number,
  verse: number
): Promise<void> {
  await db.runAsync(
    'DELETE FROM highlights WHERE bookId = ? AND chapter = ? AND verse = ?',
    [bookId, chapter, verse]
  );
}

// Note operations
export async function saveNote(
  db: SQLite.SQLiteDatabase,
  note: { id: string; bookId: string; chapter: number; verse: number; content: string }
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO notes (id, bookId, chapter, verse, content, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      note.id,
      note.bookId,
      note.chapter,
      note.verse,
      note.content,
      new Date().toISOString(),
      new Date().toISOString()
    ]
  );
}

export async function getNotes(db: SQLite.SQLiteDatabase): Promise<any[]> {
  return db.getAllAsync('SELECT * FROM notes ORDER BY updatedAt DESC');
}

// Interaction tracking
export async function recordInteraction(
  db: SQLite.SQLiteDatabase,
  bookId: string,
  chapter: number
): Promise<void> {
  await db.runAsync(
    `INSERT INTO interactions (bookId, chapter, count, createdAt, updatedAt)
     VALUES (?, ?, 1, ?, ?)
     ON CONFLICT(bookId, chapter) DO UPDATE SET count = count + 1, updatedAt = ?`,
    [bookId, chapter, new Date().toISOString(), new Date().toISOString(), new Date().toISOString()]
  );
}

export async function getInteractions(db: SQLite.SQLiteDatabase): Promise<{ bookId: string; chapter: number; count: number }[]> {
  return db.getAllAsync('SELECT bookId, chapter, count FROM interactions');
}

// Cache for offline API responses
export async function cacheResponse(
  db: SQLite.SQLiteDatabase,
  key: string,
  data: any,
  ttlSeconds: number = 3600
): Promise<void> {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  await db.runAsync(
    'INSERT OR REPLACE INTO cache (key, value, expiresAt) VALUES (?, ?, ?)',
    [key, JSON.stringify(data), expiresAt]
  );
}

export async function getCachedResponse<T>(
  db: SQLite.SQLiteDatabase,
  key: string
): Promise<T | null> {
  const result = await db.getFirstAsync<{ value: string; expiresAt: number }>(
    'SELECT value, expiresAt FROM cache WHERE key = ? AND expiresAt > ?',
    [key, Date.now()]
  );
  
  if (!result) return null;
  return JSON.parse(result.value) as T;
}

export async function clearExpiredCache(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM cache WHERE expiresAt < ?', [Date.now()]);
}
