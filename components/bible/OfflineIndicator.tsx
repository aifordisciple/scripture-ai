// components/bible/OfflineIndicator.tsx
"use client";

import { useState } from "react";
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface OfflineIndicatorProps {
  isOnline: boolean;
  cachedChapters?: number;
  pendingSync?: number;
  onSync?: () => void;
  className?: string;
}

export function OfflineIndicator({
  isOnline,
  cachedChapters = 0,
  pendingSync = 0,
  onSync,
  className,
}: OfflineIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  return (
    <div className={cn("relative", className)}>
      {/* 主指示器 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all",
          isOnline
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
        )}
      >
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-semibold">
          {isOnline ? t('bible.online') : t('bible.offline')}
        </span>
        {cachedChapters > 0 && (
          <span className="text-xs opacity-75">
            {t('bible.cachedChapters', { count: cachedChapters })}
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </div>

      {/* 展开详情 */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-2 p-4 rounded-xl bg-card border dark:border-border shadow-lg min-w-[200px] z-50">
          <div className="space-y-3">
            {/* 状态 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('bible.networkStatus')}</span>
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <>
                    <Cloud className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">{t('bible.connected')}</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-600">{t('bible.offlineModeLabel')}</span>
                  </>
                )}
              </div>
            </div>

            {/* 缓存 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('bible.cachedChapterCount')}</span>
              <span className="text-sm font-semibold">{t('bible.cachedChapterValue', { count: cachedChapters })}</span>
            </div>

            {/* 待同步 */}
            {pendingSync > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('bible.pendingSync')}</span>
                <span className="text-sm font-semibold text-amber-600">{t('bible.pendingSyncValue', { count: pendingSync })}</span>
              </div>
            )}

            {/* 同步按钮 */}
            {isOnline && onSync && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSync();
                }}
                size="sm"
                className="w-full mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('bible.syncNow')}
              </Button>
            )}

            {/* 离线提示 */}
            {!isOnline && (
              <p className="text-xs text-muted-foreground pt-2 border-t dark:border-border">
                {t('bible.offlineNotice')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}