// components/bible/DashboardTab.tsx
"use client";

import { useRouter } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { BibleHeatmap } from "@/components/bible/BibleHeatmap";
import { HomeGroupCard } from "@/components/group/HomeGroupCard";
import { useMemo, useState, useEffect } from "react";
import { Download, Activity, Trash2, CheckSquare, Square, BrainCircuit, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * 仪表盘控制面板 (DashboardTab)
 * * 核心功能说明：
 * 1. 提供 "7d", "30d", "1y" 多维度时间切片。
 * 2. 对接后端聚合 API 渲染 Recharts 的交互式动态趋势图。
 * 3. 将所选范围内的数据导出为标准 TSV (Tab-Separated Values) 格式报表。
 */
export function DashboardTab() {
  const router = useRouter();
  const { 
    highlights, notes, interactions, 
    updateActiveTab, addTab, tabs, setActiveTab,
    clearAllHighlights, clearAllNotes, clearAllInteractions
  } = useBibleStore();
  
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '1y'>('30d');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showClearMenu, setShowClearMenu] = useState(false);
  const [clearOpts, setClearOpts] = useState({ highlights: false, notes: false, interactions: false });

  // 根据过滤参数联动后端聚合服务
  useEffect(() => {
    async function fetchDashboardData() {
        setLoading(true);
        try {
            const res = await fetch(`/api/user/dashboard?range=${timeRange}`);
            const json = await res.json();
            if (json.success) setChartData(json.data.chartData);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    }
    fetchDashboardData();
  }, [timeRange]);

  /**
   * 聚合数据导出程序
   * 将前端渲染的图表结构转化为以制表符分割的 TSV 格式并提供用户下载
   */
  const handleExportTSV = () => {
    if (chartData.length === 0) {
      alert("当前时间范围内没有数据可导出！");
      return;
    }
    const headers = ['日期', 'AI互动频次', '深度标记次数(高亮/笔记)'];
    let tsvContent = headers.join('\t') + '\n';
    
    chartData.forEach(row => {
        tsvContent += [row.date, row.aiChats, row.interactions].join('\t') + '\n';
    });

    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ScriptureAI_Data_Export_${timeRange}.tsv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const executeClear = () => {
    if (clearOpts.highlights) clearAllHighlights();
    if (clearOpts.notes) clearAllNotes();
    if (clearOpts.interactions) clearAllInteractions();
    setShowClearMenu(false);
    setClearOpts({ highlights: false, notes: false, interactions: false });
  };

  const toggleOpt = (key: keyof typeof clearOpts) => {
    setClearOpts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();
    highlights.forEach(h => { map.set(`${h.bookId}-${h.chapter}`, (map.get(`${h.bookId}-${h.chapter}`) || 0) + 1); });
    notes.forEach(n => { map.set(`${n.bookId}-${n.chapter}`, (map.get(`${n.bookId}-${n.chapter}`) || 0) + 2); });
    interactions.forEach(i => { map.set(`${i.bookId}-${i.chapter}`, (map.get(`${i.bookId}-${i.chapter}`) || 0) + i.count); });

    return Array.from(map.entries()).map(([key, weight]) => {
      const [bookId, chapter] = key.split('-');
      return { bookId, chapter: parseInt(chapter), weight };
    });
  }, [highlights, notes, interactions]);

  const handleCellClick = (bookId: string, chapter: number) => {
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

    // 强制修改 URL
    router.push(`/?book=${bookId}&chapter=${chapter}`);
  };

  const totalInteractions = heatmapData.reduce((sum, item) => sum + item.weight, 0);
  const totalAiChats = chartData.reduce((acc, cur) => acc + cur.aiChats, 0);
  const totalHighlights = chartData.reduce((acc, cur) => acc + cur.interactions, 0);

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 relative pb-20">
      
      {showClearMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-sm border dark:border-slate-800">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-500 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5"/> 选择要清空的数据
            </h3>
            <div className="space-y-3 mb-8">
              <button onClick={() => toggleOpt('highlights')} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                 {clearOpts.highlights ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-slate-400" />}
                 <span className="flex-1 text-sm font-medium">清空所有高亮 ({highlights.length})</span>
              </button>
              <button onClick={() => toggleOpt('notes')} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                 {clearOpts.notes ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-slate-400" />}
                 <span className="flex-1 text-sm font-medium">清空所有笔记 ({notes.length})</span>
              </button>
              <button onClick={() => toggleOpt('interactions')} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                 {clearOpts.interactions ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-slate-400" />}
                 <span className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                    清空基础阅读足迹 <br/>
                    <span className="text-[10px] text-slate-400 font-normal">热力图将重置，不影响高亮和笔记</span>
                 </span>
              </button>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowClearMenu(false)} className="rounded-full">取消</Button>
              <Button variant="destructive" disabled={!clearOpts.highlights && !clearOpts.notes && !clearOpts.interactions} onClick={executeClear} className="rounded-full font-bold">
                确认清空
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 小组读经快捷入口 */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> 小组读经
        </h2>
        <HomeGroupCard />
      </div>

      {/* 头部区域：标题与操作盘 */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 mb-8 mt-4 md:mt-8 w-full">
          <div className="w-full lg:w-auto">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 mb-2">
              <Activity className="w-6 h-6 text-indigo-500" /> 数据洞察看板
            </h1>
            <p className="text-sm text-slate-500">动态追踪你的阅读时长、研经足迹与 AI 互动频次。</p>
          </div>
          
          {/* 操作盘：手机端分两行，桌面端在一行 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            {/* 时间跨度控制器 */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto justify-between">
              {[
                { id: '7d', label: '近 7 天' },
                { id: '30d', label: '近 30 天' },
                { id: '1y', label: '近 1 年' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setTimeRange(tab.id as any)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${timeRange === tab.id ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* 功能按钮：强制并列 */}
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-2 rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={handleExportTSV}>
                <Download className="w-4 h-4 shrink-0" /> 导出 TSV
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 sm:flex-none gap-2 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setShowClearMenu(true)}>
                <Trash2 className="w-4 h-4 shrink-0" /> 清空数据
              </Button>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
         <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
             <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl"><BrainCircuit className="w-8 h-8"/></div>
             <div><div className="text-3xl font-black">{totalAiChats}</div><div className="text-sm text-slate-500 font-medium">AI 深度探索次数</div></div>
         </div>
         <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
             <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl"><Activity className="w-8 h-8"/></div>
             <div><div className="text-3xl font-black">{totalHighlights}</div><div className="text-sm text-slate-500 font-medium">经文研读互动数</div></div>
         </div>
      </div>

      {/* 动态趋势图表 */}
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl shadow-sm border dark:border-slate-800 p-6 mb-8">
        <h3 className="text-base font-bold mb-6 flex items-center gap-2">核心交互趋势</h3>
        <div className="h-72 w-full">
            {loading ? (
                <div className="h-full w-full flex items-center justify-center text-slate-400">正在努力加载统计数据...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="aiChats" name="AI 互动数" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAi)" />
                  <Area type="monotone" dataKey="interactions" name="研读记录" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorInteractions)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
        </div>
      </div>

      {/* 原本静态热力图保留在下方即可，作为"全景概览"使用 */}
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl shadow-sm border dark:border-slate-800 p-4 md:p-6 overflow-x-auto">
         <h3 className="text-base font-bold mb-4 flex items-center gap-2">
           <Clock className="w-4 h-4" /> 全年阅读全景
         </h3>
         <BibleHeatmap data={heatmapData} onCellClick={handleCellClick} colorTheme="indigo" />
      </div>
    </div>
  );
}
