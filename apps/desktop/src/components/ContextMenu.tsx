// apps/desktop/src/components/ContextMenu.tsx
/**
 * Context Menu component for desktop app
 *
 * Provides right-click menu functionality for Bible verses
 */

import { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Highlighter,
  MessageSquare,
  Share2,
  Bot,
  Bookmark,
  Search,
} from 'lucide-react';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuProps {
  visible: boolean;
  position: ContextMenuPosition;
  verseNumbers: number[];
  hasHighlight: boolean;
  highlightColor?: string;
  onClose: () => void;
  onCopy: () => void;
  onHighlight: (color: string) => void;
  onRemoveHighlight: () => void;
  onAddNote: () => void;
  onShare: () => void;
  onAskAI: () => void;
  onBookmark: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: '黄色', color: '#fef08a' },
  { name: '绿色', color: '#bbf7d0' },
  { name: '蓝色', color: '#bfdbfe' },
  { name: '粉色', color: '#fbcfe8' },
  { name: '紫色', color: '#e9d5ff' },
  { name: '橙色', color: '#fed7aa' },
];

export function ContextMenu({
  visible,
  position,
  verseNumbers,
  hasHighlight,
  highlightColor,
  onClose,
  onCopy,
  onHighlight,
  onRemoveHighlight,
  onAddNote,
  onShare,
  onAskAI,
  onBookmark,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (visible && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const { innerWidth, innerHeight } = window;

      if (rect.right > innerWidth) {
        menuRef.current.style.left = `${position.x - rect.width}px`;
      }
      if (rect.bottom > innerHeight) {
        menuRef.current.style.top = `${position.y - rect.height}px`;
      }
    }
  }, [visible, position]);

  if (!visible) return null;

  const verseText = verseNumbers.length === 1
    ? `第${verseNumbers[0]}节`
    : `第${Math.min(...verseNumbers)}-${Math.max(...verseNumbers)}节`;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
    >
      <div className="context-menu-header">
        {verseText}
      </div>

      <div className="context-menu-items">
        <button
          className="context-menu-item"
          onClick={() => {
            onCopy();
            onClose();
          }}
        >
          <Copy className="w-4 h-4" />
          <span>复制经文</span>
        </button>

        <div className="context-menu-divider" />

        <div className="context-menu-submenu">
          <button
            className="context-menu-item"
            onMouseEnter={() => setShowColorPicker(true)}
            onMouseLeave={() => setShowColorPicker(false)}
          >
            <Highlighter className="w-4 h-4" />
            <span>高亮标注</span>
            <span className="submenu-arrow">▶</span>
          </button>

          {showColorPicker && (
            <div
              className="color-picker"
              onMouseEnter={() => setShowColorPicker(true)}
              onMouseLeave={() => setShowColorPicker(false)}
            >
              {hasHighlight && (
                <button
                  className="color-option remove"
                  onClick={() => {
                    onRemoveHighlight();
                    onClose();
                  }}
                >
                  移除高亮
                </button>
              )}
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.color}
                  className={`color-option ${highlightColor === c.color ? 'active' : ''}`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                  onClick={() => {
                    onHighlight(c.color);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <button
          className="context-menu-item"
          onClick={() => {
            onAddNote();
            onClose();
          }}
        >
          <MessageSquare className="w-4 h-4" />
          <span>添加笔记</span>
        </button>

        <button
          className="context-menu-item"
          onClick={() => {
            onBookmark();
            onClose();
          }}
        >
          <Bookmark className="w-4 h-4" />
          <span>添加书签</span>
        </button>

        <div className="context-menu-divider" />

        <button
          className="context-menu-item"
          onClick={() => {
            onShare();
            onClose();
          }}
        >
          <Share2 className="w-4 h-4" />
          <span>分享经文</span>
        </button>

        <button
          className="context-menu-item ai"
          onClick={() => {
            onAskAI();
            onClose();
          }}
        >
          <Bot className="w-4 h-4" />
          <span>AI 解读</span>
        </button>
      </div>
    </div>
  );
}