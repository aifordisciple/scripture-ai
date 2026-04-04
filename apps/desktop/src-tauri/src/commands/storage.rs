//! Storage commands for Tauri
//!
//! Handles both key-value store and SQLite database operations

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_sql::Sql;
use tauri_plugin_store::StoreExt;

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
        .filter_map(|k| k.as_str().map(String::from))
        .collect();

    Ok(keys)
}

// ============================================================================
// Data Types
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
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

#[derive(Debug, Serialize, Deserialize)]
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

#[derive(Debug, Serialize, Deserialize)]
pub struct ReadingHistoryEntry {
    pub id: String,
    pub user_id: String,
    pub book_id: String,
    pub chapter: i32,
    pub read_at: String,
    pub duration: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Bookmark {
    pub id: String,
    pub user_id: String,
    pub book_id: String,
    pub chapter: i32,
    pub verse: Option<i32>,
    pub created_at: String,
}

// ============================================================================
// Database Commands (tauri-plugin-sql)
// ============================================================================

/// Initialize database tables
#[tauri::command]
pub async fn db_init(app: AppHandle) -> Result<(), String> {
    let db = app.state::<Sql>();

    // Create highlights table
    db.execute(
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
        [],
    ).await.map_err(|e| e.to_string())?;

    // Create notes table
    db.execute(
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
        [],
    ).await.map_err(|e| e.to_string())?;

    // Create reading_history table
    db.execute(
        "CREATE TABLE IF NOT EXISTS reading_history (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            book_id TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            read_at TEXT NOT NULL,
            duration INTEGER
        )",
        [],
    ).await.map_err(|e| e.to_string())?;

    // Create bookmarks table
    db.execute(
        "CREATE TABLE IF NOT EXISTS bookmarks (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            book_id TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            verse INTEGER,
            created_at TEXT NOT NULL
        )",
        [],
    ).await.map_err(|e| e.to_string())?;

    // Create sync_status table
    db.execute(
        "CREATE TABLE IF NOT EXISTS sync_status (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            last_sync_time INTEGER NOT NULL
        )",
        [],
    ).await.map_err(|e| e.to_string())?;

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
    let db = app.state::<Sql>();

    let highlights: Vec<Highlight> = db
        .query(
            "SELECT * FROM highlights WHERE user_id = ?",
            [user_id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(highlights)
}

#[tauri::command]
pub async fn db_save_highlight(
    app: AppHandle,
    highlight: Highlight,
) -> Result<(), String> {
    let db = app.state::<Sql>();

    db.execute(
        "INSERT OR REPLACE INTO highlights
         (id, user_id, book_id, chapter, verse_start, verse_end, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            highlight.id,
            highlight.user_id,
            highlight.book_id,
            highlight.chapter.to_string(),
            highlight.verse_start.to_string(),
            highlight.verse_end.to_string(),
            highlight.color,
            highlight.created_at,
            highlight.updated_at.unwrap_or_default(),
        ],
    ).await.map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn db_delete_highlight(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let db = app.state::<Sql>();

    db.execute(
        "DELETE FROM highlights WHERE id = ?",
        [id],
    ).await.map_err(|e| e.to_string())?;

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
    let db = app.state::<Sql>();

    let notes: Vec<Note> = db
        .query(
            "SELECT * FROM notes WHERE user_id = ?",
            [user_id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(notes)
}

#[tauri::command]
pub async fn db_save_note(
    app: AppHandle,
    note: Note,
) -> Result<(), String> {
    let db = app.state::<Sql>();

    db.execute(
        "INSERT OR REPLACE INTO notes
         (id, user_id, book_id, chapter, verse_start, verse_end, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            note.id,
            note.user_id,
            note.book_id,
            note.chapter.to_string(),
            note.verse_start.to_string(),
            note.verse_end.map(|v| v.to_string()).unwrap_or_default(),
            note.content,
            note.created_at,
            note.updated_at.unwrap_or_default(),
        ],
    ).await.map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn db_delete_note(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let db = app.state::<Sql>();

    db.execute(
        "DELETE FROM notes WHERE id = ?",
        [id],
    ).await.map_err(|e| e.to_string())?;

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
    let db = app.state::<Sql>();

    let history: Vec<ReadingHistoryEntry> = db
        .query(
            "SELECT * FROM reading_history WHERE user_id = ? ORDER BY read_at DESC",
            [user_id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(history)
}

#[tauri::command]
pub async fn db_save_reading_history(
    app: AppHandle,
    entry: ReadingHistoryEntry,
) -> Result<(), String> {
    let db = app.state::<Sql>();

    db.execute(
        "INSERT OR REPLACE INTO reading_history
         (id, user_id, book_id, chapter, read_at, duration)
         VALUES (?, ?, ?, ?, ?, ?)",
        [
            entry.id,
            entry.user_id,
            entry.book_id,
            entry.chapter.to_string(),
            entry.read_at,
            entry.duration.map(|d| d.to_string()).unwrap_or_default(),
        ],
    ).await.map_err(|e| e.to_string())?;

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
    let db = app.state::<Sql>();

    let bookmarks: Vec<Bookmark> = db
        .query(
            "SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC",
            [user_id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(bookmarks)
}

#[tauri::command]
pub async fn db_save_bookmark(
    app: AppHandle,
    bookmark: Bookmark,
) -> Result<(), String> {
    let db = app.state::<Sql>();

    db.execute(
        "INSERT OR REPLACE INTO bookmarks
         (id, user_id, book_id, chapter, verse, created_at)
         VALUES (?, ?, ?, ?, ?, ?)",
        [
            bookmark.id,
            bookmark.user_id,
            bookmark.book_id,
            bookmark.chapter.to_string(),
            bookmark.verse.map(|v| v.to_string()).unwrap_or_default(),
            bookmark.created_at,
        ],
    ).await.map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn db_delete_bookmark(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let db = app.state::<Sql>();

    db.execute(
        "DELETE FROM bookmarks WHERE id = ?",
        [id],
    ).await.map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// Sync Status Commands
// ============================================================================

#[tauri::command]
pub async fn db_get_last_sync_time(app: AppHandle) -> Result<Option<i64>, String> {
    let db = app.state::<Sql>();

    let result: Vec<(i64,)> = db
        .query("SELECT last_sync_time FROM sync_status WHERE id = 1", [])
        .await
        .map_err(|e| e.to_string())?;

    Ok(result.first().map(|r| r.0))
}

#[tauri::command]
pub async fn db_set_last_sync_time(
    app: AppHandle,
    timestamp: i64,
) -> Result<(), String> {
    let db = app.state::<Sql>();

    db.execute(
        "INSERT OR REPLACE INTO sync_status (id, last_sync_time) VALUES (1, ?)",
        [timestamp],
    ).await.map_err(|e| e.to_string())?;

    Ok(())
}