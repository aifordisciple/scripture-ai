// apps/desktop/src/components/SplashScreen.tsx
/**
 * Splash Screen component for desktop app
 *
 * Shown during initial app loading
 */

import { BookOpen } from 'lucide-react';

interface SplashScreenProps {
  message?: string;
  progress?: number;
}

export function SplashScreen({ message = '正在加载...', progress }: SplashScreenProps) {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo">
          <BookOpen className="splash-icon" />
        </div>
        <h1 className="splash-title">AI读</h1>
        <p className="splash-subtitle">智能圣经阅读助手</p>

        {progress !== undefined ? (
          <div className="splash-progress">
            <div
              className="splash-progress-bar"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        ) : (
          <div className="splash-loader">
            <div className="splash-spinner" />
          </div>
        )}

        <p className="splash-message">{message}</p>
      </div>

      <div className="splash-footer">
        <p>© 2024 Scripture AI</p>
      </div>
    </div>
  );
}