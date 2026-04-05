// packages/core/src/index.ts
// Scripture AI Core Package
// Shared business logic for web and mobile apps

// Constants
export * from './constants';

// Bible engine - avoid re-exporting conflicting items
export {
  setApiBaseUrl,
  getApiBaseUrl,
  fetchChapter,
  fetchVerse,
  formatVerseRef,
} from './bible/reader';

export {
  search,
  searchExact,
  searchAI,
  searchFuzzy,
  type SearchMode,
} from './bible/search';

// AI module
export {
  sendChatMessage,
  type ChatMessage,
  type ChatContext,
  type ChatOptions,
} from './ai/chat';

// API client - use explicit re-exports to avoid conflicts
export {
  apiCall,
  bibleApi,
  chatApi,
  userApi,
  type ApiResponse,
  type BibleVerse as ApiBibleVerse,
} from './api';

// Storage
export * from './storage';

// Sync
export * from './sync';