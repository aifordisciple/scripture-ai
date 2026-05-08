// components/bible/ShareCard.tsx
"use client";

import { useEffect, useState } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Image as ImageIcon, ChevronLeft, X, Settings2, Sparkles, Bookmark, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/ui/toast';
import { cardConfigToSatoriRequest } from "@/lib/card-renderer";
import { DEFAULT_CARD_CONFIG, formatVerseRange } from "@/lib/card-presets";

// 子组件
import { CardPreview } from "./share-card/CardPreview";
import { ResolutionPicker } from "./share-card/ResolutionPicker";
import { LayoutPicker } from "./share-card/LayoutPicker";
import { BackgroundPicker } from "./share-card/BackgroundPicker";
import { TextStylePanel } from "./share-card/TextStylePanel";
import { AIGeneratePanel } from "./share-card/AIGeneratePanel";
import { QRWatermark } from "./share-card/QRWatermark";
import { ShareActions, ResultActions } from "./share-card/ShareActions";
import { TemplatePanel } from "./share-card/TemplatePanel";
import { HistoryPanel } from "./share-card/HistoryPanel";

export function ShareCard() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const {
    isShareOpen, closeShareModal, shareData, bibleVersion,
    cardConfig, updateCardConfig, initCardConfig, changeLayoutMode,
    selectBgImage, selectBgGradient, uploadBgImage,
    cardGenerating, setCardGenerating,
    cardResultImage, setCardResultImage,
    cardStep, setCardStep,
    addCardHistory,
  } = useBibleStore();

  // 初始化：打开弹窗时加载经文内容
  useEffect(() => {
    if (isShareOpen && shareData) {
      initCardConfig(shareData.book, shareData.chapter, shareData.verses);

      async function loadVerses() {
        try {
          const res = await fetch(`/api/bible?book=${shareData?.book}&chapter=${shareData?.chapter}`);
          const json = await res.json();
          const verses = json.data.filter((v: any) => shareData?.verses.includes(v.verse) && v.version === (bibleVersion || 'CUV'));
          const verseContent = verses.map((v: any) => v.content);
          const bookName = verses.length > 0 && verses[0].bookName ? verses[0].bookName : shareData?.book;

          updateCardConfig({
            verseContent,
            bookName,
            verseRange: formatVerseRange(shareData?.verses || []),
          });
        } catch (e) {
          console.error(e);
        }
      }
      loadVerses();
    }
  }, [isShareOpen, shareData]);

  // 生成图片（服务端渲染）
  const generateImage = async () => {
    setCardGenerating(true);
    try {
      const request = cardConfigToSatoriRequest(cardConfig);
      const res = await fetch('/api/card-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Generation failed');
      }

      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      setCardResultImage(dataUrl);
      setCardStep('result');

      // 记录到历史
      addCardHistory({
        id: `hist-${Date.now()}`,
        config: { ...cardConfig } as unknown as Record<string, unknown>,
        resolution: `${cardConfig.width}x${cardConfig.height}`,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Generate failed:", e);
      addToast({ type: 'error', message: t('shareCard.generateFailed') });
    } finally {
      setCardGenerating(false);
    }
  };

  if (!isShareOpen || !shareData) return null;

  return (
    <Dialog open={isShareOpen} onOpenChange={(open) => !open && closeShareModal()}>
      <DialogContent className="sm:max-w-5xl bg-card dark:bg-card border-none p-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[700px]">

        {/* --- 结果页 --- */}
        {cardStep === 'result' && cardResultImage && (
          <div className="absolute inset-0 z-50 bg-card flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-10">
            <div className="w-full max-w-sm flex flex-col h-full relative">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => setCardStep('edit')}>
                  <ChevronLeft className="w-5 h-5 mr-1" /> {t('shareCard.backToEdit')}
                </Button>
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" onClick={closeShareModal}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 flex items-center justify-center overflow-hidden py-4">
                <img
                  src={cardResultImage}
                  alt="Result"
                  className="max-h-full w-auto object-contain rounded-lg border border-white/10"
                />
              </div>

              <ResultActions onClose={closeShareModal} onBack={() => setCardStep('edit')} />
            </div>
          </div>
        )}

        {/* --- 编辑页 --- */}
        <div className={cn("flex-1 flex flex-col md:flex-row overflow-hidden relative", cardStep === 'result' ? 'invisible' : 'visible')}>

          {/* 左侧：预览 */}
          <div className="bg-secondary dark:bg-black/50 items-center justify-center p-6 overflow-auto flex-1 flex">
            <CardPreview config={cardConfig} />
          </div>

          {/* 右侧：设置 */}
          <div className="bg-card dark:bg-card flex-col transition-all duration-300 w-full md:w-96 md:border-l dark:border-border flex h-[50vh] md:h-full">
            <DialogHeader className="p-3 border-b dark:border-border shrink-0">
              <DialogTitle className="flex items-center gap-2 text-foreground dark:text-foreground text-sm md:text-base">
                <ImageIcon className="w-5 h-5" /> {t('shareCard.customize')}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <Tabs defaultValue="layout" className="w-full">
                <TabsList className="w-full mb-4 grid grid-cols-4">
                  <TabsTrigger value="layout">{t('shareCard.tabLayout')}</TabsTrigger>
                  <TabsTrigger value="bg">{t('shareCard.tabBg')}</TabsTrigger>
                  <TabsTrigger value="text">{t('shareCard.tabText')}</TabsTrigger>
                  <TabsTrigger value="more">{t('shareCard.tabMore')}</TabsTrigger>
                </TabsList>

                {/* 布局 + 分辨率 */}
                <TabsContent value="layout" className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t('shareCard.resolutionLabel')}</label>
                    <ResolutionPicker
                      width={cardConfig.width}
                      height={cardConfig.height}
                      presetId={cardConfig.resolutionPresetId}
                      onResolutionChange={(w, h, presetId) => updateCardConfig({ width: w, height: h, resolutionPresetId: presetId })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t('shareCard.layoutLabel')}</label>
                    <LayoutPicker
                      currentMode={cardConfig.layoutMode}
                      onModeChange={changeLayoutMode}
                    />
                  </div>
                </TabsContent>

                {/* 背景 */}
                <TabsContent value="bg" className="space-y-4">
                  <BackgroundPicker
                    bgImage={cardConfig.bgImage}
                    selectedBgUrl={cardConfig.selectedBgUrl}
                    bgGradient={cardConfig.bgGradient}
                    layoutMode={cardConfig.layoutMode}
                    onBgImageSelect={selectBgImage}
                    onBgGradientSelect={selectBgGradient}
                    onBgImageUpload={uploadBgImage}
                  />
                </TabsContent>

                {/* 文字 */}
                <TabsContent value="text" className="space-y-4">
                  <TextStylePanel
                    fontFamily={cardConfig.fontFamily}
                    fontSize={cardConfig.fontSize}
                    lineHeight={cardConfig.lineHeight}
                    textAlign={cardConfig.textAlign}
                    textColor={cardConfig.textColor}
                    infoColor={cardConfig.infoColor}
                    onFontFamilyChange={(f) => updateCardConfig({ fontFamily: f })}
                    onFontSizeChange={(s) => updateCardConfig({ fontSize: s })}
                    onLineHeightChange={(h) => updateCardConfig({ lineHeight: h })}
                    onTextAlignChange={(a) => updateCardConfig({ textAlign: a })}
                    onTextColorChange={(c) => updateCardConfig({ textColor: c })}
                    onInfoColorChange={(c) => updateCardConfig({ infoColor: c })}
                  />
                </TabsContent>

                {/* 更多：AI + QR + 模板 + 历史 */}
                <TabsContent value="more" className="space-y-5">
                  {/* AI 一键生成 */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {t('shareCard.aiSection')}
                    </label>
                    <AIGeneratePanel verseContent={cardConfig.verseContent} bookName={cardConfig.bookName} />
                  </div>

                  {/* QR 码水印 */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t('shareCard.qrSection')}</label>
                    <QRWatermark
                      qrCodePosition={cardConfig.qrCodePosition}
                      qrCodeUrl={cardConfig.qrCodeUrl}
                      onPositionChange={(p) => updateCardConfig({ qrCodePosition: p })}
                      onUrlChange={(u) => updateCardConfig({ qrCodeUrl: u })}
                      bookName={cardConfig.bookName}
                      chapter={cardConfig.chapter}
                      verseRange={cardConfig.verseRange}
                    />
                  </div>

                  {/* 模板收藏 */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1">
                      <Bookmark className="w-3 h-3" /> {t('shareCard.templateSection')}
                    </label>
                    <TemplatePanel />
                  </div>

                  {/* 历史记录 */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t('shareCard.historySection')}
                    </label>
                    <HistoryPanel />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* 生成按钮 */}
            <div className="p-4 border-t dark:border-border bg-secondary dark:bg-card shrink-0">
              <Button
                onClick={generateImage}
                disabled={cardGenerating || cardConfig.verseContent.length === 0}
                className="w-full bg-primary hover:bg-apple-focus text-white active:scale-95 rounded-full"
              >
                {cardGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                {cardGenerating ? t('shareCard.rendering') : t('shareCard.generateBtn')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}