// apps/desktop/src/pages/ReaderPage.tsx
/**
 * Main Bible reading page for desktop app
 *
 * Displays Bible verses with navigation and reading features
 * Supports verse selection and highlighting
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { bibleApi, type BibleVerse } from '@scripture-ai/core';
import { getAuthAdapter, type Highlight } from '@scripture-ai/native';
import { HighlightToolbar } from '../components';
import { ChevronLeft, ChevronRight, BookOpen, Search, Settings, Bookmark } from 'lucide-react';

// Bible book list - Complete 66 books
const BIBLE_BOOKS = [
  // Old Testament - Pentateuch (摩西五经)
  { id: 'gen', name: '创世记', chapters: 50, testament: 'ot', category: 'pentateuch' },
  { id: 'exod', name: '出埃及记', chapters: 40, testament: 'ot', category: 'pentateuch' },
  { id: 'lev', name: '利未记', chapters: 27, testament: 'ot', category: 'pentateuch' },
  { id: 'num', name: '民数记', chapters: 36, testament: 'ot', category: 'pentateuch' },
  { id: 'deut', name: '申命记', chapters: 34, testament: 'ot', category: 'pentateuch' },
  // Old Testament - Historical Books (历史书)
  { id: 'josh', name: '约书亚记', chapters: 24, testament: 'ot', category: 'historical' },
  { id: 'judg', name: '士师记', chapters: 21, testament: 'ot', category: 'historical' },
  { id: 'ruth', name: '路得记', chapters: 4, testament: 'ot', category: 'historical' },
  { id: '1sam', name: '撒母耳记上', chapters: 31, testament: 'ot', category: 'historical' },
  { id: '2sam', name: '撒母耳记下', chapters: 24, testament: 'ot', category: 'historical' },
  { id: '1kgs', name: '列王纪上', chapters: 22, testament: 'ot', category: 'historical' },
  { id: '2kgs', name: '列王纪下', chapters: 25, testament: 'ot', category: 'historical' },
  { id: '1chr', name: '历代志上', chapters: 29, testament: 'ot', category: 'historical' },
  { id: '2chr', name: '历代志下', chapters: 36, testament: 'ot', category: 'historical' },
  { id: 'ezra', name: '以斯拉记', chapters: 10, testament: 'ot', category: 'historical' },
  { id: 'neh', name: '尼希米记', chapters: 13, testament: 'ot', category: 'historical' },
  { id: 'esth', name: '以斯帖记', chapters: 10, testament: 'ot', category: 'historical' },
  // Old Testament - Poetry (诗歌智慧书)
  { id: 'job', name: '约伯记', chapters: 42, testament: 'ot', category: 'poetry' },
  { id: 'ps', name: '诗篇', chapters: 150, testament: 'ot', category: 'poetry' },
  { id: 'prov', name: '箴言', chapters: 31, testament: 'ot', category: 'poetry' },
  { id: 'eccl', name: '传道书', chapters: 12, testament: 'ot', category: 'poetry' },
  { id: 'song', name: '雅歌', chapters: 8, testament: 'ot', category: 'poetry' },
  // Old Testament - Major Prophets (大先知书)
  { id: 'isa', name: '以赛亚书', chapters: 66, testament: 'ot', category: 'major_prophets' },
  { id: 'jer', name: '耶利米书', chapters: 52, testament: 'ot', category: 'major_prophets' },
  { id: 'lam', name: '耶利米哀歌', chapters: 5, testament: 'ot', category: 'major_prophets' },
  { id: 'ezek', name: '以西结书', chapters: 48, testament: 'ot', category: 'major_prophets' },
  { id: 'dan', name: '但以理书', chapters: 12, testament: 'ot', category: 'major_prophets' },
  // Old Testament - Minor Prophets (小先知书)
  { id: 'hos', name: '何西阿书', chapters: 14, testament: 'ot', category: 'minor_prophets' },
  { id: 'joel', name: '约珥书', chapters: 3, testament: 'ot', category: 'minor_prophets' },
  { id: 'amos', name: '阿摩司书', chapters: 9, testament: 'ot', category: 'minor_prophets' },
  { id: 'obad', name: '俄巴底亚书', chapters: 1, testament: 'ot', category: 'minor_prophets' },
  { id: 'jonah', name: '约拿书', chapters: 4, testament: 'ot', category: 'minor_prophets' },
  { id: 'mic', name: '弥迦书', chapters: 7, testament: 'ot', category: 'minor_prophets' },
  { id: 'nah', name: '那鸿书', chapters: 3, testament: 'ot', category: 'minor_prophets' },
  { id: 'hab', name: '哈巴谷书', chapters: 3, testament: 'ot', category: 'minor_prophets' },
  { id: 'zeph', name: '西番雅书', chapters: 3, testament: 'ot', category: 'minor_prophets' },
  { id: 'hag', name: '哈该书', chapters: 2, testament: 'ot', category: 'minor_prophets' },
  { id: 'zech', name: '撒迦利亚书', chapters: 14, testament: 'ot', category: 'minor_prophets' },
  { id: 'mal', name: '玛拉基书', chapters: 4, testament: 'ot', category: 'minor_prophets' },
  // New Testament - Gospels (福音书)
  { id: 'mat', name: '马太福音', chapters: 28, testament: 'nt', category: 'gospels' },
  { id: 'mark', name: '马可福音', chapters: 16, testament: 'nt', category: 'gospels' },
  { id: 'luke', name: '路加福音', chapters: 24, testament: 'nt', category: 'gospels' },
  { id: 'john', name: '约翰福音', chapters: 21, testament: 'nt', category: 'gospels' },
  // New Testament - History (历史书)
  { id: 'acts', name: '使徒行传', chapters: 28, testament: 'nt', category: 'history' },
  // New Testament - Pauline Epistles (保罗书信)
  { id: 'rom', name: '罗马书', chapters: 16, testament: 'nt', category: 'pauline' },
  { id: '1cor', name: '哥林多前书', chapters: 16, testament: 'nt', category: 'pauline' },
  { id: '2cor', name: '哥林多后书', chapters: 13, testament: 'nt', category: 'pauline' },
  { id: 'gal', name: '加拉太书', chapters: 6, testament: 'nt', category: 'pauline' },
  { id: 'eph', name: '以弗所书', chapters: 6, testament: 'nt', category: 'pauline' },
  { id: 'phil', name: '腓立比书', chapters: 4, testament: 'nt', category: 'pauline' },
  { id: 'col', name: '歌罗西书', chapters: 4, testament: 'nt', category: 'pauline' },
  { id: '1thess', name: '帖撒罗尼迦前书', chapters: 5, testament: 'nt', category: 'pauline' },
  { id: '2thess', name: '帖撒罗尼迦后书', chapters: 3, testament: 'nt', category: 'pauline' },
  { id: '1tim', name: '提摩太前书', chapters: 6, testament: 'nt', category: 'pauline' },
  { id: '2tim', name: '提摩太后书', chapters: 4, testament: 'nt', category: 'pauline' },
  { id: 'titus', name: '提多书', chapters: 3, testament: 'nt', category: 'pauline' },
  { id: 'phlm', name: '腓利门书', chapters: 1, testament: 'nt', category: 'pauline' },
  // New Testament - General Epistles (普通书信)
  { id: 'heb', name: '希伯来书', chapters: 13, testament: 'nt', category: 'general' },
  { id: 'jas', name: '雅各书', chapters: 5, testament: 'nt', category: 'general' },
  { id: '1pet', name: '彼得前书', chapters: 5, testament: 'nt', category: 'general' },
  { id: '2pet', name: '彼得后书', chapters: 3, testament: 'nt', category: 'general' },
  { id: '1john', name: '约翰一书', chapters: 5, testament: 'nt', category: 'general' },
  { id: '2john', name: '约翰二书', chapters: 1, testament: 'nt', category: 'general' },
  { id: '3john', name: '约翰三书', chapters: 1, testament: 'nt', category: 'general' },
  { id: 'jude', name: '犹大书', chapters: 1, testament: 'nt', category: 'general' },
  // New Testament - Prophecy (预言书)
  { id: 'rev', name: '启示录', chapters: 22, testament: 'nt', category: 'prophecy' },
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

  // Highlight feature state
  const [userId, setUserId] = useState<string>('');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showHighlightToolbar, setShowHighlightToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const versesContainerRef = useRef<HTMLDivElement>(null);

  const currentBook = BIBLE_BOOKS.find(b => b.id === bookId) || BIBLE_BOOKS[0];

  // Load user ID on mount
  useEffect(() => {
    async function loadUserId() {
      try {
        const auth = getAuthAdapter();
        const token = await auth.getToken();
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserId(payload.sub || payload.id || 'default-user');
        }
      } catch {
        setUserId('default-user');
      }
    }
    loadUserId();
  }, []);

  // Load highlights when book/chapter/user changes
  useEffect(() => {
    async function loadHighlights() {
      if (!userId || !bookId) return;
      try {
        const data = await invoke<Highlight[]>('db_get_highlights', { userId });
        setHighlights(data || []);
      } catch (error) {
        console.error('Failed to load highlights:', error);
      }
    }
    loadHighlights();
  }, [userId, bookId]);

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

  // Handle verse selection for highlighting
  const handleVerseClick = useCallback((verseNum: number, e: React.MouseEvent) => {
    if (e.shiftKey && selectedVerses.length > 0) {
      // Shift+click: extend selection
      const lastVerse = selectedVerses[selectedVerses.length - 1];
      const start = Math.min(lastVerse, verseNum);
      const end = Math.max(lastVerse, verseNum);
      const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      setSelectedVerses(range);
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+click: toggle verse in selection
      setSelectedVerses(prev =>
        prev.includes(verseNum)
          ? prev.filter(v => v !== verseNum)
          : [...prev, verseNum].sort((a, b) => a - b)
      );
    } else {
      // Normal click: start new selection
      setSelectedVerses([verseNum]);
    }
  }, [selectedVerses]);

  // Show toolbar when verses are selected
  useEffect(() => {
    if (selectedVerses.length > 0 && versesContainerRef.current) {
      const container = versesContainerRef.current;
      const selector = `[data-verse="${selectedVerses[0]}"]`;
      const verseEl = container.querySelector(selector);
      if (verseEl) {
        const rect = verseEl.getBoundingClientRect();
        setToolbarPosition({
          x: rect.left + rect.width / 2 - 100,
          y: rect.top - 50,
        });
        setShowHighlightToolbar(true);
      }
    } else {
      setShowHighlightToolbar(false);
    }
  }, [selectedVerses]);

  // Get highlight for a verse
  const getVerseHighlight = useCallback((verseNum: number): Highlight | undefined => {
    return highlights.find(h =>
      h.book_id === bookId &&
      h.chapter === chapter &&
      verseNum >= h.verse_start &&
      verseNum <= h.verse_end
    );
  }, [highlights, bookId, chapter]);

  // Handle highlight added
  const handleHighlightAdded = useCallback((highlight: Highlight) => {
    setHighlights(prev => [...prev, highlight]);
    setSelectedVerses([]);
  }, []);

  // Handle highlight removed
  const handleHighlightRemoved = useCallback((id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    setSelectedVerses([]);
  }, []);

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
          <button className="icon-btn" title="搜索">
            <Search className="w-5 h-5" />
          </button>
          <button className="icon-btn" title="书签">
            <Bookmark className="w-5 h-5" />
          </button>
          <button className="icon-btn" title="设置">
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
            <div className="book-list-container">
              {/* Old Testament */}
              <div className="book-section">
                <h4 className="book-section-title">旧约</h4>
                <div className="book-list">
                  {BIBLE_BOOKS.filter(b => b.testament === 'ot').map(book => (
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
              {/* New Testament */}
              <div className="book-section">
                <h4 className="book-section-title">新约</h4>
                <div className="book-list">
                  {BIBLE_BOOKS.filter(b => b.testament === 'nt').map(book => (
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
          <div className="verses-container" style={{ fontSize: `${fontSize}px` }} ref={versesContainerRef}>
            {verses.map(verse => {
              const highlight = getVerseHighlight(verse.verse);
              const isSelected = selectedVerses.includes(verse.verse);
              return (
                <div
                  key={verse.id}
                  className={`verse ${highlight ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
                  data-verse={verse.verse}
                  onClick={(e) => handleVerseClick(verse.verse, e)}
                  style={highlight ? { backgroundColor: highlight.color } : undefined}
                >
                  <span className="verse-number">{verse.verse}</span>
                  <span className="verse-text">{verse.text}</span>
                </div>
              );
            })}
          </div>

          {/* Highlight Toolbar */}
          <HighlightToolbar
            visible={showHighlightToolbar}
            position={toolbarPosition}
            bookId={bookId}
            chapter={chapter}
            selectedVerses={selectedVerses}
            userId={userId}
            existingHighlights={highlights}
            onHighlightAdded={handleHighlightAdded}
            onHighlightRemoved={handleHighlightRemoved}
            onClose={() => {
              setShowHighlightToolbar(false);
              setSelectedVerses([]);
            }}
          />
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