// components/bible/NotesTab.tsx
"use client";

import { useMemo } from "react";
import { useBibleStore } from "@/store/useBibleStore";
import { BookOpen, Edit3, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function NotesTab() {
  const { notes, deleteNote, openNoteEditor, tabs, addTab, setActiveTab, updateActiveTab } = useBibleStore();
  const { data: session } = useSession();

  // 按书卷分组笔记
  const groupedNotes = useMemo(() => {
    const groups: Record<string, typeof notes> = {};
    notes.forEach(n => {
      if (!groups[n.bookId]) groups[n.bookId] = [];
      groups[n.bookId].push(n);
    });
    // 排序
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.chapter !== b.chapter ? a.chapter - b.chapter : a.verse - b.verse);
    });
    return groups;
  }, [notes]);

  const handleJump = (bookId: string, chapter: number, verse: number) => {
    const readTab = tabs.find(t => t.type === 'read');
    if (readTab) {
      setActiveTab(readTab.id);
      useBibleStore.setState((state) => ({
        tabs: state.tabs.map(t => t.id === readTab.id ? { ...t, book: bookId, chapter: chapter.toString() } : t)
      }));
    } else {
      addTab({ type: 'read', book: bookId, chapter: chapter.toString() });
    }
    useBibleStore.getState().setScrollToVerse(verse);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("确定要删除这条笔记吗？")) return;
    deleteNote(id);
    if (session?.user) {
      try {
        await fetch('/api/note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteId: id, action: "delete" })
        });
      } catch (err) {
        console.error("Failed to delete note remotely", err);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent, bookId: string, chapter: number, verse: number) => {
    e.stopPropagation();
    openNoteEditor(bookId, chapter, verse);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-32 min-h-screen">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b dark:border-slate-800">
        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">我的笔记</h1>
          <p className="text-sm text-muted-foreground mt-1">共记录了 {notes.length} 条灵修感悟。</p>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-20 opacity-40 select-none">
          <BookOpen className="w-16 h-16 mx-auto mb-4 stroke-[1.5]" />
          <p className="text-lg">您还没有写过任何笔记</p>
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
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleJump(item.bookId, item.chapter, item.verse)}
                    className="group relative flex flex-col p-5 bg-white dark:bg-slate-900 rounded-2xl cursor-pointer border dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3 border-b dark:border-slate-800 pb-2">
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-500">
                        {item.bookId} {item.chapter}:{item.verse}
                      </span>
                      <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 rounded-full"
                          onClick={(e) => handleEdit(e, item.bookId, item.chapter, item.verse)}
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/30 rounded-full"
                          onClick={(e) => handleDelete(e, item.id)}
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <ChevronRight className="w-5 h-5 text-muted-foreground ml-1" />
                      </div>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words text-slate-700 dark:text-slate-300">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
