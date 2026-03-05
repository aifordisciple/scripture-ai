// components/settings/ApiSettingsDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBibleStore } from "@/store/useBibleStore";
import { Cpu, Server, Key, BrainCircuit, CheckCircle2 } from "lucide-react";

export function ApiSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { apiConfig, setApiConfig } = useBibleStore();

  const [localConfig, setLocalConfig] = useState(apiConfig);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (open) setLocalConfig(apiConfig);
  }, [open, apiConfig]);

  const handleSave = () => {
    setApiConfig(localConfig);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    onOpenChange(false);
  };

  const setPreset = (provider: 'openai' | 'ollama' | 'deepseek') => {
    if (provider === 'ollama') {
      setLocalConfig({ provider: 'ollama', baseUrl: 'http://localhost:11434/v1', apiKey: 'ollama', model: 'llama3' });
    } else if (provider === 'deepseek') {
      setLocalConfig({ provider: 'deepseek', baseUrl: 'https://api.deepseek.com/v1', apiKey: '', model: 'deepseek-chat' });
    } else {
      setLocalConfig({ provider: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini' });
    }
  };

  const isOllama = localConfig.provider === 'ollama';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BrainCircuit className="w-5 h-5 text-indigo-500" />
            AI 模型与接口设置
          </DialogTitle>
          <DialogDescription>
            配置本地或第三方的 AI 驱动源。保存后即刻生效。
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 my-2 flex-wrap">
          <Button variant={localConfig.provider === 'openai' ? 'default' : 'outline'} size="sm" onClick={() => setPreset('openai')} className="flex-1 rounded-full">
            OpenAI
          </Button>
          <Button variant={localConfig.provider === 'deepseek' ? 'default' : 'outline'} size="sm" onClick={() => setPreset('deepseek')} className="flex-1 rounded-full">
            DeepSeek
          </Button>
          <Button variant={localConfig.provider === 'ollama' ? 'default' : 'outline'} size="sm" onClick={() => setPreset('ollama')} className="flex-1 rounded-full text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            本地 Ollama
          </Button>
        </div>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1">
              <Server className="w-4 h-4 text-slate-500" />
              接口地址 (Base URL)
            </label>
            <Input value={localConfig.baseUrl} onChange={e => setLocalConfig({...localConfig, baseUrl: e.target.value})} className="bg-slate-50" placeholder={isOllama ? "http://localhost:11434/v1" : "https://api.openai.com/v1"} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1">
              <Cpu className="w-4 h-4 text-slate-500" />
              模型名称 (Model)
            </label>
            <Input value={localConfig.model} onChange={e => setLocalConfig({...localConfig, model: e.target.value})} className="bg-slate-50" placeholder={isOllama ? "llama3" : "gpt-4o-mini"} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1">
              <Key className="w-4 h-4 text-slate-500" />
              API Key {!isOllama && <span className="text-red-500">*</span>}
            </label>
            <Input type="password" value={localConfig.apiKey} onChange={e => setLocalConfig({...localConfig, apiKey: e.target.value})} className="bg-slate-50" placeholder={isOllama ? "ollama (无需密钥)" : "sk-..."} />
            <p className="text-xs text-slate-400">
              {isOllama ? "本地 Ollama 无需 API Key" : "密钥仅保存在您的本地浏览器和个人云端同步数据中"}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">取消</Button>
          <Button onClick={handleSave} className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md gap-1">
            {showSuccess && <CheckCircle2 className="w-4 h-4" />}
            {showSuccess ? "已应用" : "应用并热加载"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
