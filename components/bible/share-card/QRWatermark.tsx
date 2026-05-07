// components/bible/share-card/QRWatermark.tsx
"use client";

import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { QR_POSITION_OPTIONS, type QRPosition } from '@/lib/card-presets';
import { QrCode } from 'lucide-react';

interface QRWatermarkProps {
  qrCodePosition: QRPosition;
  qrCodeUrl: string | null;
  onPositionChange: (position: QRPosition) => void;
  onUrlChange: (url: string | null) => void;
  bookName: string;
  chapter: string;
  verseRange: string;
}

export function QRWatermark({
  qrCodePosition, qrCodeUrl, onPositionChange, onUrlChange,
  bookName, chapter, verseRange,
}: QRWatermarkProps) {
  const { t } = useTranslation();

  const handleToggle = () => {
    if (qrCodePosition === 'none') {
      onPositionChange('bottom-right');
      // 自动生成经文 URL
      if (!qrCodeUrl) {
        onUrlChange(`/${bookName}/${chapter}/${verseRange}`);
      }
    } else {
      onPositionChange('none');
    }
  };

  return (
    <div className="space-y-3">
      {/* 开关 */}
      <button
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center gap-2 p-2.5 border rounded-lg transition-all active:scale-95",
          qrCodePosition !== 'none' ? "border-primary bg-primary/5" : "hover:bg-secondary"
        )}
      >
        <QrCode className={cn("w-4 h-4", qrCodePosition !== 'none' ? "text-primary" : "text-muted-foreground")} />
        <span className={cn("text-xs font-semibold", qrCodePosition !== 'none' ? "text-primary" : "text-muted-foreground")}>
          {t('shareCard.qrWatermark')}
        </span>
      </button>

      {/* 位置选择 */}
      {qrCodePosition !== 'none' && (
        <div className="flex gap-2">
          {QR_POSITION_OPTIONS.filter(o => o.value !== 'none').map((opt) => (
            <button
              key={opt.value}
              onClick={() => onPositionChange(opt.value)}
              className={cn(
                "flex-1 px-2 py-1.5 text-xs border rounded transition-all active:scale-95",
                qrCodePosition === opt.value ? "border-primary text-primary bg-primary/5" : "hover:bg-secondary"
              )}
            >
              {t(opt.nameKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}