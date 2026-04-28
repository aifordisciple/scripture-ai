// lib/rate-limit.ts
// Simple in-memory rate limiter (for production, use Redis)

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

interface RequestRecord {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RequestRecord>();

// Clean up expired entries periodically - 使用可清理的定时器
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanupTimer() {
  if (cleanupTimer) return; // 防止重复创建
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimits.entries()) {
      if (record.resetAt < now) {
        rateLimits.delete(key);
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
  const globalKey = '__rateLimitCleanupTimer' as keyof typeof globalThis;
  const oldTimer = (globalThis as Record<string, unknown>)[globalKey] as ReturnType<typeof setInterval> | undefined;
  if (oldTimer) {
    clearInterval(oldTimer);
  }
  startCleanupTimer();
  (globalThis as Record<string, unknown>)[globalKey] = cleanupTimer;
} else {
  startCleanupTimer();
}

export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimits.get(identifier);
  
  if (!record || record.resetAt < now) {
    // New window
    rateLimits.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs
    };
  }
  
  if (record.count >= config.maxRequests) {
    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt
    };
  }
  
  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt
  };
}

export function getRateLimitHeaders(result: { remaining: number; resetAt: number }) {
  return {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000))
  };
}
