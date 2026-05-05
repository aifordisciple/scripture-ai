"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, CheckCircle2, PartyPopper } from "lucide-react";
import { BIBLE_BOOKS } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";

export function PlanDailyFlow() {
  const router = useRouter();
  const {
    readingPlanContext: ctx,
    advancePlanStep,
    activePlans,
    tabs,
    addTab,
    setActiveTab
  } = useBibleStore();
  const { t } = useTranslation();

  const activeData = activePlans.find(p => p.planId === ctx?.planId);
  const step = ctx?.steps[ctx.stepIndex];

  // 1. 同步 Reader Tab：当步骤进入经文阅读时，自动切换后台的阅读页面
  useEffect(() => {
    if (ctx && step?.type === 'reading' && step.book && step.chapter) {
      const readTab = tabs.find(t => t.type === 'read');
      if (readTab) {
        // 先更新 tab 数据，再切换 activeTab
        useBibleStore.setState((state) => ({
          tabs: state.tabs.map(t => t.id === readTab.id ? { ...t, book: step.book, chapter: step.chapter!.toString() } : t)
        }));
        setActiveTab(readTab.id);
      } else {
        addTab({ type: 'read', book: step.book, chapter: step.chapter.toString() });
      }
      // 同步更新 URL，确保 Reader 组件从 searchParams 读取正确的经卷/章节
      router.push(`/?book=${step.book}&chapter=${step.chapter}`);
    }
  }, [ctx?.stepIndex]);

  if (!ctx || !step || !activeData) return null;

  // 统一的"下一步"处理逻辑交给全局 Store 接管
  const handleNext = () => advancePlanStep();

  // 视图 A：全屏灵修导读
  if (step.type === 'devotional') {
     return (
       <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-md flex flex-col pt-[10vh] animate-in fade-in duration-300">
          <div className="max-w-2xl mx-auto w-full px-6 flex-1 flex flex-col">
             <div className="flex items-center gap-2 mb-8 opacity-60">
                <Sparkles className="w-5 h-5 text-[#0066cc]" />
                <span className="text-sm font-semibold uppercase tracking-widest text-[#0066cc]">
                  {t('plan.dailyDevotional', { day: ctx.day })}
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
                  className="w-full h-14 rounded-lg bg-[#0066cc] hover:bg-[#0071e3] text-white font-semibold text-lg active:scale-95"
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

     // [新增] 动态计算当天的经文阅读进度
     const readingSteps = ctx.steps.filter((s: any) => s.type === 'reading');
     const totalReadings = readingSteps.length;
     const currentReadingIndex = readingSteps.findIndex((s: any) => s.taskId === step.taskId) + 1;

     return (
       <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md animate-in slide-in-from-bottom-8 duration-500">
         <div className="bg-white/90 dark:bg-[#272729]/90 backdrop-blur-xl p-4 rounded-lg border border-[#0066cc]/20 flex items-center justify-between">
           <div className="flex flex-col pl-2">
             <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold tracking-widest uppercase mb-0.5">{t('plan.currentlyReading')}</span>
             <span className="text-sm font-semibold text-foreground">
               {bookName} {t('plan.chapterNum', { chapter: step.chapter ?? '' })}
             </span>
             <span className="text-xs text-muted-foreground mt-1">{t('plan.readingProgress', { current: currentReadingIndex, total: totalReadings || 1 })}</span>
           </div>
           <Button
             onClick={handleNext}
             className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-semibold px-5 active:scale-95"
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
       <div className="fixed inset-0 z-[60] bg-[#0066cc]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-500">
          <div className="bg-white dark:bg-[#272729] p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
             <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                <CheckCircle2 className="w-10 h-10" />
             </div>
             <PartyPopper className="absolute -top-4 -right-4 w-16 h-16 text-yellow-400 opacity-20" />
             <PartyPopper className="absolute -bottom-4 -left-4 w-16 h-16 text-yellow-400 opacity-20 transform scale-x-[-1]" />

             <h2 className="text-2xl font-semibold mb-2 text-foreground">{t('plan.todayTaskComplete')}</h2>
             <p className="text-muted-foreground mb-8">
               {t('plan.completionMessage', { planTitle: ctx.planTitle, day: ctx.day })}
             </p>
             <Button
               onClick={handleNext}
               className="w-full h-14 rounded-lg bg-[#0066cc] hover:bg-[#0071e3] text-white font-semibold text-lg active:scale-95"
             >
               {t('plan.endCheckin')}
             </Button>
          </div>
       </div>
     );
  }

  return null;
}
