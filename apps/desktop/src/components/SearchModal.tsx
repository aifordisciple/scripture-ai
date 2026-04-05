// apps/desktop/src/components/SearchModal.tsx
/**
 * Search modal for Bible verse search
 *
 * Features:
 * - Search Bible verses by keyword
 * - Display search results with reference
 * - Navigate to verse on click
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { bibleApi, type BibleVerse } from '@scripture-ai/core';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (bookId: string, chapter: number, verse?: number) => void;
}

// Book name mapping for display
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

export function SearchModal({ visible, onClose, onNavigate }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  // Clear state when closing
  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setError(null);
    }
  }, [visible]);

  // Search function
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const verses = await bibleApi.search(query.trim());
      setResults(verses);
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle result click
  const handleResultClick = (verse: BibleVerse) => {
    const bookId = verse.bookId || verse.book || 'gen';
    onNavigate(bookId, verse.chapter, verse.verse);
    onClose();
  };

  // Get display reference
  const getReference = (verse: BibleVerse): string => {
    const bookId = verse.bookId || verse.book || '';
    const bookName = BOOK_NAMES[bookId] || bookId;
    return `${bookName} ${verse.chapter}:${verse.verse}`;
  };

  if (!visible) return null;

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="search-input-container">
          <Search className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="搜索经文..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {loading && <Loader2 className="search-loading spin" />}
          <button className="search-close" onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Results */}
        <div className="search-results">
          {error && (
            <div className="search-error">{error}</div>
          )}

          {results.length > 0 ? (
            <div className="results-list">
              {results.map((verse, index) => (
                <button
                  key={`${verse.bookId}-${verse.chapter}-${verse.verse}-${index}`}
                  className="result-item"
                  onClick={() => handleResultClick(verse)}
                >
                  <span className="result-reference">{getReference(verse)}</span>
                  <span className="result-text">{verse.text}</span>
                </button>
              ))}
            </div>
          ) : query && !loading && !error ? (
            <div className="search-empty">
              <p>未找到相关经文</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}