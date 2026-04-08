// apps/desktop/src/adapters/index.ts
/**
 * Desktop app adapter initialization
 *
 * This module initializes platform-specific adapters for the desktop app
 */

import { getStorageAdapter, getDatabaseAdapter, getAuthAdapter } from '@scripture-ai/native';

let initialized = false;

// API base URL for desktop app
const API_BASE_URL = 'http://113.44.66.210:3000';

/**
 * Initialize desktop adapters
 * Call this before rendering the app
 */
export async function initializeAdapters(): Promise<void> {
  if (initialized) return;

  // Set API base URL for desktop
  if (typeof window !== 'undefined') {
    (window as unknown as { __API_URL__?: string }).__API_URL__ = API_BASE_URL;
    console.log('API base URL set to:', API_BASE_URL);
  }

  // Initialize performance monitoring
  try {
    const { initPerformanceMonitoring } = await import('../utils/performance');
    initPerformanceMonitoring();
  } catch {
    // Performance monitoring not available
  }

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