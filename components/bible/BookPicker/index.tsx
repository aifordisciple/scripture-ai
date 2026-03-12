// components/bible/BookPicker/index.tsx
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BIBLE_BOOKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { X, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

import { TestamentTabs } from "./TestamentTabs";
import { BookGrid } from "./BookGrid";
import { ChapterGrid } from "./ChapterGrid";
import { Testament, BookInfo, BookPickerProps } from "./types";

// 旧约（前39卷）和新约（后27卷）
const OLD_TESTAMENT = BIBLE_BOOKS.slice(0, 39);
const NEW_TESTAMENT = BIBLE_BOOKS.slice(39);

/**
 * 经文选择器 - 全屏三栏联动
 *
 * 设计原则：
 * - 操作简化：选书卷 → 选章节 → 自动跳转（2步完成）
 * - 全屏展示：最大化可视区域
 * - 章节预览：固定显示，无需展开
 * - 快速定位：旧约/新约 Tab
 */
export function BookPicker({
  open,
  onOpenChange,
  currentBook,
  currentChapter,
  onSelect,
}: BookPickerProps) {
  // 当前选中的约（旧约/新约）
  const [testament, setTestament] = useState<Testament>("old");

  // 当前选中的书卷
  const [selectedBook, setSelectedBook] = useState<BookInfo | null>(null);

  // 当前书卷列表
  const books = useMemo(() => {
    return testament === "old" ? OLD_TESTAMENT : NEW_TESTAMENT;
  }, [testament]);

  // 根据当前阅读位置初始化状态
  useEffect(() => {
    if (open && currentBook) {
      const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === currentBook);
      if (bookIndex >= 0) {
        // 设置约
        setTestament(bookIndex < 39 ? "old" : "new");
        // 设置选中书卷
        setSelectedBook(BIBLE_BOOKS[bookIndex]);
      }
    }
  }, [open, currentBook]);

  // 选择书卷
  const handleBookSelect = useCallback((book: BookInfo) => {
    setSelectedBook(book);
  }, []);

  // 选择章节
  const handleChapterSelect = useCallback(
    (chapter: number) => {
      if (selectedBook) {
        onSelect(selectedBook.id, chapter);
        onOpenChange(false);
      }
    },
    [selectedBook, onSelect, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 bg-background rounded-none">
        {/* 顶部标题栏 */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <DialogTitle className="text-lg font-bold">选择经文</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* 旧约/新约切换 */}
          <div className="px-4 pb-3">
            <TestamentTabs testament={testament} onChange={setTestament} />
          </div>
        </div>

        {/* 主内容区 - 书卷网格 + 章节网格 */}
        <div className="flex-1 overflow-y-auto p-4 pb-32" style={{ height: 'calc(100vh - 120px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={testament}
              initial={{ opacity: 0, x: testament === "old" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: testament === "old" ? 20 : -20 }}
              className="space-y-4"
            >
              {/* 书卷网格 */}
              <BookGrid
                books={books}
                selectedBookId={selectedBook?.id}
                onSelect={handleBookSelect}
              />

              {/* 章节网格 - 选中书卷后显示 */}
              {selectedBook && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-4 border-t border-border/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {selectedBook.name} · 选择章节
                    </span>
                    <span className="text-xs text-muted-foreground">
                      共 {selectedBook.chapters} 章
                    </span>
                  </div>
                  <ChapterGrid
                    chapters={selectedBook.chapters}
                    selectedChapter={currentBook === selectedBook.id ? parseInt(currentChapter || "1") : undefined}
                    onSelect={handleChapterSelect}
                  />
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BookPicker;