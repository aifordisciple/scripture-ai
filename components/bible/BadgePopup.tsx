"use client";

import { useEffect, useState } from "react";
import { Medal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export function BadgePopup() {
  const [earnedType, setEarnedType] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e: CustomEvent) => setEarnedType(e.detail);
    window.addEventListener('badge-earned', handler as EventListener);
    return () => window.removeEventListener('badge-earned', handler as EventListener);
  }, []);

  if (!earnedType) return null;

  // 勋章名称映射
  const badgeNames: Record<string, string> = {
    STREAK_3: t('bible.badgeStreak3'),
    STREAK_7: t('bible.badgeStreak7'),
    STREAK_30: t('bible.badgeStreak30'),
    STREAK_90: t('bible.badgeStreak90'),
  };

  const badgeName = badgeNames[earnedType] || earnedType;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border-4 border-yellow-400 text-center max-w-sm mx-4 animate-in zoom-in-95 duration-500">
        <div className="relative inline-block mb-4">
          <Medal className="w-20 h-20 text-yellow-500" />
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('bible.badgeEarned')}</h2>
        <p className="text-muted-foreground mb-6">
          {t('bible.badgeUnlocked', { badge: badgeName })}
        </p>
        <Button 
          onClick={() => setEarnedType(null)} 
          className="w-full rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-bold"
        >
          {t('bible.claimReward')}
        </Button>
      </div>
    </div>
  );
}
