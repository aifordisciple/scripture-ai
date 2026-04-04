// apps/desktop/src/components/HighlightToolbar.tsx
/**
 * Floating toolbar for adding highlights to selected verses
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Highlighter, X, Check, MessageCircle } from 'lucide-react';
import type { Highlight } from '@scripture-ai/native';

interface HighlightToolbarProps {
  visible: boolean;
  position: { x: number; y: number };
  bookId: string;
  chapter: number;
  selectedVerses: number[];
  userId: string;
  existingHighlights: Highlight[];
  onHighlightAdded: (highlight: Highlight) => void;
  onHighlightRemoved: (id: string) => void;
  onClose: () => void;
  onAskAI?: (bookId: string, chapter: number, verses: number[]) => void;
}

const HIGHLIGHT_COLORS = [
  { id: 'yellow', color: '#fef08a', label: '黄色' },
  { id: 'green', color: '#bbf7d0', label: '绿色' },
  { id: 'blue', color: '#bfdbfe', label: '蓝色' },
  { id: 'pink', color: '#fbcfe8', label: '粉色' },
  { id: 'orange', color: '#fed7aa', label: '橙色' },
  { id: 'purple', color: '#e9d5ff', label: '紫色' },
];

export function HighlightToolbar({
  visible,
  position,
  bookId,
  chapter,
  selectedVerses,
  userId,
  existingHighlights,
  onHighlightAdded,
  onHighlightRemoved,
  onClose,
  onAskAI,
}: HighlightToolbarProps) {
  const [saving, setSaving] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Check if verses already have highlights
  const existingHighlight = existingHighlights.find(h =>
    selectedVerses.length > 0 &&
    h.book_id === bookId &&
    h.chapter === chapter &&
    h.verse_start === selectedVerses[0] &&
    h.verse_end === selectedVerses[selectedVerses.length - 1]
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [visible, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onClose]);

  const handleAddHighlight = async (colorId: string) => {
    if (saving || selectedVerses.length === 0) return;

    setSaving(true);
    try {
      const color = HIGHLIGHT_COLORS.find(c => c.id === colorId)?.color || '#fef08a';
      const highlight: Highlight = {
        id: `${bookId}-${chapter}-${selectedVerses[0]}-${Date.now()}`,
        user_id: userId,
        book_id: bookId,
        chapter: chapter,
        verse_start: selectedVerses[0],
        verse_end: selectedVerses[selectedVerses.length - 1],
        color: color,
        created_at: new Date().toISOString(),
      };

      await invoke('db_save_highlight', { highlight });
      onHighlightAdded(highlight);
      onClose();
    } catch (error) {
      console.error('Failed to save highlight:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveHighlight = async () => {
    if (!existingHighlight || saving) return;

    setSaving(true);
    try {
      await invoke('db_delete_highlight', { id: existingHighlight.id });
      onHighlightRemoved(existingHighlight.id);
      onClose();
    } catch (error) {
      console.error('Failed to remove highlight:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!visible || selectedVerses.length === 0) return null;

  return (
    <div
      ref={toolbarRef}
      className="highlight-toolbar"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="toolbar-header">
        <Highlighter className="w-4 h-4" />
        <span>高亮 {selectedVerses.length} 节</span>
        <button className="close-btn" onClick={onClose}>
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="color-options">
        {HIGHLIGHT_COLORS.map(c => (
          <button
            key={c.id}
            className={`color-btn ${existingHighlight?.color === c.color ? 'active' : ''}`}
            style={{ backgroundColor: c.color }}
            onClick={() => handleAddHighlight(c.id)}
            disabled={saving}
            title={c.label}
          >
            {existingHighlight?.color === c.color && <Check className="w-3 h-3" />}
          </button>
        ))}
      </div>

      {onAskAI && (
        <button
          className="ask-ai-btn"
          onClick={() => onAskAI(bookId, chapter, selectedVerses)}
          title="向AI助手询问这些经文"
        >
          <MessageCircle className="w-4 h-4" />
          <span>询问AI</span>
        </button>
      )}

      {existingHighlight && (
        <button className="remove-btn" onClick={handleRemoveHighlight} disabled={saving}>
          删除高亮
        </button>
      )}
    </div>
  );
}