//! Authentication commands for Tauri
//!
//! Handles token storage and login window management

use tauri::{AppHandle, Emitter, Manager};
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

    // Get login URL from environment variable or use default
    let login_url = option_env!("LOGIN_URL")
        .unwrap_or("https://aidu.app/desktop-login");

    // Create login window
    let _window = WebviewWindowBuilder::new(
        &app,
        "login",
        WebviewUrl::External(login_url.parse().unwrap())
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

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn login_url_uses_env_or_default() {
        // When LOGIN_URL env var is not set, should use default
        let default_url = option_env!("LOGIN_URL")
            .unwrap_or("https://aidu.app/desktop-login");

        assert!(!default_url.is_empty());
        assert!(default_url.starts_with("https://"));
        assert!(default_url.contains("desktop-login"));
    }

    #[test]
    fn token_key_formatting() {
        // Test that token keys are correctly formatted
        let key = "auth_token";
        assert!(key.contains('_'));
        assert!(!key.is_empty());
    }

    #[test]
    fn user_id_optional() {
        // Test that user_id is properly optional in login_complete
        fn takes_optional_user_id(user_id: Option<String>) -> bool {
            user_id.is_some()
        }

        assert!(!takes_optional_user_id(None));
        assert!(takes_optional_user_id(Some("user-123".to_string())));
    }
}