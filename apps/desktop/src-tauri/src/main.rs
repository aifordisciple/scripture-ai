//! Scripture AI Desktop - Tauri Backend
//!
//! This is the main entry point for the Tauri desktop application.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use commands::{auth, storage, system};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

fn main() {
    tauri::Builder::default()
        // Initialize plugins
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_tray::init())
        .plugin(tauri_plugin_notification::init())
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
        ])
        // Setup system tray
        .setup(|app| {
            // Create tray menu items
            let show_item = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let hide_item = MenuItem::with_id(app, "hide", "隐藏窗口", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

            // Build tray menu
            let menu = Menu::with_items(app, &[&show_item, &hide_item, &quit_item])?;

            // Create system tray
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
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
                        app.exit(0);
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
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}