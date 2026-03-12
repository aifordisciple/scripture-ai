// components/bible/BookPicker/types.ts
import { BIBLE_BOOKS } from "@/lib/constants";

export type Testament = 'old' | 'new';

export type BookInfo = typeof BIBLE_BOOKS[number];

export interface BookPickerProps {
  /** 是否打开选择器 */
  open: boolean;
  /** 打开/关闭回调 */
  onOpenChange: (open: boolean) => void;
  /** 当前选中的书卷 ID */
  currentBook?: string;
  /** 当前选中的章节 */
  currentChapter?: string;
  /** 选择经文后的回调 */
  onSelect: (bookId: string, chapter: number) => void;
}

export interface TestamentTabsProps {
  testament: Testament;
  onChange: (testament: Testament) => void;
}

export interface BookGridProps {
  books: BookInfo[];
  selectedBookId?: string;
  onSelect: (book: BookInfo) => void;
  searchQuery?: string;
}

export interface ChapterGridProps {
  chapters: number;
  selectedChapter?: number;
  onSelect: (chapter: number) => void;
}