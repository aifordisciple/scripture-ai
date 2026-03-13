// components/bible/DashboardDialog.tsx
"use client";

import { useBibleStore } from "@/store/useBibleStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BibleHeatmap } from "./BibleHeatmap";
import { useMemo, useState } from "react";
import { Download, Activity, Trash2, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function DashboardDialog() {
  const router = useRouter();
  const { 
    isDashboardOpen, setDashboardOpen, 
    highlights, notes, interactions, 
    updateActiveTab, addTab, tabs, activeTabId, setActiveTab,
    clearAllHighlights, clearAllNotes, clearAllInteractions
  } = useBibleStore();

  // --- 1. 状态区 ---
  // 控制清空确认弹窗的显示
  const [showClearMenu, setShowClearMenu] = useState(false);
  // 控制用户选择了哪些需要清空的数据类型
  const [clearOpts, setClearOpts] = useState({ highlights: false, notes: false, interactions: false });

  // --- 2. 核心逻辑：导出 TSV 功能 ---
  const handleExportTSV = () => {
    // a. 聚合所有可导出数据
    const dataToExport = [
      ...highlights.map(h => ({ 类型: '高亮', 书卷: h.bookId, 章节: h.chapter, 节: h.verse, 内容: `颜色: ${h.color}` })),
      ...notes.map(n => ({ 类型: '笔记', 书卷: n.bookId, 章节: n.chapter, 节: n.verse, 内容: n.content })),
      ...interactions.map(i => ({ 类型: '阅读足迹', 书卷: i.bookId, 章节: i.chapter, 节: '全章', 内容: `累积权重: ${i.count}` }))
    ];

    if (dataToExport.length === 0) {
      alert("目前还没有任何数据可以导出哦！");
      return;
    }

    // b. 构建 TSV 文本，防止内容中的换行或制表符破坏格式
    const headers = ['类型', '书卷', '章节', '节', '内容'];
    let tsvContent = headers.join('\t') + '\n';
    
    dataToExport.forEach(row => {
      const cleanContent = row.内容.replace(/\t/g, ' ').replace(/\n/g, ' \\n ');
      tsvContent += [row.类型, row.书卷, row.章节, row.节, cleanContent].join('\t') + '\n';
    });

    // c. 触发前端下载
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `ScriptureAI_Data_${dateStr}.tsv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- 3. 核心逻辑：清空数据功能 ---
  const executeClear = () => {
    if (clearOpts.highlights) clearAllHighlights();
    if (clearOpts.notes) clearAllNotes();
    if (clearOpts.interactions) clearAllInteractions();
    
    // 重置状态并关闭确认框
    setShowClearMenu(false);
    setClearOpts({ highlights: false, notes: false, interactions: false });
  };

  const toggleOpt = (key: keyof typeof clearOpts) => {
    setClearOpts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- 4. 热力图与跳转逻辑 ---
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
    setDashboardOpen(false);
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab && currentTab.type === 'read') {
       updateActiveTab({ book: bookId, chapter: chapter.toString() });
    } else {
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
    }
    router.push(`/?book=${bookId}&chapter=${chapter}`);
  };

  const totalInteractions = heatmapData.reduce((sum, item) => sum + item.weight, 0);

  return (
    <Dialog open={isDashboardOpen} onOpenChange={setDashboardOpen}>
      <DialogContent className="max-w-[95vw] lg:max-w-5xl xl:max-w-[1200px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background rounded-2xl relative">
        
        {/* --- [新增] 清空数据内部确认遮罩 --- */}
        {showClearMenu && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-sm border dark:border-slate-800">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-500 mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5"/> 选择要清空的数据
              </h3>
              
              <div className="space-y-3 mb-8">
                {/* 选项 1: 高亮 */}
                <button onClick={() => toggleOpt('highlights')} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                   {clearOpts.highlights ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-slate-400" />}
                   <span className="flex-1 text-sm font-medium">清空所有高亮笔记 ({highlights.length})</span>
                </button>
                {/* 选项 2: 笔记 */}
                <button onClick={() => toggleOpt('notes')} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                   {clearOpts.notes ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-slate-400" />}
                   <span className="flex-1 text-sm font-medium">清空所有深入笔记 ({notes.length})</span>
                </button>
                {/* 选项 3: 阅读足迹 */}
                <button onClick={() => toggleOpt('interactions')} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                   {clearOpts.interactions ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-slate-400" />}
                   <span className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                      清空基础阅读足迹 <br/>
                      <span className="text-xs text-slate-400 font-normal">热力图将重置，不影响高亮和笔记</span>
                   </span>
                </button>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowClearMenu(false)} className="rounded-full">取消</Button>
                <Button 
                  variant="destructive" 
                  disabled={!clearOpts.highlights && !clearOpts.notes && !clearOpts.interactions} 
                  onClick={executeClear}
                  className="rounded-full font-bold"
                >
                  确认清空
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogHeader className="p-5 md:p-6 pb-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                个人灵修图谱
              </DialogTitle>
              <DialogDescription className="mt-1">
                记录你的每一次阅读、高亮与思考。点击热力方块可快速跳转至对应章节。
              </DialogDescription>
            </div>
            
            <div className="hidden sm:flex items-center gap-2">
                {/* 导出按钮 */}
                <Button variant="outline" size="sm" className="gap-2 rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/30" onClick={handleExportTSV}>
                  <Download className="w-4 h-4" /> 导出 TSV
                </Button>
                
                {/* 清空按钮 */}
                <Button variant="ghost" size="sm" className="gap-2 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setShowClearMenu(true)}>
                  <Trash2 className="w-4 h-4" /> 清空数据
                </Button>
            </div>
          </div>

          <div className="flex gap-6 mt-4">
             <div className="flex flex-col">
                <span className="text-3xl font-black text-foreground">{totalInteractions}</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">总互动权重</span>
             </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-2 md:px-6 pb-10 bg-white dark:bg-slate-950">
           <BibleHeatmap 
             data={heatmapData} 
             onCellClick={handleCellClick}
             colorTheme="blue"
           />
        </div>

      </DialogContent>
    </Dialog>
  );
}