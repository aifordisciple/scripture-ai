// components/pwa/InstallPrompt.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall, dismissInstallPrompt } from "@/hooks/use-pwa-install";
import { IosInstallGuide } from "./IosInstallGuide";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

/**
 * PWA 安装提示组件
 *
 * 智能显示时机：
 * - Android/Chrome: 通过 beforeinstallprompt 事件触发
 * - iOS Safari: 显示手动安装引导
 * - 访问次数 >= 2 次时提示
 * - 用户关闭后 7 天再提示
 */
export function InstallPrompt() {
  const { canInstall, isIOS, isInstalled, isStandalone, promptInstall, shouldShowPrompt, markPromptShown } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { t } = useTranslation();

  // 检查是否应该显示提示
  useEffect(() => {
    // 已安装或 standalone 模式不显示
    if (isInstalled || isStandalone) return;

    // 延迟显示，让用户先看到内容
    const timer = setTimeout(() => {
      if (shouldShowPrompt()) {
        setIsVisible(true);
        markPromptShown();
      }
    }, 3000); // 3秒后显示

    return () => clearTimeout(timer);
  }, [isInstalled, isStandalone, shouldShowPrompt, markPromptShown]);

  // 处理安装
  const handleInstall = useCallback(async () => {
    if (isIOS) {
      // iOS 显示手动安装引导
      setShowIOSGuide(true);
      return;
    }

    if (canInstall) {
      const accepted = await promptInstall();
      if (accepted) {
        setIsVisible(false);
      }
    }
  }, [isIOS, canInstall, promptInstall]);

  // 处理关闭
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    dismissInstallPrompt();
  }, []);

  // 不显示的情况
  if (isInstalled || isStandalone) return null;

  return (
    <>
      {/* 安装提示横幅 */}
      <AnimatePresence>
        {isVisible && !showIOSGuide && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
          >
            <div className="glass-panel rounded-2xl p-4 shadow-lg border border-primary/20">
              <div className="flex items-start gap-3">
                {/* 图标 */}
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                  <Download className="w-6 h-6 text-white" />
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm mb-1">
                    {t('pwa.addToHomeScreen')}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('pwa.installDesc')}
                  </p>
                </div>

                {/* 关闭按钮 */}
                <button
                  onClick={handleDismiss}
                  className="shrink-0 p-1 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDismiss}
                  className="flex-1 rounded-full text-xs"
                >
                  {t('pwa.notNow')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="flex-1 rounded-full text-xs gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isIOS ? t('pwa.viewTutorial') : t('pwa.installNow')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS 安装引导 */}
      <IosInstallGuide
        open={showIOSGuide}
        onOpenChange={(open) => {
          setShowIOSGuide(open);
          if (!open) {
            dismissInstallPrompt();
          }
        }}
      />
    </>
  );
}

export default InstallPrompt;