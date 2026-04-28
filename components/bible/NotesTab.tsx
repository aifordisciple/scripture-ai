// components/bible/NotesTab.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { BookOpen, Edit3, Trash2, ChevronRight, ChevronDown, ChevronUp, Search, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export function NotesTab() {
  const router = useRouter();
  const { notes, deleteNote, openNoteEditor, tabs, addTab, setActiveTab, updateActiveTab } = useBibleStore();
  const { data: session } = useSession();
  const { t } = useTranslation();

  // [P1增强] 搜索状态
  const [searchQuery, setSearchQuery] = useState('');

  // [P1增强] 展开/收起状态 - 记录哪些笔记是展开的
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // 切换笔记展开状态
  const toggleExpand = (noteId: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  // [P1增强] 过滤笔记（全文搜索）
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(note =>
      note.content.toLowerCase().includes(query) ||
      note.bookId.toLowerCase().includes(query) ||
      `${note.chapter}:${note.verse}`.includes(query)
    );
  }, [notes, searchQuery]);

  // 按书卷分组笔记
  const groupedNotes = useMemo(() => {
    const groups: Record<string, typeof filteredNotes> = {};
    filteredNotes.forEach(n => {
      if (!groups[n.bookId]) groups[n.bookId] = [];
      groups[n.bookId].push(n);
    });
    // 排序
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.chapter !== b.chapter ? a.chapter - b.chapter : a.verse - b.verse);
    });
    return groups;
  }, [filteredNotes]);

  const handleJump = (bookId: string, chapter: number, verse: number) => {
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
    useBibleStore.getState().setScrollToVerse(verse);

    // 强制修改 URL
    router.push(`/?book=${bookId}&chapter=${chapter}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm(t('bible.confirmDeleteNote'))) return;

    // 先尝试服务端删除，成功后再删除本地
    if (session?.user) {
      try {
        const res = await fetch('/api/note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteId: id, action: "delete" })
        });
        if (!res.ok) throw new Error(t('bible.deleteFailed'));
        deleteNote(id);
      } catch (err) {
        console.error("Failed to delete note remotely", err);
        alert(t('bible.deleteFailed'));
      }
    } else {
      deleteNote(id);
    }
  };

  const handleEdit = (e: React.MouseEvent, bookId: string, chapter: number, verse: number) => {
    e.stopPropagation();
    openNoteEditor(bookId, chapter, verse);
  };

  // [P1增强] 导出笔记为Markdown
  const handleExportMarkdown = () => {
    if (notes.length === 0) {
      alert(t('bible.noNotesToExport'));
      return;
    }

    let markdown = `# ${t('bible.exportTitle')}\n\n`;
    markdown += `> ${t('bible.exportTime')}: ${new Date().toLocaleString('zh-CN')}\n\n`;
    markdown += `> ${t('bible.exportNoteCount', { count: notes.length })}\n\n---\n\n`;

    const grouped = groupedNotes;
    Object.entries(grouped).forEach(([bookName, items]) => {
      markdown += `## ${bookName}\n\n`;
      items.forEach(item => {
        markdown += `### ${item.chapter}:${item.verse}\n\n`;
        markdown += `${item.content}\n\n`;
        if (item.updatedAt) {
          markdown += `*${t('bible.updated')} ${new Date(item.updatedAt).toLocaleString('zh-CN')}*\n\n`;
        }
        markdown += '---\n\n';
      });
    });

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${t('bible.exportFileName')}_${new Date().toISOString().split('T')[0]}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-4">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b dark:border-slate-800">
        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('bible.myNotes')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('bible.noteCount', { count: notes.length })}</p>
        </div>

        {/* [P1增强] 导出按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportMarkdown}
          className="gap-2 rounded-full border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
        >
          <Download className="w-4 h-4" /> {t('bible.exportBtn')}
        </Button>
      </div>

      {/* [P1增强] 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('bible.searchNotesPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-muted-foreground mt-2">
            {t('bible.matchCount', { count: filteredNotes.length })}
          </p>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-20 opacity-40 select-none">
          <BookOpen className="w-16 h-16 mx-auto mb-4 stroke-[1.5]" />
          <p className="text-lg">{t('bible.noNotes')}</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-20 opacity-40 select-none">
          <Search className="w-16 h-16 mx-auto mb-4 stroke-[1.5]" />
          <p className="text-lg">{t('bible.noMatchNotes')}</p>
          <p className="text-sm mt-2">{t('bible.tryOther')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedNotes).map(([bookName, items]) => (
            <div key={bookName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-bold font-serif text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-amber-500 rounded-full inline-block"></span>
                {bookName}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {items.map((item) => {
                    const isExpanded = expandedNotes.has(item.id);
                    const contentLength = item.content.length;
                    const needsExpand = contentLength > 150; // 超过150字符需要展开

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group relative flex flex-col rounded-2xl border dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300",
                          isExpanded ? "bg-white dark:bg-slate-900" : "p-5 bg-white dark:bg-slate-900"
                        )}
                      >
                        {/* 标题栏 - 展开时 sticky 固定在顶部 */}
                        <div
                          className={cn(
                            "flex items-center justify-between border-b dark:border-slate-800 pb-2 px-5 pt-5",
                            needsExpand && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50",
                            // 展开时 sticky 效果
                            isExpanded && needsExpand && "sticky top-0 z-10 bg-white dark:bg-slate-900 rounded-t-2xl shadow-sm"
                          )}
                          onClick={(e) => {
                            if (needsExpand) {
                              e.stopPropagation();
                              toggleExpand(item.id);
                            } else {
                              handleJump(item.bookId, item.chapter, item.verse);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-500">
                              {item.bookId} {item.chapter}:{item.verse}
                            </span>
                            {needsExpand && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                {isExpanded ? (
                                  <><ChevronUp className="w-3.5 h-3.5" />{t('bible.collapse')}</>
                                ) : (
                                  <><ChevronDown className="w-3.5 h-3.5" />{t('bible.expand')}</>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 rounded-full"
                              onClick={(e) => handleEdit(e, item.bookId, item.chapter, item.verse)}
                              title={t('bible.editBtn')}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/30 rounded-full"
                              onClick={(e) => handleDelete(e, item.id)}
                              title={t('bible.deleteBtn')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <ChevronRight className="w-5 h-5 text-muted-foreground ml-1" />
                          </div>
                        </div>

                        {/* 内容区域 */}
                        <div
                          className={cn(
                            "prose prose-sm dark:prose-invert max-w-none break-words text-slate-700 dark:text-slate-300 px-5 pb-5",
                            !isExpanded && needsExpand && "line-clamp-3"
                          )}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
