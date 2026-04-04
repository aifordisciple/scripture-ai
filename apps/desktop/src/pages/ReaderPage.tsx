// apps/desktop/src/pages/ReaderPage.tsx
/**
 * Main Bible reading page for desktop app
 *
 * Displays Bible verses with navigation and reading features
 */

import { useState, useEffect, useCallback } from 'react';
import { bibleApi, type BibleVerse } from '@scripture-ai/core';
import { ChevronLeft, ChevronRight, BookOpen, Search, Settings } from 'lucide-react';

// Bible book list (simplified - full list in packages/core)
const BIBLE_BOOKS = [
  { id: 'gen', name: '创世记', chapters: 50 },
  { id: 'exod', name: '出埃及记', chapters: 40 },
  { id: 'lev', name: '利未记', chapters: 27 },
  { id: 'num', name: '民数记', chapters: 36 },
  { id: 'deut', name: '申命记', chapters: 34 },
  { id: 'josh', name: '约书亚记', chapters: 24 },
  { id: 'judg', name: '士师记', chapters: 21 },
  { id: 'ruth', name: '路得记', chapters: 4 },
  { id: '1sam', name: '撒母耳记上', chapters: 31 },
  { id: '2sam', name: '撒母耳记下', chapters: 24 },
  { id: '1kgs', name: '列王纪上', chapters: 22 },
  { id: '2kgs', name: '列王纪下', chapters: 25 },
  // ... more books
  { id: 'ps', name: '诗篇', chapters: 150 },
  { id: 'prov', name: '箴言', chapters: 31 },
  { id: 'eccl', name: '传道书', chapters: 12 },
  { id: 'song', name: '雅歌', chapters: 8 },
  { id: 'isa', name: '以赛亚书', chapters: 66 },
  { id: 'jer', name: '耶利米书', chapters: 52 },
  { id: 'lam', name: '耶利米哀歌', chapters: 5 },
  { id: 'ezek', name: '以西结书', chapters: 48 },
  { id: 'dan', name: '但以理书', chapters: 12 },
  // ... more books
  { id: 'mat', name: '马太福音', chapters: 28 },
  { id: 'mark', name: '马可福音', chapters: 16 },
  { id: 'luke', name: '路加福音', chapters: 24 },
  { id: 'john', name: '约翰福音', chapters: 21 },
  { id: 'acts', name: '使徒行传', chapters: 28 },
  { id: 'rom', name: '罗马书', chapters: 16 },
  { id: '1cor', name: '哥林多前书', chapters: 16 },
  { id: '2cor', name: '哥林多后书', chapters: 13 },
  { id: 'gal', name: '加拉太书', chapters: 6 },
  { id: 'eph', name: '以弗所书', chapters: 6 },
  { id: 'phil', name: '腓立比书', chapters: 4 },
  { id: 'col', name: '歌罗西书', chapters: 4 },
  { id: 'rev', name: '启示录', chapters: 22 },
];

interface ReaderPageProps {
  initialBook?: string;
  initialChapter?: number;
}

export function ReaderPage({ initialBook = 'gen', initialChapter = 1 }: ReaderPageProps) {
  const [bookId, setBookId] = useState(initialBook);
  const [chapter, setChapter] = useState(initialChapter);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  const currentBook = BIBLE_BOOKS.find(b => b.id === bookId) || BIBLE_BOOKS[0];

  // Fetch verses when book/chapter changes
  useEffect(() => {
    let cancelled = false;

    async function fetchVerses() {
      setLoading(true);
      setError(null);

      try {
        const data = await bibleApi.getChapter(bookId, chapter);
        if (!cancelled) {
          setVerses(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchVerses();

    return () => {
      cancelled = true;
    };
  }, [bookId, chapter]);

  // Navigation handlers
  const goToPrevChapter = useCallback(() => {
    if (chapter > 1) {
      setChapter(chapter - 1);
    } else {
      // Go to last chapter of previous book
      const bookIndex = BIBLE_BOOKS.findIndex(b => b.id === bookId);
      if (bookIndex > 0) {
        const prevBook = BIBLE_BOOKS[bookIndex - 1];
        setBookId(prevBook.id);
        setChapter(prevBook.chapters);
      }
    }
  }, [bookId, chapter]);

  const goToNextChapter = useCallback(() => {
    if (chapter < currentBook.chapters) {
      setChapter(chapter + 1);
    } else {
      // Go to first chapter of next book
      const bookIndex = BIBLE_BOOKS.findIndex(b => b.id === bookId);
      if (bookIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[bookIndex + 1];
        setBookId(nextBook.id);
        setChapter(1);
      }
    }
  }, [bookId, chapter, currentBook.chapters]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevChapter();
      } else if (e.key === 'ArrowRight') {
        goToNextChapter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevChapter, goToNextChapter]);

  return (
    <div className="reader-page">
      {/* Header */}
      <header className="reader-header">
        <div className="header-left">
          <button
            className="book-selector"
            onClick={() => setShowBookPicker(!showBookPicker)}
          >
            <BookOpen className="w-4 h-4" />
            <span>{currentBook.name} {chapter}章</span>
          </button>
        </div>

        <div className="header-center">
          <button
            className="nav-btn"
            onClick={goToPrevChapter}
            disabled={bookId === 'gen' && chapter === 1}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="chapter-indicator">
            {chapter} / {currentBook.chapters}
          </span>
          <button
            className="nav-btn"
            onClick={goToNextChapter}
            disabled={bookId === 'rev' && chapter === currentBook.chapters}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="header-right">
          <button className="icon-btn">
            <Search className="w-5 h-5" />
          </button>
          <button className="icon-btn">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Book Picker Dropdown */}
      {showBookPicker && (
        <div className="book-picker-overlay" onClick={() => setShowBookPicker(false)}>
          <div className="book-picker" onClick={e => e.stopPropagation()}>
            <div className="book-picker-header">
              <h3>选择书卷</h3>
            </div>
            <div className="book-list">
              {BIBLE_BOOKS.map(book => (
                <button
                  key={book.id}
                  className={`book-item ${book.id === bookId ? 'active' : ''}`}
                  onClick={() => {
                    setBookId(book.id);
                    setChapter(1);
                    setShowBookPicker(false);
                  }}
                >
                  {book.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="reader-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>加载中...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={() => setChapter(chapter)}>重试</button>
          </div>
        ) : (
          <div className="verses-container" style={{ fontSize: `${fontSize}px` }}>
            {verses.map(verse => (
              <div key={verse.id} className="verse" data-verse={verse.verse}>
                <span className="verse-number">{verse.verse}</span>
                <span className="verse-text">{verse.text}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="reader-footer">
        <div className="font-controls">
          <button onClick={() => setFontSize(Math.max(12, fontSize - 2))}>A-</button>
          <span>{fontSize}px</span>
          <button onClick={() => setFontSize(Math.min(28, fontSize + 2))}>A+</button>
        </div>
      </footer>
    </div>
  );
}