"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { BIBLE_PLANS } from "@/lib/plans";
import { BIBLE_BOOKS } from "@/lib/constants";
import { Calendar, CheckCircle2, Circle, BookOpen, Trash2, ArrowRight, Target, PlayCircle, Sparkles, Loader2, Medal, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PlanTab() {
  const router = useRouter();
  const {
    activePlans, startPlan, markDayCompleted, quitPlan, tabs, addTab, setActiveTab,
    customPlans, addCustomPlan, deleteCustomPlan
  } = useBibleStore();

  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewingPlanId, setViewingPlanId] = useState<string | null>(null);

  const allPlans = useMemo(() => [...(customPlans || []), ...BIBLE_PLANS], [customPlans]);

  const handleJump = (bookId: string, chapter: number) => {
    const readTab = tabs.find(t => t.type === 'read');
    if (readTab) {
       setActiveTab(readTab.id);
       useBibleStore.setState((state) => ({
           tabs: state.tabs.map(t => t.id === readTab.id ? { ...t, book: bookId, chapter: chapter.toString() } : t)
       }));
    } else {
       addTab({ type: 'read', book: bookId, chapter: chapter.toString() });
    }
    useBibleStore.getState().setScrollToVerse(null);
    router.push(`/?book=${bookId}&chapter=${chapter}`);
  };

  const handleGeneratePlan = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (data.plan) {
        addCustomPlan(data.plan);
        setAiPrompt("");
      } else alert("生成失败，请稍后重试");
    } catch(e) { alert("网络错误"); }
    finally { setIsGenerating(false); }
  };

  const getBookName = (id: string) => BIBLE_BOOKS.find(b => b.id === id)?.name || id;

  // -------------------------
  // 视图 2：专属计划打卡面板
  // -------------------------
  if (viewingPlanId) {
    const activeData = activePlans.find(p => p.planId === viewingPlanId);
    const planDetails = allPlans.find(p => p.id === viewingPlanId);

    if (!activeData || !planDetails) {
        setViewingPlanId(null);
        return null;
    }

    const completedCount = activeData.completedDays.length;
    const totalDays = planDetails.durationDays;
    const progressPercent = Math.round((completedCount / totalDays) * 100);
    const isTotallyCompleted = completedCount >= totalDays;

    return (
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-32 min-h-screen">
        <button onClick={() => setViewingPlanId(null)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm font-medium">
          <ChevronLeft className="w-4 h-4" /> 返回计划大厅
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
             <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm uppercase tracking-widest">正在进行</span>
             </div>
             <h1 className="text-2xl md:text-3xl font-bold text-foreground font-serif flex items-center gap-3">
                {planDetails.title}
                {isTotallyCompleted && <Medal className="w-8 h-8 text-yellow-500 drop-shadow-md animate-bounce" />}
             </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => {
              if (confirm("确定要放弃当前的读经计划吗？这会清除此计划的打卡记录。")) {
                  quitPlan(viewingPlanId);
                  setViewingPlanId(null);
              }
          }} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full self-start md:self-auto">
             <Trash2 className="w-4 h-4 mr-1.5" /> 放弃计划
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border dark:border-slate-800 shadow-sm mb-8">
           <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-slate-600 dark:text-slate-300">整体进度</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{progressPercent}% ({completedCount}/{totalDays})</span>
           </div>
           <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
           </div>
        </div>

        <div className="space-y-4">
          {planDetails.tasks.map((task: any) => {
             const isCompleted = activeData.completedDays.includes(task.day);
             return (
               <div key={task.day} className={cn(
                  "flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300",
                  isCompleted ? "bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800/50 opacity-60" : "bg-white border-indigo-100 dark:bg-slate-900 dark:border-indigo-900/30 shadow-sm"
               )}>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4 md:w-32 shrink-0">
                       <button onClick={() => markDayCompleted(viewingPlanId, task.day)} className="shrink-0 hover:scale-110 transition-transform focus:outline-none">
                         {isCompleted ? <CheckCircle2 className="w-7 h-7 text-indigo-500" /> : <Circle className="w-7 h-7 text-slate-300 dark:text-slate-600 hover:text-indigo-400" />}
                       </button>
                       <span className="font-bold text-lg text-slate-700 dark:text-slate-200">第 {task.day} 天</span>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2">
                       {task.readings.map((reading: any, idx: number) => (
                          <button key={idx} onClick={() => handleJump(reading.book, reading.chapter)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border", isCompleted ? "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-200/50" : "bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/50 dark:text-indigo-300 dark:hover:bg-indigo-900/40")}>
                             <BookOpen className="w-3.5 h-3.5" />{getBookName(reading.book)} {reading.chapter}<ArrowRight className="w-3 h-3 opacity-50 ml-1" />
                          </button>
                       ))}
                    </div>
                  </div>
                  {task.devotional && (
                     <div className="mt-1 md:ml-[9.5rem] bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-100/60 dark:border-indigo-800/30">
                       <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-serif">{task.devotional}</p>
                     </div>
                  )}
               </div>
             );
          })}
        </div>
      </div>
    );
  }

  // -------------------------
  // 视图 1：计划大厅 (首页)
  // -------------------------
  const activePlanIds = activePlans.map(p => p.planId);
  const myPlans = allPlans.filter(p => activePlanIds.includes(p.id));
  const discoverPlans = allPlans.filter(p => !activePlanIds.includes(p.id));

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-32 min-h-screen">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b dark:border-slate-800">
        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
           <Calendar className="w-6 h-6" />
        </div>
        <div>
           <h1 className="text-2xl font-bold text-foreground tracking-tight">读经计划</h1>
           <p className="text-sm text-muted-foreground mt-1">安排每日灵修，你可以同时进行多个计划。</p>
        </div>
      </div>

      {/* 我的计划 (正在进行) */}
      {myPlans.length > 0 && (
        <div className="mb-12">
          <h2 className="text-lg font-bold text-foreground mb-4">我的计划 ({myPlans.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myPlans.map((plan) => {
              const activeData = activePlans.find(p => p.planId === plan.id)!;
              const isTotallyCompleted = activeData.completedDays.length >= plan.durationDays;
              const progressPercent = Math.round((activeData.completedDays.length / plan.durationDays) * 100);

              return (
                <div key={plan.id} className="relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-indigo-100 dark:border-indigo-900 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden" onClick={() => setViewingPlanId(plan.id)}>
                   {/* 荣誉奖牌 */}
                   {isTotallyCompleted && (
                     <div className="absolute -top-3 -right-3 bg-gradient-to-br from-yellow-300 to-yellow-500 p-4 rounded-full shadow-lg border-4 border-white dark:border-slate-900 transform rotate-12">
                        <Medal className="w-7 h-7 text-white" />
                     </div>
                   )}
                   <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 font-serif mb-1 pr-10">{plan.title}</h3>
                   <div className="flex justify-between items-center mt-auto pt-6">
                      <div className="flex-1 mr-4">
                        <div className="flex justify-between text-xs mb-1 font-medium text-slate-500"><span className="text-indigo-600">{progressPercent}%</span><span>{plan.durationDays} 天</span></div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${progressPercent}%` }}/></div>
                      </div>
                      <Button variant={isTotallyCompleted ? "secondary" : "default"} size="sm" className="rounded-full">
                         {isTotallyCompleted ? "回顾" : "继续打卡"}
                      </Button>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI 定制区 */}
      <div className="mb-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 md:p-8 shadow-lg text-white">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-3"><Sparkles className="w-6 h-6 text-yellow-300" /> AI 专属计划定制</h2>
        <p className="text-indigo-100 text-sm mb-5">告诉 AI 你的困惑或想了解的主题，为你生成专属灵修旅程。</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="输入你的需求..." disabled={isGenerating} onKeyDown={(e) => e.key === 'Enter' && handleGeneratePlan()} className="flex-1 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          <Button onClick={handleGeneratePlan} disabled={isGenerating || !aiPrompt.trim()} className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl px-8 py-3 h-auto">
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : "立即生成"}
          </Button>
        </div>
      </div>

      {/* 探索计划 */}
      <h2 className="text-lg font-bold text-foreground mb-4">探索更多计划</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {discoverPlans.map((plan) => (
          <div key={plan.id} className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl p-6 border dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative group">
             {plan.id.startsWith('custom-') && (
               <button onClick={(e) => { e.stopPropagation(); deleteCustomPlan(plan.id); }} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
             )}
             <div className="flex items-start justify-between mb-4 pr-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground font-serif">{plan.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                     {plan.tags?.map((tag: string) => <span key={tag} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-[10px] rounded-md font-medium">{tag}</span>)}
                     <span className="text-xs text-muted-foreground ml-1">{plan.durationDays} 天</span>
                  </div>
                </div>
                <Target className="w-8 h-8 text-indigo-100 dark:text-indigo-900/50" />
             </div>
             <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1 line-clamp-3">{plan.description}</p>
             <Button onClick={() => { startPlan(plan.id); setViewingPlanId(plan.id); }} className="w-full gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
               <PlayCircle className="w-4 h-4" /> 开始计划
             </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
