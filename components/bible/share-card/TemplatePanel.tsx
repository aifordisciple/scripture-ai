// components/bible/share-card/TemplatePanel.tsx
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useBibleStore } from '@/store/useBibleStore';
import { Button } from '@/components/ui/button';
import { Bookmark, Trash2, Save, Loader2 } from 'lucide-react';
import type { CardTemplateData } from '@/store/types';

const STORAGE_KEY = 'scripture-card-templates';

export function TemplatePanel() {
  const { t } = useTranslation();
  const { cardConfig, cardTemplates, setCardTemplates, addCardTemplate, removeCardTemplate, updateCardConfig } = useBibleStore();
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  // 从 localStorage 加载模板
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const templates = JSON.parse(stored) as CardTemplateData[];
        setCardTemplates(templates);
      }
    } catch (e) {
      console.error('Load templates error:', e);
    }
  }, [setCardTemplates]);

  // 保存模板
  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      const template: CardTemplateData = {
        id: `tpl-${Date.now()}`,
        name: saveName.trim(),
        config: { ...cardConfig } as unknown as Record<string, unknown>,
        createdAt: new Date().toISOString(),
      };

      addCardTemplate(template);

      // 持久化到 localStorage
      const updated = [...cardTemplates, template];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // 如果已登录，同步到数据库
      try {
        await fetch('/api/card-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template),
        });
      } catch (e) {
        // 数据库同步失败不影响本地保存
        console.error('Template sync error:', e);
      }

      setSaveName('');
    } catch (e) {
      console.error('Save template error:', e);
    } finally {
      setSaving(false);
    }
  };

  // 应用模板
  const handleApply = (template: CardTemplateData) => {
    const config = template.config as unknown as typeof cardConfig;
    updateCardConfig(config);
  };

  // 删除模板
  const handleDelete = (id: string) => {
    removeCardTemplate(id);
    const updated = cardTemplates.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 同步删除到数据库
    fetch(`/api/card-template?id=${id}`, { method: 'DELETE' }).catch(() => {});
  };

  return (
    <div className="space-y-4">
      {/* 保存当前配置 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder={t('shareCard.templateNamePlaceholder')}
          className="flex-1 px-2 py-1.5 text-xs border rounded bg-background"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={!saveName.trim() || saving}
          className="active:scale-95"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
        </Button>
      </div>

      {/* 模板列表 */}
      {cardTemplates.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-4">
          {t('shareCard.noTemplates')}
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {cardTemplates.map((template) => (
            <div
              key={template.id}
              className="flex items-center gap-2 p-2 border rounded-lg hover:bg-secondary group"
            >
              <button
                onClick={() => handleApply(template)}
                className="flex-1 text-left min-w-0"
              >
                <div className="text-xs font-semibold truncate">{template.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(template.createdAt).toLocaleDateString()}
                </div>
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}