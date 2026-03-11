// lib/cache.ts
// Simple in-memory cache with TTL support
// For production with Redis, replace with ioredis client

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// In-memory cache storage
const cache = new Map<string, CacheEntry<unknown>>();

// Clean up expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt < now) {
        cache.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  crossref: 3600,      // 串珠数据缓存 1 小时
  crossrefAI: 86400,   // AI 说明缓存 24 小时
  default: 1800,       // 默认 30 分钟
};

/**
 * Generate cache key for cross-reference data
 */
export function getCrossRefCacheKey(
  bookId: string,
  chapter: number,
  verse: number
): string {
  return `crossref:${bookId}:${chapter}:${verse}`;
}

/**
 * Generate cache key for AI descriptions
 */
export function getCrossRefAICacheKey(
  bookId: string,
  chapter: number,
  verse: number
): string {
  return `crossref:ai:${bookId}:${chapter}:${verse}`;
}

/**
 * Get cached data
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set cache data with TTL
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds: number = CACHE_TTL.default
): Promise<void> {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Delete cached data
 */
export async function deleteCached(key: string): Promise<boolean> {
  return cache.delete(key);
}

/**
 * Clear all cache entries matching a prefix
 */
export async function clearCachePrefix(prefix: string): Promise<number> {
  let count = 0;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      count++;
    }
  }
  return count;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}