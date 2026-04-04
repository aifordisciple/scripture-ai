//! Scripture AI Desktop - Tauri Backend
//!
//! This is the main entry point for the Tauri desktop application.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{auth, storage};

fn main() {
    tauri::Builder::default()
        // Initialize plugins
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        // Register all IPC commands
        .invoke_handler(tauri::generate_handler![
            // Auth commands
            auth::store_token,
            auth::get_token,
            auth::clear_token,
            auth::open_login_window,
            auth::login_complete,
            // Storage commands
            storage::store_get,
            storage::store_set,
            storage::store_remove,
            storage::store_clear,
            storage::store_keys,
            // Database commands
            storage::db_init,
            storage::db_get_highlights,
            storage::db_save_highlight,
            storage::db_delete_highlight,
            storage::db_get_notes,
            storage::db_save_note,
            storage::db_delete_note,
            storage::db_get_reading_history,
            storage::db_save_reading_history,
            storage::db_get_bookmarks,
            storage::db_save_bookmark,
            storage::db_delete_bookmark,
            storage::db_get_last_sync_time,
            storage::db_set_last_sync_time,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}