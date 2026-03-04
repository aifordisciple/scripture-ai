// packages/core/src/sync/index.ts
// Sync engine - handles offline-first data synchronization

import { SyncData, SyncMode } from '../constants';
import * as storage from '../storage';

export interface SyncResult {
  success: boolean;
  data?: SyncData;
  error?: string;
  timestamp: number;
}

// Get API base URL
let API_BASE_URL = '/api';

export function setApiBaseUrl(url: string) {
  API_BASE_URL = url;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

// Fetch user data from server
export async function fetchUserData(): Promise<SyncData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/sync`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data as SyncData;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return null;
  }
}

// Push local data to server
export async function pushUserData(
  data: SyncData,
  mode: SyncMode = 'merge'
): Promise<SyncResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode,
        ...data
      })
    });
    
    if (!response.ok) {
      throw new Error('Sync failed');
    }
    
    const result = await response.json();
    
    return {
      success: true,
      data: result.data,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
  }
}

// Full sync - pull then push
export async function fullSync(mode: SyncMode = 'merge'): Promise<SyncResult> {
  // 1. Get local data
  const localData = await storage.getAllUserData();
  
  // 2. Push to server
  const result = await pushUserData(localData, mode);
  
  if (result.success && result.data) {
    // 3. Update local with server data
    await storage.saveAllUserData(result.data);
  }
  
  return result;
}

// Offline-first sync
export class OfflineSyncEngine {
  private isOnline: boolean = true;
  private pendingSync: SyncData | null = null;
  private syncMode: SyncMode = 'merge';
  
  constructor() {
    // Check online status
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processPendingSync();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }
  
  // Queue data for sync
  async queueSync(data: SyncData, mode: SyncMode = 'merge'): Promise<void> {
    this.syncMode = mode;
    
    if (this.isOnline) {
      // Try immediate sync
      const result = await pushUserData(data, mode);
      
      if (!result.success) {
        // Queue for later
        this.pendingSync = data;
      }
    } else {
      // Save locally and queue
      await storage.saveAllUserData(data);
      this.pendingSync = data;
    }
  }
  
  // Process pending sync when online
  async processPendingSync(): Promise<SyncResult | null> {
    if (!this.pendingSync || !this.isOnline) {
      return null;
    }
    
    const result = await pushUserData(this.pendingSync, this.syncMode);
    
    if (result.success) {
      this.pendingSync = null;
    }
    
    return result;
  }
  
  // Get pending sync status
  hasPendingSync(): boolean {
    return this.pendingSync !== null;
  }
}

// Create sync engine instance
let syncEngine: OfflineSyncEngine | null = null;

export function getSyncEngine(): OfflineSyncEngine {
  if (!syncEngine) {
    syncEngine = new OfflineSyncEngine();
  }
  return syncEngine;
}
