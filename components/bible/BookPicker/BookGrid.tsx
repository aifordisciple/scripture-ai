// components/bible/BookPicker/BookGrid.tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { BookGridProps } from "./types";
import { motion } from "framer-motion";
import { useBibleStore } from "@/store/useBibleStore";
import { getBookDisplayName } from "@/lib/constants";

/**
 * 书卷网格组件
 * 4-5 列响应式布局
 */
export function BookGrid({ books, selectedBookId, onSelect, searchQuery = "" }: BookGridProps) {
  const locale = useBibleStore((s) => s.locale);

  // 搜索过滤
  const filteredBooks = useMemo(() => {
    if (!searchQuery) return books;
    const query = searchQuery.toLowerCase();
    return books.filter(
      (book) =>
        book.name.includes(searchQuery) ||
        (book.nameEn && book.nameEn.toLowerCase().includes(query)) ||
        book.id.toLowerCase().includes(query) ||
        book.category?.toLowerCase().includes(query)
    );
  }, [books, searchQuery]);

  if (filteredBooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-sm">{locale === 'en' ? 'No matching books' : '未找到匹配的书卷'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
      {filteredBooks.map((book, index) => {
        const isSelected = selectedBookId === book.id;
        const displayName = locale === 'en' ? (book.nameEn || book.name) : book.name;

        return (
          <motion.button
            key={book.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02, duration: 0.15 }}
            onClick={() => onSelect(book)}
            className={cn(
              "relative px-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              "border border-transparent",
              isSelected
                ? "bg-primary text-primary-foreground shadow-md border-primary/20"
                : "bg-secondary/50 text-foreground hover:bg-secondary hover:border-border hover:shadow-sm"
            )}
          >
            <span className="block truncate">{displayName}</span>
            {/* 章节数徽章 */}
            {book.chapters && (
              <span
                className={cn(
                  "absolute -top-1 -right-1 text-[10px] px-1 py-0.5 rounded-full",
                  isSelected
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {book.chapters}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

export default BookGrid;