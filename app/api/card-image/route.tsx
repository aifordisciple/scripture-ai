// app/api/card-image/route.tsx
// 服务端渲染经文卡片 - @vercel/og ImageResponse (支持多分辨率 + 全10种布局 + 多字体 + QR码)

import { ImageResponse } from '@vercel/og';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 字体加载
function loadFontSafe(filename: string): ArrayBuffer | null {
  try {
    const fontPath = path.join(process.cwd(), 'public/fonts', filename);
    if (!fs.existsSync(fontPath)) return null;
    const fileBuffer = fs.readFileSync(fontPath);
    return new Uint8Array(fileBuffer).buffer;
  } catch (e) {
    console.error(`[Font Error] Load ${filename} failed:`, e);
    return null;
  }
}

// --------------------------------------------------
// 布局渲染
// --------------------------------------------------

type LayoutMode = 'classic' | 'poster' | 'card' | 'modern' | 'split' | 'frame' | 'film' | 'minimal' | 'magazine' | 'stamp';

interface CardParams {
  verseContent: string[];
  bookName: string;
  chapter: string;
  verseRange: string;
  width: number;
  height: number;
  bgImage?: string;
  bgGradient?: string;
  layoutMode: LayoutMode;
  textColor: string;
  infoColor: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  fontFamily: string;
  aiTitle?: string;
  qrCodeUrl?: string;
  qrCodePosition?: 'bottom-left' | 'bottom-right' | 'none';
}

