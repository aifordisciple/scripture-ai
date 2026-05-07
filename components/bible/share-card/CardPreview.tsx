// components/bible/share-card/CardPreview.tsx
"use client";

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { calculatePreviewDimensions } from '@/lib/card-renderer';
import type { CardConfig } from '@/lib/card-presets';

interface CardPreviewProps {
  config: CardConfig;
  className?: string;
}

export function CardPreview({ config, className }: CardPreviewProps) {
  const { logicalWidth, logicalHeight } = useMemo(
    () => calculatePreviewDimensions(config.width, config.height, 340),
    [config.width, config.height]
  );

  const isLightBg = !config.bgImage && config.bgGradient.includes('#fdfbfb');

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className="relative overflow-hidden rounded-lg shadow-lg border border-border/30"
        style={{
          width: logicalWidth,
          height: logicalHeight,
          background: config.bgImage
            ? `url(${config.bgImage}) center/cover no-repeat`
            : config.bgGradient,
        }}
      >
        {/* 内容层 */}
        <div
          className="absolute inset-0 flex flex-col justify-center items-center p-6"
          style={{
            color: config.textColor,
            fontFamily: config.fontFamily,
            textAlign: config.textAlign,
            fontSize: Math.max(config.fontSize * (logicalWidth / 1080), 8),
            lineHeight: config.lineHeight,
          }}
        >
          {/* AI 标题 */}
          {config.aiTitle && (
            <div
              className="font-bold mb-2 opacity-90"
              style={{ fontSize: Math.max(config.fontSize * (logicalWidth / 1080) * 1.3, 10) }}
            >
              {config.aiTitle}
            </div>
          )}

          {/* 经文内容 */}
          <div className="space-y-1 max-h-[70%] overflow-hidden">
            {config.verseContent.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          {/* 书卷信息 */}
          <div
            className="mt-3 opacity-70"
            style={{
              color: config.infoColor,
              fontSize: Math.max(config.fontSize * (logicalWidth / 1080) * 0.7, 7),
            }}
          >
            {config.bookName} {config.chapter}:{config.verseRange}
          </div>
        </div>

        {/* QR 码占位 */}
        {config.qrCodePosition !== 'none' && config.qrCodeUrl && (
          <div
            className="absolute bottom-2 w-6 h-6 bg-white/80 rounded"
            style={{ [config.qrCodePosition === 'bottom-left' ? 'left' : 'right']: 8 }}
          />
        )}
      </div>
    </div>
  );
}