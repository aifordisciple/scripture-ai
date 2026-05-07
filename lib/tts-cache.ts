import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

// --- Configuration ---
const CACHE_DIR = process.env.TTS_CACHE_DIR || '/tmp/tts-cache';
const MAX_CACHE_MB = parseInt(process.env.TTS_CACHE_MAX_MB || '500', 10);
const MAX_CACHE_FILES = parseInt(process.env.TTS_CACHE_MAX_FILES || '1000', 10);
const CACHE_TTL_MS = parseInt(process.env.TTS_CACHE_TTL_MS || String(30 * 24 * 60 * 60 * 1000), 10); // 30 days

// --- In-flight deduplication ---
const inFlightRequests = new Map<string, Promise<Buffer>>();

export function getInFlightPromise(key: string): Promise<Buffer> | undefined {
  return inFlightRequests.get(key);
}

export function setInFlightPromise(key: string, promise: Promise<Buffer>): void {
  inFlightRequests.set(key, promise);
  promise.finally(() => inFlightRequests.delete(key));
}

// --- Cache key ---
export function getTtsCacheKey(text: string, voice: string): string {
  const safeText = text.slice(0, 5000);
  const hash = createHash('sha256').update(`${safeText}|${voice}`).digest('hex');
  return `tts-${hash}.mp3`;
}

// --- Disk cache operations ---
export function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function getCachedAudio(cacheKey: string): Buffer | null {
  const filePath = path.join(CACHE_DIR, cacheKey);
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size === 0) return null;
    if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) {
      fs.unlinkSync(filePath);
      return null;
    }
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

export function setCachedAudio(cacheKey: string, buffer: Buffer): void {
  const filePath = path.join(CACHE_DIR, cacheKey);
  try {
    ensureCacheDir();
    fs.writeFileSync(filePath, buffer);
    evictIfNeeded();
  } catch {
    // Cache write failure is non-fatal — audio was already generated
  }
}

// --- Eviction ---
function evictIfNeeded(): void {
  try {
    ensureCacheDir();
    const files = fs.readdirSync(CACHE_DIR)
      .map(name => {
        const filePath = path.join(CACHE_DIR, name);
        const stat = fs.statSync(filePath);
        return { name, filePath, mtimeMs: stat.mtimeMs, size: stat.size };
      })
      .filter(f => f.size > 0)
      .sort((a, b) => a.mtimeMs - b.mtimeMs); // oldest first

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const totalMB = totalSize / (1024 * 1024);

    if (totalMB <= MAX_CACHE_MB && files.length <= MAX_CACHE_FILES) return;

    // Delete oldest files until within limits
    for (const file of files) {
      if (totalMB <= MAX_CACHE_MB && files.length <= MAX_CACHE_FILES) break;
      try {
        fs.unlinkSync(file.filePath);
      } catch {
        // File may have been deleted by another request
      }
    }
  } catch {
    // Eviction failure is non-fatal
  }
}
