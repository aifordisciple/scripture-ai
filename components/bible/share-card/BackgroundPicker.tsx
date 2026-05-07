// components/bible/share-card/BackgroundPicker.tsx
"use client";

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { GRADIENT_PRESETS, UNSPLASH_PRESETS, PICSUM_CATEGORIES, TEXT_COLOR_PRESETS, INFO_COLOR_PRESETS } from '@/lib/card-presets';
import { fetchImageAsBase64 } from '@/lib/card-renderer';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Search, Palette, Info } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface BackgroundPickerProps {
  bgImage: string | null;
  selectedBgUrl: string | null;
  bgGradient: string;
  textColor: string;
  infoColor: string;
  layoutMode: string;
  onBgImageSelect: (base64: string) => void;
  onBgGradientSelect: (gradient: string, textColor: string, infoColor: string) => void;
  onBgImageUpload: (base64: string) => void;
  onTextColorChange: (color: string) => void;
  onInfoColorChange: (color: string) => void;
}

export function BackgroundPicker({
  bgImage, selectedBgUrl, bgGradient, textColor, infoColor, layoutMode,
  onBgImageSelect, onBgGradientSelect, onBgImageUpload,
  onTextColorChange, onInfoColorChange,
}: BackgroundPickerProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainColorRef = useRef<HTMLInputElement>(null);
  const infoColorRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'featured' | 'online' | 'gradient' | 'custom'>('featured');

  const [activeGallery, setActiveGallery] = useState<'picsum' | 'bing' | 'unsplash'>('picsum');

  // 图库搜索状态
  const [picsumPage, setPicsumPage] = useState(1);
  const [picsumImages, setPicsumImages] = useState<{ id: number; author: string; url: string }[]>([]);
  const [picsumLoading, setPicsumLoading] = useState(false);

  const [bingSearchQuery, setBingSearchQuery] = useState('');
  const [bingDailyImages, setBingDailyImages] = useState<{ url: string; title: string }[]>([]);
  const [bingLoading, setBingLoading] = useState(false);

  const [unsplashSearchQuery, setUnsplashSearchQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<{ id: string; url: string; thumb: string }[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);

  // Picsum 加载
  const loadPicsumImages = async (page: number) => {
    setPicsumLoading(true);
    try {
      const res = await fetch(`/api/picsum?page=${page}&limit=12`);
      const data = await res.json();
      if (data.success && data.data) {
        setPicsumImages(page === 1 ? data.data : [...picsumImages, ...data.data]);
        setPicsumPage(page);
      }
    } catch (e) {
      console.error('Picsum load error:', e);
    } finally {
      setPicsumLoading(false);
    }
  };

  // Bing 每日壁纸加载
  const loadBingDaily = async () => {
    setBingLoading(true);
    try {
      const res = await fetch('/api/bing-wallpaper?type=daily');
      const data = await res.json();
      if (data.success && data.data) {
        setBingDailyImages(data.data);
      }
    } catch (e) {
      console.error('Bing load error:', e);
    } finally {
      setBingLoading(false);
    }
  };

  // Bing 搜索
  const searchBing = async () => {
    if (!bingSearchQuery.trim()) return;
    setBingLoading(true);
    try {
      const res = await fetch(`/api/bing-wallpaper?type=search&query=${encodeURIComponent(bingSearchQuery)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setBingDailyImages(data.data);
      }
    } catch (e) {
      console.error('Bing search error:', e);
    } finally {
      setBingLoading(false);
    }
  };

  // Unsplash 搜索
  const searchUnsplash = async () => {
    if (!unsplashSearchQuery.trim()) return;
    setUnsplashLoading(true);
    try {
      const res = await fetch(`/api/unsplash-search?query=${encodeURIComponent(unsplashSearchQuery)}&per_page=12`);
      const data = await res.json();
      if (data.success && data.data) {
        setUnsplashResults(data.data.results || data.data);
      }
    } catch (e) {
      console.error('Unsplash search error:', e);
    } finally {
      setUnsplashLoading(false);
    }
  };

  // 图片选择处理
  const handleImageSelect = async (url: string) => {
    setLoading(true);
    try {
      const base64 = await fetchImageAsBase64(url);
      onBgImageSelect(base64);
    } catch (e) {
      console.error('Image select error:', e);
      addToast({ type: 'error', message: t('shareCard.loadImageFailed') });
    } finally {
      setLoading(false);
    }
  };

  // 文件上传处理
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onBgImageUpload(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 渐变选择处理
  const handleGradientSelect = (preset: typeof GRADIENT_PRESETS[number]) => {
    onBgGradientSelect(preset.bg, preset.text, preset.info);
  };

  return (
    <div className="space-y-4">
      {/* Tab 切换 */}
      <div className="flex gap-1 border-b pb-1">
        {(['featured', 'online', 'gradient', 'custom'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-t transition-colors",
              activeTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(`shareCard.bgTab_${tab}`)}
          </button>
        ))}
      </div>

      {/* 精选美图 */}
      {activeTab === 'featured' && (
        <div className="grid grid-cols-3 gap-2">
          {UNSPLASH_PRESETS.map((url, i) => (
            <button
              key={i}
              onClick={() => handleImageSelect(url)}
              className={cn(
                "w-full aspect-square rounded-lg bg-cover bg-center border-2 hover:border-primary transition-all relative active:scale-95",
                selectedBgUrl === url ? "border-primary ring-2 ring-primary/20" : "border-transparent"
              )}
              style={{ backgroundImage: `url(${url})` }}
            >
              {selectedBgUrl === url && loading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 在线图库 */}
      {activeTab === 'online' && (
        <div className="space-y-3">
          {/* 图库来源 Tab */}
          <div className="flex gap-1">
            {(['picsum', 'bing', 'unsplash'] as const).map((source) => (
              <button
                key={source}
                onClick={() => {
                  setActiveGallery(source);
                  if (source === 'picsum' && picsumImages.length === 0) loadPicsumImages(1);
                  if (source === 'bing' && bingDailyImages.length === 0) loadBingDaily();
                }}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  activeGallery === source ? "text-primary bg-primary/5" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                {t(`shareCard.gallery_${source}`)}
              </button>
            ))}
          </div>

          {/* Picsum */}
          <div className="space-y-2">
            {picsumLoading && <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" /></div>}
            {picsumImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {picsumImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => handleImageSelect(`https://picsum.photos/id/${img.id}/1080/1920`)}
                    className="w-full aspect-square rounded-lg bg-cover bg-center border border-transparent hover:border-primary transition-all active:scale-95"
                    style={{ backgroundImage: `url(https://picsum.photos/id/${img.id}/200/200)` }}
                  />
                ))}
              </div>
            )}
            {picsumImages.length > 0 && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => loadPicsumImages(picsumPage + 1)} disabled={picsumLoading}>
                {t('shareCard.loadMore')}
              </Button>
            )}
          </div>

          {/* Bing */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={bingSearchQuery}
                onChange={(e) => setBingSearchQuery(e.target.value)}
                placeholder={t('shareCard.searchPlaceholder')}
                className="flex-1 px-2 py-1 text-xs border rounded bg-background"
              />
              <Button variant="outline" size="sm" onClick={searchBing} disabled={bingLoading}>
                <Search className="w-3 h-3" />
              </Button>
            </div>
            {bingLoading && <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" /></div>}
            {bingDailyImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {bingDailyImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => handleImageSelect(img.url)}
                    className="w-full aspect-square rounded-lg bg-cover bg-center border border-transparent hover:border-primary transition-all active:scale-95"
                    style={{ backgroundImage: `url(${img.url}&w=200)` }}
                    title={img.title}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Unsplash */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={unsplashSearchQuery}
                onChange={(e) => setUnsplashSearchQuery(e.target.value)}
                placeholder={t('shareCard.searchPlaceholder')}
                className="flex-1 px-2 py-1 text-xs border rounded bg-background"
              />
              <Button variant="outline" size="sm" onClick={searchUnsplash} disabled={unsplashLoading}>
                <Search className="w-3 h-3" />
              </Button>
            </div>
            {unsplashLoading && <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" /></div>}
            {unsplashResults.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {unsplashResults.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => handleImageSelect(img.url)}
                    className="w-full aspect-square rounded-lg bg-cover bg-center border border-transparent hover:border-primary transition-all active:scale-95"
                    style={{ backgroundImage: `url(${img.thumb})` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 渐变 */}
      {activeTab === 'gradient' && (
        <div className="grid grid-cols-4 gap-2">
          {GRADIENT_PRESETS.map((g, i) => (
            <button
              key={i}
              onClick={() => handleGradientSelect(g)}
              className={cn(
                "w-full aspect-square rounded-full border transition-transform active:scale-95",
                bgGradient === g.bg && !bgImage && "ring-2 ring-primary ring-offset-2"
              )}
              style={{ background: g.bg }}
              title={t(g.nameKey)}
            />
          ))}
        </div>
      )}

      {/* 自定义上传 + 颜色 */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t('shareCard.custom')}</label>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" size="sm" className="w-full border-dashed active:scale-95" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> {t('shareCard.uploadImage')}
            </Button>
          </div>

          {/* 文字颜色 */}
          <div className="space-y-3">
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
          <div className="space-y-3 border-t pt-3">
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
      )}
    </div>
  );
}