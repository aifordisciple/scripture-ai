// components/settings/SyncSettings.tsx
"use client";

import { useBibleStore } from "@/store/useBibleStore";
import { useTranslation } from "@/lib/i18n";
import { getClientLocale } from "@/lib/locale";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, AlertCircle, Cloud, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function SyncSettings() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const {
    syncMode,
    setSyncMode,
    lastSyncTime,
    isSyncing,
    syncError,
    setSyncError,
  } = useBibleStore();

  const handleManualSync = async () => {
    if (typeof window !== 'undefined' && (window as any).__syncToServer) {
      setSyncError(null);
      await (window as any).__syncToServer();
    }
  };

  const formatLastSyncTime = (time: number | null) => {
    if (!time) return t('settings.neverSynced');
    const now = Date.now();
    const diff = now - time;

    if (diff < 60000) return t('settings.justNow');
    if (diff < 3600000) return t('settings.minutesAgo', { count: Math.floor(diff / 60000) });
    if (diff < 86400000) return t('settings.hoursAgo', { count: Math.floor(diff / 3600000) });
    return new Date(time).toLocaleString(getClientLocale(), {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!session?.user) {
    return (
      <div className="bg-secondary/50 p-4 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 mb-2 text-sm font-bold text-muted-foreground">
          <CloudOff className="w-4 h-4" /> {t('settings.dataSync')}
        </div>
        <p className="text-xs text-muted-foreground">
          {t('settings.loginToSync')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-secondary/50 p-4 rounded-xl border border-border/50 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Cloud className="w-4 h-4 text-primary" /> {t('settings.dataSync')}
        </div>
        {isSyncing ? (
          <RefreshCw className="w-4 h-4 text-primary animate-spin" />
        ) : syncError ? (
          <AlertCircle className="w-4 h-4 text-destructive" />
        ) : (
          <Check className="w-4 h-4 text-green-500" />
        )}
      </div>

      {/* 同步模式选择 */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">{t('settings.conflictStrategy')}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSyncMode('merge')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all",
              syncMode === 'merge'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-background text-muted-foreground hover:bg-secondary"
            )}
          >
            {t('settings.smartMerge')}
          </button>
          <button
            onClick={() => setSyncMode('overwrite')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all",
              syncMode === 'overwrite'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-background text-muted-foreground hover:bg-secondary"
            )}
          >
            {t('settings.localOverwrite')}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/70">
          {syncMode === 'merge'
            ? t('settings.smartMergeDesc')
            : t('settings.localOverwriteDesc')}
        </p>
      </div>

      {/* 同步状态 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t('settings.lastSync')}</span>
        <span className="text-foreground font-semibold">
          {formatLastSyncTime(lastSyncTime)}
        </span>
      </div>

      {/* 错误提示 */}
      {syncError && (
        <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          {syncError}
        </div>
      )}

      {/* 手动同步按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleManualSync}
        disabled={isSyncing}
        className="w-full rounded-lg"
      >
        {isSyncing ? (
          <>
            <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
            {t('settings.syncingStatus')}
          </>
        ) : (
          <>
            <RefreshCw className="w-3 h-3 mr-2" />
            {t('settings.syncNow')}
          </>
        )}
      </Button>
    </div>
  );
}