// apps/desktop/src/components/OfflineDownload.tsx
/**
 * Offline Bible download manager component
 *
 * Features:
 * - Download Bible books for offline reading
 * - Progress tracking
 * - Storage usage display
 * - Clear cache option
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Trash2,
  Check,
  Database,
  Wifi,
  WifiOff,
  Loader2,
  BookOpen,
} from 'lucide-react';
import {
  preloadAllBooks,
  preloadBook,
  getBooksCacheStatus,
  getCachedVerseCount,
  clearBibleCache,
  isOnline,
  BOOK_CHAPTERS,
  BOOK_NAMES,
  getAllBookIds,
  type PreloadProgress,
} from '../utils/offlineBible';

interface OfflineDownloadProps {
  onClose?: () => void;
}

type DownloadStatus = 'idle' | 'downloading' | 'complete' | 'error';

interface BookStatus {
  cached: boolean;
  chapters: number;
  downloading?: boolean;
}

export function OfflineDownload({ onClose }: OfflineDownloadProps) {
  const [booksStatus, setBooksStatus] = useState<Record<string, BookStatus>>({});
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState<PreloadProgress | null>(null);
  const [totalVerses, setTotalVerses] = useState(0);
  const [clearing, setClearing] = useState(false);

  // Load cache status on mount
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const status = await getBooksCacheStatus();
    setBooksStatus(status);
    const count = await getCachedVerseCount();
    setTotalVerses(count);
  };

  const handleDownloadAll = useCallback(async () => {
    if (!isOnline()) {
      alert('需要网络连接才能下载');
      return;
    }

    setDownloadStatus('downloading');
    try {
      await preloadAllBooks((p) => {
        setProgress(p);
      });
      setDownloadStatus('complete');
      await loadStatus();
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus('error');
    }
  }, []);

  const handleDownloadBook = useCallback(async (bookId: string) => {
    if (!isOnline()) {
      alert('需要网络连接才能下载');
      return;
    }

    setBooksStatus(prev => ({
      ...prev,
      [bookId]: { ...prev[bookId], downloading: true },
    }));

    try {
      await preloadBook(bookId);
      await loadStatus();
    } catch (error) {
      console.error(`Failed to download ${bookId}:`, error);
    } finally {
      setBooksStatus(prev => ({
        ...prev,
        [bookId]: { ...prev[bookId], downloading: false },
      }));
    }
  }, []);

  const handleClearCache = useCallback(async () => {
    if (!confirm('确定要清除所有离线经文缓存吗？')) {
      return;
    }

    setClearing(true);
    try {
      await clearBibleCache();
      await loadStatus();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('清除缓存失败');
    } finally {
      setClearing(false);
    }
  }, []);

  const online = isOnline();
  const totalBooks = getAllBookIds().length;
  const cachedBooks = Object.values(booksStatus).filter(s => s.cached).length;
  const progressPercent = progress
    ? Math.round((progress.completedBooks / progress.totalBooks) * 100)
    : 0;

  return (
    <div className="offline-download">
      {/* Header */}
      <div className="offline-header">
        <Database className="w-6 h-6" />
        <h3>离线圣经</h3>
        {online ? (
          <span className="online-badge">
            <Wifi className="w-4 h-4" /> 在线
          </span>
        ) : (
          <span className="offline-badge">
            <WifiOff className="w-4 h-4" /> 离线
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="offline-stats">
        <div className="stat-item">
          <span className="stat-value">{cachedBooks}</span>
          <span className="stat-label">已缓存卷</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{totalVerses.toLocaleString()}</span>
          <span className="stat-label">经文数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{Math.round(totalVerses * 0.2)}</span>
          <span className="stat-label">存储(KB)</span>
        </div>
      </div>

      {/* Download All Button */}
      {downloadStatus === 'idle' && (
        <button
          className="download-all-btn"
          onClick={handleDownloadAll}
          disabled={!online}
        >
          <Download className="w-5 h-5" />
          下载整本圣经 ({totalBooks}卷)
        </button>
      )}

      {/* Progress */}
      {downloadStatus === 'downloading' && progress && (
        <div className="download-progress">
          <div className="progress-info">
            <Loader2 className="w-5 h-5 spin" />
            <span>
              正在下载 {progress.bookName} ({progress.currentChapter}/{progress.totalChapters})
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="progress-text">
            {progress.completedBooks}/{progress.totalBooks} 卷 ({progressPercent}%)
          </div>
        </div>
      )}

      {/* Complete */}
      {downloadStatus === 'complete' && (
        <div className="download-complete">
          <Check className="w-5 h-5 text-green-500" />
          <span>下载完成！</span>
          <button className="btn btn-secondary btn-sm" onClick={loadStatus}>
            刷新状态
          </button>
        </div>
      )}

      {/* Book List */}
      <div className="book-list">
        <h4>各卷下载状态</h4>
        <div className="book-grid">
          {Object.entries(booksStatus).map(([bookId, status]) => (
            <div key={bookId} className={`book-item ${status.cached ? 'cached' : ''}`}>
              <div className="book-info">
                <BookOpen className="w-4 h-4" />
                <span className="book-name">{BOOK_NAMES[bookId] || bookId}</span>
                <span className="book-chapters">{status.chapters}章</span>
              </div>
              <div className="book-actions">
                {status.cached ? (
                  <span className="cached-badge">
                    <Check className="w-4 h-4" /> 已缓存
                  </span>
                ) : status.downloading ? (
                  <Loader2 className="w-4 h-4 spin" />
                ) : (
                  <button
                    className="download-btn"
                    onClick={() => handleDownloadBook(bookId)}
                    disabled={!online || downloadStatus === 'downloading'}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Cache */}
      <div className="offline-actions">
        <button
          className="clear-cache-btn"
          onClick={handleClearCache}
          disabled={clearing || totalVerses === 0}
        >
          {clearing ? (
            <Loader2 className="w-4 h-4 spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          清除缓存
        </button>
      </div>
    </div>
  );
}