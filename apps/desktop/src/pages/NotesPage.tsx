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

import { useState, useEffect } from 'react';
import { Bookmark, FileText, Plus, Trash2, Edit2, Search, RefreshCw } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getAuthAdapter } from '@scripture-ai/native';
import type { Highlight, Note } from '@scripture-ai/native';
import { syncWithServer as performSync } from '../utils/sync';

type TabId = 'highlights' | 'notes';

interface BibleBook {
  id: string;
  name: string;
}

// Complete 66 books of the Bible
const BOOKS: BibleBook[] = [
  // Old Testament - Pentateuch (摩西五经)
  { id: 'gen', name: '创世记' },
  { id: 'exod', name: '出埃及记' },
  { id: 'lev', name: '利未记' },
  { id: 'num', name: '民数记' },
  { id: 'deut', name: '申命记' },
  // Old Testament - Historical Books (历史书)
  { id: 'josh', name: '约书亚记' },
  { id: 'judg', name: '士师记' },
  { id: 'ruth', name: '路得记' },
  { id: '1sam', name: '撒母耳记上' },
  { id: '2sam', name: '撒母耳记下' },
  { id: '1kgs', name: '列王纪上' },
  { id: '2kgs', name: '列王纪下' },
  { id: '1chr', name: '历代志上' },
  { id: '2chr', name: '历代志下' },
  { id: 'ezra', name: '以斯拉记' },
  { id: 'neh', name: '尼希米记' },
  { id: 'esth', name: '以斯帖记' },
  // Old Testament - Poetry (诗歌智慧书)
  { id: 'job', name: '约伯记' },
  { id: 'ps', name: '诗篇' },
  { id: 'prov', name: '箴言' },
  { id: 'eccl', name: '传道书' },
  { id: 'song', name: '雅歌' },
  // Old Testament - Major Prophets (大先知书)
  { id: 'isa', name: '以赛亚书' },
  { id: 'jer', name: '耶利米书' },
  { id: 'lam', name: '耶利米哀歌' },
  { id: 'ezek', name: '以西结书' },
  { id: 'dan', name: '但以理书' },
  // Old Testament - Minor Prophets (小先知书)
  { id: 'hos', name: '何西阿书' },
  { id: 'joel', name: '约珥书' },
  { id: 'amos', name: '阿摩司书' },
  { id: 'obad', name: '俄巴底亚书' },
  { id: 'jonah', name: '约拿书' },
  { id: 'mic', name: '弥迦书' },
  { id: 'nah', name: '那鸿书' },
  { id: 'hab', name: '哈巴谷书' },
  { id: 'zeph', name: '西番雅书' },
  { id: 'hag', name: '哈该书' },
  { id: 'zech', name: '撒迦利亚书' },
  { id: 'mal', name: '玛拉基书' },
  // New Testament - Gospels (福音书)
  { id: 'mat', name: '马太福音' },
  { id: 'mark', name: '马可福音' },
  { id: 'luke', name: '路加福音' },
  { id: 'john', name: '约翰福音' },
  // New Testament - History (历史书)
  { id: 'acts', name: '使徒行传' },
  // New Testament - Pauline Epistles (保罗书信)
  { id: 'rom', name: '罗马书' },
  { id: '1cor', name: '哥林多前书' },
  { id: '2cor', name: '哥林多后书' },
  { id: 'gal', name: '加拉太书' },
  { id: 'eph', name: '以弗所书' },
  { id: 'phil', name: '腓立比书' },
  { id: 'col', name: '歌罗西书' },
  { id: '1thess', name: '帖撒罗尼迦前书' },
  { id: '2thess', name: '帖撒罗尼迦后书' },
  { id: '1tim', name: '提摩太前书' },
  { id: '2tim', name: '提摩太后书' },
  { id: 'titus', name: '提多书' },
  { id: 'phlm', name: '腓利门书' },
  // New Testament - General Epistles (普通书信)
  { id: 'heb', name: '希伯来书' },
  { id: 'jas', name: '雅各书' },
  { id: '1pet', name: '彼得前书' },
  { id: '2pet', name: '彼得后书' },
  { id: '1john', name: '约翰一书' },
  { id: '2john', name: '约翰二书' },
  { id: '3john', name: '约翰三书' },
  { id: 'jude', name: '犹大书' },
  // New Testament - Prophecy (预言书)
  { id: 'rev', name: '启示录' },
];

const HIGHLIGHT_COLORS = [
  { id: 'yellow', color: '#fef08a', label: '黄色' },
  { id: 'green', color: '#bbf7d0', label: '绿色' },
  { id: 'blue', color: '#bfdbfe', label: '蓝色' },
  { id: 'pink', color: '#fbcfe8', label: '粉色' },
  { id: 'purple', color: '#e9d5ff', label: '紫色' },
];

interface NotesPageProps {
  onNavigate?: (bookId: string, chapter: number) => void;
}

export function NotesPage({ onNavigate }: NotesPageProps) {
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
  const handleSync = async () => {
    setSyncing(true);
    try {
      const auth = getAuthAdapter();
      const token = await auth.getToken();
      if (!token) {
        console.error('Not authenticated');
        return;
      }

      const userId = await auth.getUserId?.() || 'local-user';
      const result = await performSync(userId);

      if (result.success) {
        console.log('Sync completed:', result);
        // Reload data after sync
        await loadData();
      } else {
        console.error('Sync failed:', result.error);
      }
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
        user_id: userId,
        book_id: editingNote?.book_id || 'gen',
        chapter: editingNote?.chapter || 1,
        verse_start: editingNote?.verse_start || 1,
        content: newNoteContent,
        created_at: editingNote?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
    const bookName = getBookName(h.book_id);
    return bookName.includes(searchQuery) || h.color.includes(searchQuery);
  });

  const filteredNotes = notes.filter(n => {
    if (!searchQuery) return true;
    return n.content.includes(searchQuery) || getBookName(n.book_id).includes(searchQuery);
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
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'spin' : ''}`} />
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
                <div
                  key={highlight.id}
                  className="item-card highlight-card clickable"
                  onClick={() => onNavigate?.(highlight.book_id, highlight.chapter)}
                  title="点击跳转到此经文"
                >
                  <div
                    className="highlight-color-bar"
                    style={{ backgroundColor: HIGHLIGHT_COLORS.find(c => c.id === highlight.color)?.color || '#fef08a' }}
                  />
                  <div className="item-content">
                    <div className="item-header">
                      <span className="item-reference">
                        {getBookName(highlight.book_id)} {highlight.chapter}:{highlight.verse_start}
                        {highlight.verse_end > highlight.verse_start && `-${highlight.verse_end}`}
                      </span>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHighlight(highlight.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="item-date">
                      {new Date(highlight.created_at).toLocaleDateString('zh-CN')}
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
                <div
                  key={note.id}
                  className="item-card note-card clickable"
                  onClick={() => onNavigate?.(note.book_id, note.chapter)}
                  title="点击跳转到此经文"
                >
                  <div className="item-content">
                    <div className="item-header">
                      <span className="item-reference">
                        {getBookName(note.book_id)} {note.chapter}:{note.verse_start}
                      </span>
                      <div className="item-actions">
                        <button onClick={(e) => {
                          e.stopPropagation();
                          setEditingNote(note);
                          setNewNoteContent(note.content);
                          setShowNoteEditor(true);
                        }}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="note-preview">
                      {note.content.length > 100 ? `${note.content.slice(0, 100)}...` : note.content}
                    </div>
                    <div className="item-date">
                      {new Date(note.updated_at || note.created_at).toLocaleDateString('zh-CN')}
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