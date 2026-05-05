"use client";

import { useEffect, useRef } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, CheckCircle2, PartyPopper, Users } from "lucide-react";
import { BIBLE_BOOKS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";

export function GroupPlanDailyFlow() {
  const {
    groupPlanContext: ctx,
    advanceGroupPlanStep,
    tabs,
    addTab
  } = useBibleStore();
  const { t } = useTranslation();

  const step = ctx?.steps[ctx.stepIndex];
  // 使用 ref 跟踪已处理的 stepIndex，避免在 tabs 更新后重复触发 useEffect
  const prevStepIndexRef = useRef<number | null>(null);

  // 同步 Reader Tab：当步骤进入经文阅读时，自动切换后台的阅读页面
  useEffect(() => {
    if (!ctx || !step || step.type !== 'reading' || !step.book || !step.chapter) {
      return;
    }

    // 避免重复处理同一个 stepIndex
    if (prevStepIndexRef.current === ctx.stepIndex) {
      return;
    }
    prevStepIndexRef.current = ctx.stepIndex;

    const readTab = tabs.find(t => t.type === 'read');
    if (readTab) {
      useBibleStore.setState((state) => ({
        tabs: state.tabs.map(t => t.id === readTab.id ? { ...t, book: step.book, chapter: step.chapter!.toString() } : t),
        activeTabId: readTab.id
      }));
    } else {
      addTab({ type: 'read', book: step.book, chapter: step.chapter.toString() });
    }
  }, [ctx?.stepIndex, step, addTab, tabs]);

  if (!ctx || !step) return null;

  // 统一的"下一步"处理逻辑
  const handleNext = () => advanceGroupPlanStep();

  // 视图 A：全屏灵修导读
  if (step.type === 'devotional') {
    return (
      <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-md flex flex-col pt-[10vh] animate-in fade-in duration-300">
        <div className="max-w-2xl mx-auto w-full px-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-8 opacity-60">
            <Users className="w-5 h-5 text-primary" />
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              {t('plan.dailyDevotionalWithPlan', { planName: ctx.planName, day: ctx.day })}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed font-serif whitespace-pre-wrap animate-in slide-in-from-bottom-4 duration-700">
              {step.content || t('plan.devotionalDefault')}
            </p>
          </div>
          <div className="pb-12 pt-6 bg-gradient-to-t from-background via-background to-transparent sticky bottom-0">
            <Button
              onClick={handleNext}
              className="w-full h-14 rounded-lg bg-primary hover:bg-apple-focus text-white font-semibold text-lg active:scale-95"
            >
              {t('plan.readTodayScripture')} <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 视图 B：经文阅读时的底部悬浮导航条
  if (step.type === 'reading') {
    const bookName = BIBLE_BOOKS.find(b => b.id === step.book)?.name || step.book;

    // 动态计算当天的经文阅读进度
    const readingSteps = ctx.steps.filter((s) => s.type === 'reading');
    const totalReadings = readingSteps.length;
    const currentReadingIndex = readingSteps.findIndex((s) => s.taskId === step.taskId) + 1;

    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md animate-in slide-in-from-bottom-8 duration-500">
        <div className="bg-card/90 backdrop-blur-xl p-4 rounded-3xl border border-border dark:border-border flex items-center justify-between">
          <div className="flex flex-col pl-2">
            <span className="text-[10px] text-primary dark:text-primary font-semibold tracking-widest uppercase mb-0.5 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {t('plan.groupReading')}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {bookName} {t('plan.chapterNum', { chapter: step.chapter ?? '' })}
            </span>
            <span className="text-xs text-muted-foreground mt-1">{t('plan.readingProgress', { current: currentReadingIndex, total: totalReadings || 1 })}</span>
          </div>
          <Button
            onClick={handleNext}
            className="rounded-full bg-primary hover:bg-apple-focus text-white font-semibold px-5 active:scale-95"
          >
            {t('plan.completeAndContinue')} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // 视图 C：全屏撒花完成界面
  if (step.type === 'completion') {
    return (
      <div className="fixed inset-0 z-[60] bg-primary/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-500">
        <div className="bg-card p-8 rounded-[2rem] max-w-sm w-full text-center relative overflow-hidden border border-border dark:border-border">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <PartyPopper className="absolute -top-4 -right-4 w-16 h-16 text-yellow-400 opacity-20" />
          <PartyPopper className="absolute -bottom-4 -left-4 w-16 h-16 text-yellow-400 opacity-20 transform scale-x-[-1]" />

          <h2 className="text-2xl font-semibold mb-2 text-foreground tracking-tight">{t('plan.todayTaskComplete')}</h2>
          <p className="text-muted-foreground mb-4">
            {t('plan.completionMessage', { planTitle: ctx.planName, day: ctx.day })}
          </p>
          <p className="text-sm text-primary dark:text-primary mb-8 flex items-center justify-center gap-1">
            <Users className="w-4 h-4" />
            {t('plan.syncedToGroupLeaderboard')}
          </p>
          <Button
            onClick={handleNext}
            className="w-full h-14 rounded-lg bg-primary hover:bg-apple-focus text-white font-semibold text-lg active:scale-95"
          >
            {t('plan.endCheckin')}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
