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
import { getAuthAdapter, getStorageAdapter, type Highlight, type Bookmark as BookmarkType } from '@scripture-ai/native';
import { HighlightToolbar, SearchModal, AudioPlayer, TabBar, createReadingTab, type ReadingTab, ShareCard, ContextMenu, PrintPreview, ReadingProgress, useReadingProgress } from '../components';
import { getChapter, isOnline } from '../utils/offlineBible';
import { useRecentReadings } from '../hooks';
import { ChevronLeft, ChevronRight, BookOpen, Search, Settings, Bookmark, BookmarkCheck, Volume2, Share2, Printer } from 'lucide-react';

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
  onAskAI?: (bookId: string, chapter: number, verses: number[]) => void;
  onTabsChange?: (tabs: ReadingTab[], activeTabId: string) => void;
  initialTabs?: ReadingTab[];
  initialActiveTabId?: string;
}

export function ReaderPage({
  initialBook = 'gen',
  initialChapter = 1,
  onAskAI,
  onTabsChange,
  initialTabs,
  initialActiveTabId
}: ReaderPageProps) {
  // Tab state
  const [tabs, setTabs] = useState<ReadingTab[]>(() => {
    if (initialTabs && initialTabs.length > 0) {
      return initialTabs;
    }
    const book = BIBLE_BOOKS.find(b => b.id === initialBook) || BIBLE_BOOKS[0];
    return [createReadingTab(initialBook, book.name, initialChapter)];
  });
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    if (initialActiveTabId && initialTabs?.some(t => t.id === initialActiveTabId)) {
      return initialActiveTabId;
    }
    return tabs[0].id;
  });

  // Get current tab
  const currentTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const bookId = currentTab.bookId;
  const chapter = currentTab.chapter;
  const currentBook = BIBLE_BOOKS.find(b => b.id === bookId) || BIBLE_BOOKS[0];

  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [englishVerses, setEnglishVerses] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [showEnglish, setShowEnglish] = useState(false);

  // Highlight feature state
  const [userId, setUserId] = useState<string>('');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showHighlightToolbar, setShowHighlightToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const versesContainerRef = useRef<HTMLDivElement>(null);

  // Bookmark state
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Search state
  const [showSearch, setShowSearch] = useState(false);

  // Audio player state
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  // Share state
  const [showShare, setShowShare] = useState(false);
  const [shareVerses, setShareVerses] = useState<number[]>([]);
  const [shareTexts, setShareTexts] = useState<string[]>([]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    verseNumbers: number[];
  }>({ visible: false, position: { x: 0, y: 0 }, verseNumbers: [] });

  // Note dialog state
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteVerses, setNoteVerses] = useState<number[]>([]);
  const [noteContent, setNoteContent] = useState('');

  // Print state
  const [showPrint, setShowPrint] = useState(false);
  const [printVerses, setPrintVerses] = useState<number[]>([]);

  // Recent readings for tray menu
  const { addRecentReading } = useRecentReadings();

  // Reading progress
  const { markChapterRead } = useReadingProgress();

  // Tab management
  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const handleTabClose = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (newTabs.length === 0) {
        // If no tabs left, create a new default one
        const book = BIBLE_BOOKS[0];
        const newTab = createReadingTab(book.id, book.name, 1);
        setActiveTabId(newTab.id);
        onTabsChange?.([newTab], newTab.id);
        return [newTab];
      }
      // If closing active tab, switch to the previous or first tab
      if (tabId === activeTabId) {
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const newActiveIndex = Math.max(0, closedIndex - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
      }
      onTabsChange?.(newTabs, tabId === activeTabId ? newTabs[Math.max(0, prev.findIndex(t => t.id === tabId) - 1)].id : activeTabId);
      return newTabs;
    });
  }, [activeTabId, onTabsChange]);

  const handleTabAdd = useCallback(() => {
    const book = BIBLE_BOOKS[0];
    const newTab = createReadingTab(book.id, book.name, 1);
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    onTabsChange?.([...tabs, newTab], newTab.id);
  }, [tabs, onTabsChange]);

  // Update tab when book/chapter changes
  const updateCurrentTab = useCallback((newBookId: string, newChapter: number) => {
    const book = BIBLE_BOOKS.find(b => b.id === newBookId) || BIBLE_BOOKS[0];
    setTabs(prev => prev.map(t =>
      t.id === activeTabId
        ? { ...t, bookId: newBookId, bookName: book.name, chapter: newChapter, title: `${book.name} ${newChapter}章` }
        : t
    ));
    onTabsChange?.(
      tabs.map(t => t.id === activeTabId
        ? { ...t, bookId: newBookId, bookName: book.name, chapter: newChapter, title: `${book.name} ${newChapter}章` }
        : t
      ),
      activeTabId
    );
  }, [activeTabId, tabs, onTabsChange]);

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const storage = getStorageAdapter();
        const settings = await storage.get<{ showEnglish?: boolean }>('app-settings');
        if (settings?.showEnglish !== undefined) {
          setShowEnglish(settings.showEnglish);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    loadSettings();
  }, []);

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

  // Load bookmarks
  useEffect(() => {
    async function loadBookmarks() {
      if (!userId) return;
      try {
        const data = await invoke<BookmarkType[]>('db_get_bookmarks', { userId });
        setBookmarks(data || []);
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
      }
    }
    loadBookmarks();
  }, [userId]);

  // Check if current chapter is bookmarked
  useEffect(() => {
    const bookmarked = bookmarks.some(
      b => b.book_id === bookId && b.chapter === chapter
    );
    setIsBookmarked(bookmarked);
  }, [bookmarks, bookId, chapter]);

  // Fetch verses when book/chapter changes
  useEffect(() => {
    let cancelled = false;

    async function fetchVerses() {
      setLoading(true);
      setError(null);

      try {
        // Use offline-aware getChapter (tries API first, falls back to cache)
        let data: BibleVerse[] = [];

        if (isOnline()) {
          // Try API first
          try {
            data = await bibleApi.getChapter(bookId, chapter);
          } catch (apiError) {
            console.warn('API fetch failed, trying offline cache:', apiError);
            const offlineVerses = await getChapter(bookId, chapter, 'CUV');
            data = offlineVerses.map(v => ({
              id: v.id,
              book: v.book_id,
              bookName: v.book_id,
              chapter: v.chapter,
              verse: v.verse,
              text: v.text,
              textEn: v.text_en,
            }));
          }
        } else {
          // Offline: use cached verses
          const offlineVerses = await getChapter(bookId, chapter, 'CUV');
          data = offlineVerses.map(v => ({
            id: v.id,
            book: v.book_id,
            bookName: v.book_id,
            chapter: v.chapter,
            verse: v.verse,
            text: v.text,
            textEn: v.text_en,
          }));
        }

        if (!cancelled) {
          // Separate CUV and KJV verses
          const cuvVerses: BibleVerse[] = [];
          const kjvMap = new Map<number, string>();

          // API returns verses with version field
          for (const v of data) {
            const verseWithVersion = v as BibleVerse & { version?: string };
            if (verseWithVersion.version === 'KJV') {
              kjvMap.set(v.verse, v.text);
            } else {
              // Default to CUV for verses without version or with 'CUV'
              cuvVerses.push({
                ...v,
                textEn: kjvMap.get(v.verse) || v.textEn,
              });
            }
          }

          // If no version separation, use the data as-is
          if (cuvVerses.length === 0 && data.length > 0) {
            setVerses(data);
          } else {
            setVerses(cuvVerses);
          }
          setEnglishVerses(kjvMap);

          // Save reading history
          if (userId) {
            try {
              await invoke('db_save_reading_history', {
                entry: {
                  id: `history-${userId}-${bookId}-${chapter}-${Date.now()}`,
                  user_id: userId,
                  book_id: bookId,
                  chapter,
                  read_at: new Date().toISOString(),
                },
              });
            } catch (err) {
              console.error('Failed to save reading history:', err);
            }
          }

          // Add to recent readings for tray menu
          addRecentReading(bookId, currentBook.name, chapter);

          // Mark chapter as read for progress tracking
          markChapterRead(bookId, chapter);
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
  }, [bookId, chapter, userId]);

  // Navigation handlers
  const goToPrevChapter = useCallback(() => {
    if (chapter > 1) {
      updateCurrentTab(bookId, chapter - 1);
    } else {
      // Go to last chapter of previous book
      const bookIndex = BIBLE_BOOKS.findIndex(b => b.id === bookId);
      if (bookIndex > 0) {
        const prevBook = BIBLE_BOOKS[bookIndex - 1];
        updateCurrentTab(prevBook.id, prevBook.chapters);
      }
    }
  }, [bookId, chapter, updateCurrentTab]);

  const goToNextChapter = useCallback(() => {
    if (chapter < currentBook.chapters) {
      updateCurrentTab(bookId, chapter + 1);
    } else {
      // Go to first chapter of next book
      const bookIndex = BIBLE_BOOKS.findIndex(b => b.id === bookId);
      if (bookIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[bookIndex + 1];
        updateCurrentTab(nextBook.id, 1);
      }
    }
  }, [bookId, chapter, currentBook.chapters, updateCurrentTab]);

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

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, verseNum: number) => {
    e.preventDefault();
    e.stopPropagation();

    // If verses are already selected, use them; otherwise select the clicked verse
    const versesToUse = selectedVerses.length > 0 ? selectedVerses : [verseNum];

    setContextMenu({
      visible: true,
      position: { x: e.clientX, y: e.clientY },
      verseNumbers: versesToUse,
    });
  }, [selectedVerses]);

  // Context menu handlers
  const handleCopyVerses = useCallback(async () => {
    const text = contextMenu.verseNumbers.map(v => {
      const verse = verses.find(vv => vv.verse === v);
      return verse ? `${v} ${verse.text}` : '';
    }).join('\n');

    try {
      await navigator.clipboard.writeText(`${currentBook.name} ${chapter}章\n${text}`);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [contextMenu.verseNumbers, verses, currentBook.name, chapter]);

  const handleContextHighlight = useCallback(async (color: string) => {
    if (!userId || contextMenu.verseNumbers.length === 0) return;

    const verseStart = Math.min(...contextMenu.verseNumbers);
    const verseEnd = Math.max(...contextMenu.verseNumbers);

    try {
      const highlight: Highlight = {
        id: `highlight-${Date.now()}`,
        user_id: userId,
        book_id: bookId,
        chapter,
        verse_start: verseStart,
        verse_end: verseEnd,
        color,
        created_at: new Date().toISOString(),
      };

      await invoke('db_save_highlight', { highlight });
      setHighlights(prev => [...prev, highlight]);
    } catch (err) {
      console.error('Failed to save highlight:', err);
    }
  }, [userId, contextMenu.verseNumbers, bookId, chapter]);

  const handleRemoveHighlight = useCallback(async () => {
    const existingHighlight = highlights.find(h =>
      h.book_id === bookId &&
      h.chapter === chapter &&
      contextMenu.verseNumbers.some(v => v >= h.verse_start && v <= h.verse_end)
    );

    if (existingHighlight) {
      try {
        await invoke('db_delete_highlight', { id: existingHighlight.id });
        setHighlights(prev => prev.filter(h => h.id !== existingHighlight.id));
      } catch (err) {
        console.error('Failed to remove highlight:', err);
      }
    }
  }, [highlights, bookId, chapter, contextMenu.verseNumbers]);

  const handleAddNote = useCallback(() => {
    setNoteVerses(contextMenu.verseNumbers);
    setNoteContent('');
    setShowNoteDialog(true);
  }, [contextMenu.verseNumbers]);

  const handleSaveNote = useCallback(async () => {
    if (!userId || noteVerses.length === 0 || !noteContent.trim()) return;

    const verseStart = Math.min(...noteVerses);
    const verseEnd = Math.max(...noteVerses);

    try {
      await invoke('db_save_note', {
        note: {
          id: `note-${Date.now()}`,
          user_id: userId,
          book_id: bookId,
          chapter,
          verse_start: verseStart,
          verse_end: verseEnd,
          content: noteContent,
          created_at: new Date().toISOString(),
          updated_at: Date.now(),
        },
      });
      setShowNoteDialog(false);
      setNoteContent('');
      setNoteVerses([]);
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  }, [userId, noteVerses, noteContent, bookId, chapter]);

  const handleContextShare = useCallback(() => {
    setShareVerses(contextMenu.verseNumbers);
    setShareTexts(contextMenu.verseNumbers.map(v => {
      const verse = verses.find(vv => vv.verse === v);
      return verse?.text || '';
    }));
    setShowShare(true);
  }, [contextMenu.verseNumbers, verses]);

  const handleContextAskAI = useCallback(() => {
    if (onAskAI) {
      onAskAI(bookId, chapter, contextMenu.verseNumbers);
    }
  }, [onAskAI, bookId, chapter, contextMenu.verseNumbers]);

  const handleContextBookmark = useCallback(async () => {
    if (!userId) return;
    try {
      const newBookmark: BookmarkType = {
        id: `bookmark-${Date.now()}`,
        user_id: userId,
        book_id: bookId,
        chapter,
        created_at: new Date().toISOString(),
      };
      await invoke('db_save_bookmark', { bookmark: newBookmark });
      setBookmarks(prev => [...prev, newBookmark]);
      setIsBookmarked(true);
    } catch (err) {
      console.error('Failed to add bookmark:', err);
    }
  }, [userId, bookId, chapter]);

  // Handle print
  const handlePrint = useCallback((verseNumbers?: number[]) => {
    setPrintVerses(verseNumbers || []);
    setShowPrint(true);
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Handle print entire chapter
  const handlePrintChapter = useCallback(() => {
    setPrintVerses([]);
    setShowPrint(true);
  }, []);

  // Get existing highlight for context menu
  const getContextHighlight = useCallback((): { exists: boolean; color?: string } => {
    const existingHighlight = highlights.find(h =>
      h.book_id === bookId &&
      h.chapter === chapter &&
      contextMenu.verseNumbers.some(v => v >= h.verse_start && v <= h.verse_end)
    );
    return {
      exists: !!existingHighlight,
      color: existingHighlight?.color,
    };
  }, [highlights, bookId, chapter, contextMenu.verseNumbers]);

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

  // Toggle bookmark for current chapter
  const handleToggleBookmark = useCallback(async () => {
    if (!userId || !bookId) return;

    try {
      if (isBookmarked) {
        // Remove bookmark
        const bookmark = bookmarks.find(
          b => b.book_id === bookId && b.chapter === chapter
        );
        if (bookmark) {
          await invoke('db_delete_bookmark', { id: bookmark.id });
          setBookmarks(prev => prev.filter(b => b.id !== bookmark.id));
        }
      } else {
        // Add bookmark
        const newBookmark: BookmarkType = {
          id: `bookmark-${Date.now()}`,
          user_id: userId,
          book_id: bookId,
          chapter,
          created_at: new Date().toISOString(),
        };
        await invoke('db_save_bookmark', { bookmark: newBookmark });
        setBookmarks(prev => [...prev, newBookmark]);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  }, [userId, bookId, chapter, isBookmarked, bookmarks]);

  return (
    <div className="reader-page">
      {/* Tab Bar */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={handleTabSelect}
        onTabClose={handleTabClose}
        onTabAdd={handleTabAdd}
      />

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
          {/* Reading Progress */}
          <ReadingProgress
            bookId={bookId}
            chapter={chapter}
            totalChapters={currentBook.chapters}
            bookName={currentBook.name}
          />
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
          <button className="icon-btn" title="朗读" onClick={() => setShowAudioPlayer(!showAudioPlayer)}>
            <Volume2 className="w-5 h-5" />
          </button>
          <button className="icon-btn" title="搜索" onClick={() => setShowSearch(true)}>
            <Search className="w-5 h-5" />
          </button>
          <button
            className={`icon-btn ${isBookmarked ? 'bookmarked' : ''}`}
            title={isBookmarked ? '移除书签' : '添加书签'}
            onClick={handleToggleBookmark}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-5 h-5" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>
          <button
            className="icon-btn"
            title="分享经文"
            onClick={() => {
              if (selectedVerses.length > 0) {
                setShareVerses(selectedVerses);
                setShareTexts(selectedVerses.map(v => {
                  const verse = verses.find(vv => vv.verse === v);
                  return verse?.text || '';
                }));
              } else {
                setShareVerses(verses.map(v => v.verse));
                setShareTexts(verses.map(v => v.text));
              }
              setShowShare(true);
            }}
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            className="icon-btn"
            title="打印"
            onClick={handlePrintChapter}
          >
            <Printer className="w-5 h-5" />
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
                        updateCurrentTab(book.id, 1);
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
                        updateCurrentTab(book.id, 1);
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
            <button onClick={() => {
              // Trigger a reload by toggling the tab
              updateCurrentTab(bookId, chapter);
            }}>重试</button>
          </div>
        ) : (
          <>
            <div className="verses-container" style={{ fontSize: `${fontSize}px` }} ref={versesContainerRef}>
              {verses.map(verse => {
                const highlight = getVerseHighlight(verse.verse);
                const isSelected = selectedVerses.includes(verse.verse);
                const englishText = englishVerses.get(verse.verse) || verse.textEn;
                return (
                  <div
                    key={verse.id}
                    className={`verse ${highlight ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
                    data-verse={verse.verse}
                    onClick={(e) => handleVerseClick(verse.verse, e)}
                    onContextMenu={(e) => handleContextMenu(e, verse.verse)}
                    style={highlight ? { backgroundColor: highlight.color } : undefined}
                  >
                    <span className="verse-number">{verse.verse}</span>
                    <div className="verse-content">
                      <span className="verse-text">{verse.text}</span>
                      {showEnglish && englishText && (
                        <span className="verse-text-en">{englishText}</span>
                      )}
                    </div>
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
              onAskAI={onAskAI}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="reader-footer">
        {showAudioPlayer && verses.length > 0 && (
          <div className="footer-audio">
            <AudioPlayer
              text={verses.map(v => v.text).join(' ')}
              title={currentBook.name}
              reference={`${currentBook.name} ${chapter}章`}
            />
          </div>
        )}
        <div className="font-controls">
          <button onClick={() => setFontSize(Math.max(12, fontSize - 2))}>A-</button>
          <span>{fontSize}px</span>
          <button onClick={() => setFontSize(Math.min(28, fontSize + 2))}>A+</button>
        </div>
      </footer>

      {/* Search Modal */}
      <SearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigate={(newBookId, newChapter) => {
          updateCurrentTab(newBookId, newChapter);
        }}
      />

      {/* Share Card */}
      <ShareCard
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        bookName={currentBook.name}
        chapter={chapter}
        verses={shareVerses}
        verseTexts={shareTexts}
      />

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu.visible}
        position={contextMenu.position}
        verseNumbers={contextMenu.verseNumbers}
        hasHighlight={getContextHighlight().exists}
        highlightColor={getContextHighlight().color}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        onCopy={handleCopyVerses}
        onHighlight={handleContextHighlight}
        onRemoveHighlight={handleRemoveHighlight}
        onAddNote={handleAddNote}
        onShare={handleContextShare}
        onAskAI={handleContextAskAI}
        onBookmark={handleContextBookmark}
      />

      {/* Note Dialog */}
      {showNoteDialog && (
        <div className="note-dialog-overlay" onClick={() => setShowNoteDialog(false)}>
          <div className="note-dialog" onClick={e => e.stopPropagation()}>
            <h3>添加笔记</h3>
            <p className="note-verse-info">
              {currentBook.name} {chapter}章
              {noteVerses.length === 1
                ? ` 第${noteVerses[0]}节`
                : ` 第${Math.min(...noteVerses)}-${Math.max(...noteVerses)}节`}
            </p>
            <textarea
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              placeholder="写下你的笔记..."
              autoFocus
            />
            <div className="note-dialog-actions">
              <button className="btn btn-secondary" onClick={() => setShowNoteDialog(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveNote}
                disabled={!noteContent.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview */}
      <PrintPreview
        isOpen={showPrint}
        onClose={() => setShowPrint(false)}
        bookName={currentBook.name}
        chapter={chapter}
        verses={verses.map(v => ({
          verse: v.verse,
          text: v.text,
          textEn: englishVerses.get(v.verse) || v.textEn,
        }))}
        selectedVerses={printVerses.length > 0 ? printVerses : undefined}
      />
    </div>
  );
}