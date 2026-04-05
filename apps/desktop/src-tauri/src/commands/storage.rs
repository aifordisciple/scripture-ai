//! Storage commands for Tauri
//!
//! Handles both key-value store and SQLite database operations

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;
use sqlx::SqlitePool;

// ============================================================================
// Key-Value Store Commands (tauri-plugin-store)
// ============================================================================

/// Get value from key-value store
#[tauri::command]
pub async fn store_get(
    app: AppHandle,
    key: String,
) -> Result<Option<String>, String> {
    let store = app.store("data.json")
        .map_err(|e| e.to_string())?;

    let value = store.get(&key)
        .and_then(|v| v.as_str().map(String::from));

    Ok(value)
}

/// Set value in key-value store
#[tauri::command]
pub async fn store_set(
    app: AppHandle,
    key: String,
    value: String,
) -> Result<(), String> {
    let store = app.store("data.json")
        .map_err(|e| e.to_string())?;

    store.set(key, serde_json::json!(value));
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

/// Remove key from store
#[tauri::command]
pub async fn store_remove(
    app: AppHandle,
    key: String,
) -> Result<(), String> {
    let store = app.store("data.json")
        .map_err(|e| e.to_string())?;

    store.delete(&key);
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

/// Clear all keys from store
#[tauri::command]
pub async fn store_clear(app: AppHandle) -> Result<(), String> {
    let store = app.store("data.json")
        .map_err(|e| e.to_string())?;

    store.clear();
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

/// Get all keys from store
#[tauri::command]
pub async fn store_keys(app: AppHandle) -> Result<Vec<String>, String> {
    let store = app.store("data.json")
        .map_err(|e| e.to_string())?;

    let keys: Vec<String> = store.keys()
        .into_iter()
        .map(|k| k.to_string())
        .collect();

    Ok(keys)
}

// ============================================================================
// Data Types
// ============================================================================

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Highlight {
    pub id: String,
    pub user_id: String,
    pub book_id: String,
    pub chapter: i32,
    pub verse_start: i32,
    pub verse_end: i32,
    pub color: String,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Note {
    pub id: String,
    pub user_id: String,
    pub book_id: String,
    pub chapter: i32,
    pub verse_start: i32,
    pub verse_end: Option<i32>,
    pub content: String,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ReadingHistoryEntry {
    pub id: String,
    pub user_id: String,
    pub book_id: String,
    pub chapter: i32,
    pub read_at: String,
    pub duration: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Bookmark {
    pub id: String,
    pub user_id: String,
    pub book_id: String,
    pub chapter: i32,
    pub verse: Option<i32>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct ChatSession {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub mode: String,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct ChatMessage {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub created_at: String,
}

// ============================================================================
// Database Commands (tauri-plugin-sql)
// ============================================================================

/// Initialize database tables
#[tauri::command]
pub async fn db_init(app: AppHandle) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    // Create highlights table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS highlights (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            book_id TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            verse_start INTEGER NOT NULL,
            verse_end INTEGER NOT NULL,
            color TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
    ).execute(&*db).await.map_err(|e| e.to_string())?;

    // Create notes table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            book_id TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            verse_start INTEGER NOT NULL,
            verse_end INTEGER,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
    ).execute(&*db).await.map_err(|e| e.to_string())?;

    // Create reading_history table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS reading_history (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            book_id TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            read_at TEXT NOT NULL,
            duration INTEGER
        )",
    ).execute(&*db).await.map_err(|e| e.to_string())?;

    // Create bookmarks table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS bookmarks (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            book_id TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            verse INTEGER,
            created_at TEXT NOT NULL
        )",
    ).execute(&*db).await.map_err(|e| e.to_string())?;

    // Create chat_sessions table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            mode TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT
        )",
    ).execute(&*db).await.map_err(|e| e.to_string())?;

    // Create chat_messages table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
        )",
    ).execute(&*db).await.map_err(|e| e.to_string())?;

    // Create sync_status table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS sync_status (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            last_sync_time INTEGER NOT NULL
        )",
    ).execute(&*db).await.map_err(|e| e.to_string())?;

    // Create bible_verses table for offline reading
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS bible_verses (
            id TEXT PRIMARY KEY,
            book_id TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            verse INTEGER NOT NULL,
            text TEXT NOT NULL,
            text_en TEXT,
            version TEXT NOT NULL,
            cached_at TEXT NOT NULL
        )",
    ).execute(&*db).await.map_err(|e| e.to_string())?;

    // Create index for faster chapter lookups
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_bible_chapter
         ON bible_verses(book_id, chapter, version)",
    ).execute(&*db).await.map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// Highlight Commands
