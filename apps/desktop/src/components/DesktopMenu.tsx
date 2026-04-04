// apps/desktop/src/components/DesktopMenu.tsx
/**
 * Desktop-specific menu bar component
 *
 * Uses Tauri's menu API for native menu integration
 */

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function DesktopMenu() {
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    // Get platform info
    invoke<string>('get_platform')
      .then(setPlatform)
      .catch(() => setPlatform('unknown'));
  }, []);

  // Menu is handled by Tauri's native menu on macOS
  // For Windows/Linux, we show a custom menu bar
  if (platform === 'macos') {
    return null; // Use native macOS menu
  }

  return (
    <div className="desktop-menu">
      {/* Custom menu for Windows/Linux */}
      <div className="menu-item">
        <span>文件</span>
      </div>
      <div className="menu-item">
        <span>编辑</span>
      </div>
      <div className="menu-item">
        <span>视图</span>
      </div>
      <div className="menu-item">
        <span>帮助</span>
      </div>
    </div>
  );
}