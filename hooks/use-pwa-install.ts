// hooks/use-pwa-install.ts
"use client";

import { useState, useEffect, useCallback } from 'react';

// BeforeInstallPromptEvent 类型定义
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  /** 是否可以安装（Android/Chrome） */
  canInstall: boolean;
  /** 是否已安装 */
  isInstalled: boolean;
  /** 是否是 iOS Safari */
  isIOS: boolean;
  /** 是否是 standalone 模式 */
  isStandalone: boolean;
  /** 安装提示事件 */
  installPrompt: BeforeInstallPromptEvent | null;
  /** 触发安装提示 */
  promptInstall: () => Promise<boolean>;
  /** 检查是否应该显示安装提示 */
  shouldShowPrompt: () => boolean;
  /** 记录用户已看到安装提示 */
  markPromptShown: () => void;
}

const STORAGE_KEY = 'pwa-install-prompt';

/**
 * PWA 安装状态 Hook
 *
 * @example
 * const { canInstall, isInstalled, promptInstall, shouldShowPrompt } = usePWAInstall();
 *
 * if (canInstall && shouldShowPrompt()) {
 *   // 显示安装提示
 *   await promptInstall();
 * }
 */
export function usePWAInstall(): PWAInstallState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // 检测 iOS Safari - SSR 安全：在 useEffect 中计算而非组件顶层
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream
    );
  }, []);

  // 检测是否可以安装
  const canInstall = !!installPrompt;

  useEffect(() => {
    // 检测是否已经在 standalone 模式下运行
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // 监听 beforeinstallprompt 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // 监听 appinstalled 事件
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      localStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 触发安装提示
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        setInstallPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error('PWA install prompt error:', error);
      return false;
    }
  }, [installPrompt]);

  // 检查是否应该显示安装提示
  // 条件：访问次数 >= 2，或者距离上次提示超过 7 天
  const shouldShowPrompt = useCallback((): boolean => {
    if (isInstalled || isStandalone) return false;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true;

    try {
      const data = JSON.parse(stored);
      const { visitCount, lastPromptTime, dismissed } = data;

      // 用户明确关闭过，7天后再提示
      if (dismissed) {
        const daysSinceDismissed = (Date.now() - lastPromptTime) / (1000 * 60 * 60 * 24);
        return daysSinceDismissed >= 7;
      }

      // 访问次数 >= 2 次时提示
      return visitCount >= 2;
    } catch {
      return true;
    }
  }, [isInstalled, isStandalone]);

  // 记录用户已看到安装提示
  const markPromptShown = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let data = stored ? JSON.parse(stored) : { visitCount: 0 };

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      lastPromptTime: Date.now(),
    }));
  }, []);

  // 记录访问次数 — 每次会话只计数一次，防止SPA导航重复触发
  useEffect(() => {
    const sessionKey = 'pwa-session-counted';
    if (sessionStorage.getItem(sessionKey)) return; // 本次会话已计数
    sessionStorage.setItem(sessionKey, '1');

    const stored = localStorage.getItem(STORAGE_KEY);
    let data = stored ? JSON.parse(stored) : { visitCount: 0 };

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      visitCount: (data.visitCount || 0) + 1,
    }));
  }, []);

  return {
    canInstall,
    isInstalled,
    isIOS,
    isStandalone,
    installPrompt,
    promptInstall,
    shouldShowPrompt,
    markPromptShown,
  };
}

/**
 * 标记用户关闭了安装提示
 */
export function dismissInstallPrompt() {
  const stored = localStorage.getItem(STORAGE_KEY);
  let data = stored ? JSON.parse(stored) : {};

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...data,
    dismissed: true,
    lastPromptTime: Date.now(),
  }));
}

export default usePWAInstall;