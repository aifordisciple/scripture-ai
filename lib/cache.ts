// lib/cache.ts
// Simple in-memory cache with TTL support
// For production with Redis, replace with ioredis client

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// In-memory cache storage
const cache = new Map<string, CacheEntry<unknown>>();

// Clean up expired entries periodically - 使用可清理的定时器
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanupTimer() {
  if (cleanupTimer) return; // 防止重复创建
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt < now) {
        cache.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

// 导出清理函数，供测试/热重载环境使用
export function stopCleanupTimer() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

// [P2-17修复] 热重载时清理旧定时器，防止累积
// Next.js HMR 会重新执行模块，但旧定时器不会被自动清理
if (typeof globalThis !== 'undefined') {
  const globalKey = '__cacheCleanupTimer' as keyof typeof globalThis;
  const oldTimer = (globalThis as Record<string, unknown>)[globalKey] as ReturnType<typeof setInterval> | undefined;
  if (oldTimer) {
    clearInterval(oldTimer);
  }
  startCleanupTimer();
  (globalThis as Record<string, unknown>)[globalKey] = cleanupTimer;
} else {
  startCleanupTimer();
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