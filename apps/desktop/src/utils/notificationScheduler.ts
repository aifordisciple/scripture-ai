// apps/desktop/src/utils/notificationScheduler.ts
/**
 * Notification Scheduler for Desktop App
 *
 * Manages scheduled reminders for Bible reading
 */

import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:mm format
}

// Store the last notification date to prevent duplicates
let lastNotificationDate: string | null = null;
let checkInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the notification scheduler
 * Checks every minute if it's time for a reminder
 */
export function startNotificationScheduler(settings: ReminderSettings): void {
  // Clear existing interval
  stopNotificationScheduler();

  if (!settings.enabled) {
    return;
  }

  // Check every minute
  checkInterval = setInterval(async () => {
    await checkAndSendNotification(settings.time);
  }, 60000); // 1 minute

  // Also check immediately
  checkAndSendNotification(settings.time);
}

/**
 * Stop the notification scheduler
 */
export function stopNotificationScheduler(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

/**
 * Check if it's time for a notification and send one if so
 */
async function checkAndSendNotification(reminderTime: string): Promise<void> {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const currentDate = now.toDateString();

  // Check if it's the right time
  if (currentTime !== reminderTime) {
    return;
  }

  // Prevent duplicate notifications on the same day
  if (lastNotificationDate === currentDate) {
    return;
  }

  // Send notification
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === 'granted';
    }

    if (granted) {
      sendNotification({
        title: '📖 AI读 - 读经提醒',
        body: '是时候读经了！点击打开开始今天的阅读。',
      });
      lastNotificationDate = currentDate;
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === 'granted';
    }
    return granted;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Send a test notification
 */
export async function sendTestNotification(): Promise<void> {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === 'granted';
    }

    if (granted) {
      sendNotification({
        title: '📖 AI读',
        body: '测试通知 - 通知功能正常工作！',
      });
    }
  } catch (error) {
    console.error('Failed to send test notification:', error);
  }
}