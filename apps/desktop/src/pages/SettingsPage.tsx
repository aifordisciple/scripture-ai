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
 * - Notification settings
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getAuthAdapter, getStorageAdapter } from '@scripture-ai/native';
import { syncWithServer as performSync } from '../utils/sync';
import {
  startNotificationScheduler,
  stopNotificationScheduler,
  sendTestNotification,
} from '../utils/notificationScheduler';
import { useUpdater } from '../hooks';
import { useTheme } from '../contexts';
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
  Bell,
  BellOff,
  Download,
  Upload,
  DownloadCloud,
} from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

interface AppSettings {
  theme: Theme;
  fontSize: number;
  autoSync: boolean;
  syncInterval: number; // minutes
  showEnglish: boolean;
  notificationsEnabled: boolean;
  reminderTime: string; // HH:mm format
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  fontSize: 18,
  autoSync: true,
  syncInterval: 30,
  showEnglish: false,
  notificationsEnabled: true,
  reminderTime: '08:00',
};

// Read version from package.json at build time
const APP_VERSION = '0.1.0';

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [userEmail, setUserEmail] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Theme from context
  const { theme, setTheme } = useTheme();

  // Updater
  const {
    checking,
    updateAvailable,
    downloading,
    readyToInstall,
    error: updateError,
    updateInfo,
    checkForUpdates,
    installAndRestart,
  } = useUpdater({ autoCheck: true });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadUserInfo();
    loadSyncStatus();
  }, []);

  // Sync settings.theme with context theme
  useEffect(() => {
    if (settings.theme && settings.theme !== theme) {
      setTheme(settings.theme);
    }
  }, [settings.theme, theme, setTheme]);

  // Start/stop notification scheduler when settings change
  useEffect(() => {
    if (settings.notificationsEnabled) {
      startNotificationScheduler({
        enabled: true,
        time: settings.reminderTime,
      });
    } else {
      stopNotificationScheduler();
    }

    // Cleanup on unmount
    return () => {
      stopNotificationScheduler();
    };
  }, [settings.notificationsEnabled, settings.reminderTime]);

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

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    saveSettings({ ...settings, theme: newTheme });
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

  const handleNotificationsChange = async (enabled: boolean) => {
    if (enabled) {
      // Request notification permission
      try {
        const { requestPermission } = await import('@scripture-ai/native');
        const result = await requestPermission();
        if (!result.granted) {
          console.warn('Notification permission not granted');
          return;
        }
      } catch (error) {
        console.error('Failed to request notification permission:', error);
        return;
      }
    }
    saveSettings({ ...settings, notificationsEnabled: enabled });
  };

  const handleReminderTimeChange = (time: string) => {
    saveSettings({ ...settings, reminderTime: time });
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const auth = getAuthAdapter();
      const token = await auth.getToken();

      if (!token) {
        console.error('Not authenticated');
        return;
      }

      // Get user ID from token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub || payload.id || 'default-user';

      const result = await performSync(userId);

      if (result.success) {
        const now = Date.now();
        setLastSyncTime(now);
        console.log('Sync completed:', result);
      } else {
        console.error('Sync failed:', result.error);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleExportData = async () => {
    try {
      const auth = getAuthAdapter();
      const token = await auth.getToken();

      if (!token) {
        console.error('Not authenticated');
        return;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub || payload.id || 'default-user';

      // Gather all user data
      const highlights = await invoke<Array<unknown>>('db_get_highlights', { userId });
      const notes = await invoke<Array<unknown>>('db_get_notes', { userId });
      const bookmarks = await invoke<Array<unknown>>('db_get_bookmarks', { userId });

      const exportData = {
        version: APP_VERSION,
        exportDate: new Date().toISOString(),
        userId,
        data: {
          highlights,
          notes,
          bookmarks,
          settings,
        },
      };

      // Create downloadable file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scripture-ai-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('Export completed');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImportData = async () => {
    try {
      // Create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const content = event.target?.result as string;
            const importData = JSON.parse(content);

            // Validate import data structure
            if (!importData.data) {
              console.error('Invalid import file format');
              return;
            }

            const auth = getAuthAdapter();
            const token = await auth.getToken();

            if (!token) {
              console.error('Not authenticated');
              return;
            }

            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.sub || payload.id || 'default-user';

            // Import highlights
            if (importData.data.highlights && Array.isArray(importData.data.highlights)) {
              for (const highlight of importData.data.highlights) {
                await invoke('db_save_highlight', {
                  highlight: {
                    ...highlight,
                    user_id: userId, // Use current user's ID
                  },
                });
              }
            }

            // Import notes
            if (importData.data.notes && Array.isArray(importData.data.notes)) {
              for (const note of importData.data.notes) {
                await invoke('db_save_note', {
                  note: {
                    ...note,
                    user_id: userId,
                  },
                });
              }
            }

            // Import bookmarks
            if (importData.data.bookmarks && Array.isArray(importData.data.bookmarks)) {
              for (const bookmark of importData.data.bookmarks) {
                await invoke('db_save_bookmark', {
                  bookmark: {
                    ...bookmark,
                    user_id: userId,
                  },
                });
              }
            }

            // Import settings
            if (importData.data.settings) {
              const storage = getStorageAdapter();
              await storage.set('app-settings', importData.data.settings);
              setSettings({ ...DEFAULT_SETTINGS, ...importData.data.settings });
            }

            console.log('Import completed');
            // Reload to reflect changes
            window.location.reload();
          } catch (error) {
            console.error('Failed to parse import file:', error);
          }
        };

        reader.readAsText(file);
      };

      input.click();
    } catch (error) {
      console.error('Import failed:', error);
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

        {/* Data Section */}
        <section className="settings-section">
          <h3>
            <Database className="w-5 h-5" />
            数据管理
          </h3>
          <div className="settings-card">
            <div className="setting-row">
              <span className="setting-label">备份与恢复</span>
              <div className="data-actions">
                <button className="data-btn export" onClick={handleExportData}>
                  <Download className="w-4 h-4" />
                  导出数据
                </button>
                <button className="data-btn import" onClick={handleImportData}>
                  <Upload className="w-4 h-4" />
                  导入数据
                </button>
              </div>
            </div>
            <p className="setting-hint">
              导出您的高亮、笔记、书签和设置到JSON文件，或从备份文件恢复数据。
            </p>
          </div>
        </section>

        {/* Notification Section */}
        <section className="settings-section">
          <h3>
            {settings.notificationsEnabled ? (
              <Bell className="w-5 h-5" />
            ) : (
              <BellOff className="w-5 h-5" />
            )}
            通知
          </h3>
          <div className="settings-card">
            {/* Notifications Toggle */}
            <div className="setting-row">
              <span className="setting-label">启用通知</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => handleNotificationsChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Reminder Time */}
            {settings.notificationsEnabled && (
              <>
                <div className="setting-row">
                  <span className="setting-label">读经提醒时间</span>
                  <input
                    type="time"
                    className="time-input"
                    value={settings.reminderTime}
                    onChange={(e) => handleReminderTimeChange(e.target.value)}
                  />
                </div>
                <div className="setting-row">
                  <span className="setting-label">测试通知</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={sendTestNotification}
                  >
                    发送测试通知
                  </button>
                </div>
              </>
            )}
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
              <span className="setting-value">{APP_VERSION}</span>
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
            <div className="setting-row">
              <span className="setting-label">检查更新</span>
              <div className="update-actions">
                {checking ? (
                  <span className="update-status">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    检查中...
                  </span>
                ) : downloading ? (
                  <span className="update-status">
                    <DownloadCloud className="w-4 h-4 animate-pulse" />
                    下载中...
                  </span>
                ) : readyToInstall ? (
                  <button className="btn btn-primary btn-sm" onClick={installAndRestart}>
                    <RefreshCw className="w-4 h-4" />
                    重启安装
                  </button>
                ) : updateAvailable && updateInfo ? (
                  <span className="update-available">
                    新版本 {updateInfo.version} 可用
                  </span>
                ) : updateError ? (
                  <span className="update-error">{updateError}</span>
                ) : (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => checkForUpdates(false)}
                  >
                    <Download className="w-4 h-4" />
                    检查更新
                  </button>
                )}
              </div>
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