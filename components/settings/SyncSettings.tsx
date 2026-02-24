// components/settings/SyncSettings.tsx
"use client";

import { useBibleStore } from "@/store/useBibleStore";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, AlertCircle, Cloud, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function SyncSettings() {
  const { data: session } = useSession();
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
    if (!time) return "从未同步";
    const now = Date.now();
    const diff = now - time;
    
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return new Date(time).toLocaleString('zh-CN', { 
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
          <CloudOff className="w-4 h-4" /> 数据同步
        </div>
        <p className="text-xs text-muted-foreground">
          登录后即可开启跨设备数据同步
        </p>
      </div>
    );
  }

  return (
    <div className="bg-secondary/50 p-4 rounded-xl border border-border/50 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Cloud className="w-4 h-4 text-primary" /> 数据同步
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
        <span className="text-xs text-muted-foreground">冲突解决策略</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSyncMode('merge')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
              syncMode === 'merge'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-background text-muted-foreground hover:bg-secondary"
            )}
          >
            智能合并
          </button>
          <button
            onClick={() => setSyncMode('overwrite')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
              syncMode === 'overwrite'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-background text-muted-foreground hover:bg-secondary"
            )}
          >
            本地覆盖
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/70">
          {syncMode === 'merge' 
            ? "保留双方最新修改，自动合并冲突" 
            : "以本地数据为准，覆盖服务器数据"}
        </p>
      </div>

      {/* 同步状态 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">上次同步</span>
        <span className="text-foreground font-medium">
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
            同步中...
          </>
        ) : (
          <>
            <RefreshCw className="w-3 h-3 mr-2" />
            立即同步
          </>
        )}
      </Button>
    </div>
  );
}
