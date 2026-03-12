// components/bible/BookPicker/index.tsx
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { BIBLE_BOOKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Search, X, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { TestamentTabs } from "./TestamentTabs";
import { BookGrid } from "./BookGrid";
import { ChapterGrid } from "./ChapterGrid";
import { Testament, BookInfo, BookPickerProps } from "./types";

// 旧约（前39卷）和新约（后27卷）
const OLD_TESTAMENT = BIBLE_BOOKS.slice(0, 39);
const NEW_TESTAMENT = BIBLE_BOOKS.slice(39);

/**
 * 经文选择器 - 底部弹出三栏联动
 *
 * 设计原则：
 * - 操作简化：选书卷 → 选章节 → 自动跳转（2步完成）
 * - 底部弹出：符合移动端拇指热区
 * - 章节预览：固定显示，无需展开
 * - 快速定位：旧约/新约 Tab + 搜索
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

  // 搜索关键词
  const [searchQuery, setSearchQuery] = useState("");

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

  // 重置状态
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

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

  // 获取当前书卷信息
  const currentBookInfo = useMemo(() => {
    if (!currentBook) return null;
    return BIBLE_BOOKS.find((b) => b.id === currentBook);
  }, [currentBook]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl px-4 pt-4 pb-safe max-h-[85vh] overflow-hidden flex flex-col"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center justify-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            选择经文
          </SheetTitle>
        </SheetHeader>

        {/* 搜索栏 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索书卷..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 rounded-xl bg-secondary/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 旧约/新约切换 */}
        {!searchQuery && (
          <div className="mb-4">
            <TestamentTabs testament={testament} onChange={setTestament} />
          </div>
        )}

        {/* 主内容区 - 书卷网格 + 章节网格 */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            {/* 显示搜索结果或正常选择 */}
            {searchQuery ? (
              // 搜索模式：显示所有匹配的书卷
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <BookGrid
                  books={BIBLE_BOOKS}
                  selectedBookId={selectedBook?.id}
                  onSelect={handleBookSelect}
                  searchQuery={searchQuery}
                />

                {/* 搜索结果中选中书卷后显示章节 */}
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
            ) : (
              // 正常模式：显示当前约的书卷 + 选中书卷的章节
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
            )}
          </AnimatePresence>
        </div>

        {/* 底部快捷提示 */}
        <div className="shrink-0 pt-3 border-t border-border/30">
          <p className="text-center text-xs text-muted-foreground">
            选择书卷后，点击章节即可跳转
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default BookPicker;