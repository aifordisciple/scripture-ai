// components/bible/share-card/LayoutPicker.tsx
"use client";

import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { LAYOUT_MODES, type LayoutMode } from '@/lib/card-presets';
import {
  Layout, Image, StickyNote, AlignLeft, Columns, Frame,
  Clapperboard, Minus, Type, Quote
} from 'lucide-react';

interface LayoutPickerProps {
  currentMode: LayoutMode;
  onModeChange: (mode: LayoutMode) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Layout, Image, StickyNote, AlignLeft, Columns, Frame,
  Clapperboard, Minus, Type, Quote,
};

export function LayoutPicker({ currentMode, onModeChange }: LayoutPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {LAYOUT_MODES.map(({ mode, nameKey, icon }) => {
        const IconComponent = ICON_MAP[icon];
        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 border rounded-lg hover:bg-secondary transition-all active:scale-95",
              currentMode === mode && "border-primary bg-primary/5 ring-1 ring-primary"
            )}
            title={t(nameKey)}
          >
            {IconComponent && <IconComponent className={cn("w-4 h-4", currentMode === mode ? "text-primary" : "text-muted-foreground")} />}
            <span className={cn("text-[10px] truncate w-full text-center", currentMode === mode ? "text-primary font-semibold" : "text-muted-foreground")}>
              {t(nameKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}