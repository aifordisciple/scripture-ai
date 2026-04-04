/**
 * Authentication adapter interface
 * Abstracts authentication between web (NextAuth) and desktop (Tauri WebView)
 */

export interface AuthAdapter {
  /**
   * Get current authentication token
   * @returns JWT token string or null if not authenticated
   */
  getToken(): Promise<string | null>;

  /**
   * Store authentication token
   * @param token - JWT token to store
   */
  setToken(token: string): Promise<void>;

  /**
   * Clear stored authentication token (logout)
   */
  clearToken(): Promise<void>;

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * Initiate login flow
   * - Web: Uses NextAuth session
   * - Desktop: Opens WebView login page
   */
  login(): Promise<void>;

  /**
   * Logout and clear session
   */
  logout(): Promise<void>;

  /**
   * Get current user ID if authenticated
   */
  getUserId?(): Promise<string | null>;
}

/**
 * User session information
 */
export interface UserSession {
  id: string;
  email?: string;
  name?: string;
  token: string;
  expiresAt?: number;
}