// apps/desktop/src/components/TitleBar.tsx
/**
 * Custom title bar with window controls
 *
 * Provides a native-looking title bar for Windows/Linux
 * Includes window control buttons (minimize, maximize, close)
 */

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  Minus,
  Square,
  X,
  Minimize2,
} from 'lucide-react';
import { DesktopMenu } from './DesktopMenu';

export function TitleBar() {
  const [platform, setPlatform] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Get platform info
    invoke<string>('get_platform')
      .then(setPlatform)
      .catch(() => setPlatform('unknown'));

    // Check window state
    const checkWindowState = async () => {
      const win = getCurrentWindow();
      setIsMaximized(await win.isMaximized());
      setIsFullscreen(await win.isFullscreen());
    };

    checkWindowState();

    // Listen for window state changes using Tauri event
    const unlisten = getCurrentWindow().onResized(() => {
      checkWindowState();
    });

    return () => {
      unlisten.then((fn: () => void) => fn());
    };
  }, []);

  const handleMinimize = useCallback(async () => {
    await getCurrentWindow().minimize();
  }, []);

  const handleMaximize = useCallback(async () => {
    const window = getCurrentWindow();
    await window.toggleMaximize();
    setIsMaximized(await window.isMaximized());
  }, []);

  const handleClose = useCallback(async () => {
    await getCurrentWindow().close();
  }, []);

  // Don't show custom title bar on macOS (uses native)
  // Also hide in fullscreen mode
  if (platform === 'macos' || isFullscreen) {
    return null;
  }

  return (
    <div className="title-bar" data-tauri-drag-region>
      {/* App Icon and Title */}
      <div className="title-bar-left">
        <div className="app-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <span className="app-title">AI读</span>
      </div>

      {/* Menu Bar */}
      <div className="title-bar-center">
        <DesktopMenu />
      </div>

      {/* Window Controls */}
      <div className="title-bar-right">
        <button
          className="window-btn minimize"
          onClick={handleMinimize}
          title="最小化"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          className="window-btn maximize"
          onClick={handleMaximize}
          title={isMaximized ? '还原' : '最大化'}
        >
          {isMaximized ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Square className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          className="window-btn close"
          onClick={handleClose}
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}