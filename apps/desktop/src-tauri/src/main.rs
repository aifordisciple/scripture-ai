//! Scripture AI Desktop - Tauri Backend
//!
//! This is the main entry point for the Tauri desktop application.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{auth, storage, system, window, tray};
use sqlx::SqlitePool;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

fn main() {
    tauri::Builder::default()
        // Initialize plugins
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        // Register all IPC commands
        .invoke_handler(tauri::generate_handler![
            // System commands
            system::get_platform,
            system::quit_app,
            system::get_app_version,
            system::minimize_window,
            system::toggle_maximize,
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
            // Chat session commands
            storage::db_get_chat_sessions,
            storage::db_save_chat_session,
            storage::db_delete_chat_session,
            storage::db_get_chat_messages,
            storage::db_save_chat_message,
            storage::db_clear_chat_messages,
            // Bible verse cache commands (offline support)
            storage::db_get_bible_chapter,
            storage::db_save_bible_verse,
            storage::db_count_bible_verses,
            storage::db_clear_bible_cache,
            storage::db_init_bible_tables,
            // Window state commands
            window::save_window_state,
            window::get_window_state,
            window::save_current_window_state,
            window::restore_window_state,
            // Tray commands
            tray::get_recent_readings,
            tray::add_recent_reading,
            tray::clear_recent_readings,
        ])
        // Setup: initialize database and system tray
        .setup(|app| {
            // Initialize database
            let app_handle = app.handle().clone();
            tauri::async_runtime::block_on(async {
                // Create SQLite pool
                let app_data_dir = app_handle.path().app_data_dir()
                    .expect("Failed to get app data dir");

                // Ensure directory exists
                std::fs::create_dir_all(&app_data_dir)
                    .expect("Failed to create app data directory");

                let db_path = app_data_dir.join("scripture.db");
                let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

                // Connect to database
                let pool = SqlitePool::connect(&db_url)
                    .await
                    .expect("Failed to connect to database");

                // Store pool in app state
                app_handle.manage(pool);

                // Initialize tables
                let _ = storage::db_init(app_handle.clone()).await;
            });

            // Load recent readings for tray menu
            let recent_readings = tauri::async_runtime::block_on(async {
                tray::get_recent_readings(app.handle().clone()).await.unwrap_or_default()
            });

            // Create tray menu items
            let show_item = MenuItemBuilder::with_id("show", "显示窗口").build(app)?;
            let hide_item = MenuItemBuilder::with_id("hide", "隐藏窗口").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "退出").build(app)?;

            // Build tray menu with recent readings
            let mut menu_builder = MenuBuilder::new(app)
                .item(&show_item)
                .item(&hide_item)
                .separator();

            // Add recent readings section header
            if !recent_readings.is_empty() {
                let recent_header = MenuItemBuilder::with_id("recent-header", "最近阅读")
                    .enabled(false)
                    .build(app)?;
                menu_builder = menu_builder.item(&recent_header);

                // Add each recent reading
                for reading in &recent_readings {
                    let id = format!("reading-{}-{}", reading.book_id, reading.chapter);
                    let text = format!("{} {}章", reading.book_name, reading.chapter);
                    let item = MenuItemBuilder::with_id(&id, &text).build(app)?;
                    menu_builder = menu_builder.item(&item);
                }

                menu_builder = menu_builder.separator();
            }

            let menu = menu_builder
                .item(&quit_item)
                .build()?;

            // Create system tray
            match app.default_window_icon().cloned() {
                Some(icon) => {
                    if let Err(e) = TrayIconBuilder::new()
                        .icon(icon)
                        .menu(&menu)
                        .show_menu_on_left_click(false)
                        .on_menu_event(|app, event| match event.id.as_ref() {
                            "show" => {
                                if let Some(window) = app.get_webview_window("main") {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                            "hide" => {
                                if let Some(window) = app.get_webview_window("main") {
                                    let _ = window.hide();
                                }
                            }
                            "quit" => {
                                let _ = tauri::async_runtime::block_on(async {
                                    let _ = window::save_current_window_state(app.clone()).await;
                                });
                                app.exit(0);
                            }
                            id if id.starts_with("reading-") => {
                                let parts: Vec<&str> = id.split('-').collect();
                                if parts.len() == 3 {
                                    let book_id = parts[1];
                                    let chapter: i32 = parts[2].parse().unwrap_or(1);
                                    let _ = app.emit("navigate-to-reading", (book_id, chapter));
                                    if let Some(window) = app.get_webview_window("main") {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                }
                            }
                            _ => {}
                        })
                        .on_tray_icon_event(|tray, event| {
                            if let TrayIconEvent::Click {
                                button: MouseButton::Left,
                                button_state: MouseButtonState::Up,
                                ..
                            } = event
                            {
                                let app = tray.app_handle();
                                if let Some(window) = app.get_webview_window("main") {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        })
                        .build(app)
                    {
                        eprintln!("Warning: Failed to create system tray: {}", e);
                    }
                }
                None => {
                    eprintln!("Warning: No default window icon available, skipping tray creation");
                }
            }

            // Restore window state
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let _ = window::restore_window_state(app_handle).await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}