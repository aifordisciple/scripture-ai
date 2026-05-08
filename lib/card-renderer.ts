// lib/card-renderer.ts
// 服务端渲染参数构建工具 - 将 CardConfig 转换为 Satori JSX 参数

import type { CardConfig, LayoutMode } from './card-presets';

// --------------------------------------------------
// 统一缩放计算 - 预览与服务端共用同一公式
// --------------------------------------------------

export interface PreviewScaling {
  scale: number;
  fontSize: number;
  titleSize: number;
  infoSize: number;
  padding: number;
  qrSize: number;
}

/**
 * 计算预览/渲染用的统一缩放参数
 * 与 app/api/card-image/route.tsx 中的 buildCardJSX 使用完全相同的公式
 */
export function getPreviewScaling(outputWidth: number, baseFontSize: number): PreviewScaling {
  const scale = outputWidth / 1080;
  return {
    scale,
    fontSize: Math.round(baseFontSize * scale * 1.8),
    titleSize: Math.round(baseFontSize * scale * 2.2),
    infoSize: Math.round(baseFontSize * scale * 1.2),
    padding: Math.round(60 * scale),
    qrSize: Math.round(80 * scale),
  };
}

// --------------------------------------------------
// 1. Satori 渲染请求参数
// --------------------------------------------------

export interface SatoriCardRequest {
  // 内容
  verseContent: string[];
  bookName: string;
  chapter: string;
  verseRange: string;

  // 分辨率
  width: number;
  height: number;

  // 背景
  bgImage?: string;    // Base64 data URL
  bgGradient?: string; // CSS linear-gradient

  // 布局
  layoutMode: LayoutMode;

  // 文字
  textColor: string;
  infoColor: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  fontFamily: string;

  // AI 标题
  aiTitle?: string;

  // QR 码
  qrCodeUrl?: string;
  qrCodePosition?: 'bottom-left' | 'bottom-right' | 'none';
}

// --------------------------------------------------
// 2. CardConfig → SatoriCardRequest 转换
// --------------------------------------------------

export function cardConfigToSatoriRequest(config: CardConfig): SatoriCardRequest {
  const request: SatoriCardRequest = {
    verseContent: config.verseContent,
    bookName: config.bookName,
    chapter: config.chapter,
    verseRange: config.verseRange,
    width: config.width,
    height: config.height,
    layoutMode: config.layoutMode,
    textColor: config.textColor,
    infoColor: config.infoColor,
    fontSize: config.fontSize,
    textAlign: config.textAlign,
    lineHeight: config.lineHeight,
    fontFamily: config.fontFamily,
    qrCodePosition: config.qrCodePosition,
  };

  // 背景：优先使用图片，否则使用渐变
  if (config.bgImage) {
    request.bgImage = config.bgImage;
  } else {
    request.bgGradient = config.bgGradient;
  }

  // AI 标题
  if (config.aiTitle) {
    request.aiTitle = config.aiTitle;
  }

  // QR 码 URL
  if (config.qrCodeUrl && config.qrCodePosition !== 'none') {
    request.qrCodeUrl = config.qrCodeUrl;
  }

  return request;
}

// --------------------------------------------------
// 3. 预览尺寸计算（客户端预览用）
// --------------------------------------------------

export interface PreviewDimensions {
  logicalWidth: number;
  logicalHeight: number;
  aspectRatio: number;
}

/** 根据分辨率计算预览逻辑尺寸（保持宽高比，宽度固定 340px） */
export function calculatePreviewDimensions(
  outputWidth: number,
  outputHeight: number,
  baseWidth: number = 340,
): PreviewDimensions {
  const aspectRatio = outputWidth / outputHeight;
  const logicalWidth = baseWidth;
  const logicalHeight = Math.round(baseWidth / aspectRatio);

  return {
    logicalWidth,
    logicalHeight,
    aspectRatio,
  };
}

// --------------------------------------------------
// 4. Satori 字号缩放
// --------------------------------------------------

/** 根据输出分辨率缩放字号（基准 1080px 宽度） */
export function scaleFontSize(baseFontSize: number, outputWidth: number): number {
  const scaleFactor = outputWidth / 1080;
  return Math.round(baseFontSize * scaleFactor * 1.8); // 1.8 是 Satori 渲染的缩放系数
}

// --------------------------------------------------
// 5. 布局模式分类
// --------------------------------------------------

export type LayoutCategory = 'overlay' | 'card' | 'split' | 'minimal' | 'decorated';

export function categorizeLayout(mode: LayoutMode): LayoutCategory {
  switch (mode) {
    case 'poster':
    case 'film':
      return 'overlay';
    case 'card':
      return 'card';
    case 'split':
      return 'split';
    case 'minimal':
      return 'minimal';
    case 'classic':
    case 'modern':
    case 'frame':
    case 'magazine':
    case 'stamp':
      return 'decorated';
    default:
      return 'decorated';
  }
}

/** 判断布局是否需要暗色文字（白底/浅底） */
export function isLightBackgroundLayout(mode: LayoutMode): boolean {
  return mode === 'card' || mode === 'split';
}

/** 判断布局是否需要底部对齐 */
export function isBottomAlignedLayout(mode: LayoutMode): boolean {
  return mode === 'poster' || mode === 'film';
}

// --------------------------------------------------
// 6. 图片代理 URL 构建
// --------------------------------------------------

export function buildProxyUrl(originalUrl: string): string {
  return `/api/proxy?url=${encodeURIComponent(originalUrl)}`;
}

/** 将外部图片 URL 转为 Base64（通过代理） */
export async function fetchImageAsBase64(url: string): Promise<string> {
  const proxyUrl = buildProxyUrl(url);
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error('Image fetch failed');

  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}