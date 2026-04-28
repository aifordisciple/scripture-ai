// components/pwa/IosInstallGuide.tsx
"use client";

import { Share, Plus, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface IosInstallGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * iOS Safari 安装引导组件
 *
 * 展示如何在 iOS Safari 中添加到主屏幕
 */
export function IosInstallGuide({ open, onOpenChange }: IosInstallGuideProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
        <SheetHeader className="text-center mb-6">
          <SheetTitle className="text-xl">{t('pwa.iosInstallTitle')}</SheetTitle>
          <SheetDescription>
            {t('pwa.iosInstallDesc')}
          </SheetDescription>
        </SheetHeader>

        {/* 步骤引导 */}
        <div className="space-y-6 px-4">
          {/* 步骤 1 */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              1
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">{t('pwa.step1Title')}</p>
              <p className="text-sm text-muted-foreground">
                {t('pwa.step1Desc')}
              </p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg">
                <Share className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">{t('pwa.shareButton')}</span>
              </div>
            </div>
          </div>

          {/* 步骤 2 */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">{t('pwa.step2Title')}</p>
              <p className="text-sm text-muted-foreground">
                {t('pwa.step2Desc')}
              </p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg">
                <Plus className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">{t('pwa.addToHomeScreenOption')}</span>
              </div>
            </div>
          </div>

          {/* 步骤 3 */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              3
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">{t('pwa.step3Title')}</p>
              <p className="text-sm text-muted-foreground">
                {t('pwa.step3Desc')}
              </p>
            </div>
          </div>
        </div>

        {/* 完成按钮 */}
        <div className="mt-8 px-4">
          <Button
            className="w-full rounded-full h-12 text-base"
            onClick={() => onOpenChange(false)}
          >
            {t('pwa.gotIt')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default IosInstallGuide;