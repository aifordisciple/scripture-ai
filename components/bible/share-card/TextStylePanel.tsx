// components/bible/share-card/TextStylePanel.tsx
"use client";

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { FONT_OPTIONS, TEXT_COLOR_PRESETS, INFO_COLOR_PRESETS } from '@/lib/card-presets';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Type, AlignLeft, AlignCenter, AlignRight, MoveVertical, Palette, Info } from 'lucide-react';

interface TextStylePanelProps {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  textColor: string;
  infoColor: string;
  onFontFamilyChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (height: number) => void;
  onTextAlignChange: (align: 'left' | 'center' | 'right') => void;
  onTextColorChange: (color: string) => void;
  onInfoColorChange: (color: string) => void;
}

export function TextStylePanel({
  fontFamily, fontSize, lineHeight, textAlign, textColor, infoColor,
  onFontFamilyChange, onFontSizeChange, onLineHeightChange, onTextAlignChange,
  onTextColorChange, onInfoColorChange,
}: TextStylePanelProps) {
  const { t } = useTranslation();
  const mainColorRef = useRef<HTMLInputElement>(null);
  const infoColorRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-5">
      {/* 字体 */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Type className="w-3 h-3" /> {t('shareCard.fontLabel')}</label>
        <div className="grid grid-cols-3 gap-1.5">
          {FONT_OPTIONS.map((f, i) => (
            <button
              key={i}
              onClick={() => onFontFamilyChange(f.value)}
              className={cn(
                "px-2 py-1.5 text-xs border rounded hover:bg-secondary text-left truncate active:scale-95",
                fontFamily === f.value && "border-primary text-primary bg-primary/5"
              )}
              style={{ fontFamily: f.value }}
            >
              {t(f.nameKey)}
            </button>
          ))}
        </div>
      </div>

      {/* 字号 */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
          <span>{t('shareCard.fontSize')}</span>
          <span>{fontSize}px</span>
        </label>
        <Slider value={[fontSize]} min={14} max={48} step={1} onValueChange={(val) => onFontSizeChange(val[0])} />
      </div>

      {/* 行间距 */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1"><MoveVertical className="w-3 h-3" /> {t('shareCard.lineSpacing')}</span>
          <span>{lineHeight}</span>
        </label>
        <Slider value={[lineHeight]} min={1.0} max={3.0} step={0.1} onValueChange={(val) => onLineHeightChange(val[0])} />
      </div>

      {/* 对齐 */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">{t('shareCard.alignment')}</label>
        <div className="flex gap-2">
          <Button variant={textAlign === 'left' ? 'secondary' : 'outline'} size="sm" onClick={() => onTextAlignChange('left')} className="flex-1 active:scale-95"><AlignLeft className="w-4 h-4" /></Button>
          <Button variant={textAlign === 'center' ? 'secondary' : 'outline'} size="sm" onClick={() => onTextAlignChange('center')} className="flex-1 active:scale-95"><AlignCenter className="w-4 h-4" /></Button>
          <Button variant={textAlign === 'right' ? 'secondary' : 'outline'} size="sm" onClick={() => onTextAlignChange('right')} className="flex-1 active:scale-95"><AlignRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* 正文颜色 */}
      <div className="space-y-2 border-t pt-3">
        <label className="text-xs font-semibold text-muted-foreground">{t('shareCard.mainColor')}</label>
        <div className="flex gap-3 flex-wrap items-center">
          {TEXT_COLOR_PRESETS.map(c => (
            <button key={c} onClick={() => onTextColorChange(c)} className={cn("w-8 h-8 rounded-full border transition-transform active:scale-95", textColor === c && "ring-2 ring-primary ring-offset-2")} style={{ backgroundColor: c }} />
          ))}
          <div className="relative">
            <button onClick={() => mainColorRef.current?.click()} className="w-8 h-8 rounded-full border border-dashed border-muted-foreground flex items-center justify-center hover:bg-secondary active:scale-95" title={t('shareCard.customColor')}>
              <Palette className="w-4 h-4 text-muted-foreground" />
            </button>
            <input ref={mainColorRef} type="color" className="absolute opacity-0 w-0 h-0" onChange={(e) => onTextColorChange(e.target.value)} />
          </div>
        </div>
      </div>

      {/* 信息颜色 */}
      <div className="space-y-2 border-t pt-3">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3" /> {t('shareCard.infoColor')}</label>
        <div className="flex gap-3 flex-wrap items-center">
          {INFO_COLOR_PRESETS.map(c => (
            <button key={c} onClick={() => onInfoColorChange(c)} className={cn("w-6 h-6 rounded-full border transition-transform active:scale-95", infoColor === c && "ring-2 ring-primary ring-offset-2")} style={{ backgroundColor: c }} />
          ))}
          <div className="relative">
            <button onClick={() => infoColorRef.current?.click()} className="w-6 h-6 rounded-full border border-dashed border-muted-foreground flex items-center justify-center hover:bg-secondary active:scale-95" title={t('shareCard.customColor')}>
              <Palette className="w-3 h-3 text-muted-foreground" />
            </button>
            <input ref={infoColorRef} type="color" className="absolute opacity-0 w-0 h-0" onChange={(e) => onInfoColorChange(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}