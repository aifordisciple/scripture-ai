// components/bible/share-card/ShareActions.tsx
"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useBibleStore } from '@/store/useBibleStore';
import { Button } from '@/components/ui/button';
import { Download, Share2, Copy, Loader2, X, ChevronLeft } from 'lucide-react';
import { cardConfigToSatoriRequest } from '@/lib/card-renderer';
import { useToast } from '@/components/ui/toast';

interface ShareActionsProps {
  onClose: () => void;
  onBack: () => void;
}

export function ShareActions({ onClose, onBack }: ShareActionsProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { cardConfig, setCardGenerating, setCardResultImage, setCardStep, cardGenerating } = useBibleStore();
  const [canShare, setCanShare] = useState(false);
  const [canCopy, setCanCopy] = useState(false);

  // 检测 Web Share API 支持
  if (typeof navigator !== 'undefined') {
    setCanShare(typeof navigator.share === 'function');
    setCanCopy(typeof navigator.clipboard?.write === 'function');
  }

  const generateImage = async () => {
    setCardGenerating(true);
    try {
      const request = cardConfigToSatoriRequest(cardConfig);
      const res = await fetch('/api/card-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      setCardResultImage(dataUrl);
      setCardStep('result');
    } catch (e) {
      console.error('Generate failed:', e);
      addToast({ type: 'error', message: t('shareCard.generateFailed') });
    } finally {
      setCardGenerating(false);
    }
  };

  const handleDownload = () => {
    const { cardResultImage } = useBibleStore.getState();
    if (!cardResultImage) return;
    const link = document.createElement('a');
    link.download = `scripture-${Date.now()}.png`;
    link.href = cardResultImage;
    link.click();
  };

  const handleShare = async () => {
    const { cardResultImage } = useBibleStore.getState();
    if (!cardResultImage) return;
    try {
      const blob = await fetch(cardResultImage).then(r => r.blob());
      const file = new File([blob], `scripture-${Date.now()}.png`, { type: 'image/png' });
      await navigator.share({
        title: `${cardConfig.bookName} ${cardConfig.chapter}:${cardConfig.verseRange}`,
        text: cardConfig.verseContent.join('\n'),
        files: [file],
      });
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  const handleCopyToClipboard = async () => {
    const { cardResultImage } = useBibleStore.getState();
    if (!cardResultImage) return;
    try {
      const blob = await fetch(cardResultImage).then(r => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      addToast({ type: 'success', message: t('shareCard.copiedToClipboard') });
    } catch (e) {
      console.error('Copy failed:', e);
      addToast({ type: 'error', message: t('shareCard.copyFailed') });
    }
  };

  return (
    <div className="p-4 border-t dark:border-border bg-secondary dark:bg-card shrink-0">
      <Button
        onClick={generateImage}
        disabled={cardGenerating || cardConfig.verseContent.length === 0}
        className="w-full bg-primary hover:bg-apple-focus text-white active:scale-95 rounded-full"
      >
        {cardGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
        {cardGenerating ? t('shareCard.rendering') : t('shareCard.generateBtn')}
      </Button>
    </div>
  );
}

// 结果页操作栏
export function ResultActions({ onClose, onBack }: ShareActionsProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { cardResultImage, cardConfig } = useBibleStore();
  const [canShare] = useState(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  const [canCopy] = useState(typeof navigator !== 'undefined' && typeof navigator.clipboard?.write === 'function');

  const handleDownload = () => {
    if (!cardResultImage) return;
    const link = document.createElement('a');
    link.download = `scripture-${Date.now()}.png`;
    link.href = cardResultImage;
    link.click();
  };

  const handleShare = async () => {
    if (!cardResultImage) return;
    try {
      const blob = await fetch(cardResultImage).then(r => r.blob());
      const file = new File([blob], `scripture-${Date.now()}.png`, { type: 'image/png' });
      await navigator.share({
        title: `${cardConfig.bookName} ${cardConfig.chapter}:${cardConfig.verseRange}`,
        text: cardConfig.verseContent.join('\n'),
        files: [file],
      });
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  const handleCopy = async () => {
    if (!cardResultImage) return;
    try {
      const blob = await fetch(cardResultImage).then(r => r.blob());
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      addToast({ type: 'success', message: t('shareCard.copiedToClipboard') });
    } catch (e) {
      addToast({ type: 'error', message: t('shareCard.copyFailed') });
    }
  };

  return (
    <div className="mt-4 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/5 shrink-0 text-center space-y-3">
      <p className="text-white font-semibold text-lg flex items-center justify-center gap-2 animate-pulse">
        <Share2 className="w-5 h-5" />
        {t('shareCard.longPressSave')}
      </p>
      <p className="text-white/50 text-xs">{t('shareCard.screenshotShare')}</p>

      <div className="flex gap-2 pt-2">
        <Button className="flex-1 bg-primary hover:bg-apple-focus active:scale-95" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" /> {t('shareCard.download')}
        </Button>
        {canShare && (
          <Button variant="outline" className="flex-1 active:scale-95 border-white/20 text-white hover:bg-white/10" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" /> {t('shareCard.shareBtn')}
          </Button>
        )}
        {canCopy && (
          <Button variant="outline" className="active:scale-95 border-white/20 text-white hover:bg-white/10" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}