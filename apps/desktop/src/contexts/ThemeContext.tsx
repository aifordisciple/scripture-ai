// apps/desktop/src/contexts/ThemeContext.tsx
/**
 * Theme context for managing dark mode across the app
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getStorageAdapter } from '@scripture-ai/native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'app-settings';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Apply theme to DOM
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');

    let resolved: 'light' | 'dark';

    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = prefersDark ? 'dark' : 'light';
      // Let CSS media query handle it naturally
    } else {
      resolved = newTheme;
      root.classList.add(newTheme);
    }

    setResolvedTheme(resolved);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#ffffff');
    }
  }, []);

  // Load theme from storage
  useEffect(() => {
    async function loadTheme() {
      try {
        const storage = getStorageAdapter();
        const settings = await storage.get<{ theme?: Theme }>(THEME_STORAGE_KEY);
        if (settings?.theme) {
          setThemeState(settings.theme);
          applyTheme(settings.theme);
        } else {
          applyTheme('system');
        }
      } catch {
        applyTheme('system');
      }
    }
    loadTheme();
  }, [applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  // Set theme and persist
  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);

    try {
      const storage = getStorageAdapter();
      const existing = await storage.get<{ theme?: Theme; fontSize?: number; autoSync?: boolean }>(THEME_STORAGE_KEY);
      await storage.set(THEME_STORAGE_KEY, { ...existing, theme: newTheme });
    } catch {
      console.error('Failed to save theme');
    }
  }, [applyTheme]);

  // Toggle between light and dark (ignoring system)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}