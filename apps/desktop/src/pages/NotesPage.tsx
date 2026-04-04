// apps/desktop/src/pages/NotesPage.tsx
/**
 * Notes and Highlights page for desktop app
 *
 * Features:
 * - View all highlights
 * - View all notes
 * - Create/edit/delete notes
 * - Sync with server
 */

import { useState, useEffect, useCallback } from 'react';
import { Bookmark, FileText, Plus, Trash2, Edit2, Search, Sync } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getAuthAdapter } from '@scripture-ai/native';
import type { Highlight, Note } from '@scripture-ai/native';

type TabId = 'highlights' | 'notes';

interface BibleBook {
  id: string;
  name: string;
}

// Simplified book list
const BOOKS: BibleBook[] = [
  { id: 'gen', name: '创世记' },
  { id: 'exod', name: '出埃及记' },
  { id: 'lev', name: '利未记' },
  { id: 'num', name: '民数记' },
  { id: 'deut', name: '申命记' },
  { id: 'ps', name: '诗篇' },
  { id: 'prov', name: '箴言' },
  { id: 'isa', name: '以赛亚书' },
  { id: 'mat', name: '马太福音' },
  { id: 'mark', name: '马可福音' },
  { id: 'luke', name: '路加福音' },
  { id: 'john', name: '约翰福音' },
  { id: 'acts', name: '使徒行传' },
  { id: 'rom', name: '罗马书' },
  { id: 'rev', name: '启示录' },
];

const HIGHLIGHT_COLORS = [
  { id: 'yellow', color: '#fef08a', label: '黄色' },
  { id: 'green', color: '#bbf7d0', label: '绿色' },
  { id: 'blue', color: '#bfdbfe', label: '蓝色' },
  { id: 'pink', color: '#fbcfe8', label: '粉色' },
  { id: 'purple', color: '#e9d5ff', label: '紫色' },
];

export function NotesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('highlights');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const auth = getAuthAdapter();
      const userId = await auth.getUserId?.() || 'local-user';

      const [loadedHighlights, loadedNotes] = await Promise.all([
        invoke<Highlight[]>('db_get_highlights', { userId }),
        invoke<Note[]>('db_get_notes', { userId }),
      ]);

      setHighlights(loadedHighlights);
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync with server
  const syncWithServer = async () => {
    setSyncing(true);
    try {
      // In real app, call sync API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Sync completed');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Delete highlight
  const deleteHighlight = async (id: string) => {
    try {
      await invoke('db_delete_highlight', { id });
      setHighlights(prev => prev.filter(h => h.id !== id));
    } catch (error) {
      console.error('Failed to delete highlight:', error);
    }
  };

  // Delete note
  const deleteNote = async (id: string) => {
    try {
      await invoke('db_delete_note', { id });
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // Save note
  const saveNote = async () => {
    if (!newNoteContent.trim()) return;

    const auth = getAuthAdapter();
    const userId = await auth.getUserId?.() || 'local-user';

    try {
      const note: Note = {
        id: editingNote?.id || `note-${Date.now()}`,
        userId,
        bookId: editingNote?.bookId || 'gen',
        chapter: editingNote?.chapter || 1,
        verseStart: editingNote?.verseStart || 1,
        content: newNoteContent,
        createdAt: editingNote?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await invoke('db_save_note', { note });

      if (editingNote) {
        setNotes(prev => prev.map(n => n.id === note.id ? note : n));
      } else {
        setNotes(prev => [...prev, note]);
      }

      setShowNoteEditor(false);
      setEditingNote(null);
      setNewNoteContent('');
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  // Get book name
  const getBookName = (bookId: string) => {
    return BOOKS.find(b => b.id === bookId)?.name || bookId;
  };

  // Filter items by search
  const filteredHighlights = highlights.filter(h => {
    if (!searchQuery) return true;
    const bookName = getBookName(h.bookId);
    return bookName.includes(searchQuery) || h.color.includes(searchQuery);
  });

  const filteredNotes = notes.filter(n => {
    if (!searchQuery) return true;
    return n.content.includes(searchQuery) || getBookName(n.bookId).includes(searchQuery);
  });

  return (
    <div className="notes-page">
      {/* Header */}
      <header className="notes-header">
        <div className="header-left">
          <h2>笔记与高亮</h2>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className={`sync-btn ${syncing ? 'syncing' : ''}`}
            onClick={syncWithServer}
            disabled={syncing}
          >
            <Sync className="w-4 h-4" />
            {syncing ? '同步中...' : '同步'}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="notes-tabs">
        <button
          className={`tab-btn ${activeTab === 'highlights' ? 'active' : ''}`}
          onClick={() => setActiveTab('highlights')}
        >
          <Bookmark className="w-4 h-4" />
          高亮 ({highlights.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <FileText className="w-4 h-4" />
          笔记 ({notes.length})
        </button>
      </div>

      {/* Content */}
      <div className="notes-content">
        {loading ? (
          <div className="loading-state">加载中...</div>
        ) : activeTab === 'highlights' ? (
          /* Highlights List */
          <div className="items-list">
            {filteredHighlights.length === 0 ? (
              <div className="empty-state">
                <Bookmark className="w-12 h-12 text-muted" />
                <p>暂无高亮</p>
                <p className="hint">在阅读时选中经文可添加高亮</p>
              </div>
            ) : (
              filteredHighlights.map(highlight => (
                <div key={highlight.id} className="item-card highlight-card">
                  <div
                    className="highlight-color-bar"
                    style={{ backgroundColor: HIGHLIGHT_COLORS.find(c => c.id === highlight.color)?.color || '#fef08a' }}
                  />
                  <div className="item-content">
                    <div className="item-header">
                      <span className="item-reference">
                        {getBookName(highlight.bookId)} {highlight.chapter}:{highlight.verseStart}
                        {highlight.verseEnd > highlight.verseStart && `-${highlight.verseEnd}`}
                      </span>
                      <button
                        className="delete-btn"
                        onClick={() => deleteHighlight(highlight.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="item-date">
                      {new Date(highlight.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Notes List */
          <div className="items-list">
            <button
              className="add-note-btn"
              onClick={() => {
                setEditingNote(null);
                setNewNoteContent('');
                setShowNoteEditor(true);
              }}
            >
              <Plus className="w-5 h-5" />
              新建笔记
            </button>

            {filteredNotes.length === 0 ? (
              <div className="empty-state">
                <FileText className="w-12 h-12 text-muted" />
                <p>暂无笔记</p>
              </div>
            ) : (
              filteredNotes.map(note => (
                <div key={note.id} className="item-card note-card">
                  <div className="item-content">
                    <div className="item-header">
                      <span className="item-reference">
                        {getBookName(note.bookId)} {note.chapter}:{note.verseStart}
                      </span>
                      <div className="item-actions">
                        <button onClick={() => {
                          setEditingNote(note);
                          setNewNoteContent(note.content);
                          setShowNoteEditor(true);
                        }}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteNote(note.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="note-preview">
                      {note.content.length > 100 ? `${note.content.slice(0, 100)}...` : note.content}
                    </div>
                    <div className="item-date">
                      {new Date(note.updatedAt || note.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Note Editor Modal */}
      {showNoteEditor && (
        <div className="modal-overlay" onClick={() => setShowNoteEditor(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingNote ? '编辑笔记' : '新建笔记'}</h3>
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="输入笔记内容..."
              rows={10}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowNoteEditor(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={saveNote}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}