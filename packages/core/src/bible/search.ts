// packages/core/src/bible/search.ts
// Bible search engine

import { BibleVerse, SearchResult } from '../constants';
import { getApiBaseUrl } from './reader';

export type SearchMode = 'exact' | 'ai';

interface SearchOptions {
  mode?: SearchMode;
  version?: string;
  limit?: number;
}

// Exact search - keyword matching
export async function searchExact(
  query: string, 
  options: SearchOptions = {}
): Promise<BibleVerse[]> {
  const { version = 'CUV', limit = 50 } = options;
  const url = `${getApiBaseUrl()}/search?q=${encodeURIComponent(query)}&mode=exact`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Search failed');
  }
  
  const data = await response.json();
  return (data.data || []).slice(0, limit);
}

// AI semantic search - LLM powered
export async function searchAI(
  query: string,
  options: SearchOptions = {}
): Promise<BibleVerse[]> {
  const { version = 'CUV', limit = 30 } = options;
  const url = `${getApiBaseUrl()}/search?q=${encodeURIComponent(query)}&mode=ai`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('AI search failed');
  }
  
  const data = await response.json();
  return (data.data || []).slice(0, limit);
}

// Unified search function
export async function search(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult> {
  const { mode = 'exact' } = options;

  let verses: BibleVerse[];

  switch (mode) {
    case 'ai':
      verses = await searchAI(query, options);
      break;
    default:
      verses = await searchExact(query, options);
  }

  return {
    verses,
    total: verses.length
  };
}
