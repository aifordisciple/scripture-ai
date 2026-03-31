// components/settings/ApiSettingsDialog.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBibleStore } from "@/store/useBibleStore";
import { Cpu, Server, Key, BrainCircuit, CheckCircle2, Cloud, CloudOff } from "lucide-react";
import { useSession } from "next-auth/react";

export function ApiSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { apiConfig, setApiConfig } = useBibleStore();
  const { status } = useSession();
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
            apiKey: data.apiKey || 'sk-cp-q9pAztav67XjDz0H1rvF9bqP0u6Ejwrp4-bw7tZJo8-E2yCSTYCgJlePKkFe8GC1PWxIjxwfU2R5dDhwAt2C5YJxV_bFmH7JMT7-sJCIEPLPkRIOJUYe2Kg',
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
      setLocalConfig({
        provider: 'cloud',
        baseUrl: 'https://api.minimaxi.com/v1',
        apiKey: 'sk-cp-q9pAztav67XjDz0H1rvF9bqP0u6Ejwrp4-bw7tZJo8-E2yCSTYCgJlePKkFe8GC1PWxIjxwfU2R5dDhwAt2C5YJxV_bFmH7JMT7-sJCIEPLPkRIOJUYe2Kg',
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
            <BrainCircuit className="w-5 h-5 text-indigo-500" />
            AI 模型设置
          </DialogTitle>
          <DialogDescription>
            选择本地或云端AI服务。未设置时默认使用本地Ollama。
          </DialogDescription>
        </DialogHeader>

        {/* Current active config display */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 p-3 rounded-xl text-sm font-medium flex items-center justify-between mt-2 mb-4 border border-indigo-100 dark:border-indigo-800/50">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span>当前生效: {apiConfig.provider === 'local' ? '本地 Ollama' : '云端 API'}</span>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <span className="flex items-center gap-1 text-xs">
                {syncedToCloud ? (
                  <><Cloud className="w-3 h-3 text-emerald-500" /> 已同步</>
                ) : (
                  <><CloudOff className="w-3 h-3 text-slate-400" /> 本地</>
                )}
              </span>
            )}
            <span className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm font-mono tracking-tight">
              {apiConfig.model || '未知模型'}
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
            🏠 本地 Ollama
          </Button>
          <Button
            variant={!isLocal ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreset('cloud')}
            className="flex-1 rounded-full"
          >
            ☁️ 云端 API
          </Button>
        </div>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1">
              <Server className="w-4 h-4 text-slate-500" />
              接口地址 (Base URL)
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
              模型名称 (Model)
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
              API Key {!isLocal && <span className="text-red-500">*</span>}
            </label>
            <Input
              type="password"
              value={localConfig.apiKey}
              onChange={e => setLocalConfig({...localConfig, apiKey: e.target.value})}
              className="bg-slate-50"
              placeholder={isLocal ? "本地无需密钥" : "sk-..."}
            />
            <p className="text-xs text-slate-400">
              {isLocal ? "本地 Ollama 无需 API Key" : "支持 OpenAI、DeepSeek 等兼容接口"}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">取消</Button>
          <Button onClick={handleSave} disabled={isSyncing} className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md gap-1">
            {showSuccess ? (
              <><CheckCircle2 className="w-4 h-4" /> 已应用</>
            ) : isSyncing ? (
              <><Cloud className="w-4 h-4 animate-pulse" /> 同步中...</>
            ) : isLoggedIn ? (
              <>应用并同步云端</>
            ) : (
              <>应用</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}