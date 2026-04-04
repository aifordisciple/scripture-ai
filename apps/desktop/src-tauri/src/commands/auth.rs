//! Authentication commands for Tauri
//!
//! Handles token storage and login window management

use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;

/// Store authentication token
#[tauri::command]
pub async fn store_token(
    app: AppHandle,
    key: String,
    value: String,
) -> Result<(), String> {
    let store = app.store("auth.json")
        .map_err(|e| e.to_string())?;

    store.set(key, serde_json::json!(value));
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

/// Get stored authentication token
#[tauri::command]
pub async fn get_token(
    app: AppHandle,
    key: String,
) -> Result<Option<String>, String> {
    let store = app.store("auth.json")
        .map_err(|e| e.to_string())?;

    let value = store.get(&key)
        .and_then(|v| v.as_str().map(String::from));

    Ok(value)
}

/// Clear stored authentication token
#[tauri::command]
pub async fn clear_token(
    app: AppHandle,
    key: String,
) -> Result<(), String> {
    let store = app.store("auth.json")
        .map_err(|e| e.to_string())?;

    store.delete(&key);
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

/// Open login window (WebView)
#[tauri::command]
pub async fn open_login_window(
    app: AppHandle,
) -> Result<(), String> {
    use tauri::{WebviewUrl, WebviewWindowBuilder};

    // Create login window
    let _window = WebviewWindowBuilder::new(
        &app,
        "login",
        WebviewUrl::External("https://your-domain.com/desktop-login".parse().unwrap())
    )
    .title("登录 - AI读")
    .inner_size(400.0, 600.0)
    .resizable(false)
    .center()
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Called when login is complete from WebView
#[tauri::command]
pub async fn login_complete(
    app: AppHandle,
    user_id: Option<String>,
) -> Result<(), String> {
    // Close login window if it exists
    if let Some(login_window) = app.get_webview_window("login") {
        login_window.close().map_err(|e| e.to_string())?;
    }

    // Emit event to main window to refresh auth state
    if let Some(main_window) = app.get_webview_window("main") {
        main_window.emit("login-complete", user_id)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}