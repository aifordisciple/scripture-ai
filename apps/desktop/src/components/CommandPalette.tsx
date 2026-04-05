// apps/desktop/src/components/CommandPalette.tsx
/**
 * Command Palette component for desktop app
 *
 * Provides quick access to commands, navigation, and actions
 * Triggered by Ctrl/Cmd + K
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  BookOpen,
  MessageCircle,
  Calendar,
  Settings,
  Bookmark,
  Moon,
  Sun,
  Download,
  RefreshCw,
  HelpCircle,
  Command,
  ArrowRight,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  category: 'navigation' | 'action' | 'settings';
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onSearch: () => void;
  onToggleTheme: () => void;
  onCheckUpdates: () => void;
  isDarkMode: boolean;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onSearch,
  onToggleTheme,
  onCheckUpdates,
  isDarkMode,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build commands list
  const commands = useMemo<CommandItem[]>(() => [
    {
      id: 'nav-read',
      label: '阅读',
      shortcut: 'Ctrl+1',
      icon: <BookOpen className="w-4 h-4" />,
      category: 'navigation',
      action: () => onNavigate('read'),
    },
    {
      id: 'nav-ai',
      label: 'AI助手',
      shortcut: 'Ctrl+2',
      icon: <MessageCircle className="w-4 h-4" />,
      category: 'navigation',
      action: () => onNavigate('ai'),
    },
    {
      id: 'nav-plan',
      label: '读经计划',
      shortcut: 'Ctrl+3',
      icon: <Calendar className="w-4 h-4" />,
      category: 'navigation',
      action: () => onNavigate('plan'),
    },
    {
      id: 'nav-notes',
      label: '笔记',
      shortcut: 'Ctrl+4',
      icon: <Bookmark className="w-4 h-4" />,
      category: 'navigation',
      action: () => onNavigate('notes'),
    },
    {
      id: 'nav-settings',
      label: '设置',
      shortcut: 'Ctrl+5',
      icon: <Settings className="w-4 h-4" />,
      category: 'navigation',
      action: () => onNavigate('settings'),
    },
    {
      id: 'search',
      label: '搜索经文',
      shortcut: 'Ctrl+F',
      icon: <Search className="w-4 h-4" />,
      category: 'action',
      action: onSearch,
    },
    {
      id: 'theme',
      label: isDarkMode ? '切换浅色模式' : '切换深色模式',
      shortcut: 'Ctrl+Shift+D',
      icon: isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      category: 'settings',
      action: onToggleTheme,
    },
    {
      id: 'updates',
      label: '检查更新',
      icon: <Download className="w-4 h-4" />,
      category: 'action',
      action: onCheckUpdates,
    },
    {
      id: 'shortcuts',
      label: '查看快捷键',
      shortcut: 'Ctrl+/',
      icon: <HelpCircle className="w-4 h-4" />,
      category: 'action',
      action: () => {
        // Will be handled by parent
      },
    },
  ], [onNavigate, onSearch, onToggleTheme, onCheckUpdates, isDarkMode]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.category.includes(q)
    );
  }, [commands, query]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const categoryLabels: Record<string, string> = {
    navigation: '导航',
    action: '操作',
    settings: '设置',
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="command-input-wrapper">
          <Command className="command-input-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-input"
            placeholder="输入命令或搜索..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="command-kbd">ESC</kbd>
        </div>

        {/* Commands List */}
        <div className="command-list" ref={listRef}>
          {Object.entries(groupedCommands).map(([category, items]) => (
            <div key={category} className="command-group">
              <div className="command-group-label">{categoryLabels[category]}</div>
              {items.map((cmd, index) => {
                const globalIndex = filteredCommands.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    data-index={globalIndex}
                    className={`command-item ${globalIndex === selectedIndex ? 'selected' : ''}`}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <span className="command-icon">{cmd.icon}</span>
                    <span className="command-label">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="command-shortcut">{cmd.shortcut}</kbd>
                    )}
                    <ArrowRight className="command-arrow" />
                  </button>
                );
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="command-empty">
              <p>未找到匹配的命令</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="command-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
          <span><kbd>Enter</kbd> 执行</span>
          <span><kbd>Esc</kbd> 关闭</span>
        </div>
      </div>
    </div>
  );
}