import { useState, useEffect, useCallback } from 'react';
import { getPlatform, getAuthAdapter, isDesktop } from '@scripture-ai/native';
import { ReaderPage, AIChatPage, PlanPage, NotesPage, SettingsPage } from './pages';
import { OfflineIndicator, KeyboardShortcutsHelp } from './components';
import { useTauriEvent, useKeyboardShortcuts, createCommonShortcuts } from './hooks';
import { useTheme } from './contexts';
import {
  BookOpen,
  MessageCircle,
  Calendar,
  Bookmark,
  Settings,
  User,
  Menu,
  X,
} from 'lucide-react';

type TabId = 'read' | 'ai' | 'plan' | 'notes' | 'settings';

interface AIContext {
  bookId?: string;
  chapter?: number;
  verses?: number[];
}

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'read', label: '阅读', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'ai', label: 'AI助手', icon: <MessageCircle className="w-5 h-5" /> },
  { id: 'plan', label: '计划', icon: <Calendar className="w-5 h-5" /> },
  { id: 'notes', label: '笔记', icon: <Bookmark className="w-5 h-5" /> },
  { id: 'settings', label: '设置', icon: <Settings className="w-5 h-5" /> },
];

function App() {
  const [platform, setPlatform] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('read');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiContext, setAIContext] = useState<AIContext | undefined>();
  const [readerNavigation, setReaderNavigation] = useState<{ bookId: string; chapter: number } | undefined>();
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Theme
  const { toggleTheme } = useTheme();

  // Initialize platform detection
  useEffect(() => {
    const currentPlatform = getPlatform();
    setPlatform(currentPlatform);
    checkAuth();
  }, []);

  // Listen for login complete event from Tauri
  useTauriEvent<{ userId: string }>('login-complete', useCallback(() => {
    checkAuth();
  }, []));

  async function checkAuth() {
    try {
      const auth = getAuthAdapter();
      const authenticated = await auth.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Failed to check auth:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    try {
      const auth = getAuthAdapter();
      await auth.login();
      if (!isDesktop()) {
        await checkAuth();
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  async function handleLogout() {
    try {
      const auth = getAuthAdapter();
      await auth.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  // Handle Ask AI from ReaderPage
  const handleAskAI = useCallback((bookId: string, chapter: number, verses: number[]) => {
    setAIContext({ bookId, chapter, verses });
    setActiveTab('ai');
  }, []);

  // Handle navigate to verse from NotesPage
  const handleNavigateToVerse = useCallback((bookId: string, chapter: number) => {
    setReaderNavigation({ bookId, chapter });
    setActiveTab('read');
  }, []);

  // Keyboard shortcuts
  const shortcuts = createCommonShortcuts({
    onToggleSidebar: () => setSidebarCollapsed(prev => !prev),
    onToggleDarkMode: toggleTheme,
    onEscape: () => {
      // Close any open modals/menus
      setShowKeyboardHelp(false);
      setReaderNavigation(undefined);
    },
  });

  useKeyboardShortcuts(shortcuts, { enabled: isAuthenticated });

  // Tab navigation shortcuts
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + 1-5 for tab switching
      if (e.ctrlKey || e.metaKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 5) {
          e.preventDefault();
          const tabs: TabId[] = ['read', 'ai', 'plan', 'notes', 'settings'];
          setActiveTab(tabs[num - 1]);
        }
        // Ctrl/Cmd + / for help
        if (e.key === '/') {
          e.preventDefault();
          setShowKeyboardHelp(prev => !prev);
        }
      }
      // ? for help (only when not in input)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowKeyboardHelp(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  // Save window state on visibility change
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('save_current_window_state');
        } catch {
          // Ignore errors
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]);

  // Loading state
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-logo">
            <BookOpen className="w-12 h-12 text-primary" />
          </div>
          <h2 className="loading-title">AI读</h2>
          <p className="loading-text">正在加载...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-icon">
            <BookOpen className="w-16 h-16" />
          </div>
          <h1 className="login-title">AI读</h1>
          <p className="login-subtitle">智能圣经阅读助手</p>
          <p className="login-description">
            登录以同步您的阅读进度、高亮和笔记
          </p>
          <button className="btn btn-primary btn-large" onClick={handleLogin}>
            <User className="w-5 h-5" />
            开始使用
          </button>
          <div className="login-features">
            <div className="feature">📖 中英对照阅读</div>
            <div className="feature">🤖 AI经文解读</div>
            <div className="feature">📝 高亮与笔记</div>
            <div className="feature">📅 读经计划</div>
          </div>
        </div>
      </div>
    );
  }

  // Main app - Authenticated
  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
          {!sidebarCollapsed && (
            <span className="sidebar-title">AI读</span>
          )}
        </div>

        <nav className="sidebar-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              {tab.icon}
              {!sidebarCollapsed && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="user-btn" onClick={handleLogout}>
            <User className="w-5 h-5" />
            {!sidebarCollapsed && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-area">
        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'read' && (
            <ReaderPage
              initialBook={readerNavigation?.bookId}
              initialChapter={readerNavigation?.chapter}
              onAskAI={handleAskAI}
            />
          )}

          {activeTab === 'ai' && <AIChatPage context={aiContext} />}

          {activeTab === 'plan' && <PlanPage />}

          {activeTab === 'notes' && <NotesPage onNavigate={handleNavigateToVerse} />}

          {activeTab === 'settings' && <SettingsPage />}
        </div>

        {/* Offline Indicator */}
        <OfflineIndicator className="offline-banner" />
      </main>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  );
}

export default App;