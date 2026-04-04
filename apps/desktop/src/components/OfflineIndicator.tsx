// apps/desktop/src/components/OfflineIndicator.tsx
/**
 * Offline status indicator for desktop app
 *
 * Shows when the app is offline and data will be synced later
 */

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudOff, CloudCheck } from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && pendingSync === 0) {
    return null; // Don't show anything when online and synced
  }

  return (
    <div className={`offline-indicator ${className}`}>
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>离线模式</span>
        </>
      ) : pendingSync > 0 ? (
        <>
          <CloudOff className="w-4 h-4" />
          <span>{pendingSync} 项待同步</span>
        </>
      ) : (
        <>
          <CloudCheck className="w-4 h-4 text-green-500" />
          <span>已同步</span>
        </>
      )}
    </div>
  );
}