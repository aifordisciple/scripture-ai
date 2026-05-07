// components/bible/share-card/ResolutionPicker.tsx
"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { RESOLUTION_PRESETS, RESOLUTION_MIN, RESOLUTION_MAX, ASPECT_RATIO_PRESETS, type ResolutionPreset } from '@/lib/card-presets';
import { Monitor, Smartphone, Tablet, Square, Image, UserCircle, Sliders } from 'lucide-react';

interface ResolutionPickerProps {
  width: number;
  height: number;
  presetId: string | null;
  onResolutionChange: (width: number, height: number, presetId: string | null) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  wallpaper: <Monitor className="w-4 h-4" />,
  social: <Image className="w-4 h-4" />,
  avatar: <UserCircle className="w-4 h-4" />,
};

export function ResolutionPicker({ width, height, presetId, onResolutionChange }: ResolutionPickerProps) {
  const { t } = useTranslation();
  const [isCustom, setIsCustom] = useState(presetId === null);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [customWidth, setCustomWidth] = useState(String(width));
  const [customHeight, setCustomHeight] = useState(String(height));

  const handlePresetSelect = (preset: ResolutionPreset) => {
    setIsCustom(false);
    setCustomWidth(String(preset.width));
    setCustomHeight(String(preset.height));
    onResolutionChange(preset.width, preset.height, preset.id);
  };

  const handleCustomToggle = () => {
    setIsCustom(true);
    onResolutionChange(parseInt(customWidth) || 1080, parseInt(customHeight) || 1440, null);
  };

  const handleWidthChange = (value: string) => {
    const w = Math.min(Math.max(parseInt(value) || RESOLUTION_MIN, RESOLUTION_MIN), RESOLUTION_MAX);
    setCustomWidth(String(w));
    if (lockAspectRatio) {
      const ratio = width / height;
      const h = Math.round(w / ratio);
      setCustomHeight(String(Math.min(Math.max(h, RESOLUTION_MIN), RESOLUTION_MAX)));
      onResolutionChange(w, h, null);
    } else {
      onResolutionChange(w, parseInt(customHeight) || height, null);
    }
  };

  const handleHeightChange = (value: string) => {
    const h = Math.min(Math.max(parseInt(value) || RESOLUTION_MIN, RESOLUTION_MIN), RESOLUTION_MAX);
    setCustomHeight(String(h));
    if (lockAspectRatio) {
      const ratio = width / height;
      const w = Math.round(h * ratio);
      setCustomWidth(String(Math.min(Math.max(w, RESOLUTION_MIN), RESOLUTION_MAX)));
      onResolutionChange(w, h, null);
    } else {
      onResolutionChange(parseInt(customWidth) || width, h, null);
    }
  };

  const handleAspectRatio = (ratio: number) => {
    const newHeight = Math.round(width / ratio);
    const clampedH = Math.min(Math.max(newHeight, RESOLUTION_MIN), RESOLUTION_MAX);
    setCustomHeight(String(clampedH));
    setCustomWidth(String(width));
    onResolutionChange(width, clampedH, null);
    setIsCustom(true);
  };

  return (
    <div className="space-y-4">
      {/* 预设模板 */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t('shareCard.resolutionPresets')}</label>
        <div className="grid grid-cols-2 gap-2">
          {RESOLUTION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset)}
              className={cn(
                "p-2.5 border rounded-lg hover:bg-secondary flex items-center gap-2 transition-all active:scale-95",
                presetId === preset.id && !isCustom && "border-primary bg-primary/5 ring-1 ring-primary text-primary"
              )}
            >
              <div className={cn("text-muted-foreground shrink-0", presetId === preset.id && !isCustom && "text-primary")}>
                {CATEGORY_ICONS[preset.category]}
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold truncate">{t(preset.nameKey)}</div>
                <div className="text-[10px] text-muted-foreground">{preset.width}×{preset.height}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 自定义分辨率 */}
      <div>
        <button
          onClick={handleCustomToggle}
          className={cn(
            "w-full p-2.5 border rounded-lg hover:bg-secondary flex items-center gap-2 transition-all active:scale-95",
            isCustom && "border-primary bg-primary/5 ring-1 ring-primary text-primary"
          )}
        >
          <Sliders className={cn("w-4 h-4 shrink-0", isCustom ? "text-primary" : "text-muted-foreground")} />
          <span className="text-xs font-semibold">{t('shareCard.customResolution')}</span>
        </button>

        {isCustom && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">{t('shareCard.width')}</label>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  min={RESOLUTION_MIN}
                  max={RESOLUTION_MAX}
                  className="w-full px-2 py-1.5 text-xs border rounded bg-background text-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">{t('shareCard.height')}</label>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  min={RESOLUTION_MIN}
                  max={RESOLUTION_MAX}
                  className="w-full px-2 py-1.5 text-xs border rounded bg-background text-foreground"
                />
              </div>
            </div>

            {/* 宽高比锁定 */}
            <button
              onClick={() => setLockAspectRatio(!lockAspectRatio)}
              className={cn(
                "w-full text-xs px-2 py-1.5 border rounded flex items-center justify-center gap-1 transition-colors",
                lockAspectRatio ? "border-primary text-primary bg-primary/5" : "border-muted text-muted-foreground"
              )}
            >
              {lockAspectRatio ? '🔗' : '🔓'} {t(lockAspectRatio ? 'shareCard.aspectLocked' : 'shareCard.aspectUnlocked')}
            </button>

            {/* 快捷宽高比 */}
            <div className="flex gap-1.5">
              {ASPECT_RATIO_PRESETS.map((ar) => (
                <button
                  key={ar.label}
                  onClick={() => handleAspectRatio(ar.ratio)}
                  className="px-2 py-1 text-xs border rounded hover:bg-secondary active:scale-95"
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}