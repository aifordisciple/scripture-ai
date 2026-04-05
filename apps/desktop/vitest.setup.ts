// apps/desktop/vitest.setup.ts
/**
 * Vitest setup file for desktop app
 *
 * Configures testing environment with necessary mocks
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock HTMLMediaElement for audio player tests
window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
window.HTMLMediaElement.prototype.pause = vi.fn();
window.HTMLMediaElement.prototype.load = vi.fn();

// Mock Audio constructor
window.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  load: vi.fn(),
  src: '',
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  paused: true,
  ended: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

// Mock Tauri API
const mockInvoke = vi.fn();
const mockGetCurrentWindow = vi.fn(() => ({
  minimize: vi.fn(),
  toggleMaximize: vi.fn(),
  isMaximized: vi.fn().mockResolvedValue(false),
  isFullscreen: vi.fn().mockResolvedValue(false),
  setFullscreen: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: mockGetCurrentWindow,
}));

// Mock window.__TAURI__ for platform detection
Object.defineProperty(window, '__TAURI__', {
  value: {
    invoke: mockInvoke,
  },
  writable: true,
});

// Export mocks for use in tests
export { mockInvoke, mockGetCurrentWindow };