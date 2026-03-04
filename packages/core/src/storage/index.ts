// packages/core/src/storage/index.ts
// Storage abstraction - works with AsyncStorage (mobile) or localStorage (web)

import { 
  UserSettings, 
  HighlightData, 
  NoteData, 
  InteractionLog,
  PlanProgress,
  Badge,
  SyncData 
} from '../constants';

// Storage adapter interface
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Web localStorage adapter (default for web)
export function createLocalStorageAdapter(): StorageAdapter {
  return {
    async get<T>(key: string): Promise<T | null> {
      if (typeof window === 'undefined') return null;
      const value = localStorage.getItem(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    },
    
    async set<T>(key: string, value: T): Promise<void> {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    },
    
    async remove(key: string): Promise<void> {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
    },
    
    async clear(): Promise<void> {
      if (typeof window === 'undefined') return;
      localStorage.clear();
    }
  };
}

// Storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'bible-settings',
  HIGHLIGHTS: 'bible-highlights',
  NOTES: 'bible-notes',
  INTERACTIONS: 'bible-interactions',
  PLANS: 'bible-plans',
  CUSTOM_PLANS: 'bible-custom-plans',
  BADGES: 'bible-badges',
  STREAK: 'bible-streak',
  LAST_ACTIVE: 'bible-last-active',
  USER_DATA: 'bible-user-data',
  SYNC_TIME: 'bible-sync-time',
  PENDING_SYNC: 'bible-pending-sync'
} as const;

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  fontSize: 20,
  lineHeight: 1.8,
  isDarkMode: false,
  showEnglish: true
};

// Create storage instance
let storageAdapter: StorageAdapter = createLocalStorageAdapter();

export function setStorageAdapter(adapter: StorageAdapter) {
  storageAdapter = adapter;
}

export function getStorageAdapter(): StorageAdapter {
  return storageAdapter;
}

// Settings
export async function getSettings(): Promise<UserSettings> {
  const settings = await storageAdapter.get<UserSettings>(STORAGE_KEYS.SETTINGS);
  return settings || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await storageAdapter.set(STORAGE_KEYS.SETTINGS, settings);
}

// Highlights
export async function getHighlights(): Promise<HighlightData[]> {
  const highlights = await storageAdapter.get<HighlightData[]>(STORAGE_KEYS.HIGHLIGHTS);
  return highlights || [];
}

export async function saveHighlights(highlights: HighlightData[]): Promise<void> {
  await storageAdapter.set(STORAGE_KEYS.HIGHLIGHTS, highlights);
}

// Notes
export async function getNotes(): Promise<NoteData[]> {
  const notes = await storageAdapter.get<NoteData[]>(STORAGE_KEYS.NOTES);
  return notes || [];
}

export async function saveNotes(notes: NoteData[]): Promise<void> {
  await storageAdapter.set(STORAGE_KEYS.NOTES, notes);
}

// Interactions (reading history)
export async function getInteractions(): Promise<InteractionLog[]> {
  const interactions = await storageAdapter.get<InteractionLog[]>(STORAGE_KEYS.INTERACTIONS);
  return interactions || [];
}

export async function saveInteractions(interactions: InteractionLog[]): Promise<void> {
  await storageAdapter.set(STORAGE_KEYS.INTERACTIONS, interactions);
}

// Plans
export async function getActivePlans(): Promise<PlanProgress[]> {
  const plans = await storageAdapter.get<PlanProgress[]>(STORAGE_KEYS.PLANS);
  return plans || [];
}

export async function saveActivePlans(plans: PlanProgress[]): Promise<void> {
  await storageAdapter.set(STORAGE_KEYS.PLANS, plans);
}

// Streak
export async function getStreak(): Promise<{ count: number; lastActive: number | null }> {
  const streak = await storageAdapter.get<{ count: number; lastActive: number | null }>(STORAGE_KEYS.STREAK);
  return streak || { count: 0, lastActive: null };
}

export async function saveStreak(count: number, lastActive: number | null): Promise<void> {
  await storageAdapter.set(STORAGE_KEYS.STREAK, { count, lastActive });
}

// Badges
export async function getBadges(): Promise<Badge[]> {
  const badges = await storageAdapter.get<Badge[]>(STORAGE_KEYS.BADGES);
  return badges || [];
}

export async function saveBadges(badges: Badge[]): Promise<void> {
  await storageAdapter.set(STORAGE_KEYS.BADGES, badges);
}

// Full sync data
export async function getAllUserData(): Promise<SyncData> {
  const [settings, highlights, notes, interactions, activePlans, badges, streak] = await Promise.all([
    getSettings(),
    getHighlights(),
    getNotes(),
    getInteractions(),
    getActivePlans(),
    getBadges(),
    getStreak()
  ]);
  
  return {
    settings,
    highlights,
    notes,
    interactions,
    activePlans,
    streakCount: streak.count,
    lastActiveDate: streak.lastActive,
    badges
  };
}

export async function saveAllUserData(data: SyncData): Promise<void> {
  await Promise.all([
    saveSettings(data.settings),
    saveHighlights(data.highlights),
    saveNotes(data.notes),
    saveInteractions(data.interactions),
    saveActivePlans(data.activePlans),
    saveBadges(data.badges),
    saveStreak(data.streakCount, data.lastActiveDate)
  ]);
}

// Clear all data
export async function clearAllData(): Promise<void> {
  await storageAdapter.clear();
}
