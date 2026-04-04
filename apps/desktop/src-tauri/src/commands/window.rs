//! Window state management commands
//!
//! Saves and restores window position, size, and state

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;

#[derive(Debug, Serialize, Deserialize)]
pub struct WindowState {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub maximized: bool,
}

const WINDOW_STATE_KEY: &str = "window-state";

/// Save window state to store
#[tauri::command]
pub async fn save_window_state(
    app: AppHandle,
    state: WindowState,
) -> Result<(), String> {
    let store = app.store("data.json")
        .map_err(|e| e.to_string())?;

    let state_json = serde_json::to_string(&state)
        .map_err(|e| e.to_string())?;

    store.set(WINDOW_STATE_KEY, serde_json::json!(state_json));
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

/// Get saved window state
#[tauri::command]
pub async fn get_window_state(
    app: AppHandle,
) -> Result<Option<WindowState>, String> {
    let store = app.store("data.json")
        .map_err(|e| e.to_string())?;

    let value = store.get(WINDOW_STATE_KEY)
        .and_then(|v| v.as_str().map(String::from));

    if let Some(json) = value {
        let state: WindowState = serde_json::from_str(&json)
            .map_err(|e| e.to_string())?;
        Ok(Some(state))
    } else {
        Ok(None)
    }
}

/// Save current window state (called on window close/resize)
#[tauri::command]
pub async fn save_current_window_state(app: AppHandle) -> Result<(), String> {
    let window = app.get_webview_window("main")
        .ok_or("Main window not found")?;

    let position = window.outer_position()
        .map_err(|e| e.to_string())?;
    let size = window.outer_size()
        .map_err(|e| e.to_string())?;
    let maximized = window.is_maximized()
        .map_err(|e| e.to_string())?;

    let state = WindowState {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        maximized,
    };

    save_window_state(app, state).await
}

/// Restore window state
#[tauri::command]
pub async fn restore_window_state(app: AppHandle) -> Result<(), String> {
    let state = get_window_state(app.clone()).await?;

    if let Some(state) = state {
        let window = app.get_webview_window("main")
            .ok_or("Main window not found")?;

        // Set position and size
        window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: state.width,
            height: state.height,
        })).map_err(|e| e.to_string())?;

        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: state.x,
            y: state.y,
        })).map_err(|e| e.to_string())?;

        // Restore maximized state
        if state.maximized {
            window.maximize().map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}