function buildCardJSX(params: CardParams) {
  const {
    verseContent, bookName, chapter, verseRange,
    width, height, bgImage, bgGradient, layoutMode,
    textColor, infoColor, fontSize, textAlign, lineHeight, fontFamily,
    aiTitle, qrCodeUrl, qrCodePosition,
  } = params;

  const scale = width / 1080;
  const scaledFontSize = Math.round(fontSize * scale * 1.8);
  const scaledTitleSize = Math.round(fontSize * scale * 2.2);
  const scaledInfoSize = Math.round(fontSize * scale * 1.2);
  const padding = Math.round(60 * scale);
  const infoText = `${bookName} ${chapter}:${verseRange}`;

  const bgStyle: Record<string, string | undefined> = bgImage
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: bgGradient || 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' };

  // QR码占位
  const qrSize = Math.round(80 * scale);
  const qrElement = qrCodePosition && qrCodePosition !== 'none' && qrCodeUrl ? (
    <div style={{
      position: 'absolute',
      bottom: padding,
      ...(qrCodePosition === 'bottom-left' ? { left: padding } : { right: padding }),
      width: qrSize,
      height: qrSize,
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderRadius: 4 * scale,
      padding: 4 * scale,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg width={qrSize - 8 * scale} height={qrSize - 8 * scale} viewBox="0 0 100 100">
        <rect x="0" y="0" width="30" height="30" fill="#333" rx="3" />
        <rect x="70" y="0" width="30" height="30" fill="#333" rx="3" />
        <rect x="0" y="70" width="30" height="30" fill="#333" rx="3" />
        <rect x="8" y="8" width="14" height="14" fill="white" rx="2" />
        <rect x="78" y="8" width="14" height="14" fill="white" rx="2" />
        <rect x="8" y="78" width="14" height="14" fill="white" rx="2" />
        <rect x="10" y="10" width="10" height="10" fill="#333" rx="1" />
        <rect x="80" y="10" width="10" height="10" fill="#333" rx="1" />
        <rect x="10" y="80" width="10" height="10" fill="#333" rx="1" />
      </svg>
    </div>
  ) : null;

  // 通用内容
  const contentElement = (
    <div style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
      width: '100%', height: '100%', padding, color: textColor, fontFamily,
    }}>
      {aiTitle && <div style={{ fontSize: scaledTitleSize, fontWeight: 700, marginBottom: 16 * scale, opacity: 0.9, textAlign, width: '100%' }}>{aiTitle}</div>}
      <div style={{ fontSize: scaledFontSize, lineHeight, textAlign, width: '100%', maxWidth: width - padding * 2 }}>
        {verseContent.map((line, i) => <div key={i} style={{ marginBottom: 4 * scale }}>{line}</div>)}
      </div>
      <div style={{ fontSize: scaledInfoSize, color: infoColor, marginTop: 24 * scale, opacity: 0.7, textAlign, width: '100%' }}>{infoText}</div>
    </div>
  );

  switch (layoutMode) {
    case 'poster':
      return (
        <div style={{ width: '100%', height: '100%', ...bgStyle, display: 'flex', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
            {contentElement}
          </div>
          {qrElement}
        </div>
      );

    case 'card':
      return (
        <div style={{ width: '100%', height: '100%', background: bgGradient || '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 * scale }}>
          <div style={{ width: '90%', backgroundColor: 'white', borderRadius: 16 * scale, padding: padding * 1.5, boxShadow: `0 ${4 * scale}px ${24 * scale}px rgba(0,0,0,0.1)`, color: '#333' }}>
            {aiTitle && <div style={{ fontSize: scaledTitleSize, fontWeight: 700, marginBottom: 16 * scale, color: '#1a1a1a' }}>{aiTitle}</div>}
            <div style={{ fontSize: scaledFontSize, lineHeight, color: '#333' }}>
              {verseContent.map((line, i) => <div key={i} style={{ marginBottom: 4 * scale }}>{line}</div>)}
            </div>
            <div style={{ fontSize: scaledInfoSize, color: '#999', marginTop: 24 * scale }}>{infoText}</div>
          </div>
        </div>
      );

    case 'modern':
      return (
        <div style={{ width: '100%', height: '100%', ...bgStyle, display: 'flex', position: 'relative' }}>
          <div style={{ position: 'absolute', top: padding, left: padding, width: 4 * scale, height: 60 * scale, backgroundColor: textColor, opacity: 0.6, borderRadius: 2 * scale }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${padding * 2}px ${padding}px ${padding}px ${padding * 2}px`, width: '100%', height: '100%', color: textColor, fontFamily }}>
            {aiTitle && <div style={{ fontSize: scaledTitleSize, fontWeight: 700, marginBottom: 16 * scale, opacity: 0.9 }}>{aiTitle}</div>}
            <div style={{ fontSize: scaledFontSize, lineHeight, width: '100%' }}>
              {verseContent.map((line, i) => <div key={i} style={{ marginBottom: 4 * scale }}>{line}</div>)}
            </div>
            <div style={{ fontSize: scaledInfoSize, color: infoColor, marginTop: 24 * scale, opacity: 0.7 }}>{infoText}</div>
          </div>
          {qrElement}
        </div>
      );

    case 'split':
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex' }}>
          <div style={{ width: '45%', ...bgStyle }} />
          <div style={{ width: '55%', backgroundColor: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding, color: '#333', fontFamily }}>
            {aiTitle && <div style={{ fontSize: scaledTitleSize, fontWeight: 700, marginBottom: 16 * scale, color: '#1a1a1a' }}>{aiTitle}</div>}
            <div style={{ fontSize: scaledFontSize, lineHeight, color: '#333' }}>
              {verseContent.map((line, i) => <div key={i} style={{ marginBottom: 4 * scale }}>{line}</div>)}
            </div>
            <div style={{ fontSize: scaledInfoSize, color: '#999', marginTop: 24 * scale }}>{infoText}</div>
          </div>
        </div>
      );

    case 'frame':
      return (
        <div style={{ width: '100%', height: '100%', ...bgStyle, display: 'flex', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 20 * scale, left: 20 * scale, right: 20 * scale, bottom: 20 * scale, border: `${2 * scale}px solid ${textColor}`, borderRadius: 8 * scale, opacity: 0.3 }} />
          {contentElement}
          {qrElement}
        </div>
      );

    case 'film':
      return (
        <div style={{ width: '100%', height: '100%', ...bgStyle, display: 'flex', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 24 * scale, backgroundColor: 'rgba(0,0,0,0.7)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24 * scale, backgroundColor: 'rgba(0,0,0,0.7)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: `${40 * scale}px ${padding}px`, width: '100%', height: '100%', color: textColor, fontFamily, textAlign: 'center' }}>
            {aiTitle && <div style={{ fontSize: scaledTitleSize, fontWeight: 700, marginBottom: 16 * scale, opacity: 0.9 }}>{aiTitle}</div>}
            <div style={{ fontSize: scaledFontSize, lineHeight, textAlign: 'center', width: '100%' }}>
              {verseContent.map((line, i) => <div key={i} style={{ marginBottom: 4 * scale }}>{line}</div>)}
            </div>
            <div style={{ fontSize: scaledInfoSize, color: infoColor, marginTop: 24 * scale, opacity: 0.7 }}>{infoText}</div>
          </div>
          {qrElement}
        </div>
      );

    case 'minimal':
      return (
        <div style={{ width: '100%', height: '100%', ...bgStyle, display: 'flex', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: padding * 2, width: '100%', height: '100%', color: textColor, fontFamily }}>
            <div style={{ fontSize: scaledFontSize * 0.9, lineHeight, textAlign: 'center', maxWidth: width * 0.7 }}>
              {verseContent.map((line, i) => <div key={i} style={{ marginBottom: 4 * scale }}>{line}</div>)}
            </div>
            <div style={{ width: 40 * scale, height: 1, backgroundColor: textColor, opacity: 0.3, margin: `${20 * scale}px 0` }} />
            <div style={{ fontSize: scaledInfoSize, color: infoColor, opacity: 0.6 }}>{infoText}</div>
          </div>
          {qrElement}
        </div>
      );

    case 'magazine':
      return (
        <div style={{ width: '100%', height: '100%', ...bgStyle, display: 'flex', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding, width: '100%', height: '100%', color: textColor, fontFamily }}>
            {aiTitle && <div style={{ fontSize: scaledTitleSize * 1.5, fontWeight: 900, lineHeight: 1.1, marginBottom: 20 * scale, letterSpacing: 2 * scale }}>{aiTitle}</div>}
            <div style={{ fontSize: scaledFontSize * 0.85, lineHeight, textAlign: 'left', maxWidth: width * 0.65 }}>
              {verseContent.map((line, i) => <div key={i} style={{ marginBottom: 4 * scale }}>{line}</div>)}
            </div>
            <div style={{ fontSize: scaledInfoSize, color: infoColor, marginTop: 20 * scale, opacity: 0.6, letterSpacing: 1 * scale }}>{infoText}</div>
          </div>
          {qrElement}
        </div>
      );

    case 'stamp':
      return (
        <div style={{ width: '100%', height: '100%', ...bgStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ border: `${3 * scale}px solid ${textColor}`, borderRadius: 4 * scale, padding, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: width * 0.8, opacity: 0.85 }}>
            <div style={{ fontSize: scaledFontSize * 1.2, lineHeight, textAlign: 'center', color: textColor, fontFamily }}>
              &ldquo;{verseContent.join(' ')}&rdquo;
            </div>
            <div style={{ fontSize: scaledInfoSize, color: infoColor, marginTop: 16 * scale, opacity: 0.7 }}>{infoText}</div>
          </div>
          {qrElement}
        </div>
      );

    // classic (default)
    default:
      return (
        <div style={{ width: '100%', height: '100%', ...bgStyle, display: 'flex', position: 'relative' }}>
          {contentElement}
          {qrElement}
        </div>
      );
  }
}

// --------------------------------------------------
// POST handler
// --------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      verseContent, bookName = '', chapter = '', verseRange = '',
      width = 1080, height = 1440,
      bgImage, bgGradient, layoutMode = 'classic',
      textColor = '#333333', infoColor = '#666666',
      fontSize = 22, textAlign = 'center', lineHeight = 1.8,
      fontFamily = "'Noto Serif SC', serif",
      aiTitle, qrCodeUrl, qrCodePosition,
    } = body;

    if (!verseContent || !Array.isArray(verseContent) || verseContent.length === 0) {
      return NextResponse.json({ success: false, error: 'verseContent is required' }, { status: 400 });
    }

    // 加载字体
    const serifData = loadFontSafe('NotoSerifSC-Bold.otf');
    const sansData = loadFontSafe('NotoSansSC-Bold.ttf');

    const fonts: Array<{ name: string; data: ArrayBuffer; style: 'normal'; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 }> = [];
    if (serifData) fonts.push({ name: 'NotoSerifSC', data: serifData, style: 'normal', weight: 700 });
    if (sansData) fonts.push({ name: 'NotoSansSC', data: sansData, style: 'normal', weight: 700 });

    // 确定使用的字体名
    const satoriFont = fontFamily.includes('Sans') ? 'NotoSansSC' : 'NotoSerifSC';
    const fallbackFont = fonts.length > 0 ? satoriFont : 'sans-serif';

    // 构建 JSX
    const jsx = buildCardJSX({
      verseContent, bookName, chapter, verseRange,
      width, height, bgImage, bgGradient,
      layoutMode: layoutMode as LayoutMode,
      textColor, infoColor, fontSize,
      textAlign: textAlign as 'left' | 'center' | 'right',
      lineHeight, fontFamily: fallbackFont, aiTitle, qrCodeUrl, qrCodePosition,
    });

    return new ImageResponse(jsx, {
      width,
      height,
      fonts: fonts.length > 0 ? fonts : undefined,
    });
  } catch (error) {
    console.error('Card image generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}