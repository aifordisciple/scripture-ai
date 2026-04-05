// apps/desktop/src/components/ReadingProgress.tsx
/**
 * Reading progress indicator component
 *
 * Shows current reading position and progress through the Bible
 */

import { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { BookOpen, CheckCircle } from 'lucide-react';

interface ReadingProgressProps {
  bookId: string;
  chapter: number;
  totalChapters: number;
  bookName: string;
}

interface ChapterProgress {
  bookId: string;
  chapter: number;
  read: boolean;
  readAt?: string;
}

export function ReadingProgress({
  bookId,
  chapter,
  totalChapters,
  bookName,
}: ReadingProgressProps) {
  const [chaptersRead, setChaptersRead] = useState<ChapterProgress[]>([]);
  const [bookProgress, setBookProgress] = useState(0);

  // Load chapter progress
  useEffect(() => {
    loadChapterProgress();
  }, [bookId]);

  const loadChapterProgress = async () => {
    try {
      const progress = await invoke<ChapterProgress[]>('db_get_chapter_progress', { bookId });
      setChaptersRead(progress || []);
      const readCount = (progress || []).filter(p => p.read).length;
      setBookProgress(Math.round((readCount / totalChapters) * 100));
    } catch (error) {
      console.error('Failed to load chapter progress:', error);
    }
  };

  const isChapterRead = chaptersRead.some(
    p => p.bookId === bookId && p.chapter === chapter && p.read
  );

  // Chapter progress within the book
  const currentProgress = Math.round((chapter / totalChapters) * 100);

  return (
    <div className="reading-progress">
      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-info">
          <span className="progress-book">
            <BookOpen className="w-4 h-4" />
            {bookName}
          </span>
          <span className="progress-position">
            {chapter} / {totalChapters}章
          </span>
        </div>
        <div className="progress-bar-wrapper">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
          <span className="progress-percent">{currentProgress}%</span>
        </div>
      </div>

      {/* Chapter Status */}
      {isChapterRead && (
        <div className="chapter-status read">
          <CheckCircle className="w-4 h-4" />
          <span>已读</span>
        </div>
      )}

      {/* Overall Book Progress */}
      {bookProgress > 0 && (
        <div className="book-progress">
          <span className="book-progress-label">本书进度</span>
          <span className="book-progress-value">{bookProgress}%</span>
        </div>
      )}
    </div>
  );
}

// Hook for tracking reading progress
export function useReadingProgress() {
  const markChapterRead = useCallback(async (bookId: string, chapter: number) => {
    try {
      await invoke('db_mark_chapter_read', {
        progress: {
          book_id: bookId,
          chapter,
          read: true,
          read_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to mark chapter read:', error);
    }
  }, []);

  const getOverallProgress = useCallback(async () => {
    try {
      const progress = await invoke<{
        totalChapters: number;
        chaptersRead: number;
        percentage: number;
      }>('db_get_overall_progress');
      return progress;
    } catch (error) {
      console.error('Failed to get overall progress:', error);
      return { totalChapters: 1189, chaptersRead: 0, percentage: 0 };
    }
  }, []);

  return { markChapterRead, getOverallProgress };
}