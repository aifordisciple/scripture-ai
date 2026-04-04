/**
 * Authentication adapter exports
 * Automatically selects the correct adapter based on platform
 */

import { getPlatform } from '../platform';
import { WebAuthAdapter } from './web';
import { DesktopAuthAdapter } from './desktop';
import type { AuthAdapter } from './types';

export type { AuthAdapter, UserSession } from './types';
export { WebAuthAdapter } from './web';
export { DesktopAuthAdapter } from './desktop';

/**
 * Get the appropriate authentication adapter for current platform
 * @returns WebAuthAdapter for browser, DesktopAuthAdapter for Tauri
 */
export function getAuthAdapter(): AuthAdapter {
  const platform = getPlatform();
  return platform === 'desktop'
    ? new DesktopAuthAdapter()
    : new WebAuthAdapter();
}