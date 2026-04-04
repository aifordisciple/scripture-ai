/**
 * Web storage adapter using localStorage
 * Simple key-value storage for browser environment
 */

import type { StorageAdapter } from './types';

/**
 * LocalStorage adapter for web environment
 */
export class LocalStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null;

    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to get value for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set value for key ${key}:`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }

  async keys(): Promise<string[]> {
    if (typeof window === 'undefined') return [];

    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i) || '');
    }
    return keys;
  }
}

/**
 * Create localStorage adapter instance
 */
export function createLocalStorageAdapter(): StorageAdapter {
  return new LocalStorageAdapter();
}