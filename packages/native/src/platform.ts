/**
 * Platform detection for Scripture AI
 * Determines whether running in web browser or Tauri desktop app
 */

export type Platform = 'web' | 'desktop';

/**
 * Detect current platform
 * @returns 'desktop' if running in Tauri, 'web' otherwise
 */
export function getPlatform(): Platform {
  if (typeof window !== 'undefined') {
    // Check for Tauri internal object
    const hasTauri = '__TAURI__' in window;
    return hasTauri ? 'desktop' : 'web';
  }
  return 'web';
}

/**
 * Check if running in Tauri desktop environment
 */
export function isDesktop(): boolean {
  return getPlatform() === 'desktop';
}

/**
 * Check if running in web browser
 */
export function isWeb(): boolean {
  return getPlatform() === 'web';
}