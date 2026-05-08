// components/bible/share-card/CardPreview.tsx
// 客户端预览 - 10种布局模式与服务端 buildCardJSX 保持结构一致
"use client";

import { cn } from '@/lib/utils';
import { getPreviewScaling } from '@/lib/card-renderer';
import type { CardConfig } from '@/lib/card-presets';

interface CardPreviewProps {
  config: CardConfig;
}

export function CardPreview({ config }: CardPreviewProps) {
  const infoText = `${config.bookName} ${config.chapter}:${config.verseRange}`;

  // 使用与服务端完全相同的缩放公式
  const scaling = getPreviewScaling(config.width, config.fontSize);
  const { scale, fontSize: scaledFontSize, titleSize: scaledTitleSize, infoSize: scaledInfoSize, padding, qrSize } = scaling;

  // 预览容器尺寸
  const previewWidth = 340;
  const previewScale = previewWidth / config.width;
  const previewHeight = previewWidth * (config.height / config.width);

  // 将服务端像素尺寸转换为预览CSS像素
  const css = (serverPx: number) => `${Math.max(serverPx * previewScale, 0.5)}px`;

  // 背景样式
  const bgStyle: React.CSSProperties = config.bgImage
    ? { backgroundImage: `url(${config.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: config.bgGradient || 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' };

  // 字体
  const fontFamily = config.fontFamily.includes('KaiTi') ? "'KaiTi', 'STKaiti', serif"
    : config.fontFamily.includes('Sans') ? "'Noto Sans SC', sans-serif"
    : "'Noto Serif SC', serif";

  // QR码占位
  const qrElement = config.qrCodePosition && config.qrCodePosition !== 'none' ? (
    <div
      className="absolute bg-white/90 rounded flex items-center justify-center"
      style={{
        bottom: css(padding),
        ...(config.qrCodePosition === 'bottom-left' ? { left: css(padding) } : { right: css(padding) }),
        width: css(qrSize),
        height: css(qrSize),
        padding: css(4 * scale),
      }}
    >
      <div className="w-3/4 h-3/4 bg-gray-800 rounded-sm" />
    </div>
  ) : null;

  // 通用内容渲染（classic/frame 布局使用）
  const renderContent = () => (
    <div
      className="flex flex-col justify-center"
      style={{
        width: '100%',
        height: '100%',
        padding: css(padding),
        color: config.textColor,
        fontFamily,
        alignItems: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      {config.aiTitle && (
        <div style={{ fontSize: css(scaledTitleSize), fontWeight: 700, marginBottom: css(16 * scale), opacity: 0.9, textAlign: config.textAlign, width: '100%' }}>
          {config.aiTitle}
        </div>
      )}
      <div className="flex flex-col" style={{ fontSize: css(scaledFontSize), lineHeight: config.lineHeight, textAlign: config.textAlign, width: '100%' }}>
        {config.verseContent.map((line, i) => (
          <div key={i} style={{ marginBottom: css(4 * scale) }}>{line}</div>
        ))}
      </div>
      <div style={{ fontSize: css(scaledInfoSize), color: config.infoColor, marginTop: css(24 * scale), opacity: 0.7, textAlign: config.textAlign, width: '100%' }}>
        {infoText}
      </div>
    </div>
  );

  // 根据布局模式渲染不同预览
  const renderLayout = () => {
    switch (config.layoutMode) {
      case 'poster':
        return (
          <div className="relative flex w-full h-full" style={bgStyle}>
            <div
              className="absolute bottom-0 left-0 right-0 flex flex-col"
              style={{ padding: css(padding), background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}
            >
              {config.aiTitle && (
                <div style={{ fontSize: css(scaledTitleSize), fontWeight: 700, marginBottom: css(16 * scale), opacity: 0.9, textAlign: config.textAlign, width: '100%', color: config.textColor, fontFamily }}>
                  {config.aiTitle}
                </div>
              )}
              <div className="flex flex-col" style={{ fontSize: css(scaledFontSize), lineHeight: config.lineHeight, textAlign: config.textAlign, width: '100%', color: config.textColor, fontFamily }}>
                {config.verseContent.map((line, i) => (
                  <div key={i} style={{ marginBottom: css(4 * scale) }}>{line}</div>
                ))}
              </div>
              <div style={{ fontSize: css(scaledInfoSize), color: config.infoColor, marginTop: css(24 * scale), opacity: 0.7, textAlign: config.textAlign, width: '100%' }}>
                {infoText}
              </div>
            </div>
            {qrElement}
          </div>
        );

      case 'card':
        return (
          <div className="relative flex items-center justify-center w-full h-full" style={{ ...bgStyle, padding: css(40 * scale) }}>
            <div
              className="flex flex-col bg-white rounded-2xl"
              style={{
                width: '90%',
                padding: css(padding * 1.5),
                boxShadow: `0 ${css(4 * scale)} ${css(24 * scale)} rgba(0,0,0,0.1)`,
                color: config.textColor,
              }}
            >
              {config.aiTitle && (
                <div style={{ fontSize: css(scaledTitleSize), fontWeight: 700, marginBottom: css(16 * scale), color: config.textColor }}>
                  {config.aiTitle}
                </div>
              )}
              <div className="flex flex-col" style={{ fontSize: css(scaledFontSize), lineHeight: config.lineHeight, color: config.textColor }}>
                {config.verseContent.map((line, i) => (
                  <div key={i} style={{ marginBottom: css(4 * scale) }}>{line}</div>
                ))}
              </div>
              <div style={{ fontSize: css(scaledInfoSize), color: config.infoColor, marginTop: css(24 * scale) }}>
                {infoText}
              </div>
            </div>
            {qrElement}
          </div>
        );

      case 'modern':
        return (
          <div className="relative flex w-full h-full" style={bgStyle}>
            <div
              className="absolute rounded-sm"
              style={{ top: css(padding), left: css(padding), width: css(4 * scale), height: css(60 * scale), backgroundColor: config.textColor, opacity: 0.6 }}
            />
            <div
              className="flex flex-col justify-center"
              style={{ padding: `${css(padding * 2)} ${css(padding)} ${css(padding)} ${css(padding * 2)}`, width: '100%', height: '100%', color: config.textColor, fontFamily }}
            >
              {config.aiTitle && (
                <div style={{ fontSize: css(scaledTitleSize), fontWeight: 700, marginBottom: css(16 * scale), opacity: 0.9 }}>
                  {config.aiTitle}
                </div>
              )}
              <div className="flex flex-col" style={{ fontSize: css(scaledFontSize), lineHeight: config.lineHeight, width: '100%' }}>
                {config.verseContent.map((line, i) => (
                  <div key={i} style={{ marginBottom: css(4 * scale) }}>{line}</div>
                ))}
              </div>
              <div style={{ fontSize: css(scaledInfoSize), color: config.infoColor, marginTop: css(24 * scale), opacity: 0.7 }}>
                {infoText}
              </div>
            </div>
            {qrElement}
          </div>
        );

      case 'split':
        return (
          <div className="relative flex w-full h-full">
            <div className="w-[45%]" style={bgStyle} />
            <div
              className="flex flex-col justify-center w-[55%] bg-white"
              style={{ padding: css(padding), color: config.textColor, fontFamily }}
            >
              {config.aiTitle && (
                <div style={{ fontSize: css(scaledTitleSize), fontWeight: 700, marginBottom: css(16 * scale), color: config.textColor }}>
                  {config.aiTitle}
                </div>
              )}
              <div className="flex flex-col" style={{ fontSize: css(scaledFontSize), lineHeight: config.lineHeight, color: config.textColor }}>
                {config.verseContent.map((line, i) => (
                  <div key={i} style={{ marginBottom: css(4 * scale) }}>{line}</div>
                ))}
              </div>
              <div style={{ fontSize: css(scaledInfoSize), color: config.infoColor, marginTop: css(24 * scale) }}>
                {infoText}
              </div>
            </div>
            {qrElement}
          </div>
        );

      case 'frame':
        return (
          <div className="relative flex w-full h-full" style={bgStyle}>
            <div
              className="absolute rounded-lg"
              style={{
                top: css(20 * scale), left: css(20 * scale), right: css(20 * scale), bottom: css(20 * scale),
                border: `${Math.max(1, 2 * scale * previewScale)}px solid ${config.textColor}`,
                opacity: 0.3,
              }}
            />
            {renderContent()}
            {qrElement}
          </div>
        );

      case 'film':
        return (
          <div className="relative flex w-full h-full" style={bgStyle}>
            <div className="absolute top-0 left-0 right-0 bg-black/70" style={{ height: css(24 * scale) }} />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70" style={{ height: css(24 * scale) }} />
            <div
              className="flex flex-col justify-center"
              style={{
                padding: `${css(40 * scale)} ${css(padding)}`,
                width: '100%', height: '100%',
                color: config.textColor, fontFamily,
                alignItems: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start',
              }}
            >
              {config.aiTitle && (
                <div style={{ fontSize: css(scaledTitleSize), fontWeight: 700, marginBottom: css(16 * scale), opacity: 0.9, textAlign: config.textAlign, width: '100%' }}>
                  {config.aiTitle}
                </div>
              )}
              <div className="flex flex-col" style={{ fontSize: css(scaledFontSize), lineHeight: config.lineHeight, textAlign: config.textAlign, width: '100%' }}>
                {config.verseContent.map((line, i) => (
                  <div key={i} style={{ marginBottom: css(4 * scale) }}>{line}</div>
                ))}
              </div>
              <div style={{ fontSize: css(scaledInfoSize), color: config.infoColor, marginTop: css(24 * scale), opacity: 0.7, textAlign: config.textAlign, width: '100%' }}>
                {infoText}
              </div>
            </div>
            {qrElement}
          </div>
        );

      case 'minimal':
        return (
          <div className="relative flex w-full h-full" style={bgStyle}>
            <div
              className="flex flex-col justify-center"
              style={{
                padding: css(padding * 2), width: '100%', height: '100%',
                color: config.textColor, fontFamily,
                alignItems: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start',
              }}
            >
              <div className="flex flex-col" style={{ fontSize: css(scaledFontSize * 0.9), lineHeight: config.lineHeight, textAlign: config.textAlign, maxWidth: '70%' }}>
                {config.verseContent.map((line, i) => (
                  <div key={i} style={{ marginBottom: css(4 * scale) }}>{line}</div>
                ))}
              </div>
              <div style={{ width: css(40 * scale), height: 1, backgroundColor: config.textColor, opacity: 0.3, margin: `${css(20 * scale)} 0` }} />
              <div style={{ fontSize: css(scaledInfoSize), color: config.infoColor, opacity: 0.6, textAlign: config.textAlign }}>
                {infoText}
              </div>
            </div>
            {qrElement}
          </div>
        );

      case 'magazine':
        return (
          <div className="relative flex w-full h-full" style={bgStyle}>
            <div
              className="flex flex-col justify-end"
              style={{ padding: css(padding), width: '100%', height: '100%', color: config.textColor, fontFamily }}
            >
              {config.aiTitle && (
                <div style={{ fontSize: css(scaledTitleSize * 1.5), fontWeight: 900, lineHeight: 1.1, marginBottom: css(20 * scale), letterSpacing: css(2 * scale) }}>
                  {config.aiTitle}
                </div>
              )}
              <div className="flex flex-col" style={{ fontSize: css(scaledFontSize * 0.85), lineHeight: config.lineHeight, textAlign: config.textAlign, maxWidth: '65%' }}>
                {config.verseContent.map((line, i) => (
                  <div key={i} style={{ marginBottom: css(4 * scale) }}>{line}</div>
                ))}
              </div>
              <div style={{ fontSize: css(scaledInfoSize), color: config.infoColor, marginTop: css(20 * scale), opacity: 0.6, letterSpacing: css(1 * scale), textAlign: config.textAlign }}>
                {infoText}
              </div>
            </div>
            {qrElement}
          </div>
        );

      case 'stamp':
        return (
          <div className="relative flex items-center justify-center w-full h-full" style={bgStyle}>
            <div
              className="flex flex-col items-center justify-center"
              style={{
                border: `${Math.max(1, 3 * scale * previewScale)}px solid ${config.textColor}`,
                borderRadius: css(4 * scale),
                padding: css(padding),
                maxWidth: '80%',
                opacity: 0.85,
              }}
            >
              <div style={{ fontSize: css(scaledFontSize * 1.2), lineHeight: config.lineHeight, textAlign: 'center', color: config.textColor, fontFamily }}>
                {`\u201C${config.verseContent.join(' ')}\u201D`}
              </div>
              <div style={{ fontSize: css(scaledInfoSize), color: config.infoColor, marginTop: css(16 * scale), opacity: 0.7 }}>
                {infoText}
              </div>
            </div>
            {qrElement}
          </div>
        );

      // classic (default)
      default:
        return (
          <div className="relative flex w-full h-full" style={bgStyle}>
            {renderContent()}
            {qrElement}
          </div>
        );
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div
        className="relative overflow-hidden rounded-lg border shadow-sm"
        style={{ width: previewWidth, height: previewHeight }}
      >
        {renderLayout()}
      </div>
    </div>
  );
}
