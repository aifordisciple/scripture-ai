// lib/notification-service.ts
// Notification service for browser push notifications and sound alerts

// Check if browser notifications are supported and permitted
export async function checkBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

// Request browser notification permission
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[Notification] Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('[Notification] Permission denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Show browser notification
export interface BrowserNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export async function showBrowserNotification(options: BrowserNotificationOptions): Promise<boolean> {
  const permission = await checkBrowserNotificationPermission();

  if (permission !== 'granted') {
    console.log('[Notification] No permission to show notification');
    return false;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192.png',
      tag: options.tag,
      requireInteraction: false,
    });

    if (options.onClick) {
      notification.onclick = () => {
        options.onClick?.();
        notification.close();
        // Focus the window
        window.focus();
      };
    }

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return true;
  } catch (error) {
    console.error('[Notification] Failed to show notification:', error);
    return false;
  }
}

// Play notification sound
let audioContext: AudioContext | null = null;

export function playNotificationSound(type: 'default' | 'success' | 'warning' | 'message' = 'default'): void {
  try {
    // Create audio context if not exists
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Create oscillator for a simple beep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different sounds for different types
    switch (type) {
      case 'success':
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        break;
      case 'warning':
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime + 0.15);
        break;
      case 'message':
        oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.1); // G5
        break;
      default:
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    }

    // Set volume envelope
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    // Play
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

  } catch (error) {
    console.error('[Notification] Failed to play sound:', error);
  }
}

// Combined notification function
export interface NotifyOptions {
  title: string;
  body?: string;
  type?: 'default' | 'success' | 'warning' | 'message';
  tag?: string;
  playSound?: boolean;
  showBrowser?: boolean;
  onClick?: () => void;
}

export async function notify(options: NotifyOptions): Promise<void> {
  const { title, body, type = 'default', tag, playSound = true, showBrowser = true, onClick } = options;

  // Play sound
  if (playSound) {
    playNotificationSound(type);
  }

  // Show browser notification
  if (showBrowser) {
    await showBrowserNotification({
      title,
      body,
      tag,
      onClick,
    });
  }
}

// Get notification type based on notification data
export function getNotificationType(notificationType: string): 'default' | 'success' | 'warning' | 'message' {
  switch (notificationType) {
    case 'BADGE_EARNED':
    case 'USER_UNMUTED':
      return 'success';
    case 'USER_MUTED':
    case 'ANNOUNCEMENT':
      return 'warning';
    case 'NEW_MESSAGE':
    case 'FEEDBACK_REPLY':
    case 'ADMIN_MESSAGE':
    case 'NEW_FEEDBACK':
      return 'message';
    default:
      return 'default';
  }
}