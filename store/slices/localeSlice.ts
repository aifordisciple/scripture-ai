import type { StateCreator } from 'zustand';
import type { StoreState, LocaleSlice } from '../types';

export const createLocaleSlice: StateCreator<StoreState, [], [], LocaleSlice> = (set, get) => ({
  locale: (typeof window !== 'undefined' && localStorage.getItem('locale') as 'zh' | 'en') || 'zh',
  setLocale: (locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
    }
    set({ locale });
  },
});
