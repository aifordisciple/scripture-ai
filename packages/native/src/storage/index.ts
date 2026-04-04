/**
 * Storage adapter exports
 * Automatically selects correct adapter based on platform
 */

import { getPlatform } from '../platform';
import { LocalStorageAdapter, createLocalStorageAdapter } from './web';
import { DesktopStorageAdapter, DesktopDatabaseAdapter, createDesktopStorageAdapter, createDesktopDatabaseAdapter } from './desktop';
import type { StorageAdapter, DatabaseAdapter } from './types';

export type {
  StorageAdapter,
  DatabaseAdapter,
  Highlight,
  Note,
  ReadingHistoryEntry,
  Bookmark,
} from './types';

export { LocalStorageAdapter, createLocalStorageAdapter } from './web';
export { DesktopStorageAdapter, DesktopDatabaseAdapter, createDesktopStorageAdapter, createDesktopDatabaseAdapter } from './desktop';

/**
 * Get the appropriate key-value storage adapter for current platform
 */
export function getStorageAdapter(): StorageAdapter {
  const platform = getPlatform();
  return platform === 'desktop'
    ? createDesktopStorageAdapter()
    : createLocalStorageAdapter();
}

/**
 * Get the appropriate database adapter for current platform
 * Note: Web platform uses API calls instead of local database
 * This is primarily for desktop offline functionality
 */
export function getDatabaseAdapter(): DatabaseAdapter | null {
  const platform = getPlatform();
  return platform === 'desktop'
    ? createDesktopDatabaseAdapter()
    : null; // Web uses API, no local database
}