// apps/desktop/src/adapters/index.ts
/**
 * Desktop app adapter initialization
 *
 * This module initializes platform-specific adapters for the desktop app
 */

import { getStorageAdapter, getDatabaseAdapter, getAuthAdapter } from '@scripture-ai/native';

let initialized = false;

/**
 * Initialize desktop adapters
 * Call this before rendering the app
 */
export async function initializeAdapters(): Promise<void> {
  if (initialized) return;

  // Initialize database
  const db = getDatabaseAdapter();
  if (db) {
    try {
      // Import the db_init command from Tauri
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('db_init');
      console.log('Desktop database initialized');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  initialized = true;
}

// Re-export adapters
export { getStorageAdapter, getDatabaseAdapter, getAuthAdapter };