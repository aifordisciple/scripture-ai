// components/settings/ApiSettingsDialog.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBibleStore } from "@/store/useBibleStore";
import { useTranslation } from "@/lib/i18n";
import { Cpu, Server, Key, BrainCircuit, CheckCircle2, Cloud, CloudOff } from "lucide-react";
import { useSession } from "next-auth/react";

export function ApiSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { apiConfig, setApiConfig } = useBibleStore();
  const { status } = useSession();
  const { t } = useTranslation();
  const isLoggedIn = status === "authenticated";

  const [localConfig, setLocalConfig] = useState<{
    provider: 'local' | 'cloud';
    baseUrl: string;
    apiKey: string;
    model: string;
  }>({
    provider: 'local',
    baseUrl: 'http://host.docker.internal:11434/v1',
    apiKey: '',
    model: 'qwen3-coder-next:latest',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedToCloud, setSyncedToCloud] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadSettingsFromCloud = useCallback(async () => {
    try {
      const res = await fetch('/api/user/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.apiProvider || data.apiBaseUrl || data.apiModel) {
          // Map old provider values to new simplified values
          let provider = (data.apiProvider || 'local') as string;
          if (provider === 'ollama') provider = 'local';
          else if (['openai', 'deepseek', 'custom'].includes(provider)) provider = 'cloud';

          const cloudConfig = {
            provider: provider as 'local' | 'cloud',
            baseUrl: data.apiBaseUrl || (provider === 'local' ? 'http://host.docker.internal:11434/v1' : 'https://api.minimaxi.com/v1'),
            // SECURITY: Never use hardcoded API keys. Use server-side config or user-provided keys only.
            apiKey: data.apiKey || '',
            model: data.apiModel || (provider === 'local' ? 'qwen3-coder-next:latest' : 'MiniMax-M2.7-highspeed'),
          };
          setLocalConfig(cloudConfig);
          setApiConfig(cloudConfig);
          setSyncedToCloud(true);
        }
      }
    } catch (error) {
      console.error('Failed to load settings from cloud:', error);
    }
  }, [setApiConfig]);

  const saveSettingsToCloud = useCallback(async () => {
    if (!isLoggedIn) return false;

    setIsSyncing(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiProvider: localConfig.provider,
          apiBaseUrl: localConfig.baseUrl,
          apiKey: localConfig.apiKey,
          apiModel: localConfig.model,
        }),
      });
      setIsSyncing(false);
      return res.ok;
    } catch (error) {
      setIsSyncing(false);
      console.error('Failed to save settings to cloud:', error);
      return false;
    }
  }, [isLoggedIn, localConfig]);

  useEffect(() => {
    if (open && !isInitialized) {
      setLocalConfig({ ...apiConfig });
      setIsInitialized(true);
      setSyncedToCloud(false);

      if (isLoggedIn) {
        loadSettingsFromCloud();
      }
    }
  }, [open, isLoggedIn, isInitialized, apiConfig, loadSettingsFromCloud]);

  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
    }
  }, [open]);

  const handleSave = async () => {
    setApiConfig(localConfig);

    if (isLoggedIn) {
      const saved = await saveSettingsToCloud();
      if (saved) {
        setSyncedToCloud(true);
      }
    }

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    onOpenChange(false);
  };

  const setPreset = (provider: 'local' | 'cloud') => {
    if (provider === 'local') {
      setLocalConfig({
        provider: 'local',
        baseUrl: 'http://host.docker.internal:11434/v1',
        apiKey: '',
        model: 'qwen3-coder-next:latest'
      });
    } else {
      // SECURITY: Cloud preset no longer contains hardcoded API key.
      // User must provide their own key, or it will be loaded from server-side config.
      setLocalConfig({
        provider: 'cloud',
        baseUrl: 'https://api.minimaxi.com/v1',
        apiKey: '',
        model: 'MiniMax-M2.7-highspeed'
      });
    }
  };

  const isLocal = localConfig.provider === 'local';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BrainCircuit className="w-5 h-5 text-[#0066cc]" />
            {t('settings.aiModelSettings')}
          </DialogTitle>
          <DialogDescription>
            {t('settings.aiModelSettingsDesc')}
          </DialogDescription>
        </DialogHeader>

        {/* Current active config display */}
        <div className="bg-[#0066cc]/5 dark:bg-[#0066cc]/10 text-[#0066cc] dark:text-[#2997ff] p-3 rounded-xl text-sm font-medium flex items-center justify-between mt-2 mb-4 border border-[#0066cc]/20 dark:border-[#0066cc]/30">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span>{t('settings.currentActive')}: {apiConfig.provider === 'local' ? t('settings.localOllama') : t('settings.cloudApi')}</span>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <span className="flex items-center gap-1 text-xs">
                {syncedToCloud ? (
                  <><Cloud className="w-3 h-3 text-emerald-500" /> {t('settings.synced')}</>
                ) : (
                  <><CloudOff className="w-3 h-3 text-slate-400" /> {t('settings.localOnly')}</>
                )}
              </span>
            )}
            <span className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-200 dark:border-slate-700 font-mono tracking-tight">
              {apiConfig.model || t('settings.unknownModel')}
            </span>
          </div>
        </div>

        {/* Provider selection */}
        <div className="flex gap-2 my-2">
          <Button
            variant={isLocal ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreset('local')}
            className="flex-1 rounded-full text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          >
            {t('settings.btnLocalOllama')}
          </Button>
          <Button
            variant={!isLocal ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreset('cloud')}
            className="flex-1 rounded-full"
          >
            {t('settings.btnCloudApi')}
          </Button>
        </div>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1">
              <Server className="w-4 h-4 text-slate-500" />
              {t('settings.baseUrl')}
            </label>
            <Input
              value={localConfig.baseUrl}
              onChange={e => setLocalConfig({...localConfig, baseUrl: e.target.value})}
              className="bg-slate-50"
              placeholder={isLocal ? "http://host.docker.internal:11434/v1" : "https://api.openai.com/v1"}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1">
              <Cpu className="w-4 h-4 text-slate-500" />
              {t('settings.modelName')}
            </label>
            <Input
              value={localConfig.model}
              onChange={e => setLocalConfig({...localConfig, model: e.target.value})}
              className="bg-slate-50"
              placeholder={isLocal ? "qwen3-coder-next:latest" : "gpt-4o-mini"}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1">
              <Key className="w-4 h-4 text-slate-500" />
              {t('settings.apiKey')} {!isLocal && <span className="text-red-500">*</span>}
            </label>
            <Input
              type="password"
              value={localConfig.apiKey}
              onChange={e => setLocalConfig({...localConfig, apiKey: e.target.value})}
              className="bg-slate-50"
              placeholder={isLocal ? t('settings.localNoKeyPlaceholder') : "sk-..."}
            />
            <p className="text-xs text-slate-400">
              {isLocal ? t('settings.localNoKey') : t('settings.compatibleApis')}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={isSyncing} className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white gap-1 active:scale-95">
            {showSuccess ? (
              <><CheckCircle2 className="w-4 h-4" /> {t('settings.applied')}</>
            ) : isSyncing ? (
              <><Cloud className="w-4 h-4 animate-pulse" /> {t('settings.syncing')}</>
            ) : isLoggedIn ? (
              <>{t('settings.applyAndSync')}</>
            ) : (
              <>{t('settings.apply')}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
