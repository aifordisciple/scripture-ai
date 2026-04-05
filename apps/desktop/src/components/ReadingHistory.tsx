// apps/desktop/src/components/ReadingHistory.tsx
/**
 * Reading History component for desktop app
 *
 * Shows recent reading activity with statistics
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Clock, TrendingUp, Calendar, ChevronRight, BookOpen, Flame } from 'lucide-react';

interface HistoryEntry {
  id: string;
  user_id: string;
  book_id: string;
  chapter: number;
  read_at: string;
  duration?: number;
}

interface ReadingHistoryProps {
  userId: string;
  onNavigate: (bookId: string, chapter: number) => void;
}

// Book name mapping
const BOOK_NAMES: Record<string, string> = {
  gen: '创世记', exod: '出埃及记', lev: '利未记', num: '民数记', deut: '申命记',
  josh: '约书亚记', judg: '士师记', ruth: '路得记', '1sam': '撒母耳记上', '2sam': '撒母耳记下',
  '1kgs': '列王纪上', '2kgs': '列王纪下', '1chr': '历代志上', '2chr': '历代志下',
  ezra: '以斯拉记', neh: '尼希米记', esth: '以斯帖记', job: '约伯记', ps: '诗篇',
  prov: '箴言', eccl: '传道书', song: '雅歌', isa: '以赛亚书', jer: '耶利米书',
  lam: '耶利米哀歌', ezek: '以西结书', dan: '但以理书', hos: '何西阿书',
  joel: '约珥书', amos: '阿摩司书', obad: '俄巴底亚书', jonah: '约拿书',
  mic: '弥迦书', nah: '那鸿书', hab: '哈巴谷书', zeph: '西番雅书',
  hag: '哈该书', zech: '撒迦利亚书', mal: '玛拉基书',
  mat: '马太福音', mark: '马可福音', luke: '路加福音', john: '约翰福音',
  acts: '使徒行传', rom: '罗马书', '1cor': '哥林多前书', '2cor': '哥林多后书',
  gal: '加拉太书', eph: '以弗所书', phil: '腓立比书', col: '歌罗西书',
  '1thess': '帖撒罗尼迦前书', '2thess': '帖撒罗尼迦后书',
  '1tim': '提摩太前书', '2tim': '提摩太后书', titus: '提多书',
  phlm: '腓利门书', heb: '希伯来书', jas: '雅各书',
  '1pet': '彼得前书', '2pet': '彼得后书', '1john': '约翰一书',
  '2john': '约翰二书', '3john': '约翰三书', jude: '犹大书', rev: '启示录',
};

export function ReadingHistory({ userId, onNavigate }: ReadingHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalChapters: 0,
    totalDays: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  useEffect(() => {
    loadHistory();
  }, [userId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const entries = await invoke<HistoryEntry[]>('db_get_reading_history', { userId });
      setHistory(entries);
      calculateStats(entries);
    } catch (error) {
      console.error('Failed to load reading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (entries: HistoryEntry[]) => {
    if (entries.length === 0) return;

    // Total chapters
    const totalChapters = entries.length;

    // Calculate streaks
    const dates = [...new Set(entries.map(e => e.read_at.split('T')[0]))].sort().reverse();

    // Current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dates[0] === today || dates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000);

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Longest streak
    let longestStreak = 1;
    let tempStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000);

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    setStats({
      totalChapters,
      totalDays: dates.length,
      currentStreak,
      longestStreak,
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins}分钟`;
  };

  // Group history by date
  const groupedHistory = history.reduce((acc, entry) => {
    const date = entry.read_at.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, HistoryEntry[]>);

  if (loading) {
    return (
      <div className="reading-history-loading">
        <div className="loading-spinner" />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="reading-history">
      {/* Stats */}
      <div className="history-stats">
        <div className="stat-card">
          <BookOpen className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{stats.totalChapters}</span>
            <span className="stat-label">已读章节</span>
          </div>
        </div>

        <div className="stat-card">
          <Calendar className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{stats.totalDays}</span>
            <span className="stat-label">阅读天数</span>
          </div>
        </div>

        <div className="stat-card highlight">
          <Flame className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{stats.currentStreak}</span>
            <span className="stat-label">连续天数</span>
          </div>
        </div>

        <div className="stat-card">
          <TrendingUp className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{stats.longestStreak}</span>
            <span className="stat-label">最长连续</span>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="history-list">
        <h3 className="history-title">阅读记录</h3>

        {Object.keys(groupedHistory).length === 0 ? (
          <div className="history-empty">
            <Clock className="empty-icon" />
            <p>暂无阅读记录</p>
            <p className="hint">开始阅读圣经，记录你的旅程</p>
          </div>
        ) : (
          Object.entries(groupedHistory).map(([date, entries]) => (
            <div key={date} className="history-group">
              <div className="history-date">
                {formatDate(entries[0].read_at)}
              </div>
              <div className="history-entries">
                {entries.map(entry => (
                  <button
                    key={entry.id}
                    className="history-entry"
                    onClick={() => onNavigate(entry.book_id, entry.chapter)}
                  >
                    <span className="entry-book">
                      {BOOK_NAMES[entry.book_id] || entry.book_id}
                    </span>
                    <span className="entry-chapter">第{entry.chapter}章</span>
                    {entry.duration && (
                      <span className="entry-duration">
                        {formatDuration(entry.duration)}
                      </span>
                    )}
                    <ChevronRight className="entry-arrow" />
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}