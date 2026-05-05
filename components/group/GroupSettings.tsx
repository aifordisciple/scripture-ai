"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Palette, Image, Type, Loader2, Save, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/ui/toast';

interface GroupSettingsProps {
  churchId: string;
  isOwner: boolean;
  currentSettings?: {
    themeColor?: string;
    logoUrl?: string;
    fontFamily?: string;
  };
  onSettingsUpdate?: (settings: any) => void;
}

const PRESET_COLORS = [
  { nameKey: "colorBlue", value: "#0066cc" },
  { nameKey: "colorPurple", value: "#7c3aed" },
  { nameKey: "colorPink", value: "#ec4899" },
  { nameKey: "colorRed", value: "#ef4444" },
  { nameKey: "colorOrange", value: "#f97316" },
  { nameKey: "colorYellow", value: "#eab308" },
  { nameKey: "colorGreen", value: "#22c55e" },
  { nameKey: "colorCyan", value: "#06b6d4" },
  { nameKey: "colorBlue", value: "#3b82f6" },
  { nameKey: "colorGray", value: "#6b7280" },
];

const FONT_OPTIONS = [
  { nameKey: "fontSerif", value: "serif" },
  { nameKey: "fontSansSerif", value: "sans-serif" },
  { nameKey: "fontMonospace", value: "monospace" },
];

export function GroupSettings({
  churchId,
  isOwner,
  currentSettings,
  onSettingsUpdate
}: GroupSettingsProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [themeColor, setThemeColor] = useState(currentSettings?.themeColor || "#0066cc");
  const [logoUrl, setLogoUrl] = useState(currentSettings?.logoUrl || "");
  const [fontFamily, setFontFamily] = useState(currentSettings?.fontFamily || "serif");

  useEffect(() => {
    if (currentSettings) {
      setThemeColor(currentSettings.themeColor || "#0066cc");
      setLogoUrl(currentSettings.logoUrl || "");
      setFontFamily(currentSettings.fontFamily || "serif");
    }
  }, [currentSettings]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/church/${churchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateSettings",
          themeColor,
          logoUrl: logoUrl.trim() || null,
          fontFamily
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onSettingsUpdate?.({ themeColor, logoUrl, fontFamily });
        // Delay closing so user can see the success indicator
        setTimeout(() => setOpen(false), 1500);
      } else {
        addToast({ type: 'error', message: data.error || t('group.saveFailed') });
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      addToast({ type: 'error', message: t('group.saveFailedRetry') });
    } finally {
      setSaving(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Palette className="w-5 h-5" />
          {t('group.groupSettings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Theme color preview */}
            <div
              className="w-10 h-10 rounded-lg border-2"
              style={{ backgroundColor: themeColor }}
            />
            <div>
              <div className="font-medium">{t('group.themeColor')}</div>
              <div className="text-sm text-muted-foreground">
                {PRESET_COLORS.find(c => c.value === themeColor) ? t(`group.${PRESET_COLORS.find(c => c.value === themeColor)!.nameKey}`) : t('group.custom')}
              </div>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="active:scale-95">
                {t('common.edit')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('group.groupCustomization')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* Theme Color */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    {t('group.themeColor')}
                  </Label>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setThemeColor(color.value)}
                        className={cn(
                          "w-10 h-10 rounded-lg border-2 transition-colors active:scale-95",
                          themeColor === color.value
                            ? "border-foreground"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={t(`group.${color.nameKey}`)}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('group.custom')}:</span>
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <Input
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-28"
                      placeholder="#0066cc"
                    />
                  </div>
                </div>

                {/* Logo URL */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    {t('group.groupLogo')}
                  </Label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder={t('group.logoUrlPlaceholder')}
                  />
                  {logoUrl && (
                    <div className="mt-2 p-2 bg-muted rounded-lg">
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="w-16 h-16 object-contain mx-auto rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Font Family */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    {t('group.fontStyle')}
                  </Label>
                  <div className="flex gap-2">
                    {FONT_OPTIONS.map((font) => (
                      <Button
                        key={font.value}
                        variant={fontFamily === font.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFontFamily(font.value)}
                        style={{ fontFamily: font.value }}
                        className="active:scale-95"
                      >
                        {t(`group.${font.nameKey}`)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setOpen(false)} className="active:scale-95">
                  {t('common.cancel')}
                </Button>
                <Button onClick={saveSettings} disabled={saving} className="active:scale-95">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : saved ? (
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saved ? t('group.saved') : t('common.save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}