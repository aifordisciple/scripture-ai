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
  { name: "靛蓝", value: "#6366f1" },
  { name: "紫色", value: "#8b5cf6" },
  { name: "粉色", value: "#ec4899" },
  { name: "红色", value: "#ef4444" },
  { name: "橙色", value: "#f97316" },
  { name: "黄色", value: "#eab308" },
  { name: "绿色", value: "#22c55e" },
  { name: "青色", value: "#06b6d4" },
  { name: "蓝色", value: "#3b82f6" },
  { name: "灰色", value: "#6b7280" },
];

const FONT_OPTIONS = [
  { name: "衬线体", value: "serif" },
  { name: "无衬线体", value: "sans-serif" },
  { name: "等宽字体", value: "monospace" },
];

export function GroupSettings({
  churchId,
  isOwner,
  currentSettings,
  onSettingsUpdate
}: GroupSettingsProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [themeColor, setThemeColor] = useState(currentSettings?.themeColor || "#6366f1");
  const [logoUrl, setLogoUrl] = useState(currentSettings?.logoUrl || "");
  const [fontFamily, setFontFamily] = useState(currentSettings?.fontFamily || "serif");

  useEffect(() => {
    if (currentSettings) {
      setThemeColor(currentSettings.themeColor || "#6366f1");
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
        alert(data.error || "保存失败");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("保存失败，请稍后重试");
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
          小组设置
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
              <div className="font-medium">主题色</div>
              <div className="text-sm text-muted-foreground">
                {PRESET_COLORS.find(c => c.value === themeColor)?.name || "自定义"}
              </div>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                编辑
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>小组个性化设置</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* Theme Color */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    主题色
                  </Label>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setThemeColor(color.value)}
                        className={cn(
                          "w-10 h-10 rounded-lg border-2 transition-all",
                          themeColor === color.value
                            ? "border-foreground scale-110"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">自定义:</span>
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
                      placeholder="#6366f1"
                    />
                  </div>
                </div>

                {/* Logo URL */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    小组 Logo
                  </Label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Logo 图片 URL (可选)"
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
                    字体样式
                  </Label>
                  <div className="flex gap-2">
                    {FONT_OPTIONS.map((font) => (
                      <Button
                        key={font.value}
                        variant={fontFamily === font.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFontFamily(font.value)}
                        style={{ fontFamily: font.value }}
                      >
                        {font.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  取消
                </Button>
                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : saved ? (
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saved ? "已保存" : "保存"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}