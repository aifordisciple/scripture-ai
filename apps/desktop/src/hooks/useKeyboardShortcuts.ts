// apps/desktop/src/hooks/useKeyboardShortcuts.ts
/**
 * Keyboard shortcuts hook for desktop app
 *
 * Provides common keyboard shortcuts for navigation and actions
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow specific shortcuts even in input fields
        const isEscape = e.key === 'Escape';
        if (!isEscape) return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? e.ctrlKey || e.metaKey // Treat Cmd on Mac same as Ctrl
          : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

// Common shortcuts factory
export function createCommonShortcuts(handlers: {
  onNewTab?: () => void;
  onCloseTab?: () => void;
  onSearch?: () => void;
  onPreviousChapter?: () => void;
  onNextChapter?: () => void;
  onToggleSidebar?: () => void;
  onToggleDarkMode?: () => void;
  onEscape?: () => void;
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  if (handlers.onNewTab) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      action: handlers.onNewTab,
      description: '新建标签页',
    });
  }

  if (handlers.onCloseTab) {
    shortcuts.push({
      key: 'w',
      ctrl: true,
      action: handlers.onCloseTab,
      description: '关闭标签页',
    });
  }

  if (handlers.onSearch) {
    shortcuts.push({
      key: 'f',
      ctrl: true,
      action: handlers.onSearch,
      description: '搜索',
    });
  }

  if (handlers.onPreviousChapter) {
    shortcuts.push({
      key: 'ArrowLeft',
      action: handlers.onPreviousChapter,
      description: '上一章',
    });
  }

  if (handlers.onNextChapter) {
    shortcuts.push({
      key: 'ArrowRight',
      action: handlers.onNextChapter,
      description: '下一章',
    });
  }

  if (handlers.onToggleSidebar) {
    shortcuts.push({
      key: 'b',
      ctrl: true,
      action: handlers.onToggleSidebar,
      description: '切换侧边栏',
    });
  }

  if (handlers.onToggleDarkMode) {
    shortcuts.push({
      key: 'd',
      ctrl: true,
      shift: true,
      action: handlers.onToggleDarkMode,
      description: '切换深色模式',
    });
  }

  if (handlers.onEscape) {
    shortcuts.push({
      key: 'Escape',
      action: handlers.onEscape,
      description: '关闭弹窗',
    });
  }

  return shortcuts;
}

// Help dialog for displaying shortcuts
export const SHORTCUT_HELP = `
## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl/Cmd + N | 新建标签页 |
| Ctrl/Cmd + W | 关闭标签页 |
| Ctrl/Cmd + F | 搜索经文 |
| Ctrl/Cmd + B | 切换侧边栏 |
| Ctrl/Cmd + Shift + D | 切换深色模式 |
| ← / → | 上一章 / 下一章 |
| Escape | 关闭弹窗 |
`;