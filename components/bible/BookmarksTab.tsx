// components/bible/BookmarksTab.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { BIBLE_BOOKS } from "@/lib/constants";
import { Bookmark, ChevronRight, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BookmarksTab() {
  const router = useRouter();
  const { bookmarks, removeBookmark, tabs, addTab, setActiveTab } = useBibleStore();

  // 按书卷分组书签
  const groupedBookmarks = useMemo(() => {
    const groups: Record<string, typeof bookmarks> = {};
    bookmarks.forEach(b => {
      if (!groups[b.bookId]) groups[b.bookId] = [];
      groups[b.bookId].push(b);
    });
    // 按章节排序
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.chapter - b.chapter);
    });
    return groups;
  }, [bookmarks]);

  // 点击书签跳转到对应章节
  const handleJump = (bookId: string, chapter: number) => {
    const readTab = tabs.find(t => t.type === 'read');
    if (readTab) {
      useBibleStore.setState((state) => ({
        tabs: state.tabs.map(t => t.id === readTab.id ? { ...t, book: bookId, chapter: chapter.toString() } : t)
      }));
      setActiveTab(readTab.id);
    } else {
      addTab({ type: 'read', book: bookId, chapter: chapter.toString() });
    }
    router.push(`/?book=${bookId}&chapter=${chapter}`);
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeBookmark(id);
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-4">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b dark:border-slate-800">
        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
          <Bookmark className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">我的书签</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {bookmarks.length} 个书签。点击可快速跳转到对应章节。
          </p>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-20 opacity-40 select-none">
          <Bookmark className="w-16 h-16 mx-auto mb-4 stroke-[1.5]" />
          <p className="text-lg">您还没有添加书签</p>
          <p className="text-sm mt-2">在阅读经文时点击书签图标即可添加</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedBookmarks).map(([bookId, items]) => {
            const bookName = BIBLE_BOOKS.find(b => b.id === bookId)?.name || bookId;
            return (
              <div key={bookId} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-lg font-bold font-serif text-foreground mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-purple-500 rounded-full inline-block"></span>
                  {bookName}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleJump(item.bookId, item.chapter)}
                      className={cn(
                        "group relative flex flex-col p-4 rounded-xl cursor-pointer",
                        "bg-white dark:bg-slate-900 border dark:border-slate-800",
                        "shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800",
                        "transition-all duration-300"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          第 {item.chapter} 章
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleRemove(e, item.id)}
                          title="移除书签"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(item.createdAt)}</span>
                      </div>
                      <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}