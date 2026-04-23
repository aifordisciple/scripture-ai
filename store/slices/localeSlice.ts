import type { StateCreator } from 'zustand';
import type { StoreState, LocaleSlice } from '../types';

type Locale = 'zh' | 'en';

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'zh';
  const saved = localStorage.getItem('locale');
  if (saved === 'zh' || saved === 'en') return saved as Locale;
  const browserLang = navigator.language?.toLowerCase() || '';
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
}

export const createLocaleSlice: StateCreator<StoreState, [], [], LocaleSlice> = (set, get) => ({
  locale: detectLocale(),
  setLocale: (locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
    }
    set({ locale });
    // Async sync to server (non-blocking)
    fetch('/api/user/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    }).catch(() => {}); // Silent fail
  },
});
