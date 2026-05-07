// components/bible/share-card/HistoryPanel.tsx
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useBibleStore } from '@/store/useBibleStore';
import { Button } from '@/components/ui/button';
import { Clock, Trash2, RotateCcw } from 'lucide-react';
import type { CardHistoryData } from '@/store/types';

const STORAGE_KEY = 'scripture-card-histories';

export function HistoryPanel() {
  const { t } = useTranslation();
  const { cardHistories, setCardHistories, addCardHistory, clearCardHistories, updateCardConfig } = useBibleStore();

  // 从 localStorage 加载历史
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const histories = JSON.parse(stored) as CardHistoryData[];
        setCardHistories(histories);
      }
    } catch (e) {
      console.error('Load histories error:', e);
    }
  }, [setCardHistories]);

  // 应用历史配置
  const handleApply = (history: CardHistoryData) => {
    const config = history.config as unknown as typeof cardConfig;
    updateCardConfig(config);
  };

  // 清空历史
  const handleClear = () => {
    clearCardHistories();
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="space-y-3">
      {/* 标题 + 清空 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" /> {t('shareCard.historyTitle')}
        </span>
        {cardHistories.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs text-muted-foreground h-6 active:scale-95">
            <Trash2 className="w-3 h-3 mr-1" /> {t('shareCard.clearHistory')}
          </Button>
        )}
      </div>

      {/* 历史列表 */}
      {cardHistories.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-4">
          {t('shareCard.noHistory')}
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {cardHistories.map((history) => (
            <button
              key={history.id}
              onClick={() => handleApply(history)}
              className="w-full flex items-center gap-2 p-2 border rounded-lg hover:bg-secondary text-left active:scale-95"
            >
              <RotateCcw className="w-3 h-3 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs truncate">
                  {new Date(history.createdAt).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {history.resolution}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}