// ============================================================================

#[tauri::command]
pub async fn db_get_highlights(
    app: AppHandle,
    user_id: String,
) -> Result<Vec<Highlight>, String> {
    let db = app.state::<SqlitePool>();

    let highlights = sqlx::query_as::<_, Highlight>(
        "SELECT id, user_id, book_id, chapter, verse_start, verse_end, color, created_at, updated_at
         FROM highlights WHERE user_id = ?",
    )
    .bind(&user_id)
    .fetch_all(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(highlights)
}

#[tauri::command]
pub async fn db_save_highlight(
    app: AppHandle,
    highlight: Highlight,
) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    sqlx::query(
        "INSERT OR REPLACE INTO highlights
         (id, user_id, book_id, chapter, verse_start, verse_end, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&highlight.id)
    .bind(&highlight.user_id)
    .bind(&highlight.book_id)
    .bind(highlight.chapter)
    .bind(highlight.verse_start)
    .bind(highlight.verse_end)
    .bind(&highlight.color)
    .bind(&highlight.created_at)
    .bind(&highlight.updated_at)
    .execute(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn db_delete_highlight(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    sqlx::query("DELETE FROM highlights WHERE id = ?")
        .bind(&id)
        .execute(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// Note Commands
// ============================================================================

#[tauri::command]
pub async fn db_get_notes(
    app: AppHandle,
    user_id: String,
) -> Result<Vec<Note>, String> {
    let db = app.state::<SqlitePool>();

    let notes = sqlx::query_as::<_, Note>(
        "SELECT id, user_id, book_id, chapter, verse_start, verse_end, content, created_at, updated_at
         FROM notes WHERE user_id = ?",
    )
    .bind(&user_id)
    .fetch_all(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(notes)
}

#[tauri::command]
pub async fn db_save_note(
    app: AppHandle,
    note: Note,
) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    sqlx::query(
        "INSERT OR REPLACE INTO notes
         (id, user_id, book_id, chapter, verse_start, verse_end, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&note.id)
    .bind(&note.user_id)
    .bind(&note.book_id)
    .bind(note.chapter)
    .bind(note.verse_start)
    .bind(note.verse_end)
    .bind(&note.content)
    .bind(&note.created_at)
    .bind(&note.updated_at)
    .execute(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn db_delete_note(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    sqlx::query("DELETE FROM notes WHERE id = ?")
        .bind(&id)
        .execute(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// Reading History Commands
// ============================================================================

#[tauri::command]
pub async fn db_get_reading_history(
    app: AppHandle,
    user_id: String,
) -> Result<Vec<ReadingHistoryEntry>, String> {
    let db = app.state::<SqlitePool>();

    let history = sqlx::query_as::<_, ReadingHistoryEntry>(
        "SELECT id, user_id, book_id, chapter, read_at, duration
         FROM reading_history WHERE user_id = ? ORDER BY read_at DESC",
    )
    .bind(&user_id)
    .fetch_all(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(history)
}

#[tauri::command]
pub async fn db_save_reading_history(
    app: AppHandle,
    entry: ReadingHistoryEntry,
) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    sqlx::query(
        "INSERT OR REPLACE INTO reading_history
         (id, user_id, book_id, chapter, read_at, duration)
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&entry.id)
    .bind(&entry.user_id)
    .bind(&entry.book_id)
    .bind(entry.chapter)
    .bind(&entry.read_at)
    .bind(entry.duration)
    .execute(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// Bookmark Commands
// ============================================================================

#[tauri::command]
pub async fn db_get_bookmarks(
    app: AppHandle,
    user_id: String,
) -> Result<Vec<Bookmark>, String> {
    let db = app.state::<SqlitePool>();

    let bookmarks = sqlx::query_as::<_, Bookmark>(
        "SELECT id, user_id, book_id, chapter, verse, created_at
         FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC",
    )
    .bind(&user_id)
    .fetch_all(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(bookmarks)
}

#[tauri::command]
pub async fn db_save_bookmark(
    app: AppHandle,
    bookmark: Bookmark,
) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    sqlx::query(
        "INSERT OR REPLACE INTO bookmarks
         (id, user_id, book_id, chapter, verse, created_at)
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&bookmark.id)
    .bind(&bookmark.user_id)
    .bind(&bookmark.book_id)
    .bind(bookmark.chapter)
    .bind(bookmark.verse)
    .bind(&bookmark.created_at)
    .execute(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn db_delete_bookmark(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    sqlx::query("DELETE FROM bookmarks WHERE id = ?")
        .bind(&id)
        .execute(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// Chat Session Commands
// ============================================================================

#[tauri::command]
pub async fn db_get_chat_sessions(
    app: AppHandle,
    user_id: String,
) -> Result<Vec<ChatSession>, String> {
    let db = app.state::<SqlitePool>();

    let result = sqlx::query_as::<_, ChatSession>(
        "SELECT id, user_id, title, mode, created_at, updated_at
         FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC",
    )
    .bind(&user_id)
    .fetch_all(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(result)
}

#[tauri::command]
pub async fn db_save_chat_session(
    app: AppHandle,
    session: ChatSession,
) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    sqlx::query(
        "INSERT OR REPLACE INTO chat_sessions (id, user_id, title, mode, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&session.id)
    .bind(&session.user_id)
    .bind(&session.title)
    .bind(&session.mode)
    .bind(&session.created_at)
    .bind(&session.updated_at)
    .execute(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn db_delete_chat_session(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    // Delete session and its messages
    sqlx::query("DELETE FROM chat_messages WHERE session_id = ?")
        .bind(&id)
        .execute(&*db)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM chat_sessions WHERE id = ?")
        .bind(&id)
        .execute(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn db_get_chat_messages(
    app: AppHandle,
    session_id: String,
) -> Result<Vec<ChatMessage>, String> {
    let db = app.state::<SqlitePool>();

    let result = sqlx::query_as::<_, ChatMessage>(
        "SELECT id, session_id, role, content, created_at
         FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
    )
    .bind(&session_id)
    .fetch_all(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(result)
}

#[tauri::command]
pub async fn db_save_chat_message(
    app: AppHandle,
    message: ChatMessage,
) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    sqlx::query(
        "INSERT INTO chat_messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&message.id)
    .bind(&message.session_id)
    .bind(&message.role)
    .bind(&message.content)
    .bind(&message.created_at)
    .execute(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn db_clear_chat_messages(
    app: AppHandle,
    session_id: String,
) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    sqlx::query("DELETE FROM chat_messages WHERE session_id = ?")
        .bind(&session_id)
        .execute(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// Sync Status Commands
// ============================================================================

#[tauri::command]
pub async fn db_get_last_sync_time(app: AppHandle) -> Result<Option<i64>, String> {
    let db = app.state::<SqlitePool>();

    let result: Option<(i64,)> = sqlx::query_as(
        "SELECT last_sync_time FROM sync_status WHERE id = 1",
    )
    .fetch_optional(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(result.map(|r| r.0))
}

#[tauri::command]
pub async fn db_set_last_sync_time(
    app: AppHandle,
    timestamp: i64,
) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    sqlx::query(
        "INSERT OR REPLACE INTO sync_status (id, last_sync_time) VALUES (1, ?)",
    )
    .bind(timestamp)
    .execute(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// Bible Verse Cache Commands (Offline Support)
// ============================================================================

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct BibleVerse {
    pub id: String,
    pub book_id: String,
    pub chapter: i32,
    pub verse: i32,
    pub text: String,
    pub text_en: Option<String>,
    pub version: String,
    pub cached_at: String,
}

#[tauri::command]
pub async fn db_get_bible_chapter(
    app: AppHandle,
    book_id: String,
    chapter: i32,
    version: String,
) -> Result<Vec<BibleVerse>, String> {
    let db = app.state::<SqlitePool>();

    let verses = sqlx::query_as::<_, BibleVerse>(
        "SELECT id, book_id, chapter, verse, text, text_en, version, cached_at
         FROM bible_verses
         WHERE book_id = ? AND chapter = ? AND version = ?
         ORDER BY verse",
    )
    .bind(&book_id)
    .bind(chapter)
    .bind(&version)
    .fetch_all(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(verses)
}

#[tauri::command]
pub async fn db_save_bible_verse(
    app: AppHandle,
    verse: BibleVerse,
) -> Result<(), String> {
    let db = app.state::<SqlitePool>();

    sqlx::query(
        "INSERT OR REPLACE INTO bible_verses
         (id, book_id, chapter, verse, text, text_en, version, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&verse.id)
    .bind(&verse.book_id)
    .bind(verse.chapter)
    .bind(verse.verse)
    .bind(&verse.text)
    .bind(&verse.text_en)
    .bind(&verse.version)
    .bind(&verse.cached_at)
    .execute(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn db_count_bible_verses(
    app: AppHandle,
    book_id: String,
) -> Result<i32, String> {
    let db = app.state::<SqlitePool>();

    let result: Option<(i32,)> = sqlx::query_as(
        "SELECT COUNT(*) FROM bible_verses WHERE book_id = ?",
    )
    .bind(&book_id)
    .fetch_optional(&*db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(result.map(|r| r.0).unwrap_or(0))
}

#[tauri::command]
pub async fn db_init_bible_tables(_app: AppHandle) -> Result<(), String> {
    // This is called separately to initialize Bible tables
    // The main db_init already creates them, so this is a no-op
    // kept for API compatibility
    Ok(())
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn highlight_serialization() {
        let highlight = Highlight {
            id: "test-1".to_string(),
            user_id: "user-1".to_string(),
            book_id: "gen".to_string(),
            chapter: 1,
            verse_start: 1,
            verse_end: 3,
            color: "#fef08a".to_string(),
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: None,
        };

        let json = serde_json::to_string(&highlight).unwrap();
        let parsed: Highlight = serde_json::from_str(&json).unwrap();

        assert_eq!(parsed.id, "test-1");
        assert_eq!(parsed.book_id, "gen");
        assert_eq!(parsed.verse_start, 1);
        assert_eq!(parsed.verse_end, 3);
    }

    #[test]
    fn bookmark_serialization() {
        let bookmark = Bookmark {
            id: "bookmark-1".to_string(),
            user_id: "user-1".to_string(),
            book_id: "ps".to_string(),
            chapter: 23,
            verse: None,
            created_at: "2024-01-01T00:00:00Z".to_string(),
        };

        let json = serde_json::to_string(&bookmark).unwrap();
        let parsed: Bookmark = serde_json::from_str(&json).unwrap();

        assert_eq!(parsed.id, "bookmark-1");
        assert_eq!(parsed.book_id, "ps");
        assert_eq!(parsed.chapter, 23);
    }

    #[test]
    fn reading_history_serialization() {
        let entry = ReadingHistoryEntry {
            id: "history-1".to_string(),
            user_id: "user-1".to_string(),
            book_id: "john".to_string(),
            chapter: 3,
            read_at: "2024-01-01T00:00:00Z".to_string(),
            duration: None,
        };

        let json = serde_json::to_string(&entry).unwrap();
        let parsed: ReadingHistoryEntry = serde_json::from_str(&json).unwrap();

        assert_eq!(parsed.id, "history-1");
        assert_eq!(parsed.book_id, "john");
        assert_eq!(parsed.chapter, 3);
    }

    #[test]
    fn highlight_verse_range_validation() {
        // Valid range
        let highlight = Highlight {
            id: "test-1".to_string(),
            user_id: "user-1".to_string(),
            book_id: "gen".to_string(),
            chapter: 1,
            verse_start: 1,
            verse_end: 10,
            color: "#fef08a".to_string(),
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: None,
        };
        assert!(highlight.verse_start <= highlight.verse_end);

        // Single verse
        let single_verse = Highlight {
            verse_start: 5,
            verse_end: 5,
            ..highlight.clone()
        };
        assert_eq!(single_verse.verse_start, single_verse.verse_end);
    }
}