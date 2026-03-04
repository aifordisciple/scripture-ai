// packages/native/src/notifications.ts
// Native notifications module

export interface NotificationPermission {
  granted: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface PushNotification {
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

// Request notification permission
export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, status: 'denied' };
  }
  
  const permission = await Notification.requestPermission();
  
  return {
    granted: permission === 'granted',
    status: permission as 'granted' | 'denied' | 'undetermined'
  };
}

// Get notification permission status
export async function getPermissionStatus(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, status: 'denied' };
  }
  
  const status = Notification.permission;
  
  return {
    granted: status === 'granted',
    status: status as 'granted' | 'denied' | 'undetermined'
  };
}

// Show local notification
export function showNotification(notification: PushNotification): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }
  
  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: notification.data
    });
  }
}

// Schedule daily reminder
export function scheduleDailyReminder(
  hour: number,
  minute: number,
  title: string,
  body: string
): void {
  // In a real implementation, this would use a native scheduler
  // For now, we'll use a simple localStorage-based approach
  if (typeof window === 'undefined') return;
  
  const reminder = { hour, minute, title, body };
  localStorage.setItem('daily-reminder', JSON.stringify(reminder));
}

// Cancel daily reminder
export function cancelDailyReminder(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('daily-reminder');
}

// Check for due reminders
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
      // Clear the reminder to avoid duplicate notifications
      // In a real app, this would be handled by the native scheduler
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
