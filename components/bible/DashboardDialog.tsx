// components/bible/DashboardDialog.tsx
"use client";

import { useBibleStore } from "@/store/useBibleStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BibleHeatmap } from "./BibleHeatmap";
import { useMemo } from "react";
import { Download, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function DashboardDialog() {
  const router = useRouter();
  // [修改] 提取 notes 和 interactions 状态
  const { isDashboardOpen, setDashboardOpen, highlights, notes, interactions, updateActiveTab, addTab, tabs, activeTabId, setActiveTab } = useBibleStore();

  // 1. [核心重构] 多维聚合权重生成热力图
  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();

    // a. 累计高亮权重 (+1)
    highlights.forEach(h => {
       const key = `${h.bookId}-${h.chapter}`;
       map.set(key, (map.get(key) || 0) + 1);
    });

    // b. 累计笔记权重 (+2) 笔记表明了更深度的思考
    notes.forEach(n => {
       const key = `${n.bookId}-${n.chapter}`;
       map.set(key, (map.get(key) || 0) + 2); 
    });

    // c. 累计静默阅读/AI辅助等日常互动 (+1 每次)
    interactions.forEach(i => {
       const key = `${i.bookId}-${i.chapter}`;
       map.set(key, (map.get(key) || 0) + i.count);
    });

    // 将 Map 转化为数组交给图表组件渲染
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
       if (readTab) setActiveTab(readTab.id);
       else addTab({ type: 'read', book: bookId, chapter: chapter.toString() });
    }
    router.push(`/?book=${bookId}&chapter=${chapter}`);
  };

  // 简单计算总计交互次数
  const totalInteractions = heatmapData.reduce((sum, item) => sum + item.weight, 0);

  return (
    <Dialog open={isDashboardOpen} onOpenChange={setDashboardOpen}>
      <DialogContent className="max-w-[95vw] lg:max-w-5xl xl:max-w-[1200px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background rounded-2xl">
        
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
            
            <Button variant="outline" size="sm" className="hidden sm:flex gap-2 rounded-full" onClick={() => alert("导出 TSV 功能准备中...")}>
               <Download className="w-4 h-4" />
               导出分析数据
            </Button>
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