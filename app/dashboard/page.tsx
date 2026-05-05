// app/dashboard/page.tsx
"use client";

import { useBibleStore } from "@/store/useBibleStore";
import { BibleHeatmap } from "@/components/bible/BibleHeatmap";
import { useMemo, useState } from "react";
import { Download, Activity, Trash2, CheckSquare, Square, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { getClientLocale } from "@/lib/locale";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const locale = getClientLocale();

  const {
    highlights, notes, interactions,
    updateActiveTab, addTab, tabs, activeTabId, setActiveTab,
    clearAllHighlights, clearAllNotes, clearAllInteractions
  } = useBibleStore();

  const [showClearMenu, setShowClearMenu] = useState(false);
  const [clearOpts, setClearOpts] = useState({ highlights: false, notes: false, interactions: false });

  // 导出 TSV 功能
  const handleExportTSV = () => {
    const isZh = locale.startsWith('zh');
    const typeLabel = isZh ? '类型' : 'Type';
    const bookLabel = isZh ? '书卷' : 'Book';
    const chapterLabel = isZh ? '章节' : 'Chapter';
    const verseLabel = isZh ? '节' : 'Verse';
    const contentLabel = isZh ? '内容' : 'Content';

    const dataToExport = [
      ...highlights.map(h => ({ [typeLabel]: isZh ? '高亮' : 'Highlight', [bookLabel]: h.bookId, [chapterLabel]: h.chapter, [verseLabel]: h.verse, [contentLabel]: `color: ${h.color}` })),
      ...notes.map(n => ({ [typeLabel]: isZh ? '笔记' : 'Note', [bookLabel]: n.bookId, [chapterLabel]: n.chapter, [verseLabel]: n.verse, [contentLabel]: n.content })),
      ...interactions.map(i => ({ [typeLabel]: isZh ? '阅读足迹' : 'Reading', [bookLabel]: i.bookId, [chapterLabel]: i.chapter, [verseLabel]: isZh ? '全章' : 'Full', [contentLabel]: `weight: ${i.count}` }))
    ];

    if (dataToExport.length === 0) {
      addToast({ type: 'warning', message: t('dashboard.noDataToExport') });
      return;
    }

    const headers = [typeLabel, bookLabel, chapterLabel, verseLabel, contentLabel];
    let tsvContent = headers.join('\t') + '\n';

    dataToExport.forEach(row => {
      const cleanContent = String(row[contentLabel]).replace(/\t/g, ' ').replace(/\n/g, ' \\n ');
      tsvContent += [row[typeLabel], row[bookLabel], row[chapterLabel], row[verseLabel], cleanContent].join('\t') + '\n';
    });

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

  // 清空数据功能
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

  // 热力图与跳转逻辑
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
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab && currentTab.type === 'read') {
       updateActiveTab({ book: bookId, chapter: chapter.toString() });
    } else {
       const readTab = tabs.find(t => t.type === 'read');
       if (readTab) {
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
    <div className="min-h-screen bg-accent/50 dark:bg-card flex flex-col relative">

      {/* 确认遮罩 */}
      {showClearMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-card p-6 rounded-2xl shadow-2xl w-full max-w-sm border dark:border-border">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-500 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5"/> {t('dashboard.selectDataToClear') || '选择要清空的数据'}
            </h3>

            <div className="space-y-3 mb-8">
              <button onClick={() => toggleOpt('highlights')} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-accent/50 dark:hover:bg-accent transition-colors">
                 {clearOpts.highlights ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                 <span className="flex-1 text-sm font-semibold">{t('dashboard.clearHighlights') || '清空所有高亮笔记'} ({highlights.length})</span>
              </button>
              <button onClick={() => toggleOpt('notes')} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-accent/50 dark:hover:bg-accent transition-colors">
                 {clearOpts.notes ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                 <span className="flex-1 text-sm font-semibold">{t('dashboard.clearNotes') || '清空所有深入笔记'} ({notes.length})</span>
              </button>
              <button onClick={() => toggleOpt('interactions')} className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-accent/50 dark:hover:bg-accent transition-colors">
                 {clearOpts.interactions ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                 <span className="flex-1 text-sm font-semibold text-muted-foreground dark:text-foreground">
                    {t('dashboard.clearInteractions') || '清空基础阅读足迹'} <br/>
                    <span className="text-xs text-muted-foreground font-normal">{t('dashboard.clearInteractionsHint') || '热力图将重置，不影响高亮和笔记'}</span>
                 </span>
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowClearMenu(false)} className="rounded-full">{t('common.cancel')}</Button>
              <Button
                variant="destructive"
                disabled={!clearOpts.highlights && !clearOpts.notes && !clearOpts.interactions}
                onClick={executeClear}
                className="rounded-full font-bold"
              >
                {t('common.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 顶部导航 */}
      <header className="bg-white dark:bg-card border-b dark:border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> {t('dashboard.backToReading')}
          </Link>
          <div className="h-6 w-px bg-accent dark:bg-accent hidden sm:block"></div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              {t('dashboard.title')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/30" onClick={handleExportTSV}>
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">{t('dashboard.exportData')}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setShowClearMenu(true)}>
            <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">{t('dashboard.clearData') || '清空数据'}</span>
          </Button>
        </div>
      </header>

      {/* 主数据区 */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10 flex flex-col" id="main-content">
        <div className="mb-8">
            <div className="flex flex-col">
               <span className="text-4xl font-black text-foreground">{totalInteractions}</span>
               <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mt-1">{t('dashboard.totalInteractionWeight') || '总互动权重'}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">{t('dashboard.heatmapDescription') || '记录你的每一次阅读、高亮与思考。点击热力方块可快速跳回对应的经文进行研读。'}</p>
        </div>

        <div className="bg-white dark:bg-card rounded-2xl shadow-sm border dark:border-border p-6 overflow-x-auto">
           <BibleHeatmap
             data={heatmapData}
             onCellClick={handleCellClick}
             colorTheme="blue"
           />
        </div>
      </main>
    </div>
  );
}