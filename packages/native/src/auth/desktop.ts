/**
 * Desktop authentication adapter for Tauri environment
 * Uses WebView login and local token storage via Tauri invoke
 */

import { invoke } from '@tauri-apps/api/core';
import type { AuthAdapter, UserSession } from './types';

/**
 * Desktop authentication adapter for Tauri
 * - Opens WebView for login via web app's /desktop-login page
 * - Stores token using Tauri's secure storage plugin
 */
export class DesktopAuthAdapter implements AuthAdapter {
  private tokenKey = 'auth-token';

  async getToken(): Promise<string | null> {
    try {
      // Use Tauri store plugin to retrieve token
      const token = await invoke<string>('get_token', { key: this.tokenKey });
      return token || null;
    } catch (error) {
      console.error('Failed to get token from Tauri store:', error);
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      await invoke('store_token', {
        key: this.tokenKey,
        value: token,
      });
    } catch (error) {
      console.error('Failed to store token in Tauri:', error);
      throw error;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await invoke('clear_token', { key: this.tokenKey });
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null && token.length > 0;
  }

  async login(): Promise<void> {
    // Open WebView login window
    // The WebView will load the web app's /desktop-login page
    // After successful login, the page will call back via IPC
    try {
      await invoke('open_login_window');
    } catch (error) {
      console.error('Failed to open login window:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await this.clearToken();
  }
}

/**
 * Handle authentication callback from WebView login
 * Called when the web login page successfully authenticates and sends token back
 *
 * @param token - JWT token received from web login
 * @param userId - User ID from session
 */
export async function handleLoginCallback(
  token: string,
  userId?: string
): Promise<void> {
  const adapter = new DesktopAuthAdapter();
  await adapter.setToken(token);

  // Notify main window that login is complete
  await invoke('login_complete', { userId });
}