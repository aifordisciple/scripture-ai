// lib/locale.ts
// Utility for getting the user's locale for date formatting and other locale-dependent operations

/**
 * Get locale string for client-side date formatting.
 * Reads from Zustand store if available, falls back to 'zh-CN'.
 */
export function getClientLocale(): string {
  // In client components, we can access the store
  if (typeof window !== 'undefined') {
    try {
      // Dynamic import to avoid circular dependencies
      const { useBibleStore } = require('@/store/useBibleStore');
      const locale = useBibleStore.getState()?.locale;
      if (locale === 'en') return 'en-US';
      if (locale === 'zh') return 'zh-CN';
    } catch {
      // Store not available, fall through
    }
  }
  return 'zh-CN';
}

/**
 * Get locale string for server-side operations.
 * Reads from cookies, falls back to 'zh-CN'.
 */
export function getServerLocale(cookieString?: string): string {
  if (cookieString) {
    const match = cookieString.match(/locale=(en|zh)/);
    if (match) {
      return match[1] === 'en' ? 'en-US' : 'zh-CN';
    }
  }
  return 'zh-CN';
}

/**
 * Format a date according to the user's locale.
 * Client-side version - reads locale from Zustand store.
 */
export function formatDateClient(date: Date | number, options?: Intl.DateTimeFormatOptions): string {
  const locale = getClientLocale();
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(locale, options);
}

/**
 * Format a time according to the user's locale.
 * Client-side version - reads locale from Zustand store.
 */
export function formatTimeClient(date: Date | number, options?: Intl.DateTimeFormatOptions): string {
  const locale = getClientLocale();
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString(locale, options);
}