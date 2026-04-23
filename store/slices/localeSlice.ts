import type { StateCreator } from 'zustand';
import type { StoreState, LocaleSlice } from '../types';

type Locale = 'zh' | 'en';
type BibleVersion = 'CUV' | 'KJV';

const DEFAULT_VERSION: Record<Locale, BibleVersion> = {
  zh: 'CUV',
  en: 'KJV',
};

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'zh';
  const saved = localStorage.getItem('locale');
  if (saved === 'zh' || saved === 'en') return saved as Locale;
  const browserLang = navigator.language?.toLowerCase() || '';
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
}

function detectBibleVersion(locale: Locale): BibleVersion {
  if (typeof window === 'undefined') return DEFAULT_VERSION[locale];
  const saved = localStorage.getItem('bibleVersion');
  if (saved === 'CUV' || saved === 'KJV') return saved as BibleVersion;
  return DEFAULT_VERSION[locale];
}

export const createLocaleSlice: StateCreator<StoreState, [], [], LocaleSlice> = (set, get) => ({
  locale: detectLocale(),
  bibleVersion: detectBibleVersion(detectLocale()),
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
