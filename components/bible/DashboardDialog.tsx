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
  const { isDashboardOpen, setDashboardOpen, highlights, updateActiveTab, addTab, tabs, activeTabId, setActiveTab } = useBibleStore();

  // 1. 聚合高亮数据生成热力图权重
  const heatmapData = useMemo(() => {
    return highlights.map(h => ({
      bookId: h.bookId,
      chapter: h.chapter,
      weight: 1 // 预留接口，未来可加入笔记字数作为 weight 权重
    }));
  }, [highlights]);

  // 2. [新增] 完美的路由跳转逻辑
  const handleCellClick = (bookId: string, chapter: number) => {
    // 关闭看板
    setDashboardOpen(false);

    // 更新 Tab 状态
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab && currentTab.type === 'read') {
       // 如果当前已经是阅读 Tab，直接更新
       updateActiveTab({ book: bookId, chapter: chapter.toString() });
    } else {
       // 如果当前在搜索 Tab，找找有没有休眠的阅读 Tab，有就切过去，没有就新建
       const readTab = tabs.find(t => t.type === 'read');
       if (readTab) {
           setActiveTab(readTab.id);
       } else {
           addTab({ type: 'read', book: bookId, chapter: chapter.toString() });
       }
    }
    
    // 强制触发 Next.js 的路由重定向，让 Reader 重新拉取数据
    router.push(`/?book=${bookId}&chapter=${chapter}`);
  };

  const totalInteractions = heatmapData.length;

  return (
    <Dialog open={isDashboardOpen} onOpenChange={setDashboardOpen}>
      {/* [修复] 增大 maxWidth 为 95vw 和 6xl，确保右侧《诗篇》等长书卷无需频繁滚动，并增加顶部内边距防裁切 */}
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
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">总互动次数</span>
             </div>
          </div>
        </DialogHeader>

        {/* 主数据区增加滚动条，彻底解决最顶部创世记或最底部启示录被吃掉的问题 */}
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