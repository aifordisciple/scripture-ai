// packages/native/src/notifications.ts
// Native notifications module - supports both Web and Tauri platforms

import { getPlatform } from './platform';

export interface NotificationPermission {
  granted: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface PushNotification {
  title: string;
  body?: string;
  icon?: string;
  data?: Record<string, unknown>;
}

/**
 * Request notification permission
 */
export async function requestPermission(): Promise<NotificationPermission> {
  const platform = getPlatform();

  if (platform === 'desktop') {
    // Tauri notification plugin
    try {
      const { isPermissionGranted, requestPermission: request } = await import('@tauri-apps/plugin-notification');
      let granted = await isPermissionGranted();

      if (!granted) {
        const permission = await request();
        granted = permission === 'granted';
      }

      return {
        granted,
        status: granted ? 'granted' : 'denied'
      };
    } catch (error) {
      console.error('Failed to request Tauri notification permission:', error);
      return { granted: false, status: 'denied' };
    }
  }

  // Web Notification API
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, status: 'denied' };
  }

  const permission = await Notification.requestPermission();

  return {
    granted: permission === 'granted',
    status: permission as 'granted' | 'denied' | 'undetermined'
  };
}

/**
 * Get notification permission status
 */
export async function getPermissionStatus(): Promise<NotificationPermission> {
  const platform = getPlatform();

  if (platform === 'desktop') {
    try {
      const { isPermissionGranted } = await import('@tauri-apps/plugin-notification');
      const granted = await isPermissionGranted();

      return {
        granted,
        status: granted ? 'granted' : 'denied'
      };
    } catch (error) {
      console.error('Failed to check Tauri notification permission:', error);
      return { granted: false, status: 'denied' };
    }
  }

  // Web Notification API
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, status: 'denied' };
  }

  const status = Notification.permission;

  return {
    granted: status === 'granted',
    status: status as 'granted' | 'denied' | 'undetermined'
  };
}

/**
 * Show local notification
 */
export async function showNotification(notification: PushNotification): Promise<void> {
  const platform = getPlatform();

  if (platform === 'desktop') {
    try {
      const { sendNotification, isPermissionGranted } = await import('@tauri-apps/plugin-notification');

      const granted = await isPermissionGranted();
      if (!granted) {
        console.warn('Notification permission not granted');
        return;
      }

      await sendNotification({
        title: notification.title,
        body: notification.body || '',
        icon: notification.icon,
      });
    } catch (error) {
      console.error('Failed to show Tauri notification:', error);
    }
    return;
  }

  // Web Notification API
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: notification.data
    });
  }
}

/**
 * Schedule daily reminder
 * Note: For desktop, this stores settings locally. Actual scheduling requires
 * platform-specific background task setup.
 */
export function scheduleDailyReminder(
  hour: number,
  minute: number,
  title: string,
  body: string
): void {
  if (typeof window === 'undefined') return;

  const reminder = { hour, minute, title, body };
  localStorage.setItem('daily-reminder', JSON.stringify(reminder));
}

/**
 * Cancel daily reminder
 */
export function cancelDailyReminder(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('daily-reminder');
}

/**
 * Check for due reminders
 */
export function checkReminders(): PushNotification | null {
  if (typeof window === 'undefined') return null;

  const reminderStr = localStorage.getItem('daily-reminder');
  if (!reminderStr) return null;

  try {
    const reminder = JSON.parse(reminderStr);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if it's time for the reminder (within 1 minute window)
    if (currentHour === reminder.hour && Math.abs(currentMinute - reminder.minute) <= 1) {
      return {
        title: reminder.title,
        body: reminder.body
      };
    }
  } catch {
    // Invalid reminder data
  }

  return null;
}