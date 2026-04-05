// packages/core/src/constants/types.ts
// Bible types and interfaces

export interface BibleBook {
  name: string;
  id: string;
  chapters: number;
  category: string;
  intro: string;
}

export interface BibleVerse {
  id: number | string;
  bookId?: string;
  book?: string;  // Alternative field name
  bookName?: string;
  chapter: number;
  verse: number;
  text: string;   // Main text content (Chinese)
  textEn?: string; // English text (KJV)
  content?: string; // Alternative field name
  version?: string;
}

export interface VerseRef {
  bookName: string;
  chapter: number;
  verse: number;
}

export interface SearchResult {
  verses: BibleVerse[];
  total: number;
}

// Reading plan types
export interface PlanReadingTask {
  book: string;
  chapter: number;
}

export interface PlanDay {
  day: number;
  readings: PlanReadingTask[];
  devotional?: string;
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  tags: string[];
  tasks: PlanDay[];
}

// Highlight types
export interface HighlightData {
  bookId: string;
  chapter: number;
  verse: number;
  color: string;
  content?: string;
  updatedAt?: string;
}

// Note types
export interface NoteData {
  id: string;
  bookId: string;
  chapter: number;
  verse: number;
  content: string;
  updatedAt?: string;
}

// User types
export interface UserSettings {
  fontSize: number;
  lineHeight: number;
  isDarkMode: boolean;
  showEnglish: boolean;
  lastBook?: string;
  lastChapter?: number;
}

export interface InteractionLog {
  bookId: string;
  chapter: number;
  count: number;
}

// Plan progress types
export interface PlanProgress {
  planId: string;
  startDate: number;
  status?: 'active' | 'completed';
  completedTasks: Record<string, string[]>;
  savedDevotionals?: Record<string, string>;
}

// Badge types
export interface Badge {
  type: string;
  earnedAt: number;
}

// Sync types
export type SyncMode = 'merge' | 'overwrite';

export interface SyncData {
  settings: UserSettings;
  highlights: HighlightData[];
  notes: NoteData[];
  interactions: InteractionLog[];
  activePlans: PlanProgress[];
  streakCount: number;
  lastActiveDate: number | null;
  badges: Badge[];
}
