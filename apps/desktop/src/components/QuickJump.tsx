// apps/desktop/src/components/QuickJump.tsx
/**
 * Quick Jump component for desktop app
 *
 * Provides quick navigation to verses using keyboard shortcut
 * Supports various input formats:
 * - "John 3:16" or "约翰福音 3:16"
 * - "创 1" or "Gen 1"
 * - "诗 23" or "Ps 23"
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { parseVerseRef, formatVerseRef } from '../utils/verseRefParser';

interface QuickJumpProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (bookId: string, chapter: number, verse?: number) => void;
  recentReadings?: Array<{
    bookId: string;
    bookName: string;
    chapter: number;
    timestamp: number;
  }>;
}

// Popular verses for suggestions
const POPULAR_VERSES = [
  { ref: '约翰福音 3:16', bookId: 'john', chapter: 3, verse: 16, topic: '神的爱' },
  { ref: '诗篇 23:1', bookId: 'ps', chapter: 23, verse: 1, topic: '牧者' },
  { ref: '罗马书 8:28', bookId: 'rom', chapter: 8, verse: 28, topic: '万事互相效力' },
  { ref: '腓立比书 4:13', bookId: 'phil', chapter: 4, verse: 13, topic: '靠主凡事能' },
  { ref: '耶利米书 29:11', bookId: 'jer', chapter: 29, verse: 11, topic: '神的计划' },
  { ref: '以赛亚书 40:31', bookId: 'isa', chapter: 40, verse: 31, topic: '重新得力' },
  { ref: '马太福音 5:14', bookId: 'mat', chapter: 5, verse: 14, topic: '世上的光' },
  { ref: '创世记 1:1', bookId: 'gen', chapter: 1, verse: 1, topic: '创造' },
];

export function QuickJump({
  isOpen,
  onClose,
  onNavigate,
  recentReadings = [],
}: QuickJumpProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<Array<{
    type: 'parsed' | 'recent' | 'popular';
    label: string;
    sublabel?: string;
    bookId: string;
    chapter: number;
    verse?: number;
  }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Generate suggestions based on query
  useEffect(() => {
    const newSuggestions: typeof suggestions = [];

    if (query.trim()) {
      // Try to parse as verse reference
      const parsed = parseVerseRef(query);
      if (parsed.isValid) {
        newSuggestions.push({
          type: 'parsed',
          label: formatVerseRef(parsed.bookId, parsed.chapter, parsed.verseStart, parsed.verseEnd),
          sublabel: '按 Enter 跳转',
          bookId: parsed.bookId,
          chapter: parsed.chapter,
          verse: parsed.verseStart,
        });
      }
    } else {
      // Show recent readings
      recentReadings.slice(0, 3).forEach(reading => {
        newSuggestions.push({
          type: 'recent',
          label: `${reading.bookName} ${reading.chapter}章`,
          sublabel: '最近阅读',
          bookId: reading.bookId,
          chapter: reading.chapter,
        });
      });

      // Show popular verses
      POPULAR_VERSES.slice(0, 4).forEach(verse => {
        newSuggestions.push({
          type: 'popular',
          label: verse.ref,
          sublabel: verse.topic,
          bookId: verse.bookId,
          chapter: verse.chapter,
          verse: verse.verse,
        });
      });
    }

    setSuggestions(newSuggestions);
    setSelectedIndex(0);
  }, [query, recentReadings]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          const s = suggestions[selectedIndex];
          onNavigate(s.bookId, s.chapter, s.verse);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [suggestions, selectedIndex, onNavigate, onClose]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
    onNavigate(suggestion.bookId, suggestion.chapter, suggestion.verse);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="quick-jump-overlay" onClick={onClose}>
      <div className="quick-jump" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="quick-jump-input-wrapper">
          <Navigation className="quick-jump-icon" />
          <input
            ref={inputRef}
            type="text"
            className="quick-jump-input"
            placeholder="输入经文引用快速跳转，如：约3:16、创1、诗篇23"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="quick-jump-kbd">ESC</kbd>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="quick-jump-suggestions">
            {suggestions.map((s, index) => (
              <button
                key={`${s.type}-${s.bookId}-${s.chapter}-${s.verse || ''}`}
                className={`quick-jump-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSuggestionClick(s)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="quick-jump-item-icon">
                  {s.type === 'recent' && <Clock className="w-4 h-4" />}
                  {s.type === 'popular' && <TrendingUp className="w-4 h-4" />}
                  {s.type === 'parsed' && <BookOpen className="w-4 h-4" />}
                </span>
                <span className="quick-jump-item-label">{s.label}</span>
                {s.sublabel && (
                  <span className="quick-jump-item-sublabel">{s.sublabel}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {query.trim() && suggestions.length === 0 && (
          <div className="quick-jump-empty">
            <p>未找到匹配的经文</p>
            <p className="hint">试试输入"约3:16"或"创世记 1"</p>
          </div>
        )}

        {/* Footer */}
        <div className="quick-jump-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
          <span><kbd>Enter</kbd> 跳转</span>
        </div>
      </div>
    </div>
  );
}