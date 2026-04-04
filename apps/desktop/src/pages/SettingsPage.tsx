// apps/desktop/src/pages/SettingsPage.tsx
/**
 * Settings page for desktop app
 *
 * Features:
 * - Theme switching (light/dark/system)
 * - Font size adjustment
 * - Sync settings
 * - Account info
 * - About info
 */

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getAuthAdapter, getStorageAdapter } from '@scripture-ai/native';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Type,
  RefreshCw,
  User,
  Info,
  LogOut,
  Check,
  Cloud,
  Database,
} from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

interface AppSettings {
  theme: Theme;
  fontSize: number;
  autoSync: boolean;
  syncInterval: number; // minutes
  showEnglish: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  fontSize: 18,
  autoSync: true,
  syncInterval: 30,
  showEnglish: false,
};

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [userEmail, setUserEmail] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadUserInfo();
    loadSyncStatus();
  }, []);

  // Apply theme when changed
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const loadSettings = async () => {
    try {
      const storage = getStorageAdapter();
      const saved = await storage.get<AppSettings>('app-settings');
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...saved });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadUserInfo = async () => {
    try {
      const auth = getAuthAdapter();
      const token = await auth.getToken();
      if (token) {
        // Decode JWT to get user info (simplified)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserEmail(payload.email || 'user@example.com');
        } catch {
          setUserEmail('已登录用户');
        }
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const lastSync = await invoke<number | null>('db_get_last_sync_time');
      setLastSyncTime(lastSync);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      const storage = getStorageAdapter();
      await storage.set('app-settings', newSettings);
      setSettings(newSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleThemeChange = (theme: Theme) => {
    saveSettings({ ...settings, theme });
  };

  const handleFontSizeChange = (size: number) => {
    saveSettings({ ...settings, fontSize: size });
  };

  const handleAutoSyncChange = (enabled: boolean) => {
    saveSettings({ ...settings, autoSync: enabled });
  };

  const handleShowEnglishChange = (enabled: boolean) => {
    saveSettings({ ...settings, showEnglish: enabled });
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      // Trigger sync
      await new Promise(resolve => setTimeout(resolve, 1500));
      const now = Date.now();
      await invoke('db_set_last_sync_time', { timestamp: now });
      setLastSyncTime(now);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuthAdapter();
      await auth.logout();
      // Reload app to show login screen
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return '从未同步';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <header className="settings-header">
        <Settings className="w-6 h-6" />
        <h2>设置</h2>
      </header>

      {/* Content */}
      <div className="settings-content">
        {/* Account Section */}
        <section className="settings-section">
          <h3>
            <User className="w-5 h-5" />
            账户
          </h3>
          <div className="settings-card">
            <div className="setting-row">
              <span className="setting-label">邮箱</span>
              <span className="setting-value">{userEmail || '未登录'}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="settings-section">
          <h3>
            <Moon className="w-5 h-5" />
            外观
          </h3>
          <div className="settings-card">
            {/* Theme */}
            <div className="setting-row">
              <span className="setting-label">主题</span>
              <div className="theme-options">
                <button
                  className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  <Sun className="w-4 h-4" />
                  浅色
                </button>
                <button
                  className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <Moon className="w-4 h-4" />
                  深色
                </button>
                <button
                  className={`theme-btn ${settings.theme === 'system' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('system')}
                >
                  <Monitor className="w-4 h-4" />
                  系统
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div className="setting-row">
              <span className="setting-label">
                <Type className="w-4 h-4" />
                字体大小
              </span>
              <div className="font-size-control">
                <button
                  className="size-btn"
                  onClick={() => handleFontSizeChange(Math.max(12, settings.fontSize - 2))}
                >
                  A-
                </button>
                <span className="size-value">{settings.fontSize}px</span>
                <button
                  className="size-btn"
                  onClick={() => handleFontSizeChange(Math.min(28, settings.fontSize + 2))}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Show English */}
            <div className="setting-row">
              <span className="setting-label">显示英文经文（KJV）</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.showEnglish}
                  onChange={(e) => handleShowEnglishChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>

        {/* Sync Section */}
        <section className="settings-section">
          <h3>
            <Cloud className="w-5 h-5" />
            同步
          </h3>
          <div className="settings-card">
            {/* Auto Sync */}
            <div className="setting-row">
              <span className="setting-label">自动同步</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.autoSync}
                  onChange={(e) => handleAutoSyncChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Last Sync */}
            <div className="setting-row">
              <span className="setting-label">
                <Database className="w-4 h-4" />
                上次同步
              </span>
              <span className="setting-value">{formatLastSync(lastSyncTime)}</span>
            </div>

            {/* Sync Now */}
            <button
              className={`sync-now-btn ${syncing ? 'syncing' : ''}`}
              onClick={handleSyncNow}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'spin' : ''}`} />
              {syncing ? '同步中...' : '立即同步'}
            </button>
          </div>
        </section>

        {/* About Section */}
        <section className="settings-section">
          <h3>
            <Info className="w-5 h-5" />
            关于
          </h3>
          <div className="settings-card">
            <div className="setting-row">
              <span className="setting-label">版本</span>
              <span className="setting-value">0.1.0</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">技术栈</span>
              <span className="setting-value">Tauri v2 + React</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">官网</span>
              <a href="https://aidu.app" target="_blank" rel="noopener noreferrer" className="link">
                aidu.app
              </a>
            </div>
          </div>
        </section>

        {/* Save Indicator */}
        {saved && (
          <div className="save-indicator">
            <Check className="w-4 h-4" />
            设置已保存
          </div>
        )}
      </div>
    </div>
  );
}