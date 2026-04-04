/**
 * Web authentication adapter using NextAuth
 * This adapter wraps the existing NextAuth session management
 */

import type { AuthAdapter, UserSession } from './types';

/**
 * Web authentication adapter for browser environment
 * Uses NextAuth.js session management
 *
 * Note: This is a placeholder that will be replaced with actual
 * NextAuth integration when used in the web app.
 */
export class WebAuthAdapter implements AuthAdapter {
  private sessionKey = 'scripture-ai-session';

  async getToken(): Promise<string | null> {
    // In actual web app, this would check NextAuth session
    // For now, use localStorage as fallback
    if (typeof window === 'undefined') return null;

    try {
      const sessionStr = localStorage.getItem(this.sessionKey);
      if (!sessionStr) return null;

      const session: UserSession = JSON.parse(sessionStr);
      if (session.expiresAt && session.expiresAt < Date.now()) {
        // Token expired, clear it
        await this.clearToken();
        return null;
      }
      return session.token;
    } catch {
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    // This would normally be handled by NextAuth
    // Used for desktop callback scenario
    if (typeof window === 'undefined') return;

    const session: UserSession = {
      id: 'temp',
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  async clearToken(): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.sessionKey);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  async login(): Promise<void> {
    // Web login is handled by NextAuth redirect
    // This method is primarily for desktop use
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/signin';
    }
  }

  async logout(): Promise<void> {
    await this.clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/signout';
    }
  }
}