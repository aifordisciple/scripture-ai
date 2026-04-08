//! System tray commands
//!
//! Manages tray menu with recent readings

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentReading {
    pub book_id: String,
    pub book_name: String,
    pub chapter: i32,
    pub read_at: String,
}

const RECENT_READINGS_KEY: &str = "recent-readings";
const MAX_RECENT: usize = 5;
const STORE_NAME: &str = "data.json";

/// Get recent readings
#[tauri::command]
pub async fn get_recent_readings(app: AppHandle) -> Result<Vec<RecentReading>, String> {
    let store = app.store(STORE_NAME)
        .map_err(|e| format!("Store error: {}", e))?;

    let value = store.get(RECENT_READINGS_KEY);

    if let Some(json) = value {
        let readings: Vec<RecentReading> = serde_json::from_value(json.clone())
            .unwrap_or_default();
        Ok(readings)
    } else {
        Ok(Vec::new())
    }
}

/// Add to recent readings
#[tauri::command]
pub async fn add_recent_reading(
    app: AppHandle,
    reading: RecentReading,
) -> Result<(), String> {
    let store = app.store(STORE_NAME)
        .map_err(|e| format!("Store error: {}", e))?;

    let mut readings: Vec<RecentReading> = store.get(RECENT_READINGS_KEY)
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    // Remove existing entry for same book/chapter
    readings.retain(|r| !(r.book_id == reading.book_id && r.chapter == reading.chapter));

    // Add to front
    readings.insert(0, reading);

    // Keep only MAX_RECENT
    readings.truncate(MAX_RECENT);

    store.set(RECENT_READINGS_KEY, serde_json::to_value(&readings).unwrap());
    store.save().map_err(|e| format!("Save error: {}", e))?;

    Ok(())
}

/// Clear recent readings
#[tauri::command]
pub async fn clear_recent_readings(app: AppHandle) -> Result<(), String> {
    let store = app.store(STORE_NAME)
        .map_err(|e| format!("Store error: {}", e))?;

    store.set(RECENT_READINGS_KEY, serde_json::json!([]));
    store.save().map_err(|e| format!("Save error: {}", e))?;

    Ok(())
}