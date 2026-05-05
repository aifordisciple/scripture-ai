// components/bible/DashboardTab.tsx
"use client";

import { useRouter } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { BibleHeatmap } from "@/components/bible/BibleHeatmap";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Download, Activity, Trash2, CheckSquare, Square, BrainCircuit, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/ui/toast';

/**
 * 仪表盘控制面板 (DashboardTab)
 * * 核心功能说明：
 * 1. 提供 "7d", "30d", "1y" 多维度时间切片。
 * 2. 对接后端聚合 API 渲染 Recharts 的交互式动态趋势图。
 * 3. 将所选范围内的数据导出为标准 TSV (Tab-Separated Values) 格式报表。
 * 4. 详细阅读统计与热力图全景概览。
 */
export function DashboardTab() {
  const router = useRouter();
  const { t } = useTranslation();

  // 读取 CSS 变量获取主题色，确保图表跟随暗色/亮色模式
  const getThemeColor = useCallback((varName: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return value || fallback;
  }, []);

  // 图表主色（从 CSS 变量读取）
  const chartColor1 = getThemeColor('--chart-1', '#0066cc'); // action blue
  const chartColor2 = getThemeColor('--chart-2', '#0071e3'); // blue
  const chartGridColor = getThemeColor('--border', '#e0e0e0');
  const chartTickColor = getThemeColor('--muted-foreground', '#7a7a7a');
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

  const { addToast } = useToast();

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
      addToast({ type: 'warning', message: t('bible.noDataToExport') });
      return;
    }
    const headers = [t('bible.tsvHeaderDate'), t('bible.tsvHeaderAiChats'), t('bible.tsvHeaderInteractions')];
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
          <div className="bg-card dark:bg-card p-6 rounded-lg w-full max-w-sm border dark:border-border">
            <h3 className="text-xl font-semibold text-red-600 dark:text-red-500 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5"/> {t('bible.selectDataToClear')}
            </h3>
            <div className="space-y-3 mb-8">
              <button onClick={() => toggleOpt('highlights')} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
                 {clearOpts.highlights ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                 <span className="flex-1 text-sm font-semibold">{t('bible.clearAllHighlights', { count: highlights.length })}</span>
              </button>
              <button onClick={() => toggleOpt('notes')} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
                 {clearOpts.notes ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                 <span className="flex-1 text-sm font-semibold">{t('bible.clearAllNotes', { count: notes.length })}</span>
              </button>
              <button onClick={() => toggleOpt('interactions')} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
                 {clearOpts.interactions ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                 <span className="flex-1 text-sm font-semibold text-foreground dark:text-foreground">
                    {t('bible.clearReadingFootprint')} <br/>
                    <span className="text-[10px] text-muted-foreground font-normal">{t('bible.heatmapResetNote')}</span>
                 </span>
              </button>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowClearMenu(false)} className="rounded-full active:scale-95">{t('common.cancel')}</Button>
              <Button variant="destructive" disabled={!clearOpts.highlights && !clearOpts.notes && !clearOpts.interactions} onClick={executeClear} className="rounded-full font-semibold active:scale-95">
                {t('bible.confirmClear')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 头部区域：标题与操作盘 */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 mb-8 mt-4 md:mt-8 w-full">
          <div className="w-full lg:w-auto">
            <h1 className="text-2xl md:text-3xl font-semibold flex items-center gap-2 mb-2">
              <Activity className="w-6 h-6 text-primary" /> {t('bible.dashboardTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('bible.dashboardSubtitle')}</p>
          </div>
          
          {/* 操作盘：手机端分两行，桌面端在一行 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            {/* 时间跨度控制器 */}
            <div className="flex bg-secondary dark:bg-apple-tile3 p-1 rounded-lg w-full sm:w-auto justify-between">
              {[
                { id: '7d', label: t('bible.last7days') },
                { id: '30d', label: t('bible.last30days') },
                { id: '1y', label: t('bible.last1year') }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setTimeRange(tab.id as any)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${timeRange === tab.id ? 'bg-card dark:bg-apple-chip text-primary dark:text-primary' : 'text-muted-foreground hover:text-foreground dark:hover:text-foreground'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* 功能按钮：强制并列 */}
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-2 rounded-full border-primary/20 text-primary hover:bg-primary/5" onClick={handleExportTSV}>
                <Download className="w-4 h-4 shrink-0" /> {t('bible.exportTSV')}
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 sm:flex-none gap-2 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setShowClearMenu(true)}>
                <Trash2 className="w-4 h-4 shrink-0" /> {t('bible.clearData')}
              </Button>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
         <div className="bg-card dark:bg-card border dark:border-border p-6 rounded-lg flex items-center gap-5">
             <div className="p-4 bg-primary/10 text-primary dark:text-primary rounded-lg"><BrainCircuit className="w-8 h-8"/></div>
             <div><div className="text-3xl font-black">{totalAiChats}</div><div className="text-sm text-muted-foreground font-semibold">{t('bible.aiExplorationCount')}</div></div>
         </div>
         <div className="bg-card dark:bg-card border dark:border-border p-6 rounded-lg flex items-center gap-5">
             <div className="p-4 bg-primary/10 text-primary dark:text-primary rounded-lg"><Activity className="w-8 h-8"/></div>
             <div><div className="text-3xl font-black">{totalHighlights}</div><div className="text-sm text-muted-foreground font-semibold">{t('bible.studyInteractionCount')}</div></div>
         </div>
      </div>

      {/* 动态趋势图表 */}
      <div className="bg-card dark:bg-card rounded-lg border dark:border-border p-6 mb-8">
        <h3 className="text-base font-semibold mb-6 flex items-center gap-2">{t('bible.coreTrend')}</h3>
        <div className="h-72 w-full">
            {loading ? (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">{t('bible.loadingStats')}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066cc" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0066cc" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0071e3" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0071e3" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7a7a7a' }} dy={10} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7a7a7a' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="aiChats" name={t('bible.aiInteractionLabel')} stroke="#0066cc" strokeWidth={3} fillOpacity={1} fill="url(#colorAi)" />
                  <Area type="monotone" dataKey="interactions" name={t('bible.studyRecords')} stroke="#0071e3" strokeWidth={2} fillOpacity={1} fill="url(#colorInteractions)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
        </div>
      </div>

      {/* 原本静态热力图保留在下方即可，作为"全景概览"使用 */}
      <div className="bg-card dark:bg-card rounded-lg border dark:border-border p-4 md:p-6 overflow-x-auto">
         <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
           <Clock className="w-4 h-4" /> {t('bible.yearlyOverview')}
         </h3>
         <BibleHeatmap data={heatmapData} onCellClick={handleCellClick} colorTheme="blue" />
      </div>
    </div>
  );
}
