// components/bible/Sidebar.tsx
"use client";

import { BIBLE_BOOKS } from "@/lib/constants";
// import { ScrollArea } from "@/components/ui/scroll-area"; // 删除此行，不再使用
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useBibleStore } from "@/store/useBibleStore";

export function Sidebar({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toggleSidebar } = useBibleStore(); 

  // 获取当前 URL 上的参数
  const currentBookId = searchParams.get("book") || "Gen";
  const currentChapter = Number(searchParams.get("chapter")) || 1;

  // 本地状态：控制哪个书卷是展开的
  const [expandedBook, setExpandedBook] = useState<string | null>(currentBookId);

  // 当 URL 变化时（比如点击了下一章），自动展开对应的书卷
  useEffect(() => {
    setExpandedBook(currentBookId);
  }, [currentBookId]);

  // 处理章节点击
  const handleChapterClick = (bookId: string, chapter: number) => {
    router.push(`/?book=${bookId}&chapter=${chapter}`);
    // 移动端：关闭侧边栏
    if (window.innerWidth < 768) {
        toggleSidebar();
    }
  };

  return (
    <div className={cn("h-full flex flex-col bg-slate-50 border-r", className)}>
      {/* 顶部标题：增加 flex-shrink-0 防止被压缩 */}
      <div className="p-4 font-bold text-xl border-b bg-white flex-shrink-0">
        📖 圣经目录
      </div>
      
      {/* 核心修改：使用原生 div 实现滚动 
          flex-1: 占满剩余空间
          overflow-y-auto: 内容溢出时显示滚动条
          min-h-0: 这是一个 Flexbox 的魔法属性，防止子元素溢出容器
      */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 space-y-2">
          {BIBLE_BOOKS.map((book) => (
            <div key={book.id} className="space-y-1">
              {/* 书卷标题 */}
              <button
                onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md font-medium transition-colors hover:bg-slate-200",
                  currentBookId === book.id ? "text-blue-700 bg-blue-50" : "text-slate-700"
                )}
              >
                {book.name}
              </button>

              {/* 章节网格 (仅当书卷展开时显示) */}
              {expandedBook === book.id && (
                <div className="grid grid-cols-5 gap-2 pl-2 pr-2 pb-2">
                  {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => (
                    <button
                      key={chapter}
                      onClick={() => handleChapterClick(book.id, chapter)}
                      className={cn(
                        "text-sm py-1 rounded hover:bg-slate-200 border",
                        (currentBookId === book.id && currentChapter === chapter)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200"
                      )}
                    >
                      {chapter}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}