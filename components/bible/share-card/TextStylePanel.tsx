// components/bible/share-card/TextStylePanel.tsx
"use client";

import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { FONT_OPTIONS } from '@/lib/card-presets';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Type, AlignLeft, AlignCenter, AlignRight, MoveVertical } from 'lucide-react';

interface TextStylePanelProps {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  onFontFamilyChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (height: number) => void;
  onTextAlignChange: (align: 'left' | 'center' | 'right') => void;
}

export function TextStylePanel({
  fontFamily, fontSize, lineHeight, textAlign,
  onFontFamilyChange, onFontSizeChange, onLineHeightChange, onTextAlignChange,
}: TextStylePanelProps) {
  const { t } = useTranslation();

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
    </div>
  );
}