// components/bible/share-card/AIGeneratePanel.tsx
"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useBibleStore } from '@/store/useBibleStore';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Undo2 } from 'lucide-react';
import type { CardConfig, LayoutMode } from '@/lib/card-presets';

interface AIGeneratePanelProps {
  verseContent: string[];
  bookName: string;
}

export function AIGeneratePanel({ verseContent, bookName }: AIGeneratePanelProps) {
  const { t } = useTranslation();
  const {
    cardConfig, cardAiGenerating, cardAiConfigBackup,
    setCardAiGenerating, applyAiConfig, undoAiConfig,
  } = useBibleStore();
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setCardAiGenerating(true);
    setError(null);
    try {
      const content = verseContent.join('\n');
      const res = await fetch('/api/card-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();

      const aiConfig: Partial<CardConfig> = {
        layoutMode: (data.layoutMode || 'classic') as LayoutMode,
        fontFamily: data.fontFamily || "'Noto Serif SC', serif",
        textColor: data.textColor || '#ffffff',
        infoColor: data.infoColor || '#cccccc',
        fontSize: data.fontSize || 22,
        textAlign: data.textAlign || 'center',
        bgGradient: data.gradient || 'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)',
        aiTitle: data.title || null,
        bgImage: null,
        selectedBgUrl: null,
      };

      // 如果有搜索关键词，自动搜索图库
      if (data.bgSearchQuery) {
        try {
          const searchRes = await fetch(`/api/unsplash-search?query=${encodeURIComponent(data.bgSearchQuery)}&per_page=1`);
          const searchData = await searchRes.json();
          if (searchData.success && searchData.data?.results?.[0]) {
            const imageUrl = searchData.data.results[0].url;
            const proxyRes = await fetch(`/api/proxy?url=${encodeURIComponent(imageUrl)}`);
            if (proxyRes.ok) {
              const blob = await proxyRes.blob();
              const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              aiConfig.bgImage = base64;
              aiConfig.bgGradient = '';
            }
          }
        } catch (e) {
          // 图库搜索失败不影响主流程
          console.error('Auto bg search failed:', e);
        }
      }

      applyAiConfig(aiConfig);
    } catch (e) {
      console.error('AI generate error:', e);
      setError(t('shareCard.aiGenerateFailed'));
    } finally {
      setCardAiGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* AI 一键生成按钮 */}
      <Button
        onClick={handleGenerate}
        disabled={cardAiGenerating || verseContent.length === 0}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white active:scale-95 rounded-full"
      >
        {cardAiGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        {cardAiGenerating ? t('shareCard.aiGenerating') : t('shareCard.aiGenerateBtn')}
      </Button>

      {/* 生成中提示 */}
      {cardAiGenerating && (
        <div className="text-center text-xs text-muted-foreground animate-pulse">
          {t('shareCard.aiGeneratingHint')}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="text-center text-xs text-destructive">{error}</div>
      )}

      {/* 撤销按钮 */}
      {cardAiConfigBackup && !cardAiGenerating && (
        <Button
          variant="outline"
          size="sm"
          onClick={undoAiConfig}
          className="w-full active:scale-95"
        >
          <Undo2 className="w-3 h-3 mr-1" /> {t('shareCard.undoAi')}
        </Button>
      )}

      {/* 已应用提示 */}
      {cardAiConfigBackup && !cardAiGenerating && cardConfig.aiTitle && (
        <div className="text-center text-xs text-primary font-medium">
          {t('shareCard.aiApplied')} — {cardConfig.aiTitle}
        </div>
      )}
    </div>
  );
}