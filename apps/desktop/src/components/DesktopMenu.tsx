// apps/desktop/src/components/DesktopMenu.tsx
/**
 * Desktop-specific menu bar component
 *
 * Uses Tauri's menu API for native menu integration
 * Provides custom menu bar for Windows/Linux
 */

import { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  FileText,
  Upload,
  Download,
  Copy,
  ListChecks,
  Sun,
  Moon,
  Maximize,
  Minimize,
  HelpCircle,
  Info,
  RefreshCw,
} from 'lucide-react';

interface MenuDropdownProps {
  label: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function MenuDropdown({ label, children, isOpen, onToggle }: MenuDropdownProps) {
  return (
    <div className="menu-dropdown">
      <button className="menu-trigger" onClick={onToggle}>
        {label}
      </button>
      {isOpen && (
        <div className="menu-content">
          {children}
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
}

function MenuItem({ icon, label, shortcut, onClick, disabled }: MenuItemProps) {
  return (
    <button
      className={`menu-item ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="menu-icon">{icon}</span>}
      <span className="menu-label">{label}</span>
      {shortcut && <span className="menu-shortcut">{shortcut}</span>}
    </button>
  );
}

function MenuDivider() {
  return <div className="menu-divider" />;
}

export function DesktopMenu() {
  const [platform, setPlatform] = useState<string>('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Get platform info
    invoke<string>('get_platform')
      .then(setPlatform)
      .catch(() => setPlatform('unknown'));

    // Check if window is maximized
    getCurrentWindow().isMaximized().then(setIsMaximized);

    // Load theme setting
    const storage = window.localStorage;
    const settings = storage.getItem('app-settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        setTheme(parsed.theme || 'system');
      } catch {
        // ignore
      }
    }
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenu(null);
    if (openMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenu]);

  const toggleMenu = useCallback((menu: string) => {
    setOpenMenu(prev => prev === menu ? null : menu);
  }, []);

  // File menu actions
  const handleExport = useCallback(async () => {
    setOpenMenu(null);
    try {
      // Trigger export (will be implemented in export utility)
      window.dispatchEvent(new CustomEvent('menu-export'));
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, []);

  const handleImport = useCallback(async () => {
    setOpenMenu(null);
    try {
      window.dispatchEvent(new CustomEvent('menu-import'));
    } catch (error) {
      console.error('Import failed:', error);
    }
  }, []);

  // Edit menu actions
  const handleCopy = useCallback(async () => {
    setOpenMenu(null);
    try {
      const text = window.getSelection()?.toString();
      if (text) {
        await navigator.clipboard.writeText(text);
      }
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, []);

  const handleSelectAll = useCallback(() => {
    setOpenMenu(null);
    document.execCommand('selectAll');
  }, []);

  // View menu actions
  const handleToggleTheme = useCallback(() => {
    setOpenMenu(null);
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(newTheme);

    // Apply theme
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.add('light');
    }

    // Save to storage
    const storage = window.localStorage;
    const settings = storage.getItem('app-settings');
    try {
      const parsed = settings ? JSON.parse(settings) : {};
      parsed.theme = newTheme;
      storage.setItem('app-settings', JSON.stringify(parsed));
    } catch {
      // ignore
    }
  }, [theme]);

  const handleToggleMaximize = useCallback(async () => {
    setOpenMenu(null);
    const window = getCurrentWindow();
    await window.toggleMaximize();
    setIsMaximized(await window.isMaximized());
  }, []);

  const handleMinimize = useCallback(async () => {
    setOpenMenu(null);
    await getCurrentWindow().minimize();
  }, []);

  const handleFullscreen = useCallback(async () => {
    setOpenMenu(null);
    const window = getCurrentWindow();
    const isFullscreen = await window.isFullscreen();
    await window.setFullscreen(!isFullscreen);
  }, []);

  // Help menu actions
  const handleAbout = useCallback(() => {
    setOpenMenu(null);
    window.dispatchEvent(new CustomEvent('menu-about'));
  }, []);

  const handleReload = useCallback(async () => {
    setOpenMenu(null);
    window.location.reload();
  }, []);

  const handleOpenWebsite = useCallback(() => {
    setOpenMenu(null);
    window.open('https://aidu.app', '_blank');
  }, []);

  // Menu is handled by Tauri's native menu on macOS
  if (platform === 'macos') {
    return null;
  }

  return (
    <div className="desktop-menu" onClick={e => e.stopPropagation()}>
      {/* File Menu */}
      <MenuDropdown
        label="文件"
        isOpen={openMenu === 'file'}
        onToggle={() => toggleMenu('file')}
      >
        <MenuItem
          icon={<Download className="w-4 h-4" />}
          label="导出数据"
          onClick={handleExport}
        />
        <MenuItem
          icon={<Upload className="w-4 h-4" />}
          label="导入数据"
          onClick={handleImport}
        />
        <MenuDivider />
        <MenuItem
          icon={<RefreshCw className="w-4 h-4" />}
          label="重新加载"
          shortcut="Ctrl+R"
          onClick={handleReload}
        />
      </MenuDropdown>

      {/* Edit Menu */}
      <MenuDropdown
        label="编辑"
        isOpen={openMenu === 'edit'}
        onToggle={() => toggleMenu('edit')}
      >
        <MenuItem
          icon={<Copy className="w-4 h-4" />}
          label="复制"
          shortcut="Ctrl+C"
          onClick={handleCopy}
        />
        <MenuItem
          icon={<ListChecks className="w-4 h-4" />}
          label="全选"
          shortcut="Ctrl+A"
          onClick={handleSelectAll}
        />
      </MenuDropdown>

      {/* View Menu */}
      <MenuDropdown
        label="视图"
        isOpen={openMenu === 'view'}
        onToggle={() => toggleMenu('view')}
      >
        <MenuItem
          icon={theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          label={theme === 'dark' ? '浅色模式' : theme === 'light' ? '深色模式' : '切换主题'}
          onClick={handleToggleTheme}
        />
        <MenuDivider />
        <MenuItem
          icon={<Minimize className="w-4 h-4" />}
          label="最小化"
          onClick={handleMinimize}
        />
        <MenuItem
          icon={<Maximize className="w-4 h-4" />}
          label={isMaximized ? '还原' : '最大化'}
          onClick={handleToggleMaximize}
        />
        <MenuItem
          icon={<Maximize className="w-4 h-4" />}
          label="全屏"
          shortcut="F11"
          onClick={handleFullscreen}
        />
      </MenuDropdown>

      {/* Help Menu */}
      <MenuDropdown
        label="帮助"
        isOpen={openMenu === 'help'}
        onToggle={() => toggleMenu('help')}
      >
        <MenuItem
          icon={<Info className="w-4 h-4" />}
          label="关于 AI读"
          onClick={handleAbout}
        />
        <MenuItem
          icon={<HelpCircle className="w-4 h-4" />}
          label="访问官网"
          onClick={handleOpenWebsite}
        />
      </MenuDropdown>
    </div>
  );
}