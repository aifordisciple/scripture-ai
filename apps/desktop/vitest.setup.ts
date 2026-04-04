// apps/desktop/vitest.setup.ts
/**
 * Vitest setup file for desktop app
 *
 * Configures testing environment with necessary mocks
 */

import '@testing-library/jest-dom/vitest';

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