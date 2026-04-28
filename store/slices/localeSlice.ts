import type { StateCreator } from 'zustand';
import type { StoreState, LocaleSlice } from '../types';

type Locale = 'zh' | 'en';
type BibleVersion = 'CUV' | 'KJV';

const DEFAULT_VERSION: Record<Locale, BibleVersion> = {
  zh: 'CUV',
  en: 'KJV',
};

// [P1-10修复] SSR 水合安全：初始值始终使用默认值，避免 SSR/客户端不一致
// 客户端通过 Zustand persist 的 rehydration 机制异步覆盖为 localStorage 中的值
// 这样确保首次渲染 SSR 和客户端输出完全一致，消除水合闪烁
function getDefaultLocale(): Locale {
  return 'zh';
}

function getDefaultBibleVersion(): BibleVersion {
  return 'CUV';
}

export const createLocaleSlice: StateCreator<StoreState, [], [], LocaleSlice> = (set, get) => ({
  locale: getDefaultLocale(),
  bibleVersion: getDefaultBibleVersion(),
  setLocale: (locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
    }
    // Auto-set bibleVersion to default for new locale unless user has overridden
    const currentVersion = get().bibleVersion;
    const oldDefault = DEFAULT_VERSION[get().locale];
    const newDefault = DEFAULT_VERSION[locale];
    const newVersion = currentVersion === oldDefault ? newDefault : currentVersion;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bibleVersion', newVersion);
    }
    set({ locale, bibleVersion: newVersion });
    // Async sync to server (non-blocking)
    fetch('/api/user/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale, bibleVersion: newVersion }),
    }).catch(() => {});
  },
  setBibleVersion: (version) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bibleVersion', version);
    }
    set({ bibleVersion: version });
    // Async sync to server (non-blocking)
    fetch('/api/user/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: get().locale, bibleVersion: version }),
    }).catch(() => {});
  },
});