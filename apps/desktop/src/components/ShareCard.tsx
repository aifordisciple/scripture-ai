// apps/desktop/src/components/ShareCard.tsx
/**
 * Share Card component for desktop app
 * Generate verse images for sharing
 */

import { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { save } from '@tauri-apps/plugin-dialog';
import { writeBinaryFile } from '@tauri-apps/plugin-fs';
import {
  X, Download, Image, Palette, Type, AlignLeft, AlignCenter, AlignRight, RefreshCw,
} from 'lucide-react';

// Gradient presets
const GRADIENT_PRESETS = [
  { name: '纯净白', bg: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', text: '#333333', info: '#666666' },
  { name: '梦幻紫', bg: 'linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%)', text: '#ffffff', info: '#f0f0f0' },
  { name: '深海蓝', bg: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)', text: '#ffffff', info: '#cccccc' },
  { name: '清新绿', bg: 'linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)', text: '#333333', info: '#555555' },
  { name: '深邃夜', bg: 'linear-gradient(to top, #09203f 0%, #537895 100%)', text: '#ffffff', info: '#aaaaaa' },
  { name: '暖阳', bg: 'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)', text: '#333333', info: '#666666' },
];

const FONT_OPTIONS = [
  { name: '宋体', value: "'Noto Serif SC', serif" },
  { name: '黑体', value: "'Noto Sans SC', sans-serif" },
];

interface ShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  bookName: string;
  chapter: number;
  verses: number[];
  verseTexts: string[];
}

export function ShareCard({
  isOpen,
  onClose,
  bookName,
  chapter,
  verses,
  verseTexts,
}: ShareCardProps) {
  const [loading, setLoading] = useState(false);
  const [gradient, setGradient] = useState(GRADIENT_PRESETS[0]);
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [textColor, setTextColor] = useState(GRADIENT_PRESETS[0].text);
  const [infoColor, setInfoColor] = useState(GRADIENT_PRESETS[0].info);

  const cardRef = useRef<HTMLDivElement>(null);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setGradient(GRADIENT_PRESETS[0]);
      setTextColor(GRADIENT_PRESETS[0].text);
      setInfoColor(GRADIENT_PRESETS[0].info);
      setFontSize(20);
      setFontFamily(FONT_OPTIONS[0].value);
      setTextAlign('center');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGradientSelect = (preset: typeof GRADIENT_PRESETS[0]) => {
    setGradient(preset);
    setTextColor(preset.text);
    setInfoColor(preset.info);
  };

  const generateAndSave = async () => {
    if (!cardRef.current) return;
    setLoading(true);

    try {
      // Wait for render
      await new Promise(r => setTimeout(r, 100));

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        width: 360,
        height: Math.max(cardRef.current.scrollHeight, 480),
      });

      // Convert data URL to binary
      const base64 = dataUrl.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Open save dialog
      const filePath = await save({
        defaultPath: `${bookName}${chapter}章-${Date.now()}.png`,
        filters: [{ name: 'PNG Image', extensions: ['png'] }],
      });

      if (filePath) {
        await writeBinaryFile(filePath, bytes);
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setLoading(false);
    }
  };

  const verseRange = verses.length === 1
    ? `${verses[0]}节`
    : `${Math.min(...verses)}-${Math.max(...verses)}节`;

  const reference = `${bookName} ${chapter}:${verseRange}`;

  return (
    <div className="share-card-overlay">
      <div className="share-card-modal">
        <div className="share-card-header">
          <h3>分享经文</h3>
          <button className="close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="share-card-content">
          {/* Preview */}
          <div className="preview-section">
            <div
              ref={cardRef}
              className="share-preview-card"
              style={{
                background: gradient.bg,
                color: textColor,
                fontFamily,
                fontSize: `${fontSize}px`,
                lineHeight: 1.8,
                textAlign,
              }}
            >
              <div className="verse-text">
                {verseTexts.map((text, i) => (
                  <p key={i}>{verses[i]} {text}</p>
                ))}
              </div>
              <div
                className="verse-reference"
                style={{ color: infoColor }}
              >
                — {reference}
              </div>
              <div className="app-branding" style={{ color: infoColor }}>
                AI读 · 智能圣经阅读助手
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="controls-section">
            {/* Gradient selection */}
            <div className="control-group">
              <label>
                <Palette className="w-4 h-4" />
                背景
              </label>
              <div className="gradient-options">
                {GRADIENT_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    className={`gradient-option ${gradient.name === preset.name ? 'active' : ''}`}
                    style={{ background: preset.bg }}
                    onClick={() => handleGradientSelect(preset)}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Font selection */}
            <div className="control-group">
              <label>
                <Type className="w-4 h-4" />
                字体
              </label>
              <div className="font-options">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.value}
                    className={`font-option ${fontFamily === font.value ? 'active' : ''}`}
                    onClick={() => setFontFamily(font.value)}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Text alignment */}
            <div className="control-group">
              <label>对齐</label>
              <div className="align-options">
                <button
                  className={`align-option ${textAlign === 'left' ? 'active' : ''}`}
                  onClick={() => setTextAlign('left')}
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  className={`align-option ${textAlign === 'center' ? 'active' : ''}`}
                  onClick={() => setTextAlign('center')}
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  className={`align-option ${textAlign === 'right' ? 'active' : ''}`}
                  onClick={() => setTextAlign('right')}
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Font size */}
            <div className="control-group">
              <label>字号: {fontSize}px</label>
              <input
                type="range"
                min="14"
                max="28"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="font-slider"
              />
            </div>

            {/* Save button */}
            <button
              className="save-btn"
              onClick={generateAndSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  保存图片
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}