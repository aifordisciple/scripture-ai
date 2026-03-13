"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { BIBLE_PLANS } from "@/lib/plans";
import { BIBLE_BOOKS } from "@/lib/constants";
import { Calendar, CheckCircle2, Circle, BookOpen, Trash2, ArrowRight, Target, PlayCircle, Sparkles, Loader2, Medal, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PlanTab() {
  const router = useRouter();
  const {
    activePlans, startPlan, toggleTaskCompleted, quitPlan, tabs, addTab, setActiveTab,
    customPlans, addCustomPlan, deleteCustomPlan, catchUpPlan, setReadingPlanContext, generateAiDevotional,
    viewingPlanId, setViewingPlanId, apiConfig // [新增] 取出 apiConfig
  } = useBibleStore();

  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const calculateLogicDay = (startDate: number) => {
    const startMidnight = new Date(startDate).setHours(0,0,0,0);
    const todayMidnight = new Date().setHours(0,0,0,0);
    const diffDays = Math.round((todayMidnight - startMidnight) / 86400000);
    return Math.max(1, diffDays + 1);
  };

  const allPlans = useMemo(() => [...(customPlans || []), ...BIBLE_PLANS], [customPlans]);

  // [新增] 智能全局静默队列：自动把所有天数的导读全部生成出来
  const bgTaskRunning = useRef(false);

  useEffect(() => {
    if (bgTaskRunning.current) return;

    const runQueue = async () => {
      bgTaskRunning.current = true;
      let hasMore = true;

      while (hasMore && bgTaskRunning.current) {
        const state = useBibleStore.getState();
        let targetTask = null;

        // 遍历寻找缺失导读的任务（从第一天开始找，直到找遍整个计划）
        for (const plan of state.activePlans) {
          if (plan.status === 'completed') continue;
          const planDetails = allPlans.find(p => p.id === plan.planId);
          if (!planDetails) continue;

          for (const task of planDetails.tasks) {
             if (task.devotional) continue; // 系统自带了导读
             if (plan.savedDevotionals?.[task.day.toString()]) continue; // 之前已经生成过了

             // 找到了一个缺失导读的"天"，将其作为当前目标
             targetTask = { planId: plan.planId, day: task.day, planTitle: planDetails.title, readings: task.readings };
             break;
          }
          if (targetTask) break; // 每次只锁死一个任务
        }

        if (targetTask) {
          try {
            await state.generateAiDevotional(targetTask.planId, targetTask.day, targetTask.planTitle, targetTask.readings);
            // 成功后，休息 3 秒再生成下一天，绝对安全，防止 AI 接口并发报错
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (error) {
            // 如果遇到网络问题或接口限流，休息 10 秒后自动重试
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        } else {
          hasMore = false; // 太棒了！所有的计划、所有的天数都已经全部生成完毕！
        }
      }
      bgTaskRunning.current = false;
    };

    runQueue();

    return () => {
      bgTaskRunning.current = false; // 如果用户离开此页面，安全中止后台任务
    };
  }, [activePlans, allPlans]);

  const handleJump = (bookId: string, chapter: number) => {
    const readTab = tabs.find(t => t.type === 'read');
    if (readTab) {
       // 先更新 tab 数据，再切换 activeTab
       useBibleStore.setState((state) => ({
           tabs: state.tabs.map(t => t.id === readTab.id ? { ...t, book: bookId, chapter: chapter.toString() } : t)
       }));
       setActiveTab(readTab.id);
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
        body: JSON.stringify({ prompt: aiPrompt, apiConfig }) // [修复] 传递 apiConfig
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

    // 计算当前逻辑天数
    const currentLogicDay = calculateLogicDay(activeData.startDate);

    // 计算完成进度
    const completedDaysCount = Object.keys(activeData.completedTasks).filter(day => {
      const tasks = activeData.completedTasks[day] || [];
      const dayPlan = planDetails.tasks.find((t: any) => t.day === parseInt(day));
      if (!dayPlan) return false;
      const totalTasks = 1 + (dayPlan.readings?.length || 0); // devotional + readings
      return tasks.length >= totalTasks;
    }).length;
    
    const totalDays = planDetails.durationDays;
    const progressPercent = Math.round((completedDaysCount / totalDays) * 100);
    const isTotallyCompleted = completedDaysCount >= totalDays;

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
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{progressPercent}% ({completedDaysCount}/{totalDays})</span>
           </div>
           <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
           </div>
        </div>

        {/* 今日快速操作 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Button 
            className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg gap-2 shadow-lg shadow-indigo-200"
            onClick={() => {
                // 逻辑：构建智能流式阅读步骤
                const day = calculateLogicDay(activeData.startDate);
                const tasks = planDetails.tasks.find((t: any) => t.day === day) || { readings: [] };
                const completed = activeData.completedTasks[day.toString()] || [];
                const savedDevo = activeData.savedDevotionals?.[day.toString()];

                const steps: any[] = [];
                // 1. 检查灵修步骤 (如果未打卡)
                if (!completed.includes('devotional')) {
                    steps.push({ type: 'devotional', taskId: 'devotional', content: tasks.devotional || savedDevo });
                }
                // 2. 检查经文步骤 (过滤出未打卡的章节)
                tasks.readings.forEach((r: any, idx: number) => {
                    if (!completed.includes(`reading-${idx}`)) {
                        steps.push({ type: 'reading', taskId: `reading-${idx}`, book: r.book, chapter: r.chapter });
                    }
                });
                // 3. 收尾撒花步骤
                steps.push({ type: 'completion', taskId: 'completion' });

                if (steps.length > 1) { // >1 因为最后一个总是 completion
                    setReadingPlanContext({
                        planId: viewingPlanId,
                        planTitle: planDetails.title,
                        day,
                        stepIndex: 0,
                        steps
                    });
                } else {
                    alert("今天的任务已经全部完成啦！明天再来吧！");
                }
            }}
          >
            <PlayCircle className="w-6 h-6" /> 继续今日阅读
          </Button>
          
          <Button 
            variant="outline" 
            className="h-14 rounded-2xl border-2 border-indigo-100 text-indigo-600 font-bold px-6"
            onClick={() => {
              catchUpPlan(viewingPlanId);
            }}
          >
            追赶进度
          </Button>
        </div>

        <div className="space-y-4">
           {planDetails.tasks.map((task: any) => {
             const dayKey = task.day.toString();
             const completedTasks = activeData.completedTasks[dayKey] || [];
             const totalTasks = 1 + (task.readings?.length || 0);
             const completedCount = completedTasks.length;
             const isCompleted = completedCount >= totalTasks;

             // [新增] 日期计算与状态判断
             const taskDate = new Date(activeData.startDate);
             taskDate.setHours(0,0,0,0);
             taskDate.setDate(taskDate.getDate() + task.day - 1);
             const isToday = task.day === currentLogicDay;
             const isBehind = !isCompleted && task.day < currentLogicDay;
             const dateStr = `${taskDate.getMonth() + 1}月${taskDate.getDate()}日`;

             return (
               <div key={task.day} className={cn(
                  "flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300",
                  isCompleted ? "bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800/50 opacity-60"
                  : isToday ? "bg-indigo-50/50 border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20"
                  : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm hover:border-indigo-200"
               )}>
                   <div className="flex flex-col md:flex-row md:items-center gap-4">
                     <div className="flex items-center gap-4 md:w-36 shrink-0">
                        <button
                          onClick={() => toggleTaskCompleted(viewingPlanId, task.day, 'devotional')}
                          className="shrink-0 hover:scale-110 transition-transform focus:outline-none"
                        >
                          {completedTasks.includes('devotional') ? <CheckCircle2 className="w-7 h-7 text-indigo-500" /> : <Circle className="w-7 h-7 text-slate-300 dark:text-slate-600 hover:text-indigo-400" />}
                        </button>
                        <div className="flex flex-col">
                           <span className="font-bold text-lg text-slate-700 dark:text-slate-200">第 {task.day} 天</span>
                           <div className="flex items-center gap-1.5 mt-0.5">
                             <span className={cn("text-xs font-medium", isToday ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400")}>
                               {isToday ? "今天" : dateStr}
                             </span>
                             {isBehind && <span className="text-[10px] px-1.5 py-0.5 rounded text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 font-bold whitespace-nowrap">已落后</span>}
                           </div>
                        </div>
                     </div>
                      <div className="flex-1 flex flex-wrap gap-2">
                         {task.readings.map((reading: any, idx: number) => {
                            const taskKey = `reading-${idx}`;
                            const isTaskCompleted = completedTasks.includes(taskKey);
                            return (
                           <div
                             key={idx}
                             className={cn(
                               "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border group",
                               isTaskCompleted
                                 ? "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500"
                                 : "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800/50 dark:text-indigo-300"
                             )}
                           >
                              {/* 1. 独立的圆圈状态切换区 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskCompleted(viewingPlanId, task.day, taskKey);
                                }}
                                className="shrink-0 hover:scale-110 transition-transform focus:outline-none flex items-center justify-center"
                              >
                                {isTaskCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Circle className="w-4 h-4 opacity-40 hover:opacity-100 hover:text-green-500 transition-colors" />
                                )}
                              </button>

                              {/* 2. 独立的经文跳转区 */}
                              <button
                                onClick={() => {
                                  // 逻辑修复：只有在未读时，点击跳转才自动打卡；如果已读，点击只跳转不取消
                                  if (!isTaskCompleted) {
                                    toggleTaskCompleted(viewingPlanId, task.day, taskKey);
                                  }
                                  handleJump(reading.book, reading.chapter);
                                }}
                                className="flex items-center hover:opacity-70 transition-opacity"
                              >
                                {getBookName(reading.book)} {reading.chapter}
                                <ArrowRight className="w-3 h-3 opacity-50 ml-1 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                           </div>
                          )})}
                     </div>
                    </div>
                     {/* 下半部分：动态 AI 导读渲染 */}
                     {(task.devotional || activeData.savedDevotionals?.[task.day]) && (
                        <div className="mt-1 md:ml-[9.5rem] bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-100/60 dark:border-indigo-800/30 relative">
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-serif whitespace-pre-wrap">
                            {task.devotional || activeData.savedDevotionals?.[task.day]}
                          </p>
                           {/* AI 生成标记 */}
                           {!task.devotional && <Sparkles className="w-4 h-4 text-indigo-400 absolute top-2 right-2 opacity-30" />}
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
  const inProgressPlans = activePlans.filter(p => p.status !== 'completed').map(p => allPlans.find(a => a.id === p.planId)).filter(Boolean);
  const archivedPlans = activePlans.filter(p => p.status === 'completed').map(p => allPlans.find(a => a.id === p.planId)).filter(Boolean);
  const discoverPlans = allPlans.filter(p => !activePlans.some(active => active.planId === p.id));

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
      {inProgressPlans.length > 0 && (
        <div className="mb-12">
          <h2 className="text-lg font-bold text-foreground mb-4">我的计划 ({inProgressPlans.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inProgressPlans.map((plan) => {
              const activeData = activePlans.find(p => p.planId === plan.id)!;
              const completedDaysCount = Object.keys(activeData.completedTasks).filter(day => {
                const tasks = activeData.completedTasks[day] || [];
                const dayPlan = plan.tasks.find((t: any) => t.day === parseInt(day));
                if (!dayPlan) return false;
                const totalTasks = 1 + (dayPlan.readings?.length || 0);
                return tasks.length >= totalTasks;
              }).length;
              const progressPercent = Math.round((completedDaysCount / plan.durationDays) * 100);
              const isTotallyCompleted = completedDaysCount >= plan.durationDays;

              return (
                <div key={plan.id} className="relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-indigo-100 dark:border-indigo-900 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group" onClick={() => setViewingPlanId(plan.id)}>
                   {/* 自定义计划删除按钮 */}
                   {plan.id.startsWith('custom-') && (
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         if (confirm('确定要删除此计划吗？这将同时清除所有打卡记录。')) {
                           deleteCustomPlan(plan.id);
                         }
                       }}
                       className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   )}
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
                       <Button
                          variant={isTotallyCompleted ? "secondary" : "default"}
                          size="sm"
                          className="rounded-full"
                          onClick={(e) => {
                              if (isTotallyCompleted) {
                                 e.stopPropagation();
                                 useBibleStore.getState().archivePlan(plan!.id);
                              }
                          }}
                       >
                          {isTotallyCompleted ? "归档至荣誉墙" : "继续打卡"}
                       </Button>
                   </div>
                </div>
              );
            })}
          </div>
        </div>
       )}

      {/* 荣誉墙 (已完成的计划) */}
      {archivedPlans.length > 0 && (
        <div className="mb-12">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Medal className="w-5 h-5 text-yellow-500" /> 荣誉墙 ({archivedPlans.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {archivedPlans.map((plan) => (
              <div
                key={plan!.id}
                className="relative flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 opacity-80 hover:opacity-100 transition-opacity cursor-pointer group"
                onClick={() => setViewingPlanId(plan!.id)}
              >
                 {/* 自定义计划删除按钮 */}
                 {plan!.id.startsWith('custom-') && (
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       if (confirm('确定要删除此计划吗？')) {
                         deleteCustomPlan(plan!.id);
                       }
                     }}
                     className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                 )}
                 <Medal className="w-10 h-10 text-yellow-400 mb-2 drop-shadow-sm" />
                 <h3 className="text-sm font-bold text-center font-serif text-slate-700 dark:text-slate-300 line-clamp-2 leading-snug">
                   {plan!.title}
                 </h3>
                 <span className="text-[10px] text-muted-foreground mt-2 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">已完成</span>
              </div>
            ))}
          </div>
        </div>
      )}

{/* AI 定制区 */}
      <div className="mb-10 relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-[2rem] p-6 md:p-8 shadow-2xl border border-blue-400/30">
        
        {/* 装饰性背景光晕 (增加蓝宝石的通透折射感) */}
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-cyan-300/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-indigo-300/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-black flex items-center gap-3 mb-3 text-white tracking-tight">
            <div className="p-2 bg-white/20 rounded-xl border border-white/30 backdrop-blur-sm shadow-inner">
               <Sparkles className="w-5 h-5 text-cyan-100" /> 
            </div>
            AI 专属灵修定制
          </h2>
          <p className="text-blue-50/90 text-sm md:text-base mb-8 max-w-2xl leading-relaxed font-medium">
            告诉 AI 你目前正面临的挑战、想深入了解的主题，或是心中的困惑。它将为你量身打造一段专属的读经旅程。
          </p>
          
          {/* 输入框与按钮的包裹层 (高透玻璃态) */}
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex flex-col sm:flex-row gap-3 shadow-inner">
            <input 
              value={aiPrompt} 
              onChange={e => setAiPrompt(e.target.value)} 
              placeholder="例如：最近工作压力很大，总是感到焦虑..." 
              disabled={isGenerating} 
              onKeyDown={(e) => e.key === 'Enter' && handleGeneratePlan()} 
              // 保持纯白输入框的超高辨识度
              className="flex-1 bg-white dark:bg-slate-800 rounded-xl px-5 py-4 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 text-base shadow-sm transition-all" 
            />
            <Button 
              onClick={handleGeneratePlan} 
              disabled={isGenerating || !aiPrompt.trim()} 
              // 按钮改为白底蓝字，与蓝宝石背景形成清爽的强对比
              className="bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl px-8 py-4 h-auto shadow-lg shadow-blue-900/20 transition-all sm:w-auto w-full group border border-white"
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-500" /> 正在定制...</>
              ) : (
                <>立即生成 <Sparkles className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity text-blue-500" /></>
              )}
            </Button>
          </div>
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
